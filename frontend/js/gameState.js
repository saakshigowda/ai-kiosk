// Global game state management
const GameState = {
    allImages: [],
    currentImages: [],
    currentIndex: 0,
    results: [],
    gameStartTime: new Date(),
    currentMode: 'single',
    questionsPerGame: 10,
    
    // DOM element references
    elements: {
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
        restartBtn: null,
        tabBtns: null,
        feedbackFlash: null
    },
    
    // Initialize DOM references
    initElements() {
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
        this.elements.restartBtn = document.getElementById("restart-btn");
        this.elements.tabBtns = document.querySelectorAll(".tab-btn");
        this.elements.feedbackFlash = document.getElementById("feedback-flash");
        
        // Debug: Log which elements were found
        console.log("AI Side found:", this.elements.aiSide);
        console.log("Real Side found:", this.elements.realSide);
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
            filename: imageData.file || `${pairData.realImage.file} vs ${pairData.aiImage.file}`,
            actualType: imageData.isAI !== undefined ? (imageData.isAI ? "AI" : "Real") : "Comparison",
            userGuess: userGuess,
            correct: isCorrect,
            timestamp: new Date().toISOString()
        };
        
        if (pairData) {
            result.comparison = {
                realImage: pairData.realImage.file,
                aiImage: pairData.aiImage.file,
                realInA: pairData.realInA,
                userChose: userGuess
            };
        }
        
        this.results.push(result);
        console.log("Result recorded:", result);
    },
    
    // Switch between game modes
    switchMode(newMode) {
        if (newMode === this.currentMode) return;
        
        this.currentMode = newMode;
        
        // Update tab buttons
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });
        
        // Update body class for CSS
        document.body.className = newMode === 'comparison' ? 'comparison-mode' : '';
        
        // Restart game in new mode
        Game.restart();
    }
};