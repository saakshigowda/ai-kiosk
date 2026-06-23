// Visual feedback effects for user interactions
const Feedback = {
    // Training feedback messages
    trainingMessages: {
        correct: "Remember, images of faces with low proportionality and high memorability are more indicative of being real!",
        incorrect: "Remember, images of faces with low proportionality, high memorability and low familiarity are more indicative of being real!"
    },

    // Show feedback for comparison mode voting
    showComparison(isCorrect, realInA, userChoseA) {
        // Only show detailed feedback in Phase II (training)
        if (GameState.currentMode === 'phase2') {
            this.flashScreen(isCorrect);
            this.showTrainingMessage(isCorrect);
            
            const realOption = realInA ? GameState.elements.optionA : GameState.elements.optionB;
            const aiOption = realInA ? GameState.elements.optionB : GameState.elements.optionA;
            const chosenOption = userChoseA ? GameState.elements.optionA : GameState.elements.optionB;
            
            GameState.elements.optionA.style.pointerEvents = 'none';
            GameState.elements.optionB.style.pointerEvents = 'none';
            GameState.elements.optionA.querySelector('.comparison-label').style.color = '#fff';
            GameState.elements.optionB.querySelector('.comparison-label').style.color = '#fff';

            if (isCorrect) {
                realOption.querySelector('.comparison-image').style.border = '6px solid #4ade80';
                realOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(74, 222, 128, 0.8)';
                realOption.querySelector('.comparison-label').textContent = 'REAL';
                realOption.querySelector('.comparison-label').style.background = 'rgba(74, 222, 128, 0.9)';
                
                aiOption.querySelector('.comparison-label').textContent = 'AI';
                aiOption.querySelector('.comparison-label').style.background = 'rgba(148, 163, 184, 0.28)';
            } else {
                chosenOption.querySelector('.comparison-image').style.border = '6px solid #f87171';
                chosenOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(248, 113, 113, 0.8)';
                chosenOption.querySelector('.comparison-label').textContent = 'AI';
                chosenOption.querySelector('.comparison-label').style.background = 'rgba(248, 113, 113, 0.9)';
                
                realOption.querySelector('.comparison-image').style.border = '6px solid #4ade80';
                realOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(74, 222, 128, 0.8)';
                realOption.querySelector('.comparison-label').textContent = 'REAL';
                realOption.querySelector('.comparison-label').style.background = 'rgba(74, 222, 128, 0.9)';
            }
        } else {
            // Phase 1 and Phase 2: Only show white glow on chosen option
            this.showChoiceGlow(userChoseA);
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
        GameState.elements.optionA.querySelector('.comparison-label').style.color = '#fff';
        GameState.elements.optionB.querySelector('.comparison-label').style.color = '#fff';

        if (isCorrect) {
            dogOption.querySelector('.comparison-image').style.border = '6px solid #4ade80';
            dogOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(74, 222, 128, 0.8)';
            dogOption.querySelector('.comparison-label').textContent = 'DOG';
            dogOption.querySelector('.comparison-label').style.background = 'rgba(74, 222, 128, 0.9)';
            
            catOption.querySelector('.comparison-label').textContent = 'CAT';
            catOption.querySelector('.comparison-label').style.background = 'rgba(148, 163, 184, 0.28)';
        } else {
            chosenOption.querySelector('.comparison-image').style.border = '6px solid #f87171';
            chosenOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(248, 113, 113, 0.8)';
            chosenOption.querySelector('.comparison-label').textContent = 'CAT';
            chosenOption.querySelector('.comparison-label').style.background = 'rgba(248, 113, 113, 0.9)';
            
            dogOption.querySelector('.comparison-image').style.border = '6px solid #4ade80';
            dogOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(74, 222, 128, 0.8)';
            dogOption.querySelector('.comparison-label').textContent = 'DOG';
            dogOption.querySelector('.comparison-label').style.background = 'rgba(74, 222, 128, 0.9)';
        }
    },
    
    // NEW: Show only choice glow for Phase 1 and Phase 2
    showChoiceGlow(userChoseA) {
        const chosenOption = userChoseA ? GameState.elements.optionA : GameState.elements.optionB;
        
        // Disable clicking
        GameState.elements.optionA.style.pointerEvents = 'none';
        GameState.elements.optionB.style.pointerEvents = 'none';
        
        // Add white glow to chosen option
        chosenOption.querySelector('.comparison-image').style.border = '6px solid #ffffff';
        chosenOption.querySelector('.comparison-image').style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
        
        // Keep labels as A and B (no change)
        // No screen flash for Phase 1 and Phase 2
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
        GameState.elements.optionA.querySelector('.comparison-label').style.background = '';
        GameState.elements.optionA.querySelector('.comparison-label').style.color = '';

        GameState.elements.optionB.querySelector('.comparison-image').style.border = '4px solid rgba(255, 255, 255, 0.5)';
        GameState.elements.optionB.querySelector('.comparison-image').style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
        GameState.elements.optionB.querySelector('.comparison-label').textContent = 'B';
        GameState.elements.optionB.querySelector('.comparison-label').style.background = '';
        GameState.elements.optionB.querySelector('.comparison-label').style.color = '';
        
        // Hide training feedback message
        this.hideTrainingMessage();
    },

    // Show training feedback message
    showTrainingMessage(isCorrect) {
        const messageEl = document.getElementById('training-feedback-message');
        if (!messageEl) return;
        
        const titleEl = messageEl.querySelector('.message-title');
        const bodyEl = messageEl.querySelector('.message-body');
        
        titleEl.textContent = isCorrect ? 'Correct!' : 'Incorrect.';
        bodyEl.textContent = isCorrect ? this.trainingMessages.correct : this.trainingMessages.incorrect;
        
        messageEl.className = 'training-feedback-message show ' + (isCorrect ? 'correct' : 'incorrect');
    },

    // Hide training feedback message
    hideTrainingMessage() {
        const messageEl = document.getElementById('training-feedback-message');
        if (messageEl) {
            messageEl.className = 'training-feedback-message';
        }
    }
};