/**
 * Problem Page Script for BananaPrep
 * Handles problem display, solution submission, and progress tracking
 */

// State management
let currentProblem = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get query parameters
  const currentProblemId = getQueryParam('id') || '0';
  
  // Set up event listeners
  setupEventListeners();
  
  // Load problem data
  loadProblem();
  
  // Check authentication status
  checkAuthStatus();
});

/**
 * Set up all event listeners for the page
 */
function setupEventListeners() {
  // Tab switching
  document.getElementById('answerTab').addEventListener('click', function() {
    document.getElementById('answerTab').classList.add('active');
    document.getElementById('codeTab').classList.remove('active');
    document.getElementById('answerSection').classList.add('active');
    document.getElementById('codeSection').classList.remove('active');
  });
  
  document.getElementById('codeTab').addEventListener('click', function() {
    document.getElementById('codeTab').classList.add('active');
    document.getElementById('answerTab').classList.remove('active');
    document.getElementById('codeSection').classList.add('active');
    document.getElementById('answerSection').classList.remove('active');
  });
  
  // Answer form submission
  document.getElementById('answerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await submitAnswer();
  });
  
  // Code run button
  document.getElementById('runBtn').addEventListener('click', async function() {
    await runCode();
  });
  
  // Code submit button
  document.getElementById('submitBtn').addEventListener('click', async function() {
    await submitCode();
  });
}

/**
 * Utility: Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} - Parameter value
 */
function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

/**
 * Check authentication status and update UI
 */
function checkAuthStatus() {
  const authPrompt = document.getElementById('authPrompt');
  
  if (!Auth.isLoggedIn()) {
    authPrompt.style.display = 'block';
    return false;
  } else {
    authPrompt.style.display = 'none';
    return true;
  }
}

/**
 * Show error alert
 * @param {string} message - Error message
 */
function showError(message) {
  const errorAlert = document.getElementById('errorAlert');
  errorAlert.textContent = message;
  errorAlert.style.display = 'block';
  document.getElementById('successAlert').style.display = 'none';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    errorAlert.style.display = 'none';
  }, 5000);
}

/**
 * Show success alert
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const successAlert = document.getElementById('successAlert');
  successAlert.textContent = message;
  successAlert.style.display = 'block';
  document.getElementById('errorAlert').style.display = 'none';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    successAlert.style.display = 'none';
  }, 5000);
}

/**
 * Toggle loading state for run button
 * @param {boolean} isLoading - Whether to show loading
 */
function toggleRunLoading(isLoading) {
  document.getElementById('runSpinner').style.display = isLoading ? 'block' : 'none';
  document.getElementById('runBtn').disabled = isLoading;
}

/**
 * Toggle loading state for submit button
 * @param {boolean} isLoading - Whether to show loading
 */
function toggleSubmitLoading(isLoading) {
  document.getElementById('submitSpinner').style.display = isLoading ? 'block' : 'none';
  document.getElementById('submitBtn').disabled = isLoading;
}

/**
 * Toggle loading state for answer submit button
 * @param {boolean} isLoading - Whether to show loading
 */
function toggleAnswerLoading(isLoading) {
  document.getElementById('answerSpinner').style.display = isLoading ? 'block' : 'none';
  document.getElementById('submitAnswerBtn').disabled = isLoading;
}

/**
 * Update problem status display
 * @param {string} status - Problem status: 'solved', 'attempted', or 'unsolved'
 */
function updateProblemStatus(status) {
  const statusElement = document.getElementById('problemStatus');
  statusElement.className = 'problem-status';
  
  switch(status) {
    case 'solved':
      statusElement.classList.add('status-solved');
      statusElement.textContent = 'Solved';
      break;
    case 'attempted':
      statusElement.classList.add('status-attempted');
      statusElement.textContent = 'Attempted';
      break;
    default:
      statusElement.classList.add('status-unsolved');
      statusElement.textContent = 'Unsolved';
  }
}

/**
 * Show answer feedback
 * @param {boolean} isCorrect - Whether answer is correct
 * @param {string} message - Feedback message
 */
function showAnswerFeedback(isCorrect, message) {
  const feedbackElement = document.getElementById('answerFeedback');
  feedbackElement.textContent = message;
  feedbackElement.className = 'answer-feedback';
  
  if (isCorrect) {
    feedbackElement.classList.add('answer-correct');
  } else {
    feedbackElement.classList.add('answer-incorrect');
  }
  
  feedbackElement.style.display = 'block';
}

/**
 * Display problem image
 * @param {string} imagePath - Path to image
 * @param {string} problemTitle - Problem title
 */
function displayProblemImage(imagePath, problemTitle) {
  const imageContainer = document.getElementById('problemImageContainer');
  
  if (imagePath) {
    // Direct image display with inline error handling
    const fullImagePath = `images/problems/${imagePath}`;
    
    imageContainer.innerHTML = `
      <img src="${fullImagePath}" alt="${problemTitle} illustration" 
           onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'image-placeholder\\'><i>📷</i><p>Image not available</p></div>';"
           style="max-width: 100%; border: 1px solid var(--border-color);">
      <figcaption>Illustration for ${problemTitle}</figcaption>
    `;
  } else {
    // No image provided, show placeholder
    imageContainer.innerHTML = `
      <div class="image-placeholder">
        <i>📷</i>
        <p>No illustration available</p>
      </div>
    `;
  }
}

/**
 * Load user progress for this problem
 */
async function loadUserProgress() {
  if (!Auth.isLoggedIn()) return;
  
  const problemId = getQueryParam('id') || '0';
  
  try {
    const progress = await API.progress.getOne(problemId);
    
    if (!progress) return;
    
    // Update code editor with saved solution
    if (progress.solution_code) {
      document.getElementById('codeEditor').textContent = progress.solution_code;
    }
    
    // Update status display
    updateProblemStatus(progress.status);
    
    // If the problem is already solved, disable the answer input
    if (progress.status === 'solved') {
      document.getElementById('userAnswer').disabled = true;
      document.getElementById('submitAnswerBtn').disabled = true;
      showAnswerFeedback(true, 'You have already solved this problem!');
    }
    
  } catch (error) {
    console.error('Error loading progress:', error);
  }
}

/**
 * Save user progress
 * @param {string} status - Problem status
 * @param {string} solutionCode - Solution code
 * @returns {boolean} - Whether progress was saved successfully
 */
async function saveUserProgress(status, solutionCode) {
  if (!Auth.isLoggedIn()) {
    showError('Please sign in to save your progress');
    return false;
  }
  
  const problemId = getQueryParam('id') || '0';
  
  try {
    await API.progress.update(parseInt(problemId), status, solutionCode);
    
    // Update status display
    updateProblemStatus(status);
    
    return true;
  } catch (error) {
    showError(error.message || 'Failed to save progress');
    return false;
  }
}

/**
 * Submit user answer
 */
async function submitAnswer() {
  const userAnswer = document.getElementById('userAnswer').value;
  
  if (!userAnswer.trim()) {
    showError('Please provide an answer before submitting');
    return;
  }
  
  if (!Auth.isLoggedIn()) {
    showError('Please sign in to submit your answer');
    return;
  }
  
  toggleAnswerLoading(true);
  
  try {
    const problemId = getQueryParam('id') || '0';
    const result = await API.progress.validateAnswer(parseInt(problemId), userAnswer);
    
    if (result.isCorrect) {
      showAnswerFeedback(true, 'Correct! Well done!');
      // Update status display
      updateProblemStatus('solved');
      
      // Disable input
      document.getElementById('userAnswer').disabled = true;
      document.getElementById('submitAnswerBtn').disabled = true;
    } else {
      showAnswerFeedback(false, 'Incorrect. Try again!');
      // Update status as attempted
      updateProblemStatus('attempted');
    }
  } catch (error) {
    showError(error.message || 'Error validating answer');
  } finally {
    toggleAnswerLoading(false);
  }
}

/**
 * Run code in the editor
 */
async function runCode() {
  const solutionCode = document.getElementById('codeEditor').textContent;
  
  if (!solutionCode || solutionCode.trim() === '') {
    showError('Please provide code before running');
    return;
  }
  
  let inputValue = null;
  
  try {
    inputValue = prompt("Enter input for your MATLAB function:");
    
    if (inputValue === null) return; // User cancelled the prompt
    
    document.getElementById('matlabOutput').textContent = 'Running MATLAB code...';
    toggleRunLoading(true);
    
    // Save progress as "attempted"
    await saveUserProgress('attempted', solutionCode);
    
    // Simulate MATLAB execution (this would be replaced with actual API call)
    simulateMatlabExecution(solutionCode, inputValue);
  } catch (error) {
    console.error('Error running code:', error);
    document.getElementById('matlabOutput').textContent = 'Error running MATLAB code: ' + error.message;
    toggleRunLoading(false);
  }
}

/**
 * Simulate MATLAB execution (would be replaced with actual API call)
 * @param {string} code - MATLAB code
 * @param {string} input - Input for MATLAB function
 */
function simulateMatlabExecution(code, input) {
  // This is a very simple simulation, in a real app you'd make an API call
  setTimeout(() => {
    let output;
    try {
      // Very basic simulation of running the code
      if (code.includes('function') && input) {
        output = `Executed with input: ${input}\nOutput: ${parseFloat(input) * 2} (simulated)`;
      } else {
        output = 'Function not properly defined. Please define a function.';
      }
    } catch (err) {
      output = `Error in code execution: ${err.message}`;
    }
    
    document.getElementById('matlabOutput').textContent = output;
    toggleRunLoading(false);
  }, 1500);
}

/**
 * Submit code solution
 */
async function submitCode() {
  const solutionCode = document.getElementById('codeEditor').textContent;
  
  // Validate solution before submission
  if (!solutionCode || solutionCode.trim() === '') {
    showError('Please provide a solution before submitting');
    return;
  }
  
  toggleSubmitLoading(true);
  
  try {
    // Save progress as "solved"
    const saved = await saveUserProgress('solved', solutionCode);
    
    if (saved) {
      showSuccess('Solution submitted successfully!');
    }
  } catch (error) {
    showError(error.message || 'Failed to submit solution');
  } finally {
    toggleSubmitLoading(false);
  }
}

/**
 * Load problem data
 */
async function loadProblem() {
  try {
    const problems = await API.problems.getAll();
    
    const id = getQueryParam('id') || '0';
    
    currentProblem = problems[parseInt(id)] || problems[0];
    
    if (!currentProblem) {
      console.error("No problem found for id:", id);
      document.getElementById('problemTitle').textContent = 'Error: Problem not found';
      document.getElementById('problemDescription').textContent = 'No problem found with the specified ID.';
      return;
    }
    
    // Update problem details
    document.getElementById('problemTitle').textContent = currentProblem.title || 'Untitled Problem';
    document.getElementById('problemDescription').textContent = currentProblem.description || 'No description available.';
    
    // Display problem image
    displayProblemImage(currentProblem.image, currentProblem.title);
    
    // Update examples
    updateExamples(currentProblem);
    
    // Update constraints
    updateConstraints(currentProblem);
    
    // Load user progress after problem is loaded
    loadUserProgress();
    
  } catch (error) {
    console.error('Error loading problem:', error);
    document.getElementById('problemTitle').textContent = 'Error loading problem';
    document.getElementById('problemDescription').textContent = error.message;
  }
}

/**
 * Update examples section with problem examples
 * @param {Object} problem - Problem data
 */
function updateExamples(problem) {
  const examplesDiv = document.getElementById('problemExamples');
  examplesDiv.innerHTML = '';
  
  if (Array.isArray(problem.examples) && problem.examples.length > 0) {
    problem.examples.forEach(example => {
      const exDiv = document.createElement('div');
      exDiv.classList.add('example-item');
      exDiv.innerHTML = `<strong>Input:</strong> ${example.input}<br>
                         <strong>Output:</strong> ${example.output}
                         ${example.explanation ? '<br><strong>Explanation:</strong> ' + example.explanation : ''}`;
      examplesDiv.appendChild(exDiv);
    });
  } else {
    examplesDiv.textContent = 'No examples provided.';
  }
}

/**
 * Update constraints section with problem constraints
 * @param {Object} problem - Problem data
 */
function updateConstraints(problem) {
  const constraintsUl = document.getElementById('problemConstraints');
  constraintsUl.innerHTML = '';
  
  if (Array.isArray(problem.constraints) && problem.constraints.length > 0) {
    problem.constraints.forEach(constraint => {
      const li = document.createElement('li');
      li.classList.add('constraint-item');
      li.textContent = constraint;
      constraintsUl.appendChild(li);
    });
  } else {
    constraintsUl.textContent = 'No constraints provided.';
  }
}