// Single image mode game logic
const SingleMode = {
    // Load the current image for single mode
    load() {
        if (GameState.currentIndex >= GameState.currentImages.length) {
            console.error("No more images to load");
            return;
        }
        
        // Reset visual effects from previous round
        Feedback.resetSingle();
        
        // Show single mode interface
        GameState.elements.splitContainer.style.display = "flex";
        GameState.elements.centerOverlay.style.display = "block";
        GameState.elements.comparisonOverlay.style.display = "none";
        
        const currentImage = GameState.currentImages[GameState.currentIndex];
        const imagePath = `assets/faces/${currentImage.file}`;
        
        console.log("Loading single image:", imagePath);
        
        GameState.elements.img.src = imagePath;
        GameState.elements.questionText.textContent = Utils.getRandomQuestion(Questions.singleMode);
        Utils.updateProgress();
    },
    
    // Handle user vote in single mode
    vote(userGuessedAI) {
        if (GameState.currentIndex >= GameState.currentImages.length) return;
        
        console.log("Single mode vote received:", userGuessedAI ? "AI" : "Real");
        
        const currentImage = GameState.currentImages[GameState.currentIndex];
        const isCorrect = userGuessedAI === currentImage.isAI;
        
        console.log("Current image is AI:", currentImage.isAI, "User guessed AI:", userGuessedAI, "Correct:", isCorrect);
        
        // Show immediate feedback
        Feedback.showSingle(isCorrect, userGuessedAI);
        
        GameState.recordResult(currentImage, userGuessedAI ? "AI" : "Real", isCorrect);
        
        // Delay before moving to next image
        setTimeout(() => {
            Game.nextImage();
        }, 2000); // Increased delay for new UI
    }
};
