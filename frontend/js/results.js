// Results display and management
const Results = {
    // Show the results screen
    show() {
        GameState.elements.comparisonOverlay.style.display = "none";
        
        const correctAnswers = GameState.results.filter(r => r.correct).length;
        const totalQuestions = GameState.results.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        console.log(`Results: ${correctAnswers}/${totalQuestions} correct (${percentage}%)`);
        
        // Data is already saved to backend via API calls
        // Just show next screen based on mode
        this.showNextScreen();
    },
    
    // Show next screen based on mode
    showNextScreen() {
        if (GameState.currentMode === 'demo') {
            // After demo, go back to home
            setTimeout(() => {
                GameState.goHome();
            }, 1000);
        } else if (GameState.currentMode === 'phase2') {
            // After Phase II, go back to home
            setTimeout(() => {
                GameState.goHome();
            }, 1000);
        } else {
            // After pretest, go to training screen
            setTimeout(() => {
                Game.showTraining();
            }, 1000);
        }
    },
    
    hide() {
        GameState.elements.resultsOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
    }
};