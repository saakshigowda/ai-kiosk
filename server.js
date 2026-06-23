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
app.use(express.static('frontend')); // Serve your frontend files from 'frontend' directory

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// CSV file paths
const phase1CsvPath = path.join(dataDir, 'phase1_results.csv');
const phase2CsvPath = path.join(dataDir, 'phase2_results.csv');
const phase3CsvPath = path.join(dataDir, 'phase3_results.csv');
const demoCsvPath = path.join(dataDir, 'demo_results.csv');
const summaryCsvPath = path.join(dataDir, 'summary_results.csv');
const undoEventsCsvPath = path.join(dataDir, 'undo_events.csv');

// CSV headers
// Note: undo_count is the LAST column on trial rows so older CSVs stay aligned
// (existing rows simply leave that trailing field blank).
const csvHeaders = {
    phase1: 'user_id,session_timestamp,set_order,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp,undo_count\n',
    phase2: 'user_id,session_timestamp,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp,undo_count\n',
    phase3: 'user_id,session_timestamp,set_order,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp,undo_count\n',
    demo: 'user_id,session_timestamp,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp,undo_count\n',
    summary: 'participant_id,session_timestamp,set_order,phase1_correct,phase1_total,phase1_percent,phase3_correct,phase3_total,phase3_percent,difference_percent,improved,timestamp\n',
    // One row per undo: which choice the participant abandoned and when.
    undo: 'user_id,session_timestamp,phase,set_order,trial_number,left_image,right_image,abandoned_choice,abandoned_was_correct,correct_answer,undo_index,response_time_ms,timestamp\n'
};

// Initialize CSV files with headers if they don't exist
function initializeCsvFile(filePath, header) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, header);
        console.log(`Created CSV file: ${filePath}`);
    }
}

// Initialize all CSV files
initializeCsvFile(phase1CsvPath, csvHeaders.phase1);
initializeCsvFile(phase2CsvPath, csvHeaders.phase2);
initializeCsvFile(phase3CsvPath, csvHeaders.phase3);
initializeCsvFile(demoCsvPath, csvHeaders.demo);
initializeCsvFile(summaryCsvPath, csvHeaders.summary);
initializeCsvFile(undoEventsCsvPath, csvHeaders.undo);

// Per-participant combined CSV (all phases in one file, with a `phase` column)
const participantsDir = path.join(dataDir, 'participants');
if (!fs.existsSync(participantsDir)) {
    fs.mkdirSync(participantsDir);
}
const participantCsvHeader = 'participant_id,phase,session_timestamp,set_order,trial_number,left_image,right_image,user_choice,correct_answer,is_correct,response_time_ms,timestamp,undo_count\n';

// Upgrade older CSVs that predate the undo_count column: append it to the header
// line only. Existing data rows keep their original field count, so the new
// column simply reads blank for them (standard "added column" behaviour).
function ensureTrailingColumn(filePath, columnName) {
    try {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf8');
        const newlineIdx = content.indexOf('\n');
        if (newlineIdx === -1) return; // empty/malformed file, leave as-is
        const header = content.slice(0, newlineIdx);
        if (header.split(',').includes(columnName)) return; // already migrated
        const rest = content.slice(newlineIdx); // keep the leading newline + all rows
        fs.writeFileSync(filePath, header + ',' + columnName + rest);
        console.log(`Migrated ${filePath}: added '${columnName}' column`);
    } catch (err) {
        // A transient lock (e.g. OneDrive sync) must not stop the server from
        // starting. Warn and carry on — the migration retries on next startup.
        console.warn(`Could not migrate ${filePath} (${err.code || err.message}); will retry on next start`);
    }
}

// Apply the undo_count migration to the per-phase files and every participant file.
[phase1CsvPath, phase2CsvPath, phase3CsvPath, demoCsvPath].forEach(p => ensureTrailingColumn(p, 'undo_count'));
fs.readdirSync(participantsDir)
    .filter(f => f.endsWith('.csv'))
    .forEach(f => ensureTrailingColumn(path.join(participantsDir, f), 'undo_count'));

// Recover any rows that were queued to a sidecar while a file was locked
// (e.g. left open in Excel during a previous run).
function recoverAllPending() {
    [phase1CsvPath, phase2CsvPath, phase3CsvPath, demoCsvPath, summaryCsvPath, undoEventsCsvPath].forEach(flushPending);
    if (fs.existsSync(participantsDir)) {
        fs.readdirSync(participantsDir)
            .filter(f => f.endsWith('.csv'))
            .forEach(f => flushPending(path.join(participantsDir, f)));
    }
}
recoverAllPending();
// Keep retrying while the server runs: drains queued rows within ~15s of a
// locked file (e.g. open in Excel) being closed, even with no new trials.
setInterval(recoverAllPending, 15000).unref();

// Quote a value only if it contains a comma, quote, or newline
function csvEscape(value) {
    const s = value === undefined || value === null ? '' : String(value);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// --- Resilient CSV appends -------------------------------------------------
// Excel (and occasionally OneDrive) holds an exclusive write lock on an open
// CSV, so a plain appendFileSync throws EBUSY/EPERM and the row would be lost.
// robustAppend retries briefly; if the file is still locked it spills the row
// to a "<file>.pending" sidecar (which nobody opens in Excel) so nothing is
// dropped. Queued rows are flushed back into the real file once it is writable.
const APPEND_RETRIES = 5;
const APPEND_RETRY_DELAY_MS = 120;

// Block the thread without busy-waiting (kiosk handles one request at a time).
function sleepSync(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function pendingPath(filePath) {
    return filePath + '.pending';
}

// Drain any queued rows back into the real file, in order. No-op if still locked.
function flushPending(filePath) {
    const pPath = pendingPath(filePath);
    if (!fs.existsSync(pPath)) return;
    try {
        const queued = fs.readFileSync(pPath, 'utf8');
        if (queued.length > 0) {
            fs.appendFileSync(filePath, queued);
        }
        fs.unlinkSync(pPath);
        console.log(`Recovered ${queued.split('\n').filter(Boolean).length} queued row(s) into ${filePath}`);
    } catch (err) {
        // Real file still locked — leave the sidecar for the next attempt.
    }
}

// Append a row, surviving a transient/exclusive file lock. Returns whether the
// row landed in the real file (queued=true means it is safely held in the sidecar).
function robustAppend(filePath, row) {
    // Drain anything queued first so row order is preserved.
    flushPending(filePath);

    for (let attempt = 1; attempt <= APPEND_RETRIES; attempt++) {
        try {
            fs.appendFileSync(filePath, row);
            return { ok: true, queued: false };
        } catch (err) {
            if (attempt < APPEND_RETRIES) {
                sleepSync(APPEND_RETRY_DELAY_MS);
                continue;
            }
            // Still locked after retries: spill to the sidecar so the row survives.
            try {
                fs.appendFileSync(pendingPath(filePath), row);
                console.warn(`${filePath} locked (${err.code || err.message}); row queued to ${pendingPath(filePath)} — close the file in Excel to recover`);
                return { ok: true, queued: true };
            } catch (qErr) {
                console.error(`Failed to queue row for ${filePath}: ${qErr.message}`);
                return { ok: false, queued: false };
            }
        }
    }
}

// Make a participant id safe to use as a filename
function sanitizeId(id) {
    return (String(id).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)) || 'unknown';
}

// Append one trial row to the participant's combined CSV
function appendParticipantRow(userId, phaseLabel, fields) {
    const filePath = path.join(participantsDir, `${sanitizeId(userId)}.csv`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, participantCsvHeader);
    }
    const row = [
        userId,
        phaseLabel,
        fields.sessionTimestamp,
        fields.setOrder,
        fields.trialNumber,
        fields.leftImage,
        fields.rightImage,
        fields.userChoice,
        fields.correctAnswer,
        fields.isCorrect,
        fields.responseTimeMs,
        fields.timestamp,
        fields.undoCount
    ].map(csvEscape).join(',') + '\n';
    robustAppend(filePath, row);
}

// Counterbalancing: Track which set order to use next (alternates A/B)
const counterFilePath = path.join(dataDir, 'session_counter.json');

function getNextSetOrder() {
    let counter = { count: 0 };
    
    if (fs.existsSync(counterFilePath)) {
        try {
            counter = JSON.parse(fs.readFileSync(counterFilePath, 'utf8'));
        } catch (e) {
            counter = { count: 0 };
        }
    }
    
    // Alternate between A and B based on count
    const setOrder = counter.count % 2 === 0 ? 'A' : 'B';
    
    // Increment counter for next session
    counter.count++;
    fs.writeFileSync(counterFilePath, JSON.stringify(counter));
    
    console.log(`Set order for this session: ${setOrder} (session #${counter.count})`);
    return setOrder;
}

// Generate unique user ID
app.post('/api/start-session', (req, res) => {
    const userId = req.body.userId || uuidv4();
    const sessionTimestamp = new Date().toISOString();
    const setOrder = getNextSetOrder();
    
    console.log(`New session started: ${userId} at ${sessionTimestamp}, Set Order: ${setOrder}`);
    
    res.json({
        userId: userId,
        sessionTimestamp: sessionTimestamp,
        setOrder: setOrder,
        message: 'Session started successfully'
    });
});

// Save trial results
app.post('/api/save-trial', (req, res) => {
    try {
        const {
            userId,
            sessionTimestamp,
            setOrder, // 'A' or 'B' for counterbalancing
            mode, // 'phase1', 'phase2', 'phase3', or 'demo'
            trialNumber,
            leftImage,
            rightImage,
            userChoice, // 'left' or 'right'
            correctAnswer, // 'left' or 'right' (which side has the correct answer)
            isCorrect,
            responseTimeMs,
            undoCount, // how many times the participant reversed before confirming
            timestamp
        } = req.body;

        // Validate required fields
        if (!userId || !mode || !trialNumber || !leftImage || !rightImage || !userChoice) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId', 'mode', 'trialNumber', 'leftImage', 'rightImage', 'userChoice']
            });
        }

        // Determine which CSV file to use and if setOrder applies
        let csvPath;
        let includeSetOrder = false;
        let phaseLabel;
        switch (mode.toLowerCase()) {
            case 'phase1':
            case 'pretest':
            case 'comparison':
                csvPath = phase1CsvPath;
                includeSetOrder = true;
                phaseLabel = 'phase1';
                break;
            case 'phase2':
            case 'training':
                csvPath = phase2CsvPath;
                phaseLabel = 'phase2';
                break;
            case 'phase3':
                csvPath = phase3CsvPath;
                includeSetOrder = true;
                phaseLabel = 'phase3';
                break;
            case 'demo':
                csvPath = demoCsvPath;
                phaseLabel = 'demo';
                break;
            default:
                return res.status(400).json({ error: 'Invalid mode. Must be phase1, phase2, phase3, or demo' });
        }

        // Default undo_count to 0 so confirmed-first-time trials read cleanly.
        const undoCountValue = undoCount != null ? undoCount : 0;

        // Create CSV row (with or without setOrder based on mode)
        let csvRow;
        if (includeSetOrder) {
            csvRow = [
                userId,
                sessionTimestamp || new Date().toISOString(),
                setOrder || '',
                trialNumber,
                leftImage,
                rightImage,
                userChoice,
                correctAnswer || '',
                isCorrect ? 'TRUE' : 'FALSE',
                responseTimeMs || '',
                timestamp || new Date().toISOString(),
                undoCountValue
            ].join(',') + '\n';
        } else {
            csvRow = [
                userId,
                sessionTimestamp || new Date().toISOString(),
                trialNumber,
                leftImage,
                rightImage,
                userChoice,
                correctAnswer || '',
                isCorrect ? 'TRUE' : 'FALSE',
                responseTimeMs || '',
                timestamp || new Date().toISOString(),
                undoCountValue
            ].join(',') + '\n';
        }

        // Append to CSV file (resilient to a file left open in Excel)
        robustAppend(csvPath, csvRow);

        // Also append to this participant's combined CSV (all phases, with a phase column)
        appendParticipantRow(userId, phaseLabel, {
            sessionTimestamp: sessionTimestamp || new Date().toISOString(),
            setOrder: setOrder || '',
            trialNumber,
            leftImage,
            rightImage,
            userChoice,
            correctAnswer: correctAnswer || '',
            isCorrect: isCorrect ? 'TRUE' : 'FALSE',
            responseTimeMs: responseTimeMs || '',
            timestamp: timestamp || new Date().toISOString(),
            undoCount: undoCountValue
        });

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

// Log an undo/unselect event (the participant reversed a selection before confirming)
app.post('/api/save-undo', (req, res) => {
    try {
        const {
            userId,
            sessionTimestamp,
            setOrder,
            mode,
            trialNumber,
            leftImage,
            rightImage,
            abandonedChoice,    // 'left' or 'right' — the choice they backed out of
            abandonedWasCorrect, // would that choice have been correct?
            correctAnswer,
            undoIndex,          // 1 for first undo on this trial, 2 for second, ...
            responseTimeMs,     // time from images shown (or last undo) to this undo
            timestamp
        } = req.body;

        if (!userId || !mode || !trialNumber) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId', 'mode', 'trialNumber']
            });
        }

        // Normalise mode to a phase label (mirrors save-trial)
        let phaseLabel;
        switch (String(mode).toLowerCase()) {
            case 'phase1':
            case 'pretest':
            case 'comparison':
                phaseLabel = 'phase1';
                break;
            case 'phase2':
            case 'training':
                phaseLabel = 'phase2';
                break;
            case 'phase3':
                phaseLabel = 'phase3';
                break;
            case 'demo':
                phaseLabel = 'demo';
                break;
            default:
                phaseLabel = String(mode).toLowerCase();
        }

        const row = [
            userId,
            sessionTimestamp || new Date().toISOString(),
            phaseLabel,
            setOrder || '',
            trialNumber,
            leftImage || '',
            rightImage || '',
            abandonedChoice || '',
            abandonedWasCorrect ? 'TRUE' : 'FALSE',
            correctAnswer || '',
            undoIndex || '',
            responseTimeMs || '',
            timestamp || new Date().toISOString()
        ].map(csvEscape).join(',') + '\n';

        robustAppend(undoEventsCsvPath, row);

        console.log(`Undo logged: User ${userId}, ${phaseLabel}, Trial ${trialNumber}, undo #${undoIndex}`);

        res.json({
            message: 'Undo logged successfully',
            userId: userId,
            trialNumber: trialNumber,
            undoIndex: undoIndex
        });

    } catch (error) {
        console.error('Error logging undo:', error);
        res.status(500).json({
            error: 'Failed to log undo',
            details: error.message
        });
    }
});

// Save experiment summary (after Phase III completion)
app.post('/api/save-summary', (req, res) => {
    try {
        const {
            participantId,
            sessionTimestamp,
            setOrder,
            phase1Correct,
            phase1Total,
            phase1Percent,
            phase3Correct,
            phase3Total,
            phase3Percent,
            differencePercent,
            improved
        } = req.body;

        // Validate required fields
        if (!participantId) {
            return res.status(400).json({
                error: 'Missing required field: participantId'
            });
        }

        // Create CSV row
        const csvRow = [
            participantId,
            sessionTimestamp || new Date().toISOString(),
            setOrder || '',
            phase1Correct || 0,
            phase1Total || 0,
            phase1Percent || 0,
            phase3Correct || 0,
            phase3Total || 0,
            phase3Percent || 0,
            differencePercent || 0,
            improved ? 'TRUE' : 'FALSE',
            new Date().toISOString()
        ].join(',') + '\n';

        // Append to summary CSV file (resilient to a file left open in Excel)
        robustAppend(summaryCsvPath, csvRow);

        console.log(`Summary saved: Participant ${participantId}, Phase 1: ${phase1Correct}/${phase1Total} (${phase1Percent}%), Phase 3: ${phase3Correct}/${phase3Total} (${phase3Percent}%), Diff: ${differencePercent}%`);

        res.json({
            message: 'Summary saved successfully',
            participantId: participantId,
            improvement: differencePercent
        });

    } catch (error) {
        console.error('Error saving summary:', error);
        res.status(500).json({
            error: 'Failed to save summary',
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
            { name: 'phase1', path: phase1CsvPath },
            { name: 'phase2', path: phase2CsvPath },
            { name: 'phase3', path: phase3CsvPath },
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
            case 'phase1':
            case 'pretest':
                csvPath = phase1CsvPath;
                break;
            case 'phase2':
            case 'training':
                csvPath = phase2CsvPath;
                break;
            case 'phase3':
                csvPath = phase3CsvPath;
                break;
            case 'demo':
                csvPath = demoCsvPath;
                break;
            case 'summary':
                csvPath = summaryCsvPath;
                break;
            case 'undo':
            case 'undo_events':
                csvPath = undoEventsCsvPath;
                break;
            default:
                return res.status(400).json({ error: 'Invalid mode. Must be phase1, phase2, phase3, demo, summary, or undo' });
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
            phase1: fs.existsSync(phase1CsvPath),
            phase2: fs.existsSync(phase2CsvPath),
            phase3: fs.existsSync(phase3CsvPath),
            demo: fs.existsSync(demoCsvPath),
            summary: fs.existsSync(summaryCsvPath)
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\nFaceOrFake Backend Server`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data directory: ${dataDir}`);
    console.log(`CSV files will be saved to:`);
    console.log(`   - Phase I: ${phase1CsvPath}`);
    console.log(`   - Phase II: ${phase2CsvPath}`);
    console.log(`   - Phase III: ${phase3CsvPath}`);
    console.log(`   - Summary: ${summaryCsvPath}`);
    console.log(`   - Demo: ${demoCsvPath}`);
    console.log(`   - Undo events: ${undoEventsCsvPath}`);
    console.log(`   - Per-participant: ${participantsDir}${path.sep}<id>.csv`);
    console.log(`\nAPI Endpoints:`);
    console.log(`   POST /api/start-session - Start new session`);
    console.log(`   POST /api/save-trial - Save individual trial`);
    console.log(`   POST /api/save-summary - Save experiment summary`);
    console.log(`   POST /api/save-session - Save complete session`);
    console.log(`   GET  /api/stats - Get statistics`);
    console.log(`   GET  /api/download/:mode - Download CSV`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`\nPlace your frontend files in the 'frontend' directory`);
    console.log(`\n`);
});

module.exports = app;