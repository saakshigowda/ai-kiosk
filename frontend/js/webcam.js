// Webcam and hand gesture detection module with MediaPipe
const Webcam = {
    video: null,
    canvas: null,
    ctx: null,
    hands: null,
    isSetup: false,
    lastGesture: 0,
    
    // Gesture detection settings
    settings: {
        GESTURE_COOLDOWN: 2000,      // ms between gestures (2 seconds)
        POSITION_THRESHOLD: 0.3,     // How far left/right to trigger
        RAISE_THRESHOLD: 0.15,       // How high hand must be raised
    },
    
    // Initialize webcam and MediaPipe
    async init() {
        console.log("Initializing webcam and MediaPipe...");
        
        try {
            // Get DOM elements
            this.video = document.getElementById('webcam');
            this.canvas = document.getElementById('webcam-view');
            
            if (!this.video || !this.canvas) {
                console.log("Webcam elements not found, continuing without hand tracking");
                return;
            }
            
            this.ctx = this.canvas.getContext('2d');
            
            // Wait for MediaPipe to load
            await this.waitForMediaPipe();
            
            // Setup camera
            await this.setupCamera();
            
            // Initialize MediaPipe Hands
            await this.setupHandDetection();
            
            // Start the render loop
            this.startRenderLoop();
            
            this.updateStatus("✅ Hand tracking ready! Raise left/right hand to vote", true);
            this.isSetup = true;
            
            console.log("Webcam and hand tracking initialized successfully!");
            
        } catch (error) {
            console.error("Failed to initialize webcam:", error);
            this.updateStatus("❌ Camera not available. Use clicks/keys to vote.", false);
        }
    },
    
    // Wait for MediaPipe libraries to load
    async waitForMediaPipe() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkMediaPipe = () => {
                attempts++;
                if (typeof Hands !== 'undefined' && typeof drawConnectors !== 'undefined') {
                    console.log("MediaPipe libraries loaded");
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error("MediaPipe failed to load after 5 seconds"));
                } else {
                    setTimeout(checkMediaPipe, 100);
                }
            };
            
            checkMediaPipe();
        });
    },
    
// Setup camera stream
async setupCamera() {
    console.log("Setting up camera...");
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'  // Front-facing camera
        } 
    });
    
    this.video.srcObject = stream;
    
    return new Promise((resolve) => {
        this.video.onloadedmetadata = async () => {
            // ADD THIS LINE - Force video to play
            await this.video.play();
            console.log("Camera ready and playing");
            resolve(this.video);
        };
    });
},
    
    // Initialize MediaPipe Hands
    async setupHandDetection() {
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5,
        });
        
        this.hands.onResults((results) => this.onHandResults(results));
        console.log("MediaPipe Hands configured");
    },
    
    // Handle hand detection results
    onHandResults(results) {
        // Clear canvas and draw video frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Draw hand landmarks for debugging
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(this.ctx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
                drawLandmarks(this.ctx, landmarks, {color: '#FF0000', lineWidth: 1});
            }
            
            // Detect voting gestures
            this.detectVotingGesture(results.multiHandLandmarks, results.multiHandedness);
        }
    },
    
    // Detect when user raises left or right hand for voting
    detectVotingGesture(handLandmarks, handedness) {
        const now = performance.now();
        
        // Cooldown check - prevent rapid voting
        if (now - this.lastGesture < this.settings.GESTURE_COOLDOWN) {
            return;
        }
        
        for (let i = 0; i < handLandmarks.length; i++) {
            const landmarks = handLandmarks[i];
            const handInfo = handedness[i];
            
            // Get key landmarks
            const wrist = landmarks[0];           // Wrist (base)
            const middleTip = landmarks[12];      // Middle finger tip
            const indexTip = landmarks[8];        // Index finger tip
            const thumbTip = landmarks[4];        // Thumb tip
            
            // Check if hand is raised (fingers significantly above wrist)
            const isHandRaised = (middleTip.y < wrist.y - this.settings.RAISE_THRESHOLD) && 
                                (indexTip.y < wrist.y - this.settings.RAISE_THRESHOLD);
            
            if (isHandRaised) {
                // Determine which hand it is and which side of screen
                const handX = wrist.x;
                const handLabel = handInfo.label; // "Left" or "Right"
                
                console.log(`${handLabel} hand raised at position ${handX.toFixed(2)}`);
                
                // Vote based on hand position on screen (not hand label)
                let voteDirection = null;
                
                if (handX < this.settings.POSITION_THRESHOLD) {
                    voteDirection = 'LEFT_SIDE';  // Left side of screen
                } else if (handX > (1 - this.settings.POSITION_THRESHOLD)) {
                    voteDirection = 'RIGHT_SIDE'; // Right side of screen
                }
                
                if (voteDirection) {
                    console.log(`Vote detected: ${voteDirection} (${handLabel} hand)`);
                    this.processVote(voteDirection, handX, handLabel);
                    this.lastGesture = now;
                }
            }
        }
    },
    
// Process the voting gesture
processVote(direction, handX, handLabel) {
    console.log(`Processing vote: ${direction} (${handLabel} hand)`);
    
    // Show visual feedback
    this.showVoteFeedback(direction, handX, handLabel);
    
    // Cast the vote based on current game mode
    // NOTE: Front camera is mirrored, so we flip the logic
    if (GameState.currentMode === 'single') {
        // FIXED: Flip the logic for mirrored camera
        // When you raise RIGHT hand, it appears on LEFT side of screen = should vote REAL
        // When you raise LEFT hand, it appears on RIGHT side of screen = should vote AI
        const isAI = direction === 'RIGHT_SIDE';  // FLIPPED
        console.log(`Single mode hand vote: ${isAI ? 'AI' : 'Real'} (${handLabel} hand raised)`);
        SingleMode.vote(isAI);
    } else {
        // FIXED: Flip for comparison mode too
        const chooseA = direction === 'RIGHT_SIDE';  // FLIPPED
        console.log(`Comparison mode hand vote: ${chooseA ? 'A' : 'B'} (${handLabel} hand raised)`);
        ComparisonMode.vote(chooseA);
    }
},
    
    // Show visual feedback for vote
    showVoteFeedback(direction, handX, handLabel) {
        // Colors based on game mode
        let color, text;
    
    if (GameState.currentMode === 'single') {
        // FLIPPED: RIGHT_SIDE = AI, LEFT_SIDE = Real
        color = direction === 'RIGHT_SIDE' ? '#e74c3c' : '#2ecc71';
        text = direction === 'RIGHT_SIDE' ? 'AI VOTE!' : 'REAL VOTE!';
    } else {
        // FLIPPED: RIGHT_SIDE = A, LEFT_SIDE = B  
        color = direction === 'RIGHT_SIDE' ? '#3498db' : '#9b59b6';
        text = direction === 'RIGHT_SIDE' ? 'OPTION A!' : 'OPTION B!';
    }
        
        // Draw feedback on canvas
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(text, handX * this.canvas.width, 60);
        this.ctx.fillText(text, handX * this.canvas.width, 60);
        
        // Show hand info
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`${handLabel} Hand`, handX * this.canvas.width, 90);
        
        // Add cooldown indicator
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Wait 2 seconds...', handX * this.canvas.width, 110);
    },
    
    // Start the video rendering loop
    startRenderLoop() {
        const render = async () => {
            if (this.hands && this.video && this.video.readyState >= 2) {
                try {
                    await this.hands.send({image: this.video});
                } catch (error) {
                    console.error("Error processing frame:", error);
                }
            }
            requestAnimationFrame(render);
        };
        render();
    },
    
    // Update status message
    updateStatus(message, isReady) {
        console.log("Hand tracking status:", message);
        // Update instructions
        const instructions = document.querySelector('.instructions');
        if (instructions && isReady) {
            instructions.textContent = 'Click sides • Arrow keys • Raise left/right hand to vote';
        }
    },
    
    // Stop webcam
    stop() {
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }
};