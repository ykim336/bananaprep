/**
 * Problem Page Script for BananaPrep
 * Handles problem display, solution submission, and progress tracking.
 * We're coding defensively here because nulls are extra AF.
 */

// Global state management
let currentProblem = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // Get query parameter for problem id (default: '0')
  const currentProblemId = getQueryParam('id') || '0';
  
  // Set up event listeners (with defensive checks)
  setupEventListeners();
  
  // Load the problem data from the API
  loadProblem();
  
  // Check and update authentication status
  checkAuthStatus();
});

/**
 * Set up all event listeners for the page with defensive checks.
 */
function setupEventListeners() {
  // Tab switching functionality
  const answerTab = document.getElementById('answerTab');
  const codeTab = document.getElementById('codeTab');
  const answerSection = document.getElementById('answerSection');
  const codeSection = document.getElementById('codeSection');
  
  if (answerTab && codeTab && answerSection && codeSection) {
    answerTab.addEventListener('click', function () {
      answerTab.classList.add('active');
      codeTab.classList.remove('active');
      answerSection.classList.add('active');
      codeSection.classList.remove('active');
    });
    
    codeTab.addEventListener('click', function () {
      codeTab.classList.add('active');
      answerTab.classList.remove('active');
      codeSection.classList.add('active');
      answerSection.classList.remove('active');
    });
  } else {
    console.error("Tab elements not all found. Skipping tab event listeners.");
  }
  
  // Answer form submission
  const answerForm = document.getElementById('answerForm');
  if (answerForm) {
    answerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      await submitAnswer();
    });
  } else {
    console.warn("Answer form element not found. Skipping answer form submission event listener.");
  }
  
  // Code run button
  const runBtn = document.getElementById('runBtn');
  if (runBtn) {
    runBtn.addEventListener('click', async function () {
      await runMatlabCode();
    });
  } else {
    console.error("Run button not found in the DOM!");
  }
  
  // Code submit button
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async function () {
      await submitCode();
    });
  } else {
    console.error("Submit button not found in the DOM!");
  }
}

/**
 * Utility: Retrieve query parameter from URL.
 * @param {string} param - Parameter name.
 * @returns {string|null} - Parameter value.
 */
function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

/**
 * Check authentication status and update the UI accordingly.
 */
function checkAuthStatus() {
  const authPrompt = document.getElementById('authPrompt');
  if (!Auth.isLoggedIn()) {
    if (authPrompt) authPrompt.style.display = 'block';
    return false;
  } else {
    if (authPrompt) authPrompt.style.display = 'none';
    return true;
  }
}

/**
 * Show error alert with a message.
 * @param {string} message - Error message.
 */
function showError(message) {
  const errorAlert = document.getElementById('errorAlert');
  if (errorAlert) {
    errorAlert.textContent = message;
    errorAlert.style.display = 'block';
    const successAlert = document.getElementById('successAlert');
    if (successAlert) successAlert.style.display = 'none';
    setTimeout(() => {
      errorAlert.style.display = 'none';
    }, 5000);
  } else {
    console.error("Error alert element not found:", message);
  }
}

/**
 * Show success alert with a message.
 * @param {string} message - Success message.
 */
function showSuccess(message) {
  const successAlert = document.getElementById('successAlert');
  if (successAlert) {
    successAlert.textContent = message;
    successAlert.style.display = 'block';
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) errorAlert.style.display = 'none';
    setTimeout(() => {
      successAlert.style.display = 'none';
    }, 5000);
  } else {
    console.error("Success alert element not found:", message);
  }
}

/**
 * Toggle the loading state for the run button.
 * @param {boolean} isLoading - Whether to show the loading indicator.
 */
function toggleRunLoading(isLoading) {
  const runSpinner = document.getElementById('runSpinner');
  const runBtn = document.getElementById('runBtn');
  if (runSpinner) {
    runSpinner.style.display = isLoading ? 'block' : 'none';
  }
  if (runBtn) {
    runBtn.disabled = isLoading;
  }
}

/**
 * Toggle the loading state for the submit button.
 * @param {boolean} isLoading - Whether to show the loading indicator.
 */
function toggleSubmitLoading(isLoading) {
  const submitSpinner = document.getElementById('submitSpinner');
  const submitBtn = document.getElementById('submitBtn');
  if (submitSpinner) {
    submitSpinner.style.display = isLoading ? 'block' : 'none';
  }
  if (submitBtn) {
    submitBtn.disabled = isLoading;
  }
}

/**
 * Toggle the loading state for the answer submit button.
 * @param {boolean} isLoading - Whether to show the loading indicator.
 */
function toggleAnswerLoading(isLoading) {
  const answerSpinner = document.getElementById('answerSpinner');
  const submitAnswerBtn = document.getElementById('submitAnswerBtn');
  if (answerSpinner) {
    answerSpinner.style.display = isLoading ? 'block' : 'none';
  }
  if (submitAnswerBtn) {
    submitAnswerBtn.disabled = isLoading;
  }
}

/**
 * Update the problem status display.
 * @param {string} status - Problem status: 'solved', 'attempted', or 'unsolved'.
 */
function updateProblemStatus(status) {
  const statusElement = document.getElementById('problemStatus');
  if (statusElement) {
    statusElement.className = 'problem-status';
    switch (status) {
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
}

/**
 * Show answer feedback to the user.
 * @param {boolean} isCorrect - Whether the answer is correct.
 * @param {string} message - Feedback message.
 */
function showAnswerFeedback(isCorrect, message) {
  const feedbackElement = document.getElementById('answerFeedback');
  if (feedbackElement) {
    feedbackElement.textContent = message;
    feedbackElement.className = 'answer-feedback';
    if (isCorrect) {
      feedbackElement.classList.add('answer-correct');
    } else {
      feedbackElement.classList.add('answer-incorrect');
    }
    feedbackElement.style.display = 'block';
  }
}

/**
 * Display problem image (with inline error handling).
 * @param {string} imagePath - Relative path to the image.
 * @param {string} problemTitle - Problem title.
 */
function displayProblemImage(imagePath, problemTitle) {
  const imageContainer = document.getElementById('problemImageContainer');
  if (!imageContainer) {
    console.error("Problem image container element not found!");
    return;
  }
  
  if (imagePath) {
    const fullImagePath = `images/problems/${imagePath}`;
    imageContainer.innerHTML = `
      <img src="${fullImagePath}" alt="${problemTitle} illustration"
           onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'image-placeholder\\'><i>📷</i><p>Image not available</p></div>';"
           style="max-width: 100%; border: 1px solid var(--border-color);">
      <figcaption>Illustration for ${problemTitle}</figcaption>
    `;
  } else {
    imageContainer.innerHTML = `
      <div class="image-placeholder">
        <i>📷</i>
        <p>No illustration available</p>
      </div>
    `;
  }
}

/**
 * Load user progress for this problem.
 */
async function loadUserProgress() {
  if (!Auth.isLoggedIn()) return;
  
  const problemId = getQueryParam('id') || '0';
  
  try {
    const progress = await API.progress.getOne(problemId);
    if (!progress) return;
    
    // Update code editor with saved solution, if any
    if (progress.solution_code) {
      const editor = ace.edit('codeEditor');
      editor.setValue(progress.solution_code, -1); // -1 moves the cursor to the start
    }
    
    // Update problem status display
    updateProblemStatus(progress.status);
    
    // If already solved, disable answer inputs
    const userAnswer = document.getElementById('userAnswer');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    if (progress.status === 'solved') {
      if (userAnswer) userAnswer.disabled = true;
      if (submitAnswerBtn) submitAnswerBtn.disabled = true;
      showAnswerFeedback(true, 'You have already solved this problem!');
    }
    
  } catch (error) {
    console.error('Error loading progress:', error);
  }
}

/**
 * Save user progress.
 * @param {string} status - Problem status.
 * @param {string} solutionCode - User's solution code.
 * @returns {boolean} - Whether progress was saved successfully.
 */
async function saveUserProgress(status, solutionCode) {
  if (!Auth.isLoggedIn()) {
    showError('Please sign in to save your progress');
    return false;
  }
  
  const problemId = getQueryParam('id') || '0';
  
  try {
    await API.progress.update(parseInt(problemId), status, solutionCode);
    updateProblemStatus(status);
    return true;
  } catch (error) {
    showError(error.message || 'Failed to save progress');
    return false;
  }
}

/**
 * Run MATLAB code from the editor and update the terminal output.
 */
async function runMatlabCode() {
  const editor = ace.edit('codeEditor');
  const code = editor.getValue();
  
  // Optional: get user input
  const input = prompt("Enter input for your MATLAB function (optional):");
  
  toggleRunLoading(true);
  const matlabOutput = document.getElementById('matlabOutput');
  if (matlabOutput) {
    matlabOutput.textContent = 'Running MATLAB code...';
  }
  
  try {
    const response = await fetch(`${API_URL}/run-octave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: JSON.stringify({ code, input })
    });
    
    const result = await response.json();
    
    // Output the full response to the console
    console.log("Response from Octave:", result);

    if (matlabOutput) {
      matlabOutput.textContent = result.output || 'No output generated.';
    }
    
    // Save progress as "attempted"
    await saveUserProgress('attempted', code);
  } catch (error) {
    console.error("Error running MATLAB code:", error);
    if (matlabOutput) {
      matlabOutput.textContent = `Error: ${error.message}`;
    }
  } finally {
    toggleRunLoading(false);
  }
}


/**
 * Simulate MATLAB execution (for demo purposes only).
 * Replace this with your actual API call as needed.
 * @param {string} code - MATLAB code.
 * @param {string} input - Input for the function.
 */
function simulateMatlabExecution(code, input) {
  setTimeout(() => {
    let output;
    try {
      if (code.includes('function') && input) {
        output = `Executed with input: ${input}\nOutput: ${parseFloat(input) * 2} (simulated)`;
      } else {
        output = 'Function not properly defined. Please define a function.';
      }
    } catch (err) {
      output = `Error in code execution: ${err.message}`;
    }
    
    const matlabOutput = document.getElementById('matlabOutput');
    if (matlabOutput) {
      matlabOutput.textContent = output;
    }
    toggleRunLoading(false);
  }, 1500);
}

/**
 * Submit the user's solution code.
 */
async function submitCode() {
  const editor = ace.edit('codeEditor');
  const solutionCode = editor.getValue();
  
  if (!solutionCode || solutionCode.trim() === '') {
    showError('Please provide a solution before submitting');
    return;
  }
  
  toggleSubmitLoading(true);
  
  try {
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
 * Load problem data and update the UI.
 */
async function loadProblem() {
  try {
    const problems = await API.problems.getAll();
    const id = getQueryParam('id') || '0';
    currentProblem = problems[parseInt(id)] || problems[0];
    
    if (!currentProblem) {
      console.error("No problem found for id:", id);
      const problemTitleEl = document.getElementById('problemTitle');
      const problemDescriptionEl = document.getElementById('problemDescription');
      if (problemTitleEl) problemTitleEl.textContent = 'Error: Problem not found';
      if (problemDescriptionEl) problemDescriptionEl.textContent = 'No problem found with the specified ID.';
      return;
    }
    
    // Update problem title and description in the UI
    const problemTitleEl = document.getElementById('problemTitle');
    const problemDescriptionEl = document.getElementById('problemDescription');
    if (problemTitleEl) {
      problemTitleEl.textContent = currentProblem.title || 'Untitled Problem';
    }
    if (problemDescriptionEl) {
      problemDescriptionEl.textContent = currentProblem.description || 'No description available.';
    }
    
    // Display problem image
    displayProblemImage(currentProblem.image, currentProblem.title);
    
    // Update examples and constraints
    updateExamples(currentProblem);
    updateConstraints(currentProblem);
    
    // Load the user's progress for the problem
    loadUserProgress();
    
  } catch (error) {
    console.error('Error loading problem:', error);
    const problemTitleEl = document.getElementById('problemTitle');
    const problemDescriptionEl = document.getElementById('problemDescription');
    if (problemTitleEl) problemTitleEl.textContent = 'Error loading problem';
    if (problemDescriptionEl) problemDescriptionEl.textContent = error.message;
  }
}

/**
 * Update the examples section with problem examples.
 * @param {Object} problem - The problem data.
 */
function updateExamples(problem) {
  const examplesDiv = document.getElementById('problemExamples'); // was 'problemExamples'
  if (!examplesDiv) {
    console.error("Problem examples container not found!");
    return;
  }
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
 * Update the constraints section with problem constraints.
 * @param {Object} problem - The problem data.
 */
function updateConstraints(problem) {
  const constraintsUl = document.getElementById('problemConstraints');
  if (!constraintsUl) {
    console.error("Problem constraints container not found!");
    return;
  }
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
