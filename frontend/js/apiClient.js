// API client for communicating with Flask backend
const ApiClient = {
    baseUrl: 'http://localhost:5000/api', // Flask backend URL
    currentSession: null,
    
    // Start a new session and get user ID
    async startSession() {
        try {
            const response = await fetch(`${this.baseUrl}/start-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentSession = {
                userId: data.userId,
                sessionTimestamp: data.sessionTimestamp,
                startTime: Date.now()
            };
            
            console.log('Session started:', this.currentSession.userId);
            return this.currentSession;
            
        } catch (error) {
            console.error('Failed to start session:', error);
            // Fallback to local session if server is unavailable
            this.currentSession = {
                userId: 'local_' + Date.now(),
                sessionTimestamp: new Date().toISOString(),
                startTime: Date.now(),
                offline: true
            };
            console.log('Using offline session:', this.currentSession.userId);
            return this.currentSession;
        }
    },
    
    // Save individual trial result
    async saveTrial(trialData) {
        if (!this.currentSession) {
            console.error('No active session. Call startSession() first.');
            return false;
        }
        
        // If offline, store locally
        if (this.currentSession.offline) {
            console.log('Offline mode - trial data:', trialData);
            return true;
        }
        
        try {
            const payload = {
                userId: this.currentSession.userId,
                sessionTimestamp: this.currentSession.sessionTimestamp,
                ...trialData,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(`${this.baseUrl}/save-trial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Trial saved:', result);
            return true;
            
        } catch (error) {
            console.error('Failed to save trial:', error);
            return false;
        }
    },
    
    // Check server health
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Server online:', data);
            return true;
            
        } catch (error) {
            console.error('Server offline:', error);
            return false;
        }
    }
};