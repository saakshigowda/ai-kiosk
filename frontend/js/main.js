// Main game controller and initialization
const Game = {
    // Initialize the entire game
    async init() {
        console.log("Initializing AI Face Detection Challenge...");
        
        // Initialize DOM elements
        GameState.initElements();
        
        // Load image databases
        GameState.allImages = ImageLoader.loadDatabase();
        GameState.demoImages = ImageLoader.loadDemoDatabase();
        
        if (GameState.allImages.length === 0) {
            console.error("No face images loaded! Check your file paths and names.");
            return;
        }
        
        if (GameState.demoImages.length === 0) {
            console.error("No demo images loaded! Check your animals folder.");
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup image error handlers
        ImageLoader.setupErrorHandlers();
        
        // Initialize webcam (async, non-blocking)
        this.initWebcam();
        
        console.log("Game initialized successfully!");
    },
    
    // Initialize webcam in background
    async initWebcam() {
        try {
            await Webcam.init();
        } catch (error) {
            console.log("Webcam initialization failed, continuing with button controls only");
        }
    },
    
    // Start the pretest
    startPretest() {
        console.log("Starting pretest...");
        
        GameState.switchMode('comparison');
        
        // Hide landing page and show game
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
    startDemo() {
        console.log("Starting demo...");
        
        GameState.switchMode('demo');
        
        // Hide landing page and show game
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
    
    // Move to next image/question
    nextImage() {
        GameState.currentIndex++;
        
        if (GameState.currentIndex >= GameState.currentImages.length) {
            Results.show();
        } else {
            ComparisonMode.load();
        }
    },
    
    // Restart the current game mode
    restart() {
        // Hide results if showing
        Results.hide();
        
        // Reset visual effects
        Feedback.resetComparison();
        
        // Restart the appropriate game mode
        if (GameState.currentMode === 'demo') {
            this.startDemo();
        } else {
            this.startPretest();
        }
    },
    
    // Go back to home page
    goHome() {
        GameState.goHome();
    },
    
    // Setup all event listeners
    setupEventListeners() {
        console.log("Setting up event listeners...");
        
        // Landing page buttons
        GameState.elements.demoBtn.addEventListener("click", () => this.startDemo());
        GameState.elements.startBtn.addEventListener("click", () => this.startPretest());
        
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
        GameState.elements.restartBtn.addEventListener("click", () => this.restart());
        
        // Keyboard handlers
        document.body.addEventListener("keydown", e => {
            console.log("Key pressed:", e.key);
            
            // Only respond to keys during active game
            if (GameState.elements.comparisonOverlay.style.display !== "block") return;
            if (GameState.currentIndex >= GameState.currentImages.length) return;
            
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
        });
        
        // Webcam toggle functionality
        if (GameState.elements.webcamToggle && GameState.elements.webcamContainer) {
            GameState.elements.webcamToggle.addEventListener('click', () => {
                GameState.elements.webcamContainer.classList.toggle('hidden');
                GameState.elements.webcamToggle.textContent = GameState.elements.webcamContainer.classList.contains('hidden') ? '📹 Show Camera' : '📹 Hide Camera';
            });
        }
        
        console.log("Event listeners setup complete!");
    }
};

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});