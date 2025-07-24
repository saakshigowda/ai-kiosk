// Side-by-side comparison mode game logic
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
        
        if (currentPair.realInA) {
            GameState.elements.imageA.src = `assets/faces/${currentPair.realImage.file}`;
            GameState.elements.imageB.src = `assets/faces/${currentPair.aiImage.file}`;
        } else {
            GameState.elements.imageA.src = `assets/faces/${currentPair.aiImage.file}`;
            GameState.elements.imageB.src = `assets/faces/${currentPair.realImage.file}`;
        }
        
        // Update question text in the comparison overlay (NOT the single mode question)
        const comparisonQuestionText = GameState.elements.comparisonOverlay.querySelector('.question-text');
        if (comparisonQuestionText) {
            comparisonQuestionText.textContent = Utils.getRandomQuestion(Questions.comparison);
        }
        
        // Update progress in comparison mode
        if (GameState.elements.progressComparison) {
            const totalQuestions = GameState.currentImages.length;
            GameState.elements.progressComparison.textContent = `Image ${GameState.currentIndex + 1} of ${totalQuestions}`;
        }
        
        console.log(`Round ${GameState.currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'}`);
        console.log(`Images: ${currentPair.realImage.originalName} vs ${currentPair.aiImage.originalName}`);
    },
    
    // Handle user vote in comparison mode
    vote(chooseA) {
        console.log("Comparison mode vote received:", chooseA ? "A" : "B");
        
        const currentPair = GameState.currentImages[GameState.currentIndex];
        
        // User is correct if they choose the real image (since all questions ask for real)
        const userChoseReal = (chooseA && currentPair.realInA) || (!chooseA && !currentPair.realInA);
        
        console.log("Real in A:", currentPair.realInA, "User chose A:", chooseA, "User chose real:", userChoseReal);
        
        // For recording purposes, determine what image they actually selected
        const selectedImage = chooseA ? 
            (currentPair.realInA ? currentPair.realImage : currentPair.aiImage) :
            (currentPair.realInA ? currentPair.aiImage : currentPair.realImage);
        
        // Record the type they actually chose, not just A/B
        const actualChoice = chooseA ? 
            (currentPair.realInA ? "Real" : "AI") :
            (currentPair.realInA ? "AI" : "Real");
        
        // Show immediate feedback
        Feedback.showComparison(userChoseReal, currentPair.realInA, chooseA);
        
        GameState.recordResult(selectedImage, actualChoice, userChoseReal, currentPair);
        
        // Delay before moving to next image
        setTimeout(() => {
            Game.nextImage();
        }, 2500); // Increased delay for new UI
    }
};