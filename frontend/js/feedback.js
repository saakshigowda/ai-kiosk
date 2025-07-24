// Visual feedback effects for user interactions
const Feedback = {
    // Show feedback for single mode voting
    showSingle(isCorrect, userGuessedAI) {
        // Flash the screen with color
        this.flashScreen(isCorrect);
        
        // Highlight the chosen side
        const chosenSide = userGuessedAI ? GameState.elements.aiSide : GameState.elements.realSide;
        const otherSide = userGuessedAI ? GameState.elements.realSide : GameState.elements.aiSide;
        
        if (isCorrect) {
            // Show correct feedback
            chosenSide.style.transform = 'scale(1.05)';
            chosenSide.style.filter = 'brightness(1.2)';
            chosenSide.querySelector('.side-title').textContent += ' ✓';
        } else {
            // Show incorrect feedback
            chosenSide.style.filter = 'brightness(0.7)';
            chosenSide.querySelector('.side-title').textContent += ' ✗';
            
            // Show correct answer
            otherSide.style.transform = 'scale(1.05)';
            otherSide.style.filter = 'brightness(1.2)';
            otherSide.querySelector('.side-title').textContent += ' ✓';
        }
    },
    
    // Show feedback for comparison mode voting
    showComparison(isCorrect, realInA, userChoseA) {
        // Flash the screen with color
        this.flashScreen(isCorrect);
        
        const realOption = realInA ? GameState.elements.optionA : GameState.elements.optionB;
        const aiOption = realInA ? GameState.elements.optionB : GameState.elements.optionA;
        const chosenOption = userChoseA ? GameState.elements.optionA : GameState.elements.optionB;
        
        // Disable clicking
        GameState.elements.optionA.style.pointerEvents = 'none';
        GameState.elements.optionB.style.pointerEvents = 'none';
        
        if (isCorrect) {
            // User chose correctly (the real image)
            realOption.querySelector('.comparison-image').style.border = '6px solid #2ecc71';
            realOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(46, 204, 113, 0.8)';
            realOption.querySelector('.comparison-label').textContent = 'REAL ✓';
            realOption.querySelector('.comparison-label').style.background = 'rgba(46, 204, 113, 0.9)';
            
            // Mark the AI image
            aiOption.querySelector('.comparison-label').textContent = 'AI';
            aiOption.querySelector('.comparison-label').style.background = 'rgba(0, 0, 0, 0.5)';
        } else {
            // User chose incorrectly (picked the AI image)
            chosenOption.querySelector('.comparison-image').style.border = '6px solid #e74c3c';
            chosenOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(231, 76, 60, 0.8)';
            chosenOption.querySelector('.comparison-label').textContent = 'AI ✗';
            chosenOption.querySelector('.comparison-label').style.background = 'rgba(231, 76, 60, 0.9)';
            
            // Show correct answer
            realOption.querySelector('.comparison-image').style.border = '6px solid #2ecc71';
            realOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(46, 204, 113, 0.8)';
            realOption.querySelector('.comparison-label').textContent = 'REAL ✓';
            realOption.querySelector('.comparison-label').style.background = 'rgba(46, 204, 113, 0.9)';
        }
    },
    
    // Flash the screen with feedback color
    flashScreen(isCorrect) {
        const flash = GameState.elements.feedbackFlash;
        flash.className = `feedback-flash ${isCorrect ? 'correct' : 'incorrect'} show`;
        
        setTimeout(() => {
            flash.className = 'feedback-flash';
        }, 500);
    },
    
    // Reset single mode visual effects
    resetSingle() {
        // Reset side styling
        [GameState.elements.aiSide, GameState.elements.realSide].forEach(side => {
            side.style.transform = '';
            side.style.filter = '';
        });
        
        // Reset text
        GameState.elements.aiSide.querySelector('.side-title').textContent = 'AI';
        GameState.elements.realSide.querySelector('.side-title').textContent = 'REAL';
    },
    
    // Reset comparison mode visual effects
    resetComparison() {
        // Re-enable clicking
        GameState.elements.optionA.style.pointerEvents = 'auto';
        GameState.elements.optionB.style.pointerEvents = 'auto';
        
        // Reset option A
        GameState.elements.optionA.querySelector('.comparison-image').style.border = '4px solid rgba(255, 255, 255, 0.5)';
        GameState.elements.optionA.querySelector('.comparison-image').style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
        GameState.elements.optionA.querySelector('.comparison-label').textContent = 'A';
        GameState.elements.optionA.querySelector('.comparison-label').style.background = 'rgba(0, 0, 0, 0.7)';
        
        // Reset option B
        GameState.elements.optionB.querySelector('.comparison-image').style.border = '4px solid rgba(255, 255, 255, 0.5)';
        GameState.elements.optionB.querySelector('.comparison-image').style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
        GameState.elements.optionB.querySelector('.comparison-label').textContent = 'B';
        GameState.elements.optionB.querySelector('.comparison-label').style.background = 'rgba(0, 0, 0, 0.7)';
    }
};
