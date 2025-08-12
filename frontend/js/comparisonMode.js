// Side-by-side comparison mode game logic (supports both face comparison and demo mode)
const ComparisonMode = {
    // Load images for comparison mode
    load() {
        if (GameState.currentIndex >= GameState.currentImages.length) {
            console.error("No more pairs to load");
            return;
        }
        
        // Reset visual effects from previous round
        Feedback.resetComparison();
        
        // Show comparison mode interface
        GameState.elements.splitContainer.style.display = "none";
        GameState.elements.centerOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
        
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
        } else if (GameState.currentMode === 'training') {
    // Training mode: Load real vs AI training images
    const assetPath = 'assets/training/';
    
    if (currentPair.realInA) {
        GameState.elements.imageA.src = `${assetPath}${currentPair.realImage.file}`;
        GameState.elements.imageB.src = `${assetPath}${currentPair.aiImage.file}`;
    } else {
        GameState.elements.imageA.src = `${assetPath}${currentPair.aiImage.file}`;
        GameState.elements.imageB.src = `${assetPath}${currentPair.realImage.file}`;
    }
    
    console.log(`Training Round ${GameState.currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'}`);
    console.log(`Images: ${currentPair.realImage.originalName} vs ${currentPair.aiImage.originalName}`);
} else {
            // Face comparison mode: Load real vs AI images
            const assetPath = 'assets/faces/';
            
            if (currentPair.realInA) {
                GameState.elements.imageA.src = `${assetPath}${currentPair.realImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.aiImage.file}`;
            } else {
                GameState.elements.imageA.src = `${assetPath}${currentPair.aiImage.file}`;
                GameState.elements.imageB.src = `${assetPath}${currentPair.realImage.file}`;
            }
            
            console.log(`Round ${GameState.currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'}`);
            console.log(`Images: ${currentPair.realImage.originalName} vs ${currentPair.aiImage.originalName}`);
        }
        
        // Update question text in the comparison overlay
        const comparisonQuestionText = GameState.elements.comparisonOverlay.querySelector('.question-text');
        if (comparisonQuestionText) {
            const questionSet = GameState.currentMode === 'demo' ? Questions.demo :GameState.currentMode === 'training' ? Questions.comparison : Questions.comparison;
            comparisonQuestionText.textContent = Utils.getRandomQuestion(questionSet);
        }
        
        // Update progress in comparison mode
        if (GameState.elements.progressComparison) {
            const totalQuestions = GameState.currentImages.length;
            GameState.elements.progressComparison.textContent = `Image ${GameState.currentIndex + 1} of ${totalQuestions}`;
        }
    },
    
    // Handle user vote in comparison mode
    vote(chooseA) {
        console.log("Comparison mode vote received:", chooseA ? "A" : "B");
        
        const currentPair = GameState.currentImages[GameState.currentIndex];
        let userChoseCorrect, selectedImage, actualChoice;
        
        if (GameState.currentMode === 'demo') {
            // Demo mode: User is correct if they choose the dog
            userChoseCorrect = (chooseA && currentPair.dogInA) || (!chooseA && !currentPair.dogInA);
            
            // For recording purposes, determine what they actually selected
            selectedImage = chooseA ? 
                (currentPair.dogInA ? currentPair.dogImage : currentPair.catImage) :
                (currentPair.dogInA ? currentPair.catImage : currentPair.dogImage);
            
            // Record the type they actually chose
            actualChoice = chooseA ? 
                (currentPair.dogInA ? "Dog" : "Cat") :
                (currentPair.dogInA ? "Cat" : "Dog");
                
            console.log("Dog in A:", currentPair.dogInA, "User chose A:", chooseA, "User chose dog:", userChoseCorrect);
        } else {
            // Face comparison mode: User is correct if they choose the real image
            userChoseCorrect = (chooseA && currentPair.realInA) || (!chooseA && !currentPair.realInA);
            
            // For recording purposes, determine what image they actually selected
            selectedImage = chooseA ? 
                (currentPair.realInA ? currentPair.realImage : currentPair.aiImage) :
                (currentPair.realInA ? currentPair.aiImage : currentPair.realImage);
            
            // Record the type they actually chose, not just A/B
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
        
        // Delay before moving to next image
        setTimeout(() => {
            Game.nextImage();
        }, 2500);
    }
};