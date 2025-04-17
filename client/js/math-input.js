/**
 * math-input.js - Handles the math expression input functionality
 * BananaPrep - Mathematical Expression Input Handler
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const mathInput = document.getElementById('mathInputArea');
    const mathPreview = document.getElementById('mathPreview');
    const submitBtn = document.getElementById('submitSolutionBtn');
    const clearBtn = document.getElementById('clearBtn');
    const helpBtn = document.getElementById('helpBtn');
    
    // Function to update preview with MathJax
    function updateMathPreview() {
        const expression = mathInput.value.trim();
        if (expression) {
            mathPreview.innerHTML = '$$' + expression + '$$';
            MathJax.typeset([mathPreview]);
            
            // Also try KaTeX as a fallback if available
            if (typeof katex !== 'undefined' && typeof renderMathInElement !== 'undefined') {
                try {
                    renderMathInElement(mathPreview, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true}
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.warn('KaTeX rendering failed, using MathJax only:', e);
                }
            }
        } else {
            mathPreview.innerHTML = 'Preview will appear here...';
        }
    }
    
    // Update preview as user types (with debounce for performance)
    let debounceTimer;
    mathInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateMathPreview, 300);
    });
    
    // Submit solution
    submitBtn.addEventListener('click', function() {
        const solution = mathInput.value.trim();
        if (!solution) {
            showError('Please enter a solution before submitting.');
            return;
        }
        
        // Get the problem ID from the URL or your application state
        const problemId = getProblemIdFromUrl();
        
        // Submit the solution to your backend
        submitSolution(problemId, solution)
            .then(response => {
                if (response.correct) {
                    showSuccess('Correct! Your solution is right.');
                    document.getElementById('problemStatus').textContent = 'Solved';
                    document.getElementById('problemStatus').classList.add('correct');
                } else {
                    showError('Sorry, that\'s not correct. Try again!');
                    document.getElementById('problemStatus').classList.add('incorrect');
                }
            })
            .catch(error => {
                showError('Error submitting solution: ' + error.message);
            });
    });
    
    // Clear input
    clearBtn.addEventListener('click', function() {
        mathInput.value = '';
        mathPreview.innerHTML = 'Preview will appear here...';
    });
    
    // Show help dialog
    helpBtn.addEventListener('click', function() {
        showHelpDialog();
    });
    
    // Helper functions
    function getProblemIdFromUrl() {
        // Extract problem ID from URL or your application state
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || '1'; // Default to 1 if not found
    }
    
    function submitSolution(problemId, solution) {
        // This would normally be an API call to your backend
        // For now, returning a mock promise
        return new Promise((resolve, reject) => {
            // Mock validation - replace with actual API call
            // In a real implementation, you would make an API call like:
            // return fetch('/api/problems/' + problemId + '/solutions', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ solution: solution })
            // }).then(response => response.json());
            
            setTimeout(() => {
                // This is where you'd validate the solution on your server
                // For testing, let's say solutions containing "=" are correct
                const isCorrect = solution.includes('=');
                resolve({ correct: isCorrect });
            }, 500);
        });
    }
    
    function showHelpDialog() {
        // Create a modal dialog for help
        const modalHtml = `
            <div class="math-help-modal">
                <div class="math-help-content">
                    <div class="math-help-header">
                        <h3>Math Expression Syntax Help</h3>
                        <button class="math-help-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="math-help-body">
                        <h4>Basic Syntax:</h4>
                        <ul>
                            <li><strong>Basic operations:</strong> + - * / ^</li>
                            <li><strong>Fractions:</strong> \\frac{numerator}{denominator}</li>
                            <li><strong>Subscripts:</strong> x_{1}</li>
                            <li><strong>Superscripts:</strong> x^{2}</li>
                            <li><strong>Square roots:</strong> \\sqrt{x}</li>
                            <li><strong>Greek letters:</strong> \\alpha, \\beta, \\pi</li>
                        </ul>
                        
                        <h4>Examples:</h4>
                        <p>Quadratic Formula: x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}</p>
                        <p>Integration: \\int_{a}^{b} f(x) dx</p>
                        <p>Summation: \\sum_{i=1}^{n} i^2</p>
                    </div>
                </div>
            </div>
        `;
        
        // Append modal to body
        const modalContainer = document.createElement('div');
        modalContainer.classList.add('modal-container');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Add event listener to close button
        const closeButton = modalContainer.querySelector('.math-help-close');
        closeButton.addEventListener('click', function() {
            document.body.removeChild(modalContainer);
        });
        
        // Close when clicking outside the modal
        modalContainer.addEventListener('click', function(e) {
            if (e.target === modalContainer) {
                document.body.removeChild(modalContainer);
            }
        });
        
        // Add styles for the modal if not already defined in CSS
        if (!document.getElementById('math-help-styles')) {
            const style = document.createElement('style');
            style.id = 'math-help-styles';
            style.innerHTML = `
                .modal-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1001;
                }
                
                .math-help-modal {
                    background-color: var(--bg-medium);
                    border-radius: 8px;
                    width: 90%;
                    max-width: 600px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    animation: modalFadeIn 0.3s;
                }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .math-help-content {
                    padding: 20px;
                }
                
                .math-help-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                
                .math-help-header h3 {
                    margin: 0;
                    color: var(--accent-yellow);
                }
                
                .math-help-close {
                    background: transparent;
                    border: none;
                    color: var(--text-light);
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 5px;
                }
                
                .math-help-body {
                    color: var(--text-light);
                }
                
                .math-help-body h4 {
                    color: var(--accent-yellow);
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                
                .math-help-body ul {
                    padding-left: 20px;
                }
                
                .math-help-body li {
                    margin-bottom: 8px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }
    
    function showSuccess(message) {
        const successAlert = document.getElementById('successAlert');
        successAlert.textContent = message;
        successAlert.style.display = 'block';
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 5000);
    }
});