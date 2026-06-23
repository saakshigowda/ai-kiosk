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
                const parts = filename.split('_');
                if (parts.length < 2) {
                    console.warn(`Invalid filename format: ${filename}`);
                    return;
                }
                
                const typeIndicator = parts[1][0];
                const isReal = typeIndicator === 'r';
                
                images.push({
                    file: filename + ".jpg",
                    fileAlt: filename + ".JPG",
                    isAI: !isReal,
                    index: index + 1,
                    originalName: filename
                });
            } catch (error) {
                console.error(`Error parsing filename ${filename}:`, error);
            }
        });
        
        console.log("Loaded", images.length, "face images");
        return images;
    },

    // Load SetB images for Phase II
    loadSetBDatabase() {
        const imageFiles = [
            "1_rwf026", "2_swf008", "3_rwm008", "4_rwm022", "5_rwf014", "6_swm040", 
            "7_swm001", "8_rwf017", "9_rwf003", "10_rwf021", "11_swf026", "12_rwf012",
            "13_rwf002", "14_swm050", "15_swm033", "16_rwm007", "17_swm032", "18_rwm050",
            "19_rwf033", "20_swm011", "21_swf013", "22_swm026", "23_rwf050", "24_swf029",
            "25_swf030", "26_swm045", "27_rwf044", "28_swf050", "29_rwf018", "30_swm041"
        ];
        
        const images = [];
        
        imageFiles.forEach((filename, index) => {
            try {
                const parts = filename.split('_');
                if (parts.length < 2) {
                    console.warn(`Invalid SetB filename format: ${filename}`);
                    return;
                }
                
                const typeIndicator = parts[1][0];
                const isReal = typeIndicator === 'r';
                
                images.push({
                    file: filename + ".jpg",
                    fileAlt: filename + ".JPG",
                    isAI: !isReal,
                    index: index + 1,
                    originalName: filename
                });
            } catch (error) {
                console.error(`Error parsing SetB filename ${filename}:`, error);
            }
        });
        
        console.log("Loaded", images.length, "SetB images");
        return images;
    },

    // Load Training images
    loadTrainingDatabase() {
        const imageFiles = [
            "1_swf047", "2_swf046", "3_rwm016", "4_swf024", "5_rwm020", "6_rwm049", 
            "7_swf011", "8_swf017", "9_swf021", "10_rwf028", "11_swf025", "12_rwf025", 
            "13_rwm047", "14_rwf029", "15_swf022", "16_rwm048", "17_swf032", "18_rwf013",
            "19_rwm015", "20_swf010", "21_rwf008", "22_rwf038", "23_rwf045", "24_rwf041", 
            "25_swf039", "26_swf019", "27_rwf016", "28_swf001", "29_swf016", "30_swf002", 
            "31_swf009", "32_rwf037", "33_rwf020", "34_swm008", "35_rwm037", "36_swm009"
        ];
        
        const images = [];
        
        imageFiles.forEach((filename, index) => {
            try {
                const parts = filename.split('_');
                if (parts.length < 2) {
                    console.warn(`Invalid Training filename format: ${filename}`);
                    return;
                }
                
                const typeIndicator = parts[1][0];
                const isReal = typeIndicator === 'r';
                
                images.push({
                    file: filename + ".jpg",
                    fileAlt: filename + ".JPG",
                    isAI: !isReal,
                    index: index + 1,
                    originalName: filename
                });
            } catch (error) {
                console.error(`Error parsing Training filename ${filename}:`, error);
            }
        });
        
        console.log("Loaded", images.length, "Training images");
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
    
    // Create unique comparison pairs for Phase I (pretest)
    // Uses Set A or Set B based on counterbalancing
    createComparisonPairs(numPairs) {
        // Determine which image set to use based on setOrder
        const useSetB = GameState.setOrder === 'B';
        const imageSet = useSetB ? GameState.setBImages : GameState.allImages;
        const setName = useSetB ? 'SetB' : 'SetA';
        
        const realImages = imageSet.filter(img => !img.isAI);
        const aiImages = imageSet.filter(img => img.isAI);
        
        console.log(`Phase I using ${setName} (setOrder: ${GameState.setOrder})`);
        console.log("Available real images:", realImages.length);
        console.log("Available AI images:", aiImages.length);
        
        if (realImages.length === 0 || aiImages.length === 0) {
            console.error("Need both real and AI images for comparison mode");
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
                pairNumber: i + 1,
                setUsed: setName  // Track which set was used
            });
            
            console.log(`Pair ${i + 1}: ${realImage.originalName} (real) vs ${aiImage.originalName} (AI)`);
        }
        
        return pairs;
    },

    // Create Phase III pairs (post-test)
    // Uses opposite set from Phase I based on counterbalancing
    createPhase3Pairs(numPairs) {
        // Determine which image set to use (opposite of Phase I)
        const useSetA = GameState.setOrder === 'B';  // Opposite of Phase I
        const imageSet = useSetA ? GameState.allImages : GameState.setBImages;
        const setName = useSetA ? 'SetA' : 'SetB';
        
        const realImages = imageSet.filter(img => !img.isAI);
        const aiImages = imageSet.filter(img => img.isAI);
        
        console.log(`Phase III using ${setName} (setOrder: ${GameState.setOrder})`);
        console.log("Available real images:", realImages.length);
        console.log("Available AI images:", aiImages.length);
        
        if (realImages.length === 0 || aiImages.length === 0) {
            console.error("Need both real and AI images for Phase III");
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
                pairNumber: i + 1,
                setUsed: setName  // Track which set was used
            });
            
            console.log(`Phase III Pair ${i + 1}: ${realImage.originalName} (real) vs ${aiImage.originalName} (AI)`);
        }
        
        return pairs;
    },

    // Create Phase II pairs (training)
    createPhase2Pairs(numPairs) {
        const realImages = GameState.trainingImages.filter(img => !img.isAI);
        const aiImages = GameState.trainingImages.filter(img => img.isAI);
        
        console.log("Available Phase II real images:", realImages.length);
        console.log("Available Phase II AI images:", aiImages.length);
        
        if (realImages.length === 0 || aiImages.length === 0) {
            console.error("Need both real and AI images for Phase II");
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
            
            console.log(`Phase II Pair ${i + 1}: ${realImage.originalName} (real) vs ${aiImage.originalName} (AI)`);
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
        
        const shuffledDogs = Utils.shuffleArray(dogImages);
        const shuffledCats = Utils.shuffleArray(catImages);
        
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
    
    // Setup error handlers for image loading
    setupErrorHandlers() {
        GameState.elements.imageA.onerror = function() { 
            Utils.handleImageError(this, this.src); 
        };

        GameState.elements.imageB.onerror = function() { 
            Utils.handleImageError(this, this.src); 
        };
    }
};