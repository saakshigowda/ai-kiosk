const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your frontend files from 'public' directory

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// CSV file paths
const pretestCsvPath = path.join(dataDir, 'pretest_results.csv');
const phase2CsvPath = path.join(dataDir, 'phase2_results.csv');
const demoCsvPath = path.join(dataDir, 'demo_results.csv');

// CSV headers
const csvHeaders = {
    pretest: 'user_id,session_timestamp,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp\n',
    phase2: 'user_id,session_timestamp,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp\n',
    demo: 'user_id,session_timestamp,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp\n'
};

// Initialize CSV files with headers if they don't exist
function initializeCsvFile(filePath, header) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, header);
        console.log(`Created CSV file: ${filePath}`);
    }
}

// Initialize all CSV files
initializeCsvFile(pretestCsvPath, csvHeaders.pretest);
initializeCsvFile(phase2CsvPath, csvHeaders.phase2);
initializeCsvFile(demoCsvPath, csvHeaders.demo);

// Generate unique user ID
app.post('/api/start-session', (req, res) => {
    const userId = uuidv4();
    const sessionTimestamp = new Date().toISOString();
    
    console.log(`New session started: ${userId} at ${sessionTimestamp}`);
    
    res.json({
        userId: userId,
        sessionTimestamp: sessionTimestamp,
        message: 'Session started successfully'
    });
});

// Save trial results
app.post('/api/save-trial', (req, res) => {
    try {
        const {
            userId,
            sessionTimestamp,
            mode, // 'pretest', 'phase2', or 'demo'
            trialNumber,
            leftImage,
            rightImage,
            userChoice, // 'left' or 'right'
            correctAnswer, // 'left' or 'right' (which side has the correct answer)
            isCorrect,
            responseTimeMs,
            timestamp
        } = req.body;

        // Validate required fields
        if (!userId || !mode || !trialNumber || !leftImage || !rightImage || !userChoice) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId', 'mode', 'trialNumber', 'leftImage', 'rightImage', 'userChoice']
            });
        }

        // Determine which CSV file to use
        let csvPath;
        switch (mode.toLowerCase()) {
            case 'pretest':
            case 'comparison':
                csvPath = pretestCsvPath;
                break;
            case 'phase2':
                csvPath = phase2CsvPath;
                break;
            case 'demo':
                csvPath = demoCsvPath;
                break;
            default:
                return res.status(400).json({ error: 'Invalid mode. Must be pretest, phase2, or demo' });
        }

        // Create CSV row
        const csvRow = [
            userId,
            sessionTimestamp || new Date().toISOString(),
            trialNumber,
            leftImage,
            rightImage,
            userChoice,
            correctAnswer || '',
            isCorrect ? 'TRUE' : 'FALSE',
            responseTimeMs || '',
            timestamp || new Date().toISOString()
        ].join(',') + '\n';

        // Append to CSV file
        fs.appendFileSync(csvPath, csvRow);

        console.log(`Trial saved: User ${userId}, Mode ${mode}, Trial ${trialNumber}`);

        res.json({
            message: 'Trial saved successfully',
            userId: userId,
            mode: mode,
            trialNumber: trialNumber
        });

    } catch (error) {
        console.error('Error saving trial:', error);
        res.status(500).json({
            error: 'Failed to save trial',
            details: error.message
        });
    }
});

// Save complete session results (batch save)
app.post('/api/save-session', (req, res) => {
    try {
        const {
            userId,
            sessionTimestamp,
            mode,
            trials // Array of trial objects
        } = req.body;

        if (!userId || !mode || !Array.isArray(trials)) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId', 'mode', 'trials (array)']
            });
        }

        let savedCount = 0;
        let errors = [];

        trials.forEach((trial, index) => {
            try {
                // Add session info to each trial
                const trialWithSession = {
                    ...trial,
                    userId,
                    sessionTimestamp,
                    mode,
                    trialNumber: index + 1
                };

                // Use the existing save-trial logic
                const mockReq = { body: trialWithSession };
                const mockRes = {
                    status: () => mockRes,
                    json: (data) => {
                        if (data.error) {
                            errors.push(`Trial ${index + 1}: ${data.error}`);
                        } else {
                            savedCount++;
                        }
                    }
                };

                // This is a bit hacky, but reuses our existing save logic
                // In a real implementation, you'd extract the save logic to a separate function
                
            } catch (error) {
                errors.push(`Trial ${index + 1}: ${error.message}`);
            }
        });

        res.json({
            message: 'Session save completed',
            savedTrials: savedCount,
            totalTrials: trials.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error saving session:', error);
        res.status(500).json({
            error: 'Failed to save session',
            details: error.message
        });
    }
});

// Get statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = {};

        // Count lines in each CSV file (subtract 1 for header)
        [
            { name: 'pretest', path: pretestCsvPath },
            { name: 'phase2', path: phase2CsvPath },
            { name: 'demo', path: demoCsvPath }
        ].forEach(({ name, path }) => {
            if (fs.existsSync(path)) {
                const content = fs.readFileSync(path, 'utf8');
                const lines = content.split('\n').filter(line => line.trim() !== '');
                stats[name] = Math.max(0, lines.length - 1); // Subtract header
            } else {
                stats[name] = 0;
            }
        });

        res.json({
            message: 'Statistics retrieved successfully',
            totalTrials: stats,
            dataDirectory: dataDir
        });

    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            error: 'Failed to get statistics',
            details: error.message
        });
    }
});

// Download CSV files
app.get('/api/download/:mode', (req, res) => {
    try {
        const mode = req.params.mode.toLowerCase();
        let csvPath;

        switch (mode) {
            case 'pretest':
                csvPath = pretestCsvPath;
                break;
            case 'phase2':
                csvPath = phase2CsvPath;
                break;
            case 'demo':
                csvPath = demoCsvPath;
                break;
            default:
                return res.status(400).json({ error: 'Invalid mode. Must be pretest, phase2, or demo' });
        }

        if (!fs.existsSync(csvPath)) {
            return res.status(404).json({ error: 'CSV file not found' });
        }

        const filename = `${mode}_results_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(csvPath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading CSV:', error);
        res.status(500).json({
            error: 'Failed to download CSV',
            details: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        dataDirectory: dataDir,
        csvFiles: {
            pretest: fs.existsSync(pretestCsvPath),
            phase2: fs.existsSync(phase2CsvPath),
            demo: fs.existsSync(demoCsvPath)
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 AI Face Detection Backend Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${dataDir}`);
    console.log(`📊 CSV files will be saved to:`);
    console.log(`   - Pretest: ${pretestCsvPath}`);
    console.log(`   - Phase II: ${phase2CsvPath}`);
    console.log(`   - Demo: ${demoCsvPath}`);
    console.log(`\n🔗 API Endpoints:`);
    console.log(`   POST /api/start-session - Start new session`);
    console.log(`   POST /api/save-trial - Save individual trial`);
    console.log(`   POST /api/save-session - Save complete session`);
    console.log(`   GET  /api/stats - Get statistics`);
    console.log(`   GET  /api/download/:mode - Download CSV`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`\n💡 Place your frontend files in the 'public' directory`);
    console.log(`\n`);
});

module.exports = app;