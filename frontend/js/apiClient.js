// API client for communicating with Flask backend
const ApiClient = {
    baseUrl: 'http://localhost:5000/api',
    currentSession: null,
    participantId: null, // Store manually entered participant ID
    
    // Set participant ID manually
    setParticipantId(id) {
        this.participantId = id;
        console.log('Participant ID set:', id);
        
        // Update display if element exists
        const displayElement = document.getElementById('participant-display');
        if (displayElement) {
            displayElement.textContent = id;
        }
    },
    
    // Get current participant ID
    getParticipantId() {
        return this.participantId;
    },
    
    // Clear participant ID (for new participant)
    clearParticipantId() {
        this.participantId = null;
        this.currentSession = null;
        console.log('Participant ID cleared');
        
        // Update display
        const displayElement = document.getElementById('participant-display');
        if (displayElement) {
            displayElement.textContent = '---';
        }
    },
    
    // Start a new session (uses manual participant ID)
    async startSession(mode) {
        try {
            // Use the manually entered participant ID
            const userId = this.participantId || 'unknown_' + Date.now();
            
            const response = await fetch(`${this.baseUrl}/start-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.currentSession = {
                userId: userId,
                sessionTimestamp: data.sessionTimestamp,
                startTime: Date.now(),
                mode: mode
            };
            
            console.log(`Session started for ${mode}:`, this.currentSession.userId);
            return this.currentSession;
            
        } catch (error) {
            console.error('Failed to start session:', error);
            const userId = this.participantId || 'offline_' + Date.now();
            this.currentSession = {
                userId: userId,
                sessionTimestamp: new Date().toISOString(),
                startTime: Date.now(),
                mode: mode,
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