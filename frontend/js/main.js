// Main game controller and initialization
const Game = {
    targetMode: null, // Store which mode we're heading to
    
    // Initialize the entire game
    async init() {
        console.log("Initializing AI Face Detection Challenge...");
        
        GameState.initElements();
        GameState.allImages = ImageLoader.loadDatabase();
        GameState.setBImages = ImageLoader.loadSetBDatabase();
        GameState.demoImages = ImageLoader.loadDemoDatabase();
        
        if (GameState.allImages.length === 0) {
            console.error("No face images loaded! Check your file paths and names.");
            return;
        }
        
        if (GameState.setBImages.length === 0) {
            console.error("No SetB images loaded! Check your SetB folder.");
            return;
        }
        
        if (GameState.demoImages.length === 0) {
            console.error("No demo images loaded! Check your animals folder.");
            return;
        }
        
        this.setupEventListeners();
        ImageLoader.setupErrorHandlers();
        
        // Check backend connection (don't fail if offline)
        try {
            await ApiClient.checkHealth();
        } catch (error) {
            console.log("Backend check failed, continuing anyway");
        }
        
        // Initialize webcam (async, non-blocking)
        try {
            await Webcam.init();
        } catch (error) {
            console.log("Webcam initialization failed, continuing with button controls only");
        }
        
        console.log("Game initialized successfully!");
    },
    
    // Show participant ID entry screen
    showParticipantScreen(targetMode) {
        console.log("Showing participant ID screen...");
        
        // Store which mode we're heading to
        this.targetMode = targetMode;
        
        // Hide landing, show participant screen
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.participantOverlay.style.display = "flex";
        GameState.elements.participantError.style.display = "none";
        
        // Focus on input
        GameState.elements.participantInput.value = '';
        GameState.elements.participantInput.focus();
    },
    
    // Handle participant ID submission
    submitParticipantId() {
        const participantId = GameState.elements.participantInput.value.trim();
        
        if (!participantId) {
            GameState.elements.participantError.style.display = "block";
            GameState.elements.participantError.textContent = "Please enter a participant ID";
            return;
        }
        
        // Validate participant ID (letters, numbers, underscores, hyphens only)
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validPattern.test(participantId)) {
            GameState.elements.participantError.style.display = "block";
            GameState.elements.participantError.textContent = "Only letters, numbers, underscores and hyphens allowed";
            return;
        }
        
        // Set the participant ID in ApiClient
        ApiClient.setParticipantId(participantId);
        
        // Show participant info display
        GameState.elements.participantInfo.style.display = "block";
        
        // Hide participant screen
        GameState.elements.participantOverlay.style.display = "none";
        
        // Start the target mode
        switch(this.targetMode) {
            case 'demo':
                this.startDemo();
                break;
            case 'pretest':
                this.startPretest();
                break;
            case 'phase2':
                this.startPhase2();
                break;
        }
    },
    
    // Reset participant (for new participant)
    resetParticipant() {
        console.log("Resetting participant...");
        
        // Clear participant ID
        ApiClient.clearParticipantId();
        
        // Hide participant info
        GameState.elements.participantInfo.style.display = "none";
        
        // Go to home screen
        GameState.goHome();
    },
    
    // Start the pretest
    async startPretest() {
        console.log("Starting pretest...");
        
        // Start new session with backend (don't fail if backend is down)
        try {
            await ApiClient.startSession('pretest');
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('comparison');
        
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        GameState.elements.participantInfo.style.display = "block";
        
        GameState.reset();
        GameState.currentImages = ImageLoader.createComparisonPairs(GameState.questionsPerGame);
        console.log("Pretest: created", GameState.currentImages.length, "unique pairs");
        ComparisonMode.load();
    },

    // Start the demo
    async startDemo() {
        console.log("Starting demo...");
        
        // Start new session with backend (don't fail if backend is down)
        try {
            await ApiClient.startSession('demo');
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('demo');
        
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        GameState.elements.participantInfo.style.display = "block";
        
        GameState.reset();
        GameState.currentImages = ImageLoader.createDemoPairs(GameState.demoTrials);
        console.log("Demo: created", GameState.currentImages.length, "unique pairs");
        ComparisonMode.load();
    },

    // Start Phase II
    async startPhase2() {
        console.log("Starting Phase II...");
        
        // Start new session with backend (don't fail if backend is down)
        try {
            await ApiClient.startSession('phase2');
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('phase2');
        
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        GameState.elements.participantInfo.style.display = "block";
        
        GameState.reset();
        GameState.currentImages = ImageLoader.createPhase2Pairs(GameState.questionsPerGame);
        console.log("Phase II: created", GameState.currentImages.length, "unique pairs");
        ComparisonMode.load();
    },

    // Show training screen
    showTraining() {
        console.log("Showing training screen...");
        
        // Hide other screens
        GameState.elements.resultsOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "none";
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.instructions.classList.remove("show");
        GameState.elements.webcamContainer.classList.add("hidden");
        GameState.elements.webcamToggle.style.display = "none";
        
        // Show training screen (keep participant info visible)
        GameState.elements.trainingOverlay.style.display = "flex";
    },
    
    // Move to next image/question
    nextImage() {
        // Only proceed if we're waiting for next trial
        if (!GameState.waitingForNextTrial) {
            console.log("Not waiting for next trial, ignoring nextImage call");
            return;
        }
        
        console.log("Moving to next image...");
        
        // Move to next index
        GameState.currentIndex++;
        
        if (GameState.currentIndex >= GameState.currentImages.length) {
            console.log("Game complete, showing results");
            Results.show();
        } else {
            console.log(`Loading image ${GameState.currentIndex + 1} of ${GameState.currentImages.length}`);
            ComparisonMode.load();
        }
    },
    
    // Go back to home page
    goHome() {
        GameState.goHome();
    },
    
    // Setup all event listeners
    setupEventListeners() {
        console.log("Setting up event listeners...");
        
        // Landing page buttons - show participant screen first
        GameState.elements.demoBtn.addEventListener("click", () => {
            console.log("Demo button clicked!");
            this.showParticipantScreen('demo');
        });
        
        GameState.elements.startBtn.addEventListener("click", () => {
            console.log("Start button clicked!");
            this.showParticipantScreen('pretest');
        });
        
        // Participant ID submission
        GameState.elements.participantSubmitBtn.addEventListener("click", () => {
            this.submitParticipantId();
        });
        
        // Allow Enter key to submit participant ID
        GameState.elements.participantInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.submitParticipantId();
            }
        });
        
        // Training screen buttons
        GameState.elements.trainingHomeBtn.addEventListener("click", () => this.goHome());
        
        GameState.elements.phase2Btn.addEventListener("click", async () => {
            console.log("Phase 2 button clicked!");
            try {
                await this.startPhase2();
            } catch (error) {
                console.error("Error starting Phase II:", error);
            }
        });
        
        // New Participant button
        GameState.elements.newParticipantBtn.addEventListener("click", () => {
            console.log("New Participant button clicked!");
            this.resetParticipant();
        });
        
        // Comparison mode voting
        GameState.elements.optionA.addEventListener("click", () => {
            console.log("Option A clicked!");
            ComparisonMode.vote(true);
        });
        
        GameState.elements.optionB.addEventListener("click", () => {
            console.log("Option B clicked!");
            ComparisonMode.vote(false);
        });
        
        // Results buttons
        GameState.elements.homeBtn.addEventListener("click", () => this.goHome());
        GameState.elements.trainingBtn.addEventListener("click", () => this.showTraining());
        
        // Keyboard handlers
        document.body.addEventListener("keydown", e => {
            console.log("Key pressed:", e.key);
            
            // Only handle keys during comparison mode
            if (GameState.elements.comparisonOverlay.style.display !== "block") return;
            
            // Handle voting keys (only if not waiting for next trial)
            if (!GameState.waitingForNextTrial) {
                switch(e.key) {
                    case "ArrowLeft":
                    case "a":
                    case "A":
                        console.log("Left/A - voting for option A");
                        ComparisonMode.vote(true);
                        break;
                    case "ArrowRight":
                    case "b":
                    case "B":
                        console.log("Right/B - voting for option B");
                        ComparisonMode.vote(false);
                        break;
                }
            }
            
            // Handle next trial key (only if waiting for next trial)
            if (GameState.waitingForNextTrial) {
                switch(e.key) {
                    case " ": // Space bar
                    case "Enter":
                        console.log("Space/Enter - proceeding to next trial");
                        e.preventDefault(); // Prevent page scroll
                        this.nextImage();
                        break;
                }
            }
        });
        
        // Webcam toggle functionality
        if (GameState.elements.webcamToggle && GameState.elements.webcamContainer) {
            GameState.elements.webcamToggle.addEventListener('click', () => {
                GameState.elements.webcamContainer.classList.toggle('hidden');
                GameState.elements.webcamToggle.textContent = GameState.elements.webcamContainer.classList.contains('hidden') ? 'Show Camera' : 'Hide Camera';
            });
        }
        
        console.log("Event listeners setup complete!");
    }
};

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});