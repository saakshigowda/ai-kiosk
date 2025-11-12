// Main game controller and initialization
const Game = {
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
    
    // Start the pretest
    async startPretest() {
        console.log("Starting pretest...");
        
        // Start new session with backend (don't fail if backend is down)
        try {
            await ApiClient.startSession();
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('comparison');
        
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        
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
            await ApiClient.startSession();
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('demo');
        
        GameState.elements.landingOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        
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
            await ApiClient.startSession();
        } catch (error) {
            console.log("Session start failed, continuing in offline mode");
        }
        
        GameState.switchMode('phase2');
        
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        GameState.elements.instructions.classList.add("show");
        GameState.elements.webcamContainer.classList.remove("hidden");
        GameState.elements.webcamToggle.style.display = "block";
        
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
        
        // Show training screen
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
        
        // Landing page buttons - wrapped in async
        GameState.elements.demoBtn.addEventListener("click", async () => {
            console.log("Demo button clicked!");
            try {
                await this.startDemo();
            } catch (error) {
                console.error("Error starting demo:", error);
            }
        });
        
        GameState.elements.startBtn.addEventListener("click", async () => {
            console.log("Start button clicked!");
            try {
                await this.startPretest();
            } catch (error) {
                console.error("Error starting pretest:", error);
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