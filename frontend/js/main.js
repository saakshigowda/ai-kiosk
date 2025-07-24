// Main game controller and initialization
const Game = {
    // Initialize the entire game
    async init() {
        console.log("Initializing AI Face Detection Challenge...");
        
        // Initialize DOM elements
        GameState.initElements();
        
        // Load image database
        GameState.allImages = ImageLoader.loadDatabase();
        if (GameState.allImages.length === 0) {
            console.error("No images loaded! Check your file paths and names.");
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup image error handlers
        ImageLoader.setupErrorHandlers();
        
        // Initialize webcam (async, non-blocking)
        this.initWebcam();
        
        // Start the game
        this.start();
        
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
    
    // Start or restart the game
    start() {
        console.log("Starting game in", GameState.currentMode, "mode...");
        
        // Reset game state
        GameState.reset();
        
        if (GameState.currentMode === 'single') {
            // For single mode: use shuffled subset
            const maxQuestions = Math.min(GameState.questionsPerGame, GameState.allImages.length);
            GameState.currentImages = Utils.shuffleArray(GameState.allImages).slice(0, maxQuestions);
            console.log("Single mode: using", GameState.currentImages.length, "shuffled images");
            SingleMode.load();
        } else {
            // For comparison mode: create predefined pairs to avoid repeats
            GameState.currentImages = ImageLoader.createComparisonPairs(GameState.questionsPerGame);
            console.log("Comparison mode: created", GameState.currentImages.length, "unique pairs");
            ComparisonMode.load();
        }
    },
    
    // Move to next image/question
    nextImage() {
        GameState.currentIndex++;
        
        const maxQuestions = GameState.currentMode === 'single' ? 
            Math.min(GameState.questionsPerGame, GameState.currentImages.length) : 
            GameState.currentImages.length;
        
        if (GameState.currentIndex >= maxQuestions) {
            Results.show();
        } else {
            if (GameState.currentMode === 'single') {
                SingleMode.load();
            } else {
                ComparisonMode.load();
            }
        }
    },
    
    // Restart the game
    restart() {
        // Hide results if showing
        Results.hide();
        
        // Reset visual effects
        if (GameState.currentMode === 'single') {
            Feedback.resetSingle();
        } else {
            Feedback.resetComparison();
        }
        
        // Restart the game
        this.start();
    },
    
    // Setup all event listeners
    setupEventListeners() {
        console.log("Setting up event listeners...");
        
        // Tab switching
        GameState.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => GameState.switchMode(btn.dataset.mode));
        });
        
        // Single mode - click on sides
        console.log("AI Side element:", GameState.elements.aiSide);
        console.log("Real Side element:", GameState.elements.realSide);
        
        GameState.elements.aiSide.addEventListener("click", () => {
            console.log("AI side clicked!");
            SingleMode.vote(true);
        });
        
        GameState.elements.realSide.addEventListener("click", () => {
            console.log("Real side clicked!");
            SingleMode.vote(false);
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
        
        // Restart button
        GameState.elements.restartBtn.addEventListener("click", () => this.restart());
        
        // Keyboard handlers
        document.body.addEventListener("keydown", e => {
            console.log("Key pressed:", e.key);
            
            const maxQuestions = GameState.currentMode === 'single' ? 
                Math.min(GameState.questionsPerGame, GameState.currentImages.length) : 
                GameState.currentImages.length;
                
            if (GameState.currentIndex >= maxQuestions) return;
            
            if (GameState.currentMode === 'single') {
                switch(e.key) {
                    case "ArrowLeft":
                        console.log("Left arrow - voting AI");
                        SingleMode.vote(true);
                        break;
                    case "ArrowRight":
                        console.log("Right arrow - voting Real");
                        SingleMode.vote(false);
                        break;
                }
            } else {
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
        });
        
        console.log("Event listeners setup complete!");
    }
};

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});