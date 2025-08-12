// Image database loading and management
const ImageLoader = {
    // Load images based on filename patterns
    loadDatabase() {
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
        
        console.log("Loaded", images.length, "face images");
        console.log("Sample:", images.slice(0, 3));
        return images;
    },

    // Load demo images (cats and dogs)
    loadDemoDatabase() {
        const demoImages = [];
        
        // Load dogs
        for (let i = 1; i <= 5; i++) {
            demoImages.push({
                file: `dog${i}.jpg`,
                fileAlt: `dog${i}.JPG`,
                type: 'dog',
                index: i,
                originalName: `dog${i}`
            });
        }
        
        // Load cats
        for (let i = 1; i <= 5; i++) {
            demoImages.push({
                file: `cat${i}.jpg`,
                fileAlt: `cat${i}.JPG`,
                type: 'cat',
                index: i,
                originalName: `cat${i}`
            });
        }
        
        console.log("Loaded", demoImages.length, "demo images");
        return demoImages;
    },

loadTrainingDatabase() {
    const trainingImages = [];
    
    // Load 36 training images (18 real, 18 AI)
    for (let i = 1; i <= 36; i++) {
        const isReal = i <= 18; // First 18 are real, last 18 are AI
        const prefix = isReal ? 'real' : 'ai';
        const imageNumber = isReal ? i : i - 18;
        
        trainingImages.push({
            file: `${prefix}${imageNumber}.jpg`,
            fileAlt: `${prefix}${imageNumber}.JPG`,
            isAI: !isReal,
            index: i,
            originalName: `${prefix}${imageNumber}`
        });
    }
    
    console.log("Loaded", trainingImages.length, "training images");
    return trainingImages;
},
    
    // Create unique comparison pairs (no repeats)
    createComparisonPairs(numPairs) {
        const realImages = GameState.allImages.filter(img => !img.isAI);
        const aiImages = GameState.allImages.filter(img => img.isAI);
        
        console.log("Available real images:", realImages.length);
        console.log("Available AI images:", aiImages.length);
        
        if (realImages.length === 0 || aiImages.length === 0) {
            console.error("Need both real and AI images for comparison mode");
            return [];
        }
        
        const pairs = [];
        const maxPairs = Math.min(numPairs, Math.min(realImages.length, aiImages.length));
        
        // Shuffle both arrays
        const shuffledReal = Utils.shuffleArray(realImages);
        const shuffledAI = Utils.shuffleArray(aiImages);
        
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
    },

    // Create demo pairs (cats vs dogs)
    createDemoPairs(numPairs) {
        const dogImages = GameState.demoImages.filter(img => img.type === 'dog');
        const catImages = GameState.demoImages.filter(img => img.type === 'cat');
        
        console.log("Available dog images:", dogImages.length);
        console.log("Available cat images:", catImages.length);
        
        if (dogImages.length === 0 || catImages.length === 0) {
            console.error("Need both dog and cat images for demo mode");
            return [];
        }
        
        const pairs = [];
        const maxPairs = Math.min(numPairs, Math.min(dogImages.length, catImages.length));
        
        // Shuffle both arrays
        const shuffledDogs = Utils.shuffleArray(dogImages);
        const shuffledCats = Utils.shuffleArray(catImages);
        
        // Create pairs by taking one from each shuffled array
        for (let i = 0; i < maxPairs; i++) {
            const dogImage = shuffledDogs[i % shuffledDogs.length];
            const catImage = shuffledCats[i % shuffledCats.length];
            const dogInA = Math.random() < 0.5;
            
            pairs.push({
                dogImage,
                catImage,
                dogInA,
                pairNumber: i + 1
            });
            
            console.log(`Demo Pair ${i + 1}: ${dogImage.originalName} vs ${catImage.originalName} (dog in ${dogInA ? 'A' : 'B'})`);
        }
        
        return pairs;
    },

    createTrainingPairs(numPairs) {
    const realImages = GameState.trainingImages.filter(img => !img.isAI);
    const aiImages = GameState.trainingImages.filter(img => img.isAI);
    
    console.log("Available training real images:", realImages.length);
    console.log("Available training AI images:", aiImages.length);
    
    if (realImages.length === 0 || aiImages.length === 0) {
        console.error("Need both real and AI training images");
        return [];
    }
    
    const pairs = [];
    const maxPairs = Math.min(numPairs, Math.min(realImages.length, aiImages.length));
    
    const shuffledReal = Utils.shuffleArray(realImages);
    const shuffledAI = Utils.shuffleArray(aiImages);
    
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
        
        console.log(`Training Pair ${i + 1}: ${realImage.originalName} (real) vs ${aiImage.originalName} (AI)`);
    }
    
    return pairs;
},
    
    // Setup error handlers for image loading
    setupErrorHandlers() {
        GameState.elements.imageA.onerror = function() { 
            const currentPair = GameState.currentImages[GameState.currentIndex];
            if (GameState.currentMode === 'demo') {
                // Handle demo image errors
                if (currentPair && currentPair.dogImage && currentPair.dogImage.fileAlt && 
                    this.src.includes(currentPair.dogImage.originalName) && 
                    !this.src.includes(currentPair.dogImage.fileAlt)) {
                    console.log("Trying alternative extension for demo image A (dog)");
                    this.src = `assets/animals/${currentPair.dogImage.fileAlt}`;
                } else if (currentPair && currentPair.catImage && currentPair.catImage.fileAlt && 
                           this.src.includes(currentPair.catImage.originalName) && 
                           !this.src.includes(currentPair.catImage.fileAlt)) {
                    console.log("Trying alternative extension for demo image A (cat)");
                    this.src = `assets/animals/${currentPair.catImage.fileAlt}`;
                } else {
                    Utils.handleImageError(this, this.src); 
                }
            } else {
                // Handle face image errors
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
                    Utils.handleImageError(this, this.src); 
                }
            }
        };

        GameState.elements.imageB.onerror = function() { 
            const currentPair = GameState.currentImages[GameState.currentIndex];
            if (GameState.currentMode === 'demo') {
                // Handle demo image errors
                if (currentPair && currentPair.dogImage && currentPair.dogImage.fileAlt && 
                    this.src.includes(currentPair.dogImage.originalName) && 
                    !this.src.includes(currentPair.dogImage.fileAlt)) {
                    console.log("Trying alternative extension for demo image B (dog)");
                    this.src = `assets/animals/${currentPair.dogImage.fileAlt}`;
                } else if (currentPair && currentPair.catImage && currentPair.catImage.fileAlt && 
                           this.src.includes(currentPair.catImage.originalName) && 
                           !this.src.includes(currentPair.catImage.fileAlt)) {
                    console.log("Trying alternative extension for demo image B (cat)");
                    this.src = `assets/animals/${currentPair.catImage.fileAlt}`;
                } else {
                    Utils.handleImageError(this, this.src); 
                }
            } else {
                // Handle face image errors
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
                    Utils.handleImageError(this, this.src); 
                }
            }
        };
    }
};