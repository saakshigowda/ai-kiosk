// Results display and management
const Results = {
    // Show the results screen
    show() {
        // Hide game interfaces
        GameState.elements.splitContainer.style.display = "none";
        GameState.elements.centerOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "none";
        
        // Calculate score
        const correctAnswers = GameState.results.filter(r => r.correct).length;
        const totalQuestions = GameState.results.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Update results title based on mode
        const resultsTitle = GameState.elements.resultsOverlay.querySelector('.results-title');
        if (resultsTitle) {
            if (GameState.currentMode === 'demo') {
                resultsTitle.textContent = '🐕 Demo Complete!';
            } else if (GameState.currentMode === 'training') {
                resultsTitle.textContent = '🎓 Training Complete!';
            } else {
                resultsTitle.textContent = '🎯 Pretest Complete!';
            }
        }
        
        GameState.elements.scoreDiv.innerHTML = `You got <strong>${correctAnswers} out of ${totalQuestions}</strong> correct (${percentage}%)`;
        
        // Create breakdown
        this.createBreakdown();
        
        // Show/hide appropriate buttons
        const homeBtn = GameState.elements.homeBtn;
        const restartBtn = GameState.elements.restartBtn;
        
        if (GameState.currentMode === 'demo') {
            homeBtn.style.display = 'block';
            restartBtn.style.display = 'none';
        } else if (GameState.currentMode === 'training') {
            homeBtn.style.display = 'block';
            restartBtn.style.display = 'none';
        } else {
            homeBtn.style.display = 'block';
            restartBtn.style.display = 'block';
            restartBtn.textContent = '🎓 Next: Training'; // Make sure button text is correct
        }
        
        GameState.elements.resultsOverlay.style.display = "block";
    },
    
    // Create detailed breakdown of results
    createBreakdown() {
        let breakdown = "";
        GameState.results.forEach(result => {
            const icon = result.correct ? "✅" : "❌";
            const color = result.correct ? "#2ecc71" : "#e74c3c";
            
            let displayText;
            if (GameState.currentMode === 'demo') {
                displayText = `#${result.imageNumber}: You chose ${result.userGuess} (${result.correct ? 'Correct!' : 'Should be Dog'})`;
            } else {
                displayText = `#${result.imageNumber}: ${result.actualType} (you chose ${result.userGuess})`;
            }
            
            breakdown += `<div style="margin: 0.5rem 0; color: ${color}; font-size: 1.1rem; padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.1);">
                ${icon} ${displayText}
            </div>`;
        });
        GameState.elements.breakdownDiv.innerHTML = breakdown;
    },
    
    // Hide results and return to game
    hide() {
        GameState.elements.resultsOverlay.style.display = "none";
        
        // Show appropriate game mode
        if (GameState.currentMode === 'single') {
            GameState.elements.splitContainer.style.display = "flex";
            GameState.elements.centerOverlay.style.display = "block";
        } else {
            GameState.elements.comparisonOverlay.style.display = "flex";
        }
    }
};