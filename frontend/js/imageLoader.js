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
        
        console.log("Loaded", images.length, "images");
        console.log("Sample:", images.slice(0, 3));
        return images;
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
    
    // Setup error handlers for image loading
    setupErrorHandlers() {
        GameState.elements.img.onerror = function() { 
            const currentImage = GameState.currentImages[GameState.currentIndex];
            if (currentImage && currentImage.fileAlt && !this.src.includes(currentImage.fileAlt)) {
                console.log("Trying alternative extension:", currentImage.fileAlt);
                this.src = `assets/faces/${currentImage.fileAlt}`;
            } else {
                Utils.handleImageError(this, this.src); 
            }
        };

        GameState.elements.imageA.onerror = function() { 
            const currentPair = GameState.currentImages[GameState.currentIndex];
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
        };

        GameState.elements.imageB.onerror = function() { 
            const currentPair = GameState.currentImages[GameState.currentIndex];
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
        };
    }
};