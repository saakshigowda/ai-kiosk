// Results display and management
const Results = {
    // Show the results screen
    show() {
        GameState.elements.comparisonOverlay.style.display = "none";
        
        const correctAnswers = GameState.results.filter(r => r.correct).length;
        const totalQuestions = GameState.results.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Update results title based on mode
        const resultsTitle = GameState.elements.resultsOverlay.querySelector('.results-title');
        if (resultsTitle) {
            if (GameState.currentMode === 'demo') {
                resultsTitle.textContent = '🐕 Demo Complete!';
            } else if (GameState.currentMode === 'phase2') {
                resultsTitle.textContent = '🎯 Phase II Complete!';
            } else {
                resultsTitle.textContent = '🎯 Pretest Complete!';
            }
        }
        
        GameState.elements.scoreDiv.innerHTML = `You got <strong>${correctAnswers} out of ${totalQuestions}</strong> correct (${percentage}%)`;
        
        this.createBreakdown();
        
        // Show/hide appropriate buttons
        const homeBtn = GameState.elements.homeBtn;
        const trainingBtn = GameState.elements.trainingBtn;
        
        if (GameState.currentMode === 'demo') {
            homeBtn.style.display = 'block';
            trainingBtn.style.display = 'none';
        } else if (GameState.currentMode === 'phase2') {
            homeBtn.style.display = 'block';
            trainingBtn.style.display = 'none';
        } else {
            // Pretest mode
            homeBtn.style.display = 'block';
            trainingBtn.style.display = 'block';
            trainingBtn.textContent = '🎓 Next: Training';
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
    
    hide() {
        GameState.elements.resultsOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
    }
};