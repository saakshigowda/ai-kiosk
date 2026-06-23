// Global game state management
const GameState = {
    allImages: [],
    setBImages: [],
    trainingImages: [],
    demoImages: [],
    currentImages: [],
    currentIndex: 0,
    results: [],
    gameStartTime: new Date(),
    currentMode: 'phase1',
    questionsPerGame: 15,
    trainingTrials: 18,
    demoTrials: 5,
    waitingForNextTrial: false,
    gameComplete: false,
    
    // Counterbalancing: 'A' = Phase I uses Set A, Phase III uses Set B
    //                   'B' = Phase I uses Set B, Phase III uses Set A
    setOrder: 'A',
    
    // Phase scores for final comparison
    phaseScores: {
        phase1: { correct: 0, total: 0 },
        phase2: { correct: 0, total: 0 },  // training
        phase3: { correct: 0, total: 0 }
    },
    
    // DOM element references
    elements: {
        landingOverlay: null,
        participantOverlay: null,
        participantInput: null,
        participantSubmitBtn: null,
        participantError: null,
        participantInfo: null,
        participantDisplay: null,
        trainingOverlay: null,
        phase1CompleteOverlay: null,
        trainingCompleteOverlay: null,
        phase2InstructionsOverlay: null,
        demoBtn: null,
        startBtn: null,
        trainingHomeBtn: null,
        trainingStartBtn: null,
        phase2Btn: null,
        trainingBtn: null,
        newParticipantBtn: null,
        phase1HomeBtn: null,
        phase1TrainingBtn: null,
        trainingCompleteHomeBtn: null,
        trainingCompletePhase2Btn: null,
        phase2InstructionsContinueBtn: null,
        progressComparison: null,
        comparisonOverlay: null,
        resultsOverlay: null,
        scoreDiv: null,
        breakdownDiv: null,
        optionA: null,
        optionB: null,
        imageA: null,
        imageB: null,
        undoBtn: null,
        homeBtn: null,
        feedbackFlash: null,
        webcamContainer: null,
        webcamToggle: null,
        instructions: null,
        devNav: null,
        devBackBtn: null,
        devHomeBtn: null,
        devNextBtn: null
    },
    
    // Initialize DOM references
    initElements() {
        this.elements.landingOverlay = document.getElementById("landing-overlay");
        this.elements.participantOverlay = document.getElementById("participant-overlay");
        this.elements.participantInput = document.getElementById("participant-id-input");
        this.elements.participantSubmitBtn = document.getElementById("participant-submit-btn");
        this.elements.participantError = document.getElementById("participant-error");
        this.elements.participantInfo = document.getElementById("participant-info");
        this.elements.participantDisplay = document.getElementById("participant-display");
        this.elements.trainingOverlay = document.getElementById("training-overlay");
        this.elements.phase1CompleteOverlay = document.getElementById("phase1-complete-overlay");
        this.elements.trainingCompleteOverlay = document.getElementById("training-complete-overlay");
        this.elements.phase2InstructionsOverlay = document.getElementById("phase2-instructions-overlay");
        this.elements.demoBtn = document.getElementById("demo-btn");
        this.elements.startBtn = document.getElementById("start-btn");
        this.elements.trainingHomeBtn = document.getElementById("training-home-btn");
        this.elements.trainingStartBtn = document.getElementById("training-start-btn");
        this.elements.phase2Btn = document.getElementById("phase2-btn");
        this.elements.newParticipantBtn = document.getElementById("new-participant-btn");
        this.elements.phase1HomeBtn = document.getElementById("phase1-home-btn");
        this.elements.phase1TrainingBtn = document.getElementById("phase1-training-btn");
        this.elements.trainingCompleteHomeBtn = document.getElementById("training-complete-home-btn");
        this.elements.trainingCompletePhase2Btn = document.getElementById("training-complete-phase2-btn");
        this.elements.phase2InstructionsContinueBtn = document.getElementById("phase2-instructions-continue-btn");
        this.elements.progressComparison = document.getElementById("progress-comparison");
        this.elements.comparisonOverlay = document.getElementById("comparison-overlay");
        this.elements.resultsOverlay = document.getElementById("results");
        this.elements.scoreDiv = document.getElementById("score");
        this.elements.breakdownDiv = document.getElementById("breakdown");
        this.elements.optionA = document.getElementById("option-a");
        this.elements.optionB = document.getElementById("option-b");
        this.elements.imageA = document.getElementById("image-a");
        this.elements.imageB = document.getElementById("image-b");
        this.elements.undoBtn = document.getElementById("undo-btn");
        this.elements.homeBtn = document.getElementById("home-btn");
        this.elements.trainingBtn = document.getElementById("training-btn");
        this.elements.feedbackFlash = document.getElementById("feedback-flash");
        this.elements.webcamContainer = document.getElementById("webcam-container");
        this.elements.webcamToggle = document.getElementById("webcam-toggle");
        this.elements.instructions = document.getElementById("instructions");
        this.elements.devNav = document.getElementById("dev-nav");
        this.elements.devBackBtn = document.getElementById("dev-back-btn");
        this.elements.devHomeBtn = document.getElementById("dev-home-btn");
        this.elements.devNextBtn = document.getElementById("dev-next-btn");
        this.elements.finalResultsOverlay = document.getElementById("final-results-overlay");
    },
    
    // Reset game state for next phase (keeps phase scores)
    reset() {
        this.currentIndex = 0;
        this.results = [];
        this.gameStartTime = new Date();
        this.waitingForNextTrial = false;
        this.gameComplete = false;
    },
    
    // Full reset including phase scores (for going home)
    fullReset() {
        this.reset();
        this.phaseScores = {
            phase1: { correct: 0, total: 0 },
            phase2: { correct: 0, total: 0 },
            phase3: { correct: 0, total: 0 }
        };
    },
    
    // Save current phase score
    savePhaseScore(phase) {
        const correctAnswers = this.results.filter(r => r.correct).length;
        const totalQuestions = this.results.length;
        
        if (phase === 'phase1' || phase === 'comparison' || phase === 'pretest') {
            this.phaseScores.phase1 = { correct: correctAnswers, total: totalQuestions };
        } else if (phase === 'phase2' || phase === 'training') {
            this.phaseScores.phase2 = { correct: correctAnswers, total: totalQuestions };
        } else if (phase === 'phase3') {
            this.phaseScores.phase3 = { correct: correctAnswers, total: totalQuestions };
        }
        
        console.log(`Saved ${phase} score:`, correctAnswers, '/', totalQuestions);
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
                       this.currentMode === 'phase3' ? "Phase III" :
                       this.currentMode === 'phase2' ? "Phase II" : "Phase I",
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
        } else if (newMode === 'phase3') {
            document.body.className = 'phase3-mode';
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
        this.currentMode = 'phase1';
        document.body.className = '';
        
        // Hide all game interfaces
        this.elements.comparisonOverlay.style.display = "none";
        this.elements.resultsOverlay.style.display = "none";
        this.elements.trainingOverlay.style.display = "none";
        this.elements.phase1CompleteOverlay.style.display = "none";
        this.elements.trainingCompleteOverlay.style.display = "none";
        if (this.elements.phase2InstructionsOverlay) {
            this.elements.phase2InstructionsOverlay.style.display = "none";
        }
        if (this.elements.finalResultsOverlay) {
            this.elements.finalResultsOverlay.style.display = "none";
        }
        this.elements.instructions.classList.remove("show");
        this.elements.webcamContainer.classList.add("hidden");
        this.elements.webcamToggle.style.display = "none";
        this.elements.participantInfo.style.display = "none";
        if (typeof Feedback !== 'undefined') {
            Feedback.hideTrainingMessage();
        }
        
        // Hide dev nav
        this.updateDevNav();
        
        // Show landing page
        this.elements.landingOverlay.style.display = "flex";
        
        // Full reset including phase scores
        this.fullReset();
    },
    
    // Update dev navigation buttons based on current mode
    updateDevNav() {
        if (!this.elements.devNav) return;
        
        // Hide all buttons by default
        this.elements.devBackBtn.style.display = "none";
        this.elements.devHomeBtn.style.display = "none";
        this.elements.devNextBtn.style.display = "none";
        
        // Show container only during active phases
        const isActivePhase = this.elements.comparisonOverlay.style.display === "block";
        
        if (isActivePhase) {
            this.elements.devNav.classList.remove("hidden");
            
            // Show buttons based on current mode
            switch(this.currentMode) {
                case 'phase1': // Phase I
                    this.elements.devHomeBtn.style.display = "inline-block";
                    this.elements.devNextBtn.style.display = "inline-block";
                    break;
                case 'phase2': // Phase II
                    this.elements.devBackBtn.style.display = "inline-block";
                    this.elements.devHomeBtn.style.display = "inline-block";
                    this.elements.devNextBtn.style.display = "inline-block";
                    break;
                case 'phase3': // Phase III
                    this.elements.devBackBtn.style.display = "inline-block";
                    this.elements.devHomeBtn.style.display = "inline-block";
                    break;
                case 'demo':
                    this.elements.devHomeBtn.style.display = "inline-block";
                    this.elements.devNextBtn.style.display = "inline-block";
                    break;
            }
        } else {
            this.elements.devNav.classList.add("hidden");
        }
    }
};