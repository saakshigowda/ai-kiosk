// Global game state management
const GameState = {
    allImages: [],
    setBImages: [], // For Phase II
    demoImages: [],
    currentImages: [],
    currentIndex: 0,
    results: [],
    gameStartTime: new Date(),
    currentMode: 'comparison', // 'comparison', 'demo', or 'phase2'
    questionsPerGame: 15,
    demoTrials: 5,
    waitingForNextTrial: false, // NEW: Prevents multiple votes and controls progression
    
    // DOM element references
    elements: {
        landingOverlay: null,
        trainingOverlay: null,
        demoBtn: null,
        startBtn: null,
        trainingHomeBtn: null,
        phase2Btn: null,
        progressComparison: null,
        comparisonOverlay: null,
        resultsOverlay: null,
        scoreDiv: null,
        breakdownDiv: null,
        optionA: null,
        optionB: null,
        imageA: null,
        imageB: null,
        homeBtn: null,
        trainingBtn: null,
        feedbackFlash: null,
        webcamContainer: null,
        webcamToggle: null,
        instructions: null
    },
    
    // Initialize DOM references
    initElements() {
        this.elements.landingOverlay = document.getElementById("landing-overlay");
        this.elements.trainingOverlay = document.getElementById("training-overlay");
        this.elements.demoBtn = document.getElementById("demo-btn");
        this.elements.startBtn = document.getElementById("start-btn");
        this.elements.trainingHomeBtn = document.getElementById("training-home-btn");
        this.elements.phase2Btn = document.getElementById("phase2-btn");
        this.elements.progressComparison = document.getElementById("progress-comparison");
        this.elements.comparisonOverlay = document.getElementById("comparison-overlay");
        this.elements.resultsOverlay = document.getElementById("results");
        this.elements.scoreDiv = document.getElementById("score");
        this.elements.breakdownDiv = document.getElementById("breakdown");
        this.elements.optionA = document.getElementById("option-a");
        this.elements.optionB = document.getElementById("option-b");
        this.elements.imageA = document.getElementById("image-a");
        this.elements.imageB = document.getElementById("image-b");
        this.elements.homeBtn = document.getElementById("home-btn");
        this.elements.trainingBtn = document.getElementById("training-btn");
        this.elements.feedbackFlash = document.getElementById("feedback-flash");
        this.elements.webcamContainer = document.getElementById("webcam-container");
        this.elements.webcamToggle = document.getElementById("webcam-toggle");
        this.elements.instructions = document.getElementById("instructions");
    },
    
    // Reset game state
    reset() {
        this.currentIndex = 0;
        this.results = [];
        this.gameStartTime = new Date();
        this.waitingForNextTrial = false;
    },
    
    // Record a game result
    recordResult(imageData, userGuess, isCorrect, pairData = null) {
        const result = {
            imageNumber: this.currentIndex + 1,
            mode: this.currentMode,
            filename: this.currentMode === 'demo' ? 
                `${pairData.dogImage.file} vs ${pairData.catImage.file}` :
                `${pairData.realImage.file} vs ${pairData.aiImage.file}`,
            actualType: this.currentMode === 'demo' ? "Demo" : 
                       this.currentMode === 'phase2' ? "Phase II" : "Pretest",
            userGuess: userGuess,
            correct: isCorrect,
            timestamp: new Date().toISOString()
        };
        
        if (pairData) {
            if (this.currentMode === 'demo') {
                result.comparison = {
                    dogImage: pairData.dogImage.file,
                    catImage: pairData.catImage.file,
                    dogInA: pairData.dogInA,
                    userChose: userGuess
                };
            } else {
                result.comparison = {
                    realImage: pairData.realImage.file,
                    aiImage: pairData.aiImage.file,
                    realInA: pairData.realInA,
                    userChose: userGuess
                };
            }
        }
        
        this.results.push(result);
        console.log("Result recorded:", result);
    },
    
    // Switch between game modes
    switchMode(newMode) {
        if (newMode === this.currentMode) return;
        
        this.currentMode = newMode;
        
        // Update body class for CSS
        if (newMode === 'demo') {
            document.body.className = 'demo-mode';
        } else if (newMode === 'phase2') {
            document.body.className = 'phase2-mode';
        } else {
            document.body.className = '';
        }
        
        console.log("Switched to mode:", newMode);
    },
    
    // Go back to home page
    goHome() {
        // Reset mode
        this.currentMode = 'comparison';
        document.body.className = '';
        
        // Hide all game interfaces
        this.elements.comparisonOverlay.style.display = "none";
        this.elements.resultsOverlay.style.display = "none";
        this.elements.trainingOverlay.style.display = "none";
        this.elements.instructions.classList.remove("show");
        this.elements.webcamContainer.classList.add("hidden");
        this.elements.webcamToggle.style.display = "none";
        
        // Show landing page
        this.elements.landingOverlay.style.display = "flex";
        
        // Reset game state
        this.reset();
    }
};