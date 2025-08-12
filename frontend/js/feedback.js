// Visual feedback effects for user interactions
const Feedback = {
    // Show feedback for comparison mode voting
    showComparison(isCorrect, realInA, userChoseA) {
        this.flashScreen(isCorrect);
        
        const realOption = realInA ? GameState.elements.optionA : GameState.elements.optionB;
        const aiOption = realInA ? GameState.elements.optionB : GameState.elements.optionA;
        const chosenOption = userChoseA ? GameState.elements.optionA : GameState.elements.optionB;
        
        GameState.elements.optionA.style.pointerEvents = 'none';
        GameState.elements.optionB.style.pointerEvents = 'none';
        
        if (isCorrect) {
            realOption.querySelector('.comparison-image').style.border = '6px solid #2ecc71';
            realOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(46, 204, 113, 0.8)';
            realOption.querySelector('.comparison-label').textContent = 'REAL ✓';
            realOption.querySelector('.comparison-label').style.background = 'rgba(46, 204, 113, 0.9)';
            
            aiOption.querySelector('.comparison-label').textContent = 'AI';
            aiOption.querySelector('.comparison-label').style.background = 'rgba(0, 0, 0, 0.5)';
        } else {
            chosenOption.querySelector('.comparison-image').style.border = '6px solid #e74c3c';
            chosenOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(231, 76, 60, 0.8)';
            chosenOption.querySelector('.comparison-label').textContent = 'AI ✗';
            chosenOption.querySelector('.comparison-label').style.background = 'rgba(231, 76, 60, 0.9)';
            
            realOption.querySelector('.comparison-image').style.border = '6px solid #2ecc71';
            realOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(46, 204, 113, 0.8)';
            realOption.querySelector('.comparison-label').textContent = 'REAL ✓';
            realOption.querySelector('.comparison-label').style.background = 'rgba(46, 204, 113, 0.9)';
        }
    },

    // Show feedback for demo mode voting
    showDemo(isCorrect, dogInA, userChoseA) {
        this.flashScreen(isCorrect);
        
        const dogOption = dogInA ? GameState.elements.optionA : GameState.elements.optionB;
        const catOption = dogInA ? GameState.elements.optionB : GameState.elements.optionA;
        const chosenOption = userChoseA ? GameState.elements.optionA : GameState.elements.optionB;
        
        GameState.elements.optionA.style.pointerEvents = 'none';
        GameState.elements.optionB.style.pointerEvents = 'none';
        
        if (isCorrect) {
            dogOption.querySelector('.comparison-image').style.border = '6px solid #2ecc71';
            dogOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(46, 204, 113, 0.8)';
            dogOption.querySelector('.comparison-label').textContent = 'DOG ✓';
            dogOption.querySelector('.comparison-label').style.background = 'rgba(46, 204, 113, 0.9)';
            
            catOption.querySelector('.comparison-label').textContent = 'CAT';
            catOption.querySelector('.comparison-label').style.background = 'rgba(0, 0, 0, 0.5)';
        } else {
            chosenOption.querySelector('.comparison-image').style.border = '6px solid #e74c3c';
            chosenOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(231, 76, 60, 0.8)';
            chosenOption.querySelector('.comparison-label').textContent = 'CAT ✗';
            chosenOption.querySelector('.comparison-label').style.background = 'rgba(231, 76, 60, 0.9)';
            
            dogOption.querySelector('.comparison-image').style.border = '6px solid #2ecc71';
            dogOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(46, 204, 113, 0.8)';
            dogOption.querySelector('.comparison-label').textContent = 'DOG ✓';
            dogOption.querySelector('.comparison-label').style.background = 'rgba(46, 204, 113, 0.9)';
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
    
    // Reset comparison mode visual effects
    resetComparison() {
        GameState.elements.optionA.style.pointerEvents = 'auto';
        GameState.elements.optionB.style.pointerEvents = 'auto';
        
        GameState.elements.optionA.querySelector('.comparison-image').style.border = '4px solid rgba(255, 255, 255, 0.5)';
        GameState.elements.optionA.querySelector('.comparison-image').style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
        GameState.elements.optionA.querySelector('.comparison-label').textContent = 'A';
        GameState.elements.optionA.querySelector('.comparison-label').style.background = 'rgba(0, 0, 0, 0.7)';
        
        GameState.elements.optionB.querySelector('.comparison-image').style.border = '4px solid rgba(255, 255, 255, 0.5)';
        GameState.elements.optionB.querySelector('.comparison-image').style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
        GameState.elements.optionB.querySelector('.comparison-label').textContent = 'B';
        GameState.elements.optionB.querySelector('.comparison-label').style.background = 'rgba(0, 0, 0, 0.7)';
    }
};