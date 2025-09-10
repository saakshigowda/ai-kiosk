// Results display and management
const Results = {
    // Show the results screen - now exports CSV instead of showing UI
    show() {
        GameState.elements.comparisonOverlay.style.display = "none";
        
        const correctAnswers = GameState.results.filter(r => r.correct).length;
        const totalQuestions = GameState.results.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        console.log(`Results: ${correctAnswers}/${totalQuestions} correct (${percentage}%)`);
        
        // Generate and download CSV instead of showing results screen
        this.downloadCSV();
        
        // Show appropriate next screen based on mode
        this.showNextScreen();
    },
    
    // Generate CSV data and trigger download
    downloadCSV() {
        const csvData = this.generateCSVData();
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        
        // Create download link
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with timestamp and mode
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const mode = GameState.currentMode;
            link.setAttribute('download', `ai-detection-results-${mode}-${timestamp}.csv`);
            
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`CSV downloaded: ai-detection-results-${mode}-${timestamp}.csv`);
        }
    },
    
    // Generate CSV data from results
    generateCSVData() {
        // CSV Headers
        const headers = [
            'ImageNumber',
            'Mode', 
            'UserGuess',
            'Correct',
            'Timestamp',
            'GameStartTime',
            'ResponseTime',
            'Filename',
            'ActualType'
        ];
        
        // Add mode-specific headers
        if (GameState.currentMode === 'demo') {
            headers.push('DogImage', 'CatImage', 'DogInA');
        } else {
            headers.push('RealImage', 'AIImage', 'RealInA');
        }
        
        let csv = headers.join(',') + '\n';
        
        // Add data rows
        GameState.results.forEach(result => {
            const row = [
                result.imageNumber,
                result.mode,
                `"${result.userGuess}"`, // Quoted in case of commas
                result.correct,
                result.timestamp,
                GameState.gameStartTime.toISOString(),
                this.calculateResponseTime(result.timestamp),
                `"${result.filename}"`, // Quoted in case of commas
                `"${result.actualType}"` // Quoted in case of commas
            ];
            
            // Add mode-specific data
            if (result.comparison) {
                if (GameState.currentMode === 'demo') {
                    row.push(
                        `"${result.comparison.dogImage}"`,
                        `"${result.comparison.catImage}"`,
                        result.comparison.dogInA
                    );
                } else {
                    row.push(
                        `"${result.comparison.realImage}"`,
                        `"${result.comparison.aiImage}"`,
                        result.comparison.realInA
                    );
                }
            }
            
            csv += row.join(',') + '\n';
        });
        
        return csv;
    },
    
    // Calculate response time (placeholder - you'd need to track question start times)
    calculateResponseTime(timestamp) {
        // This would require tracking when each question started
        // For now, return empty or implement timing logic
        return ''; // or implement actual response time calculation
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
    
    // Keep this method in case you want to show results sometimes
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