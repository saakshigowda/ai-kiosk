// Side-by-side comparison mode game logic
const ComparisonMode = {
    trialStartTime: null, // Track when trial starts
    pendingTrial: null,   // Vote staged for save; committed on confirm, discarded on undo
    undoCount: 0,         // Times the participant reversed on the current pair (reset each load)

    // Load images for comparison mode
    load() {
        if (GameState.currentIndex >= GameState.currentImages.length) {
            console.error("No more pairs to load");
            return;
        }
        
        // Record trial start time
        this.trialStartTime = Date.now();
        this.undoCount = 0; // fresh pair, no reversals yet

        Feedback.resetComparison();
        this.hideUndoButton();
        
        const currentPair = GameState.currentImages[GameState.currentIndex];
        
        // Add/remove phase2-mode class based on current mode
        if (GameState.currentMode === 'phase2') {
            GameState.elements.imageA.classList.add('phase2-mode');
            GameState.elements.imageB.classList.add('phase2-mode');
        } else {
            GameState.elements.imageA.classList.remove('phase2-mode');
            GameState.elements.imageB.classList.remove('phase2-mode');
        }
        
        if (GameState.currentMode === 'demo') {
            // Demo mode: Load cat vs dog images
            const assetPath = 'assets/animals/';
            
            if (currentPair.dogInA) {
                GameState.elements.imageA.src = `${assetPath}${currentPair.dogImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.catImage.file}`;
            } else {
                GameState.elements.imageA.src = `${assetPath}${currentPair.catImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.dogImage.file}`;
            }
            
            console.log(`Demo Round ${GameState.currentIndex + 1}: Dog in ${currentPair.dogInA ? 'A' : 'B'}`);
            console.log(`Images: ${currentPair.dogImage.originalName} vs ${currentPair.catImage.originalName}`);
        } else if (GameState.currentMode === 'phase3') {
            // Phase III mode: Load real vs AI images
            // Use opposite set from Phase I based on counterbalancing
            const useSetA = GameState.setOrder === 'B';
            const assetPath = useSetA ? 'assets/faces/' : 'assets/SetB/';
            
            if (currentPair.realInA) {
                GameState.elements.imageA.src = `${assetPath}${currentPair.realImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.aiImage.file}`;
            } else {
                GameState.elements.imageA.src = `${assetPath}${currentPair.aiImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.realImage.file}`;
            }
            
            console.log(`Phase III Round ${GameState.currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'} (using ${useSetA ? 'SetA' : 'SetB'})`);
            console.log(`Images: ${currentPair.realImage.originalName} vs ${currentPair.aiImage.originalName}`);
        } else if (GameState.currentMode === 'phase2') {
            // Phase II mode: Load real vs AI images from Training folder
            const assetPath = 'assets/Training/';
            
            if (currentPair.realInA) {
                GameState.elements.imageA.src = `${assetPath}${currentPair.realImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.aiImage.file}`;
            } else {
                GameState.elements.imageA.src = `${assetPath}${currentPair.aiImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.realImage.file}`;
            }
            
            console.log(`Phase II Round ${GameState.currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'}`);
            console.log(`Images: ${currentPair.realImage.originalName} vs ${currentPair.aiImage.originalName}`);
        } else {
            // Pretest (Phase I) mode: Load real vs AI images
            // Use Set A or Set B based on counterbalancing
            const useSetB = GameState.setOrder === 'B';
            const assetPath = useSetB ? 'assets/SetB/' : 'assets/faces/';
            
            if (currentPair.realInA) {
                GameState.elements.imageA.src = `${assetPath}${currentPair.realImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.aiImage.file}`;
            } else {
                GameState.elements.imageA.src = `${assetPath}${currentPair.aiImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.realImage.file}`;
            }
            
            console.log(`Phase I Round ${GameState.currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'} (using ${useSetB ? 'SetB' : 'SetA'})`);
            console.log(`Images: ${currentPair.realImage.originalName} vs ${currentPair.aiImage.originalName}`);
        }
        
        // Update question text
        const comparisonQuestionText = GameState.elements.comparisonOverlay.querySelector('.question-text');
        if (comparisonQuestionText) {
            const questionSet = GameState.currentMode === 'demo' ? Questions.demo : Questions.comparison;
            comparisonQuestionText.textContent = Utils.getRandomQuestion(questionSet);
        }
        
        // Update progress
        if (GameState.elements.progressComparison) {
            const totalQuestions = GameState.currentImages.length;
            GameState.elements.progressComparison.textContent = `Image ${GameState.currentIndex + 1} of ${totalQuestions}`;
        }
        
        // Enable voting gestures when new images load
        if (typeof Webcam !== 'undefined' && Webcam.isSetup) {
            Webcam.gesturesEnabled = true;
            Webcam.waitingForThumbsUp = false;
            console.log("New images loaded - voting gestures enabled");
        }
        
        // Reset the waiting state for next trial
        GameState.waitingForNextTrial = false;
    },
    
    // Handle user vote in comparison mode
    async vote(chooseA) {
        // Prevent multiple votes
        if (GameState.waitingForNextTrial) {
            console.log("Already voted, waiting for next trial");
            return;
        }
        
        console.log("Comparison mode vote received:", chooseA ? "A" : "B");
        
        // Calculate response time
        const responseTime = Date.now() - this.trialStartTime;
        
        // Set waiting state to prevent multiple votes
        GameState.waitingForNextTrial = true;
        
        // Disable voting gestures and enter thumbs up mode
        if (typeof Webcam !== 'undefined' && Webcam.isSetup) {
            Webcam.gesturesEnabled = false;
            Webcam.waitingForThumbsUp = true;
            console.log("Vote registered - now waiting for thumbs up or space to continue");
        }
        
        const currentPair = GameState.currentImages[GameState.currentIndex];
        let userChoseCorrect, selectedImage, actualChoice, leftImage, rightImage, correctSide;
        
        if (GameState.currentMode === 'demo') {
            // Demo mode: User is correct if they choose the dog
            userChoseCorrect = (chooseA && currentPair.dogInA) || (!chooseA && !currentPair.dogInA);
            
            // Determine which images are on left (A) and right (B)
            leftImage = currentPair.dogInA ? currentPair.dogImage.file : currentPair.catImage.file;
            rightImage = currentPair.dogInA ? currentPair.catImage.file : currentPair.dogImage.file;
            correctSide = currentPair.dogInA ? 'left' : 'right';
            
            selectedImage = chooseA ? 
                (currentPair.dogInA ? currentPair.dogImage : currentPair.catImage) :
                (currentPair.dogInA ? currentPair.catImage : currentPair.dogImage);
            
            actualChoice = chooseA ? 
                (currentPair.dogInA ? "Dog" : "Cat") :
                (currentPair.dogInA ? "Cat" : "Dog");
                
            console.log("Dog in A:", currentPair.dogInA, "User chose A:", chooseA, "User chose dog:", userChoseCorrect);
        } else {
            // Pretest and Phase III modes: User is correct if they choose the real image
            userChoseCorrect = (chooseA && currentPair.realInA) || (!chooseA && !currentPair.realInA);
            
            // Determine which images are on left (A) and right (B)
            leftImage = currentPair.realInA ? currentPair.realImage.file : currentPair.aiImage.file;
            rightImage = currentPair.realInA ? currentPair.aiImage.file : currentPair.realImage.file;
            correctSide = currentPair.realInA ? 'left' : 'right';
            
            selectedImage = chooseA ? 
                (currentPair.realInA ? currentPair.realImage : currentPair.aiImage) :
                (currentPair.realInA ? currentPair.aiImage : currentPair.realImage);
            
            actualChoice = chooseA ? 
                (currentPair.realInA ? "Real" : "AI") :
                (currentPair.realInA ? "AI" : "Real");
                
            console.log("Real in A:", currentPair.realInA, "User chose A:", chooseA, "User chose real:", userChoseCorrect);
        }
        
        // Show immediate feedback
        if (GameState.currentMode === 'demo') {
            Feedback.showDemo(userChoseCorrect, currentPair.dogInA, chooseA);
        } else {
            Feedback.showComparison(userChoseCorrect, currentPair.realInA, chooseA);
        }
        
        // Record result in game state (for local tracking)
        GameState.recordResult(selectedImage, actualChoice, userChoseCorrect, currentPair);

        // Stage the backend trial instead of saving immediately. It is committed in
        // Game.nextImage() once the user confirms, or discarded by undo() if they
        // change their selection — so an undone vote never reaches the CSV.
        const userChoiceSide = chooseA ? 'left' : 'right';
        this.pendingTrial = {
            mode: GameState.currentMode,
            setOrder: GameState.setOrder,
            trialNumber: GameState.currentIndex + 1,
            leftImage: leftImage,
            rightImage: rightImage,
            userChoice: userChoiceSide,
            correctAnswer: correctSide,
            isCorrect: userChoseCorrect,
            responseTimeMs: responseTime,
            undoCount: this.undoCount // reversals before settling on this choice
        };

        // Offer the chance to reverse this selection until it is confirmed.
        this.showUndoButton();

        // Wait for the user to confirm with a thumbs up or the space bar before
        // advancing — including on the final pair, which Game.nextImage() routes
        // to the results screen. (Handled in webcam.js processThumbsUp / main.js space handler.)
    },

    // Commit the staged vote to the backend. Called from Game.nextImage() right
    // before advancing, so only confirmed selections are persisted.
    commitTrial() {
        if (!this.pendingTrial) return;

        // Fire-and-forget so the UI never blocks on the network.
        ApiClient.saveTrial(this.pendingTrial).catch(err => console.error("saveTrial failed:", err));
        this.pendingTrial = null;
        this.hideUndoButton();
    },

    // Reverse the current selection so the user can vote again on the same pair.
    // Valid only while waiting to confirm (between vote and advancing).
    undo() {
        if (!GameState.waitingForNextTrial || GameState.gameComplete) {
            return;
        }

        console.log("Undo selection - reverting to current pair");

        this.undoCount++;

        // Log the undo as its own event, capturing the choice being abandoned,
        // before we discard the staged trial.
        const abandoned = this.pendingTrial;
        if (abandoned) {
            ApiClient.saveUndo({
                mode: abandoned.mode,
                setOrder: abandoned.setOrder,
                trialNumber: abandoned.trialNumber,
                leftImage: abandoned.leftImage,
                rightImage: abandoned.rightImage,
                abandonedChoice: abandoned.userChoice,
                abandonedWasCorrect: abandoned.isCorrect,
                correctAnswer: abandoned.correctAnswer,
                undoIndex: this.undoCount,
                responseTimeMs: abandoned.responseTimeMs
            }).catch(err => console.error("saveUndo failed:", err));
        }

        // Drop the locally recorded result and the staged backend trial.
        GameState.results.pop();
        this.pendingTrial = null;

        // Restore the un-voted visuals (re-enables clicking, clears feedback glow).
        Feedback.resetComparison();
        this.hideUndoButton();

        // Re-arm voting on the same pair and restart its response timer.
        GameState.waitingForNextTrial = false;
        this.trialStartTime = Date.now();

        // Exit thumbs-up mode and re-enable voting gestures. Apply the gesture
        // cooldown so a still-raised hand doesn't immediately re-cast a vote.
        if (typeof Webcam !== 'undefined' && Webcam.isSetup) {
            Webcam.waitingForThumbsUp = false;
            Webcam.gesturesEnabled = true;
            Webcam.lastGesture = performance.now();
        }
    },

    showUndoButton() {
        if (GameState.elements.undoBtn) {
            GameState.elements.undoBtn.classList.add('show');
        }
    },

    hideUndoButton() {
        if (GameState.elements.undoBtn) {
            GameState.elements.undoBtn.classList.remove('show');
        }
    }
};