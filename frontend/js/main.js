// Main game controller and initialization
const Game = {
    targetMode: null, // Store which mode we're heading to
    
    // Initialize the entire game
    async init() {
        console.log("Initializing FaceOrFake...");
        
        GameState.initElements();
        GameState.allImages = ImageLoader.loadDatabase();
        GameState.setBImages = ImageLoader.loadSetBDatabase();
        GameState.trainingImages = ImageLoader.loadTrainingDatabase();
        GameState.demoImages = ImageLoader.loadDemoDatabase();
        
        if (GameState.allImages.length === 0) {
            console.error("No face images loaded! Check your file paths and names.");
            return;
        }
        
        if (GameState.setBImages.length === 0) {
            console.error("No SetB images loaded! Check your SetB folder.");
            return;
        }
        
        if (GameState.trainingImages.length === 0) {
            console.error("No Training images loaded! Check your Training folder.");
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
            case 'phase1':
            case 'pretest':
                this.startPhase1();
                break;
            case 'phase2':
            case 'training':
                this.startPhase2();
                break;
            case 'phase3':
                this.startPhase3();
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
    
    // Start Phase I (pretest)
    async startPhase1() {
        console.log("Starting Phase I...");
        
        // Start new session with backend (don't fail if backend is down)
        try {
            await ApiClient.startSession('phase1');
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('phase1');
        
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        GameState.elements.participantInfo.style.display = "block";
        
        GameState.reset();
        GameState.currentImages = ImageLoader.createComparisonPairs(GameState.questionsPerGame);
        console.log("Pretest: created", GameState.currentImages.length, "unique pairs");
        GameState.updateDevNav();
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
        GameState.updateDevNav();
        ComparisonMode.load();
    },

    // Show Phase II instructions before starting trials
    showPhase2Instructions() {
        console.log("Showing Phase II instructions...");
        
        // Hide other overlays
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.phase1CompleteOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "none";
        
        // Show the Phase II instructions overlay
        if (GameState.elements.phase2InstructionsOverlay) {
            GameState.elements.phase2InstructionsOverlay.style.display = "flex";
        }
    },

    // Start Phase II (training) - shows instructions first
    async startPhase2() {
        console.log("Starting Phase II...");
        this.showPhase2Instructions();
    },

    // Actually begin Phase II trials after user reads instructions
    async beginPhase2Trials() {
        console.log("Beginning Phase II trials...");
        
        // Hide the instructions overlay
        if (GameState.elements.phase2InstructionsOverlay) {
            GameState.elements.phase2InstructionsOverlay.style.display = "none";
        }
        
        // Start new session with backend (don't fail if backend is down)
        try {
            await ApiClient.startSession('phase2');
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('phase2');
        
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.phase1CompleteOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        GameState.elements.participantInfo.style.display = "block";
        
        GameState.reset();
        GameState.currentImages = ImageLoader.createPhase2Pairs(GameState.trainingTrials);
        console.log("Phase II: created", GameState.currentImages.length, "unique pairs");
        GameState.updateDevNav();
        ComparisonMode.load();
    },

    // Start Phase III
    async startPhase3() {
        console.log("Starting Phase III...");
        
        // Start new session with backend (don't fail if backend is down)
        try {
            await ApiClient.startSession('phase3');
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('phase3');
        
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.trainingCompleteOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        GameState.elements.participantInfo.style.display = "block";
        
        GameState.reset();
        GameState.currentImages = ImageLoader.createPhase3Pairs(GameState.questionsPerGame);
        console.log("Phase III: created", GameState.currentImages.length, "unique pairs");
        GameState.updateDevNav();
        ComparisonMode.load();
    },

    // Show Phase 1 complete screen
    showPhase1Complete() {
        console.log("Showing Phase 1 complete screen...");
        
        // Hide other screens
        GameState.elements.resultsOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "none";
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.trainingCompleteOverlay.style.display = "none";
        GameState.elements.instructions.classList.remove("show");
        GameState.elements.webcamContainer.classList.add("hidden");
        GameState.elements.webcamToggle.style.display = "none";
        
        // Show Phase 1 complete screen (keep participant info visible)
        GameState.elements.phase1CompleteOverlay.style.display = "flex";
    },
    
    // Show training complete screen
    showTrainingComplete() {
        console.log("Showing training complete screen...");
        
        // Hide other screens
        GameState.elements.resultsOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "none";
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.phase1CompleteOverlay.style.display = "none";
        GameState.elements.instructions.classList.remove("show");
        GameState.elements.webcamContainer.classList.add("hidden");
        GameState.elements.webcamToggle.style.display = "none";
        
        // Show training complete screen (keep participant info visible)
        GameState.elements.trainingCompleteOverlay.style.display = "flex";
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
        // Check if game is complete (last trial already handled)
        if (GameState.gameComplete) {
            console.log("Game complete - ignoring nextImage call (Results already showing)");
            return;
        }
        
        // Only proceed if we're waiting for next trial
        if (!GameState.waitingForNextTrial) {
            console.log("Not waiting for next trial, ignoring nextImage call");
            return;
        }
        
        console.log("Moving to next image...");

        // Persist the confirmed selection now (deferred from vote so undo can discard it).
        ComparisonMode.commitTrial();

        // Move to next index
        GameState.currentIndex++;

        if (GameState.currentIndex >= GameState.currentImages.length) {
            // Final pair confirmed (thumbs up / space) — now show results
            console.log("Reached end of images - showing results");
            const completedMode = GameState.currentMode;
            GameState.gameComplete = true;
            Results.show(completedMode);
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
            this.showParticipantScreen('phase1');
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
        
        // Training screen buttons (on the training overlay screen)
        if (GameState.elements.trainingHomeBtn) {
            GameState.elements.trainingHomeBtn.addEventListener("click", () => this.goHome());
        }
        
        if (GameState.elements.trainingStartBtn) {
            GameState.elements.trainingStartBtn.addEventListener("click", () => {
                console.log("Start Training button clicked!");
                this.startPhase2();
            });
        }
        
        if (GameState.elements.phase2Btn) {
            GameState.elements.phase2Btn.addEventListener("click", async () => {
                console.log("Phase 3 button clicked!");
                try {
                    await this.startPhase3();
                } catch (error) {
                    console.error("Error starting Phase III:", error);
                }
            });
        }
        
        // Phase 1 Complete screen buttons
        if (GameState.elements.phase1HomeBtn) {
            GameState.elements.phase1HomeBtn.addEventListener("click", () => {
                console.log("Phase 1 Complete - Home clicked");
                this.goHome();
            });
        } else {
            console.warn("phase1HomeBtn not found!");
        }
        
        if (GameState.elements.phase1TrainingBtn) {
            GameState.elements.phase1TrainingBtn.addEventListener("click", () => {
                console.log("Phase 1 Complete - Start Phase II clicked!");
                this.startPhase2();
            });
        } else {
            console.warn("phase1TrainingBtn not found!");
        }
        
        // Phase II Instructions continue button
        if (GameState.elements.phase2InstructionsContinueBtn) {
            GameState.elements.phase2InstructionsContinueBtn.addEventListener("click", async () => {
                console.log("Phase II Instructions - Continue clicked!");
                try {
                    await this.beginPhase2Trials();
                } catch (error) {
                    console.error("Error beginning Phase II trials:", error);
                }
            });
        } else {
            console.warn("phase2InstructionsContinueBtn not found!");
        }
        
        // Training Complete screen buttons
        if (GameState.elements.trainingCompleteHomeBtn) {
            GameState.elements.trainingCompleteHomeBtn.addEventListener("click", () => {
                console.log("Training Complete - Home clicked");
                this.goHome();
            });
        } else {
            console.warn("trainingCompleteHomeBtn not found!");
        }
        
        if (GameState.elements.trainingCompletePhase2Btn) {
            GameState.elements.trainingCompletePhase2Btn.addEventListener("click", async () => {
                console.log("Phase II Complete - Start Phase III clicked!");
                try {
                    await this.startPhase3();
                } catch (error) {
                    console.error("Error starting Phase III:", error);
                }
            });
        } else {
            console.warn("trainingCompletePhase2Btn not found!");
        }
        
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

        // Undo button - reverse the current selection before confirming
        if (GameState.elements.undoBtn) {
            GameState.elements.undoBtn.addEventListener("click", () => {
                console.log("Undo button clicked!");
                ComparisonMode.undo();
            });
        }

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
                    case "u":
                    case "U":
                    case "Backspace":
                        console.log("U/Backspace - undoing selection");
                        e.preventDefault();
                        ComparisonMode.undo();
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
        
        // Dev navigation buttons
        if (GameState.elements.devBackBtn) {
            GameState.elements.devBackBtn.addEventListener('click', () => {
                console.log("Dev Back button clicked");
                if (GameState.currentMode === 'phase2') {
                    // Go back to Phase 1 Complete screen
                    this.showPhase1Complete();
                } else if (GameState.currentMode === 'phase3') {
                    // Go back to Phase II Complete screen
                    this.showTrainingComplete();
                }
            });
        }
        
        if (GameState.elements.devHomeBtn) {
            GameState.elements.devHomeBtn.addEventListener('click', () => {
                console.log("Dev Home button clicked");
                this.goHome();
            });
        }
        
        if (GameState.elements.devNextBtn) {
            GameState.elements.devNextBtn.addEventListener('click', () => {
                console.log("Dev Next button clicked");
                if (GameState.currentMode === 'phase1') {
                    // Skip to Phase 1 Complete screen
                    this.showPhase1Complete();
                } else if (GameState.currentMode === 'phase2') {
                    // Skip to Phase II complete screen
                    this.showTrainingComplete();
                } else if (GameState.currentMode === 'demo') {
                    // Go to Phase I
                    this.showParticipantScreen('phase1');
                }
            });
        }
        
        console.log("Event listeners setup complete!");
    }
};

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});