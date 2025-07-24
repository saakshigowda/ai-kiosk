// Load images based on your actual filenames
function loadImageDatabase() {
    const imageFiles = [
        "1_rwm003", "2_swf014", "3_swm031", "4_rwf019", "5_swm023", "6_rwf001", 
        "7_rwm004", "8_rwm023", "9_swm042", "10_rwm027", "11_rwm046", "12_swf004",
        "13_rwm009", "14_swm047", "15_swm036", "16_rwf031", "17_swf049", "18_rwm032",
        "19_swm034", "20_rwm014", "21_swm010", "22_rwm012", "23_swf028", "24_rwm039",
        "25_swm013", "26_swf041", "27_rwf006", "28_rwf024", "29_swm018", "30_swm044"
    ];
    
    const images = [];
    
    imageFiles.forEach((filename, index) => {
        try {
            // Parse the filename: number_typeIndicator
            const parts = filename.split('_');
            if (parts.length < 2) {
                console.warn(`Invalid filename format: ${filename}`);
                return;
            }
            
            const typeIndicator = parts[1][0]; // Gets 'r' or 's'
            const isReal = typeIndicator === 'r';
            
            // Try both extensions - we'll handle fallback in error handlers
            images.push({
                file: filename + ".jpg",
                fileAlt: filename + ".JPG",  // Alternative extension
                isAI: !isReal,
                index: index + 1,
                originalName: filename
            });
        } catch (error) {
            console.error(`Error parsing filename ${filename}:`, error);
        }
    });
    
    console.log("Loaded", images.length, "images");
    console.log("Sample:", images.slice(0, 3));
    return images;
}

// Shuffle array function
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Create unique comparison pairs (no repeats)
function createComparisonPairs(numPairs) {
    const realImages = allImages.filter(img => !img.isAI);
    const aiImages = allImages.filter(img => img.isAI);
    
    console.log("Available real images:", realImages.length);
    console.log("Available AI images:", aiImages.length);
    
    if (realImages.length === 0 || aiImages.length === 0) {
        console.error("Need both real and AI images for comparison mode");
        return [];
    }
    
    const pairs = [];
    const maxPairs = Math.min(numPairs, Math.min(realImages.length, aiImages.length));
    
    // Shuffle both arrays
    const shuffledReal = shuffleArray(realImages);
    const shuffledAI = shuffleArray(aiImages);
    
    // Create pairs by taking one from each shuffled array
    for (let i = 0; i < maxPairs; i++) {
        const realImage = shuffledReal[i % shuffledReal.length];
        const aiImage = shuffledAI[i % shuffledAI.length];
        const realInA = Math.random() < 0.5;
        
        pairs.push({
            realImage,
            aiImage,
            realInA,
            pairNumber: i + 1
        });
        
        console.log(`Pair ${i + 1}: ${realImage.originalName} (real) vs ${aiImage.originalName} (AI)`);
    }
    
    return pairs;
}

// Questions for different modes - FIXED to match scoring logic
const singleModeQuestions = [
    "Is this face real or AI-generated?",
    "Real person or computer generated?", 
    "Can you tell if this is a real human?",
    "Human face or artificial creation?",
    "Real photo or AI synthesis?"
];

const comparisonQuestions = [
    "Which one do you think is Real?",
    "Which face belongs to a real person?",
    "Which image shows a real human?",
    "Which one is the genuine photograph?",
    "Pick the real person:"
];

// Game state
let allImages = [];
let currentImages = [];
let currentIndex = 0;
let results = [];
let gameStartTime = new Date();
let currentMode = 'single';
let questionsPerGame = 10;

// DOM elements
const questionText = document.getElementById("question-text");
const progressDiv = document.getElementById("progress");
const singleMode = document.getElementById("single-mode");
const comparisonMode = document.getElementById("comparison-mode");
const resultsDiv = document.getElementById("results");
const scoreDiv = document.getElementById("score");
const breakdownDiv = document.getElementById("breakdown");

// Single mode elements
const img = document.getElementById("face");
const aiBtn = document.getElementById("ai-btn");
const realBtn = document.getElementById("real-btn");

// Comparison mode elements
const optionA = document.getElementById("option-a");
const optionB = document.getElementById("option-b");
const imageA = document.getElementById("image-a");
const imageB = document.getElementById("image-b");

// Control elements
const downloadBtn = document.getElementById("download-btn");
const restartBtn = document.getElementById("restart-btn");
const tabBtns = document.querySelectorAll(".tab-btn");

// Initialize game
function initGame() {
    console.log("Initializing game...");
    
    allImages = loadImageDatabase();
    if (allImages.length === 0) {
        console.error("No images loaded! Check your file paths and names.");
        return;
    }
    
    currentIndex = 0;
    results = [];
    gameStartTime = new Date();
    
    if (currentMode === 'single') {
        // For single mode: use shuffled subset
        const maxQuestions = Math.min(questionsPerGame, allImages.length);
        currentImages = shuffleArray(allImages).slice(0, maxQuestions);
        console.log("Single mode: using", currentImages.length, "shuffled images");
        loadSingleModeImage();
    } else {
        // For comparison mode: create predefined pairs to avoid repeats
        currentImages = createComparisonPairs(questionsPerGame);
        console.log("Comparison mode: created", currentImages.length, "unique pairs");
        loadComparisonModeImages();
    }
}

function updateProgress() {
    const totalQuestions = currentMode === 'single' ? 
        Math.min(questionsPerGame, currentImages.length) : 
        currentImages.length;
    progressDiv.textContent = `Image ${currentIndex + 1} of ${totalQuestions}`;
}

function getRandomQuestion(questionArray) {
    return questionArray[Math.floor(Math.random() * questionArray.length)];
}

// Single mode functions
function loadSingleModeImage() {
    if (currentIndex >= currentImages.length) {
        console.error("No more images to load");
        return;
    }
    
    // Reset visual effects from previous round
    resetSingleMode();
    
    const currentImage = currentImages[currentIndex];
    const imagePath = `assets/faces/${currentImage.file}`;
    
    console.log("Loading single image:", imagePath);
    
    img.src = imagePath;
    questionText.textContent = getRandomQuestion(singleModeQuestions);
    updateProgress();
}

function voteSingle(userGuessedAI) {
    if (currentIndex >= currentImages.length) return;
    
    const currentImage = currentImages[currentIndex];
    const isCorrect = userGuessedAI === currentImage.isAI;
    
    // Show immediate feedback
    showSingleFeedback(isCorrect, userGuessedAI);
    
    recordResult(currentImage, userGuessedAI ? "AI" : "Real", isCorrect);
    
    // Delay before moving to next image
    setTimeout(() => {
        nextImage();
    }, 1500);
}

// Comparison mode functions - COMPLETELY REWRITTEN
function loadComparisonModeImages() {
    if (currentIndex >= currentImages.length) {
        console.error("No more pairs to load");
        return;
    }
    
    // Reset visual effects from previous round
    resetComparisonMode();
    
    const currentPair = currentImages[currentIndex];
    
    if (currentPair.realInA) {
        imageA.src = `assets/faces/${currentPair.realImage.file}`;
        imageB.src = `assets/faces/${currentPair.aiImage.file}`;
    } else {
        imageA.src = `assets/faces/${currentPair.aiImage.file}`;
        imageB.src = `assets/faces/${currentPair.realImage.file}`;
    }
    
    questionText.textContent = getRandomQuestion(comparisonQuestions);
    updateProgress();
    
    console.log(`Round ${currentIndex + 1}: Real in ${currentPair.realInA ? 'A' : 'B'}`);
    console.log(`Images: ${currentPair.realImage.originalName} vs ${currentPair.aiImage.originalName}`);
}

function voteComparison(chooseA) {
    const currentPair = currentImages[currentIndex];
    
    // User is correct if they choose the real image (since all questions ask for real)
    const userChoseReal = (chooseA && currentPair.realInA) || (!chooseA && !currentPair.realInA);
    
    // For recording purposes, determine what image they actually selected
    const selectedImage = chooseA ? 
        (currentPair.realInA ? currentPair.realImage : currentPair.aiImage) :
        (currentPair.realInA ? currentPair.aiImage : currentPair.realImage);
    
    // Record the type they actually chose, not just A/B
    const actualChoice = chooseA ? 
        (currentPair.realInA ? "Real" : "AI") :
        (currentPair.realInA ? "AI" : "Real");
    
    // Show immediate feedback
    showComparisonFeedback(userChoseReal, currentPair.realInA, chooseA);
    
    recordResult(selectedImage, actualChoice, userChoseReal, currentPair);
    
    // Delay before moving to next image
    setTimeout(() => {
        nextImage();
    }, 2000);
}

// Shared functions
function recordResult(imageData, userGuess, isCorrect, pairData = null) {
    const result = {
        imageNumber: currentIndex + 1,
        mode: currentMode,
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
    
    results.push(result);
    console.log("Result recorded:", result);
}

function nextImage() {
    currentIndex++;
    
    const maxQuestions = currentMode === 'single' ? 
        Math.min(questionsPerGame, currentImages.length) : 
        currentImages.length;
    
    if (currentIndex >= maxQuestions) {
        showResults();
    } else {
        if (currentMode === 'single') {
            loadSingleModeImage();
        } else {
            loadComparisonModeImages();
        }
    }
}

function showResults() {
    // Hide game interfaces
    singleMode.style.display = "none";
    comparisonMode.style.display = "none";
    progressDiv.style.display = "none";
    questionText.style.display = "none";
    
    // Calculate score
    const correctAnswers = results.filter(r => r.correct).length;
    const totalQuestions = results.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    scoreDiv.innerHTML = `You got <strong>${correctAnswers} out of ${totalQuestions}</strong> correct (${percentage}%)`;
    
    // Create breakdown
    let breakdown = "<div style='margin-top: 1rem; text-align: left; max-height: 300px; overflow-y: auto;'>";
    results.forEach(result => {
        const icon = result.correct ? "✅" : "❌";
        const color = result.correct ? "#2ecc71" : "#e74c3c";
        breakdown += `<div style="margin: 0.5rem 0; color: ${color}; font-size: 0.9rem;">
            ${icon} #${result.imageNumber}: ${result.actualType} (you chose ${result.userGuess})
        </div>`;
    });
    breakdown += "</div>";
    breakdownDiv.innerHTML = breakdown;
    
    resultsDiv.style.display = "block";
}

function switchMode(newMode) {
    if (newMode === currentMode) return;
    
    currentMode = newMode;
    
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === newMode);
    });
    
    // Show/hide appropriate interface
    if (newMode === 'single') {
        singleMode.style.display = "block";
        comparisonMode.style.display = "none";
    } else {
        singleMode.style.display = "none";
        comparisonMode.style.display = "block";
    }
    
    // Restart game in new mode
    restartGame();
}

function restartGame() {
    // Reset display
    singleMode.style.display = currentMode === 'single' ? "block" : "none";
    comparisonMode.style.display = currentMode === 'comparison' ? "block" : "none";
    progressDiv.style.display = "block";
    questionText.style.display = "block";
    resultsDiv.style.display = "none";
    
    // Reinitialize - this will create new pairs for comparison mode
    initGame();
}

function downloadResults() {
    const gameData = {
        summary: {
            mode: currentMode,
            totalImages: results.length,
            correctAnswers: results.filter(r => r.correct).length,
            score: Math.round((results.filter(r => r.correct).length / results.length) * 100),
            gameStartTime: gameStartTime.toISOString(),
            gameEndTime: new Date().toISOString()
        },
        results: results
    };
    
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-face-challenge-${currentMode}-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Feedback functions for immediate visual response
function showSingleFeedback(isCorrect, userGuessedAI) {
    const clickedBtn = userGuessedAI ? aiBtn : realBtn;
    const otherBtn = userGuessedAI ? realBtn : aiBtn;
    
    // Disable both buttons
    aiBtn.disabled = true;
    realBtn.disabled = true;
    
    if (isCorrect) {
        // Show correct feedback
        clickedBtn.style.background = '#2ecc71';
        clickedBtn.style.color = 'white';
        clickedBtn.style.transform = 'scale(1.1)';
        clickedBtn.textContent = clickedBtn.textContent + ' ✓';
        
        // Pulse the image frame green
        img.parentElement.style.borderColor = '#2ecc71';
        img.parentElement.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.6)';
    } else {
        // Show incorrect feedback
        clickedBtn.style.background = '#e74c3c';
        clickedBtn.style.color = 'white';
        clickedBtn.style.transform = 'scale(0.9)';
        clickedBtn.textContent = clickedBtn.textContent + ' ✗';
        
        // Show correct answer
        otherBtn.style.background = '#2ecc71';
        otherBtn.style.color = 'white';
        otherBtn.textContent = otherBtn.textContent + ' ✓';
        
        // Pulse the image frame red
        img.parentElement.style.borderColor = '#e74c3c';
        img.parentElement.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.6)';
    }
}

function showComparisonFeedback(isCorrect, realInA, userChoseA) {
    // Disable clicking
    optionA.style.pointerEvents = 'none';
    optionB.style.pointerEvents = 'none';
    
    const realOption = realInA ? optionA : optionB;
    const aiOption = realInA ? optionB : optionA;
    const chosenOption = userChoseA ? optionA : optionB;
    
    if (isCorrect) {
        // User chose correctly (the real image)
        realOption.querySelector('.option-frame').style.borderColor = '#2ecc71';
        realOption.querySelector('.option-frame').style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.6)';
        realOption.querySelector('.option-label').textContent = 'Real Person ✓';
        realOption.querySelector('.option-label').style.color = '#2ecc71';
        
        // Mark the AI image
        aiOption.querySelector('.option-label').textContent = 'AI Generated';
        aiOption.querySelector('.option-label').style.color = '#888';
    } else {
        // User chose incorrectly (picked the AI image)
        chosenOption.querySelector('.option-frame').style.borderColor = '#e74c3c';
        chosenOption.querySelector('.option-frame').style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.6)';
        chosenOption.querySelector('.option-label').textContent = 'AI Generated ✗';
        chosenOption.querySelector('.option-label').style.color = '#e74c3c';
        
        // Show correct answer
        realOption.querySelector('.option-frame').style.borderColor = '#2ecc71';
        realOption.querySelector('.option-frame').style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.6)';
        realOption.querySelector('.option-label').textContent = 'Real Person ✓';
        realOption.querySelector('.option-label').style.color = '#2ecc71';
    }
}

// Reset functions to clean up visual effects
function resetSingleMode() {
    // Re-enable buttons
    aiBtn.disabled = false;
    realBtn.disabled = false;
    
    // Reset button styles
    aiBtn.style.background = 'transparent';
    aiBtn.style.transform = '';
    aiBtn.textContent = '⬅ AI Generated';
    
    realBtn.style.background = 'transparent';
    realBtn.style.transform = '';
    realBtn.textContent = 'Real Person ➡';
    
    // Reset image frame
    img.parentElement.style.borderColor = '#444';
    img.parentElement.style.boxShadow = '';
}

function resetComparisonMode() {
    // Re-enable clicking
    optionA.style.pointerEvents = 'auto';
    optionB.style.pointerEvents = 'auto';
    
    // Reset option A
    optionA.querySelector('.option-frame').style.borderColor = '#444';
    optionA.querySelector('.option-frame').style.boxShadow = '';
    optionA.querySelector('.option-label').textContent = 'Option A';
    optionA.querySelector('.option-label').style.color = '#3498db';
    
    // Reset option B
    optionB.querySelector('.option-frame').style.borderColor = '#444';
    optionB.querySelector('.option-frame').style.boxShadow = '';
    optionB.querySelector('.option-label').textContent = 'Option B';
    optionB.querySelector('.option-label').style.color = '#3498db';
}

// Event listeners
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

aiBtn.addEventListener("click", () => voteSingle(true));
realBtn.addEventListener("click", () => voteSingle(false));

optionA.addEventListener("click", () => voteComparison(true));
optionB.addEventListener("click", () => voteComparison(false));

downloadBtn.addEventListener("click", downloadResults);
restartBtn.addEventListener("click", restartGame);

// Keyboard handlers
document.body.addEventListener("keydown", e => {
    const maxQuestions = currentMode === 'single' ? 
        Math.min(questionsPerGame, currentImages.length) : 
        currentImages.length;
        
    if (currentIndex >= maxQuestions) return;
    
    if (currentMode === 'single') {
        switch(e.key) {
            case "ArrowLeft":
                voteSingle(true);
                break;
            case "ArrowRight":
                voteSingle(false);
                break;
        }
    } else {
        switch(e.key) {
            case "ArrowLeft":
            case "a":
            case "A":
                voteComparison(true);
                break;
            case "ArrowRight":
            case "b":
            case "B":
                voteComparison(false);
                break;
        }
    }
});

// Smart error handlers that try both extensions
img.onerror = function() { 
    const currentImage = currentImages[currentIndex];
    if (currentImage && currentImage.fileAlt && !this.src.includes(currentImage.fileAlt)) {
        console.log("Trying alternative extension:", currentImage.fileAlt);
        this.src = `assets/faces/${currentImage.fileAlt}`;
    } else {
        handleImageError(this, this.src); 
    }
};

imageA.onerror = function() { 
    const currentPair = currentImages[currentIndex];
    if (currentPair && currentPair.realImage && currentPair.realImage.fileAlt && 
        this.src.includes(currentPair.realImage.originalName) && 
        !this.src.includes(currentPair.realImage.fileAlt)) {
        console.log("Trying alternative extension for image A");
        this.src = `assets/faces/${currentPair.realImage.fileAlt}`;
    } else if (currentPair && currentPair.aiImage && currentPair.aiImage.fileAlt && 
               this.src.includes(currentPair.aiImage.originalName) && 
               !this.src.includes(currentPair.aiImage.fileAlt)) {
        console.log("Trying alternative extension for image A");
        this.src = `assets/faces/${currentPair.aiImage.fileAlt}`;
    } else {
        handleImageError(this, this.src); 
    }
};

imageB.onerror = function() { 
    const currentPair = currentImages[currentIndex];
    if (currentPair && currentPair.realImage && currentPair.realImage.fileAlt && 
        this.src.includes(currentPair.realImage.originalName) && 
        !this.src.includes(currentPair.realImage.fileAlt)) {
        console.log("Trying alternative extension for image B");
        this.src = `assets/faces/${currentPair.realImage.fileAlt}`;
    } else if (currentPair && currentPair.aiImage && currentPair.aiImage.fileAlt && 
               this.src.includes(currentPair.aiImage.originalName) && 
               !this.src.includes(currentPair.aiImage.fileAlt)) {
        console.log("Trying alternative extension for image B");
        this.src = `assets/faces/${currentPair.aiImage.fileAlt}`;
    } else {
        handleImageError(this, this.src); 
    }
};

// Initialize the game
console.log("AI Face Detection Challenge loaded!");
initGame();