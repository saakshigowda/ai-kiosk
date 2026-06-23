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
    
    // Error handling for images
    handleImageError(imgElement, imagePath) {
        console.error("Failed to load image:", imagePath);
        
        // Try alternate extension (.jpg vs .JPG)
        if (imagePath.endsWith('.jpg')) {
            const altPath = imagePath.replace('.jpg', '.JPG');
            console.log("Trying alternate extension:", altPath);
            imgElement.src = altPath;
        } else if (imagePath.endsWith('.JPG')) {
            const altPath = imagePath.replace('.JPG', '.jpg');
            console.log("Trying alternate extension:", altPath);
            imgElement.src = altPath;
        } else {
            imgElement.src = "https://via.placeholder.com/250x250/333/fff?text=Image+Not+Found";
        }
    }
};

// Question sets for different modes
const Questions = {
    comparison: [
        "Which is the real person?"
    ],

    demo: [
        "Which one is the dog?"
    ]
};