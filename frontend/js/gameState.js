// Global game state management
const GameState = {
    allImages: [],
    demoImages: [], // New for demo mode
    currentImages: [],
    currentIndex: 0,
    results: [],
    gameStartTime: new Date(),
    currentMode: 'comparison', // 'comparison' or 'demo'
    questionsPerGame: 10,
    demoTrials: 5, // Number of demo trials
    trainingTirrals:  18,
    
    // DOM element references
    elements: {
        landingOverlay: null,
        demoBtn: null,
        startBtn: null,
        questionText: null,
        progressDiv: null,
        progressComparison: null,
        splitContainer: null,
        centerOverlay: null,
        comparisonOverlay: null,
        resultsOverlay: null,
        scoreDiv: null,
        breakdownDiv: null,
        img: null,
        aiSide: null,
        realSide: null,
        optionA: null,
        optionB: null,
        imageA: null,
        imageB: null,
        homeBtn: null,
        restartBtn: null,
        tabBtns: null,
        feedbackFlash: null,
        webcamContainer: null,
        webcamToggle: null,
        instructions: null
    },
    
    // Initialize DOM references
    initElements() {
        this.elements.landingOverlay = document.getElementById("landing-overlay");
        this.elements.demoBtn = document.getElementById("demo-btn");
        this.elements.startBtn = document.getElementById("start-btn");
        this.elements.questionText = document.getElementById("question-text");
        this.elements.progressDiv = document.getElementById("progress");
        this.elements.progressComparison = document.getElementById("progress-comparison");
        this.elements.splitContainer = document.getElementById("split-container");
        this.elements.centerOverlay = document.getElementById("center-overlay");
        this.elements.comparisonOverlay = document.getElementById("comparison-overlay");
        this.elements.resultsOverlay = document.getElementById("results");
        this.elements.scoreDiv = document.getElementById("score");
        this.elements.breakdownDiv = document.getElementById("breakdown");
        this.elements.img = document.getElementById("face");
        this.elements.aiSide = document.getElementById("ai-side");
        this.elements.realSide = document.getElementById("real-side");
        this.elements.optionA = document.getElementById("option-a");
        this.elements.optionB = document.getElementById("option-b");
        this.elements.imageA = document.getElementById("image-a");
        this.elements.imageB = document.getElementById("image-b");
        this.elements.homeBtn = document.getElementById("home-btn");
        this.elements.restartBtn = document.getElementById("restart-btn");
        this.elements.tabBtns = document.querySelectorAll(".tab-btn");
        this.elements.feedbackFlash = document.getElementById("feedback-flash");
        this.elements.webcamContainer = document.getElementById("webcam-container");
        this.elements.webcamToggle = document.getElementById("webcam-toggle");
        this.elements.instructions = document.getElementById("instructions");
        
        // Debug: Log which elements were found
        console.log("Demo button found:", this.elements.demoBtn);
        console.log("Home button found:", this.elements.homeBtn);
    },
    
    // Reset game state
    reset() {
        this.currentIndex = 0;
        this.results = [];
        this.gameStartTime = new Date();
    },
    
    // Record a game result
    recordResult(imageData, userGuess, isCorrect, pairData = null) {
        const result = {
            imageNumber: this.currentIndex + 1,
            mode: this.currentMode,
            filename: this.currentMode === 'demo' ? 
                `${pairData.dogImage.file} vs ${pairData.catImage.file}` :
                `${pairData.realImage.file} vs ${pairData.aiImage.file}`,
            actualType: this.currentMode === 'demo' ? "Demo" : "Comparison",
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
        } else if (newMode === 'traingin') {
            document.body.className = 'training-mode'
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
        this.elements.instructions.classList.remove("show");
        this.elements.webcamContainer.classList.add("hidden");
        this.elements.webcamToggle.style.display = "none";
        
        // Show landing page
        this.elements.landingOverlay.style.display = "flex";
        
        // Reset game state
        this.reset();
    }
};