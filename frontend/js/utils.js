// Utility functions and constants
const Utils = {
    // Shuffle array function
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // Get random question from array
    getRandomQuestion(questionArray) {
        return questionArray[Math.floor(Math.random() * questionArray.length)];
    },
    
    // Update progress display
    updateProgress() {
        const totalQuestions = GameState.currentMode === 'single' ? 
            Math.min(GameState.questionsPerGame, GameState.currentImages.length) : 
            GameState.currentImages.length;
        GameState.elements.progressDiv.textContent = `Image ${GameState.currentIndex + 1} of ${totalQuestions}`;
    },
    
    // Error handling for images
    handleImageError(imgElement, imagePath) {
        console.error("Failed to load image:", imagePath);
        imgElement.src = "https://via.placeholder.com/320x320/333/fff?text=Image+Not+Found";
    }
};

// Question sets for different modes
const Questions = {
    singleMode: [
        "Is this face real or AI-generated?",
        "Real person or computer generated?", 
        "Can you tell if this is a real human?",
        "Human face or artificial creation?",
        "Real photo or AI synthesis?"
    ],
    
    comparison: [
        "Which one do you think is Real?",
        "Which face belongs to a real person?",
        "Which image shows a real human?",
        "Which one is the genuine photograph?",
        "Pick the real person:"
    ],

    demo: [
        "Which one is the dog?",
        "Pick the dog!",
        "Which image shows a dog?",
        "Can you find the dog?",
        "Choose the dog:"
    ]
};