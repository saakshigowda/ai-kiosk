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
        
        // Save phase score before transitioning
        GameState.savePhaseScore(completedMode);

        // Clear any lingering training feedback toast from the final pair
        // (resetComparison() normally hides it, but there is no next trial to trigger it)
        if (typeof Feedback !== 'undefined') {
            Feedback.hideTrainingMessage();
        }

        // Hide comparison overlay first
        GameState.elements.comparisonOverlay.style.display = "none";
        
        // For demo, go straight home
        if (completedMode === 'demo') {
            console.log(`Fast transition for ${completedMode} mode`);
            this.showNextScreen(completedMode);
            return;
        }
        
        // For Phase III, show final results screen
        if (completedMode === 'phase3') {
            console.log("Phase III complete - showing final results");
            this.showFinalResults();
            return;
        }
        
        // For Phase II (training), go to training complete screen
        if (completedMode === 'phase2') {
            console.log("Phase II finished, going to training complete screen");
            this.showNextScreen(completedMode);
            return;
        }
        
        // For Phase I, go directly to Phase 1 Complete screen
        if (completedMode === 'phase1') {
            console.log("Phase I finished, showing Phase 1 Complete screen");
            Game.showPhase1Complete();
            return;
        }
        
        // Default fallback
        console.log("Unknown mode, going home");
        GameState.goHome();
    },
    
    // Show final results after Phase III
    async showFinalResults() {
        const phase1 = GameState.phaseScores.phase1;
        const phase3 = GameState.phaseScores.phase3;
        
        const phase1Percent = phase1.total > 0 ? Math.round((phase1.correct / phase1.total) * 100) : 0;
        const phase3Percent = phase3.total > 0 ? Math.round((phase3.correct / phase3.total) * 100) : 0;
        const difference = phase3Percent - phase1Percent;
        
        // Update Phase I score
        document.getElementById('phase1-score').textContent = `${phase1.correct}/${phase1.total}`;
        document.getElementById('phase1-percent').textContent = `${phase1Percent}%`;
        
        // Update Phase III score
        document.getElementById('phase3-score').textContent = `${phase3.correct}/${phase3.total}`;
        document.getElementById('phase3-percent').textContent = `${phase3Percent}%`;
        
        // Update comparison result
        const comparisonText = document.getElementById('comparison-text');
        const comparisonValue = document.getElementById('comparison-value');
        
        if (difference > 0) {
            comparisonText.textContent = "You improved by:";
            comparisonValue.textContent = `+${difference}%`;
            comparisonValue.className = 'comparison-result-value improved';
        } else if (difference < 0) {
            comparisonText.textContent = "Your score changed by:";
            comparisonValue.textContent = `${difference}%`;
            comparisonValue.className = 'comparison-result-value declined';
        } else {
            comparisonText.textContent = "Your performance:";
            comparisonValue.textContent = "No change";
            comparisonValue.className = 'comparison-result-value same';
        }
        
        // Update final message based on performance
        const finalMessage = document.getElementById('final-message');
        if (difference > 10) {
            finalMessage.textContent = "Excellent improvement! The training really helped you distinguish AI faces!";
        } else if (difference > 0) {
            finalMessage.textContent = "Good job! You showed improvement after training.";
        } else if (difference === 0) {
            finalMessage.textContent = "Your performance was consistent across both phases.";
        } else {
            finalMessage.textContent = "Thank you for participating in this experiment!";
        }
        
        // Hide other overlays
        GameState.elements.comparisonOverlay.style.display = "none";
        GameState.elements.trainingOverlay.style.display = "none";
        GameState.elements.trainingCompleteOverlay.style.display = "none";
        GameState.elements.instructions.classList.remove("show");
        GameState.elements.webcamContainer.classList.add("hidden");
        GameState.elements.webcamToggle.style.display = "none";
        
        // Show final results overlay
        GameState.elements.finalResultsOverlay.style.display = "flex";
        
        // Set up home button
        const homeBtn = document.getElementById('final-home-btn');
        if (homeBtn) {
            homeBtn.onclick = () => {
                GameState.goHome();
            };
        }
        
        // Save summary to backend
        await this.saveSummary(phase1, phase3, difference);
    },
    
    // Save summary data to backend
    async saveSummary(phase1, phase3, difference) {
        try {
            const summaryData = {
                participantId: ApiClient.userId,
                sessionTimestamp: ApiClient.sessionTimestamp,
                setOrder: GameState.setOrder,
                phase1Correct: phase1.correct,
                phase1Total: phase1.total,
                phase1Percent: phase1.total > 0 ? Math.round((phase1.correct / phase1.total) * 100) : 0,
                phase3Correct: phase3.correct,
                phase3Total: phase3.total,
                phase3Percent: phase3.total > 0 ? Math.round((phase3.correct / phase3.total) * 100) : 0,
                differencePercent: difference,
                improved: difference > 0
            };
            
            await ApiClient.saveSummary(summaryData);
            console.log("Summary saved successfully");
        } catch (error) {
            console.error("Failed to save summary:", error);
        }
    },
    
    // Show pretest results with transition buttons
    showPretestResults(correctAnswers, totalQuestions, percentage) {
        // Show results overlay
        GameState.elements.resultsOverlay.style.display = "flex";
        
        // Update score
        GameState.elements.scoreDiv.innerHTML = `
            <h2>Pretest Complete!</h2>
            <p class="score-big">${correctAnswers} / ${totalQuestions}</p>
            <p class="percentage">${percentage}% Correct</p>
        `;
        
        // Update breakdown with navigation buttons
        GameState.elements.breakdownDiv.innerHTML = `
            <p>You've completed phase I.</p>
            <p>Ready to continue to the training phase?</p>
            <div style="display: flex; gap: 20px; margin-top: 30px; justify-content: center;">
                <button id="results-home-btn" class="btn btn-secondary" style="padding: 15px 30px; font-size: 18px;">
                    Home
                </button>
                <button id="results-training-btn" class="btn btn-primary" style="padding: 15px 30px; font-size: 18px;">
                    Next: Training
                </button>
            </div>
        `;
        
        // Add event listeners to new buttons
        document.getElementById('results-home-btn').addEventListener('click', () => {
            console.log("Results Home button clicked");
            GameState.goHome();
        });
        
        document.getElementById('results-training-btn').addEventListener('click', () => {
            console.log("Results Training button clicked");
            GameState.elements.resultsOverlay.style.display = "none";
            Game.showPhase1Complete();
        });
    },
    
    // Hide results and show training screen
    hideResults() {
        GameState.elements.resultsOverlay.style.display = "none";
    },
    
    // Show next screen based on mode
    showNextScreen(completedMode) {
        console.log(`showNextScreen called with mode: ${completedMode}`);
        
        if (completedMode === 'demo') {
            // After demo, go back to home immediately
            console.log("Demo complete - returning to home");
            GameState.goHome();
        } else if (completedMode === 'phase2') {
            // After Phase II (training), show training complete screen
            console.log("Phase II complete - showing training complete screen");
            Game.showTrainingComplete();
        } else if (completedMode === 'phase3') {
            // After Phase III, go back to home immediately
            console.log("Phase III complete - returning to home");
            GameState.goHome();
        } else if (completedMode === 'phase1') {
            // This shouldn't be reached anymore since we handle it above
            console.log("Phase I complete - showing Phase 1 Complete screen");
            Game.showPhase1Complete();
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