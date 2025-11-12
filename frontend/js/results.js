// Results display and management
const Results = {
    // Show the results screen
    show(completedMode) {
        // If no mode passed, get it from GameState (but prefer passed mode)
        if (!completedMode) {
            completedMode = GameState.currentMode;
        }
        
        const correctAnswers = GameState.results.filter(r => r.correct).length;
        const totalQuestions = GameState.results.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        console.log(`Results: ${correctAnswers}/${totalQuestions} correct (${percentage}%)`);
        console.log(`Completed mode: ${completedMode}`);
        
        // For demo and phase2, go straight to next screen without showing results overlay
        if (completedMode === 'demo' || completedMode === 'phase2') {
            this.showNextScreen(completedMode);
            return;
        }
        
        // For pretest (comparison mode), hide comparison overlay
        GameState.elements.comparisonOverlay.style.display = "none";
        
        // Data is already saved to backend via API calls
        // Just show next screen based on mode
        this.showNextScreen(completedMode);
    },
    
    // Show next screen based on mode
    showNextScreen(completedMode) {
        console.log(`showNextScreen called with mode: ${completedMode}`);
        
        if (completedMode === 'demo') {
            // After demo, go back to home immediately
            console.log("Demo complete - returning to home");
            GameState.goHome();
        } else if (completedMode === 'phase2') {
            // After Phase II, go back to home immediately
            console.log("Phase II complete - returning to home");
            GameState.goHome();
        } else if (completedMode === 'comparison') {
            // After pretest, go to training screen
            console.log("Pretest complete - going to training");
            setTimeout(() => {
                Game.showTraining();
            }, 1000);
        } else {
            // Default: go home
            console.log("Unknown mode - returning to home");
            GameState.goHome();
        }
    },
    
    hide() {
        GameState.elements.resultsOverlay.style.display = "none";
        GameState.elements.comparisonOverlay.style.display = "block";
    }
};