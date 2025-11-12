from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import csv
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Create data directory if it doesn't exist
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# CSV file paths
CSV_FILES = {
    'pretest': os.path.join(DATA_DIR, 'pretest_results.csv'),
    'phase2': os.path.join(DATA_DIR, 'phase2_results.csv'),
    'demo': os.path.join(DATA_DIR, 'demo_results.csv')
}

# CSV headers
CSV_HEADERS = [
    'user_id',
    'session_timestamp',
    'trial_number',
    'left_image',
    'right_image',
    'user_choice',
    'correct_answer',
    'is_correct',
    'response_time_ms',
    'timestamp'
]

def initialize_csv_files():
    """Initialize CSV files with headers if they don't exist"""
    for mode, filepath in CSV_FILES.items():
        if not os.path.exists(filepath):
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(CSV_HEADERS)
            print(f"✓ Created {mode} CSV file")

# Initialize CSV files on startup
initialize_csv_files()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'online',
        'message': 'Flask backend is running',
        'timestamp': datetime.now().isoformat(),
        'data_directory': DATA_DIR,
        'csv_files': {
            mode: os.path.exists(path) 
            for mode, path in CSV_FILES.items()
        }
    })

@app.route('/api/start-session', methods=['POST'])
def start_session():
    """Generate a unique user ID and start a new session"""
    user_id = str(uuid.uuid4())
    session_timestamp = datetime.now().isoformat()
    
    print(f"📝 New session started: {user_id}")
    
    return jsonify({
        'userId': user_id,
        'sessionTimestamp': session_timestamp,
        'message': 'Session started successfully'
    })

@app.route('/api/save-trial', methods=['POST'])
def save_trial():
    """Save individual trial result to CSV"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['userId', 'mode', 'trialNumber', 'leftImage', 
                          'rightImage', 'userChoice']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing_fields
            }), 400
        
        # Determine which CSV file to use
        mode = data['mode'].lower()
        if mode == 'comparison':
            mode = 'pretest'
        
        if mode not in CSV_FILES:
            return jsonify({
                'error': 'Invalid mode',
                'valid_modes': list(CSV_FILES.keys())
            }), 400
        
        csv_path = CSV_FILES[mode]
        
        # Prepare row data
        row = [
            data.get('userId', ''),
            data.get('sessionTimestamp', datetime.now().isoformat()),
            data.get('trialNumber', ''),
            data.get('leftImage', ''),
            data.get('rightImage', ''),
            data.get('userChoice', ''),
            data.get('correctAnswer', ''),
            str(data.get('isCorrect', '')).upper(),
            data.get('responseTimeMs', ''),
            data.get('timestamp', datetime.now().isoformat())
        ]
        
        # Append to CSV file
        with open(csv_path, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(row)
        
        print(f"✓ Trial saved: User {data['userId'][:8]}..., Mode {mode}, Trial {data['trialNumber']}")
        
        return jsonify({
            'message': 'Trial saved successfully',
            'userId': data['userId'],
            'mode': mode,
            'trialNumber': data['trialNumber']
        })
    
    except Exception as e:
        print(f"✗ Error saving trial: {str(e)}")
        return jsonify({
            'error': 'Failed to save trial',
            'details': str(e)
        }), 500

@app.route('/api/save-session', methods=['POST'])
def save_session():
    """Save complete session (batch save all trials)"""
    try:
        data = request.json
        
        if 'trials' not in data or not isinstance(data['trials'], list):
            return jsonify({
                'error': 'Invalid request',
                'message': 'trials array is required'
            }), 400
        
        user_id = data.get('userId')
        session_timestamp = data.get('sessionTimestamp', datetime.now().isoformat())
        mode = data.get('mode', 'pretest').lower()
        
        if mode == 'comparison':
            mode = 'pretest'
        
        if mode not in CSV_FILES:
            return jsonify({
                'error': 'Invalid mode',
                'valid_modes': list(CSV_FILES.keys())
            }), 400
        
        csv_path = CSV_FILES[mode]
        saved_count = 0
        errors = []
        
        # Save each trial
        with open(csv_path, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            for idx, trial in enumerate(data['trials']):
                try:
                    row = [
                        user_id,
                        session_timestamp,
                        trial.get('trialNumber', idx + 1),
                        trial.get('leftImage', ''),
                        trial.get('rightImage', ''),
                        trial.get('userChoice', ''),
                        trial.get('correctAnswer', ''),
                        str(trial.get('isCorrect', '')).upper(),
                        trial.get('responseTimeMs', ''),
                        trial.get('timestamp', datetime.now().isoformat())
                    ]
                    writer.writerow(row)
                    saved_count += 1
                except Exception as e:
                    errors.append(f"Trial {idx + 1}: {str(e)}")
        
        print(f"✓ Session saved: {saved_count} trials for user {user_id[:8] if user_id else 'unknown'}...")
        
        return jsonify({
            'message': 'Session saved successfully',
            'savedTrials': saved_count,
            'totalTrials': len(data['trials']),
            'errors': errors if errors else None
        })
    
    except Exception as e:
        print(f"✗ Error saving session: {str(e)}")
        return jsonify({
            'error': 'Failed to save session',
            'details': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics about collected data"""
    try:
        stats = {}
        
        for mode, filepath in CSV_FILES.items():
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    # Count lines minus header
                    line_count = sum(1 for line in f) - 1
                    stats[mode] = max(0, line_count)
            else:
                stats[mode] = 0
        
        return jsonify({
            'message': 'Statistics retrieved successfully',
            'totalTrials': stats,
            'dataDirectory': DATA_DIR
        })
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to get statistics',
            'details': str(e)
        }), 500

@app.route('/api/download/<mode>', methods=['GET'])
def download_csv(mode):
    """Download CSV file for specified mode"""
    try:
        mode = mode.lower()
        if mode not in CSV_FILES:
            return jsonify({
                'error': 'Invalid mode',
                'valid_modes': list(CSV_FILES.keys())
            }), 400
        
        csv_path = CSV_FILES[mode]
        
        if not os.path.exists(csv_path):
            return jsonify({
                'error': 'CSV file not found',
                'path': csv_path
            }), 404
        
        filename = f"{mode}_results_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return send_file(
            csv_path,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to download CSV',
            'details': str(e)
        }), 500

@app.route('/api/view/<mode>', methods=['GET'])
def view_data(mode):
    """View recent data for specified mode"""
    try:
        mode = mode.lower()
        if mode not in CSV_FILES:
            return jsonify({
                'error': 'Invalid mode',
                'valid_modes': list(CSV_FILES.keys())
            }), 400
        
        csv_path = CSV_FILES[mode]
        
        if not os.path.exists(csv_path):
            return jsonify({
                'error': 'CSV file not found'
            }), 404
        
        # Read last 50 rows
        data = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            data = rows[-50:]  # Last 50 entries
        
        return jsonify({
            'mode': mode,
            'total_entries': len(rows),
            'showing': len(data),
            'data': data
        })
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to view data',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 AI Face Detection Flask Backend")
    print("="*60)
    print(f"📡 Server will run on: http://localhost:5000")
    print(f"📁 Data directory: {os.path.abspath(DATA_DIR)}")
    print(f"📊 CSV files:")
    for mode, path in CSV_FILES.items():
        print(f"   - {mode}: {os.path.abspath(path)}")
    print("\n🔗 API Endpoints:")
    print("   POST /api/start-session - Start new session")
    print("   POST /api/save-trial - Save individual trial")
    print("   POST /api/save-session - Save complete session")
    print("   GET  /api/stats - Get statistics")
    print("   GET  /api/download/<mode> - Download CSV")
    print("   GET  /api/view/<mode> - View recent data")
    print("   GET  /api/health - Health check")
    print("\n💡 Frontend should run on: http://localhost:8080")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)