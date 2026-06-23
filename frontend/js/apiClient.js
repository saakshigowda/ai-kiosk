// API client for communicating with backend
const ApiClient = {
    baseUrl: 'http://localhost:3000/api',
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
                setOrder: data.setOrder || 'A',
                startTime: Date.now(),
                mode: mode
            };
            
            // Store setOrder in GameState for use by imageLoader and comparisonMode
            if (typeof GameState !== 'undefined') {
                GameState.setOrder = data.setOrder || 'A';
                console.log(`Set order assigned: ${GameState.setOrder}`);
            }
            
            console.log(`Session started for ${mode}:`, this.currentSession.userId, `Set Order: ${this.currentSession.setOrder}`);
            return this.currentSession;
            
        } catch (error) {
            console.error('Failed to start session:', error);
            const userId = this.participantId || 'offline_' + Date.now();
            // Alternate offline based on timestamp (even/odd seconds)
            const offlineSetOrder = new Date().getSeconds() % 2 === 0 ? 'A' : 'B';
            this.currentSession = {
                userId: userId,
                sessionTimestamp: new Date().toISOString(),
                setOrder: offlineSetOrder,
                startTime: Date.now(),
                mode: mode,
                offline: true
            };
            
            if (typeof GameState !== 'undefined') {
                GameState.setOrder = offlineSetOrder;
            }
            
            console.log('Using offline session:', this.currentSession.userId, `Set Order: ${offlineSetOrder}`);
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
    
    // Log an undo/unselect event (participant reversed a selection before confirming)
    async saveUndo(undoData) {
        if (!this.currentSession) {
            console.error('No active session. Call startSession() first.');
            return false;
        }

        if (this.currentSession.offline) {
            console.log('Offline mode - undo event:', undoData);
            return true;
        }

        try {
            const payload = {
                userId: this.currentSession.userId,
                sessionTimestamp: this.currentSession.sessionTimestamp,
                ...undoData,
                timestamp: new Date().toISOString()
            };

            const response = await fetch(`${this.baseUrl}/save-undo`, {
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
            console.log('Undo logged:', result);
            return true;

        } catch (error) {
            console.error('Failed to save undo:', error);
            return false;
        }
    },

    // Save experiment summary (after Phase III)
    async saveSummary(summaryData) {
        if (this.currentSession?.offline) {
            console.log('Offline mode - summary data:', summaryData);
            return true;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/save-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(summaryData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Summary saved:', result);
            return true;
            
        } catch (error) {
            console.error('Failed to save summary:', error);
            return false;
        }
    },
    
    // Get current user ID
    get userId() {
        return this.currentSession?.userId || this.participantId || 'unknown';
    },
    
    // Get current session timestamp
    get sessionTimestamp() {
        return this.currentSession?.sessionTimestamp || new Date().toISOString();
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