// Side-by-side comparison mode game logic
const ComparisonMode = {
    // Load images for comparison mode
    load() {
        if (GameState.currentIndex >= GameState.currentImages.length) {
            console.error("No more pairs to load");
            return;
        }
        
        Feedback.resetComparison();
        
        const currentPair = GameState.currentImages[GameState.currentIndex];
        
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
        } else if (GameState.currentMode === 'phase2') {
            // Phase II mode: Load real vs AI images from SetB
            const assetPath = 'assets/SetB/';
            
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
            // Pretest mode: Load real vs AI images
            const assetPath = 'assets/faces/';
            
            if (currentPair.realInA) {
                GameState.elements.imageA.src = `${assetPath}${currentPair.realImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.aiImage.file}`;
            } else {
                GameState.elements.imageA.src = `${assetPath}${currentPair.aiImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.realImage.file}`;
            }
            
            console.log(`Pretest Round ${GameState.currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'}`);
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
    vote(chooseA) {
        // Prevent multiple votes
        if (GameState.waitingForNextTrial) {
            console.log("Already voted, waiting for next trial");
            return;
        }
        
        console.log("Comparison mode vote received:", chooseA ? "A" : "B");
        
        // Set waiting state to prevent multiple votes
        GameState.waitingForNextTrial = true;
        
        // Disable voting gestures and enter thumbs up mode
        if (typeof Webcam !== 'undefined' && Webcam.isSetup) {
            Webcam.gesturesEnabled = false;
            Webcam.waitingForThumbsUp = true;
            console.log("Vote registered - now waiting for thumbs up or space to continue");
        }
        
        const currentPair = GameState.currentImages[GameState.currentIndex];
        let userChoseCorrect, selectedImage, actualChoice;
        
        if (GameState.currentMode === 'demo') {
            // Demo mode: User is correct if they choose the dog
            userChoseCorrect = (chooseA && currentPair.dogInA) || (!chooseA && !currentPair.dogInA);
            
            selectedImage = chooseA ? 
                (currentPair.dogInA ? currentPair.dogImage : currentPair.catImage) :
                (currentPair.dogInA ? currentPair.catImage : currentPair.dogImage);
            
            actualChoice = chooseA ? 
                (currentPair.dogInA ? "Dog" : "Cat") :
                (currentPair.dogInA ? "Cat" : "Dog");
                
            console.log("Dog in A:", currentPair.dogInA, "User chose A:", chooseA, "User chose dog:", userChoseCorrect);
        } else {
            // Pretest and Phase II modes: User is correct if they choose the real image
            userChoseCorrect = (chooseA && currentPair.realInA) || (!chooseA && !currentPair.realInA);
            
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
        
        GameState.recordResult(selectedImage, actualChoice, userChoseCorrect, currentPair);
        
        // Check if we've reached the end
        if (GameState.currentIndex + 1 >= GameState.currentImages.length) {
            // If at end, show results after a delay (no thumbs up or space needed)
            setTimeout(() => {
                Results.show();
            }, 2500);
        }
        // Otherwise, wait for thumbs up gesture or space bar to load next image
        // (this is handled in webcam.js processThumbsUp method or main.js space handler)
    }
};