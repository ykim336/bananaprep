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
  
  // Check and update authentication status (practice mode means no forced login)
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

  // Clear terminal button
  const clearTerminalBtn = document.getElementById('clearTerminal');
  if (clearTerminalBtn) {
    clearTerminalBtn.addEventListener('click', function() {
      clearTerminal();
    });
  } else {
    console.error("Clear terminal button not found in the DOM!");
  }
}
function clearTerminal() {
  const terminalOutput = document.getElementById('terminalOutput');
  if (terminalOutput) {
    terminalOutput.innerHTML = 'Run your code to see the output here.';
  } else {
    console.error("Terminal output element not found!");
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
 * In practice mode, we don't force you to log in. Keep it breezy.
 */
function checkAuthStatus() {
  const authPrompt = document.getElementById('authPrompt');
  // Regardless of login status, hide the auth prompt—practice mode is in full effect.
  if (authPrompt) authPrompt.style.display = 'none';
  return Auth.isLoggedIn();
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
           onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'image-placeholder\\'><p>Image not available</p></div>';"
           style="max-width: 100%; border: 1px solid var(--border-color);">
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
 * In practice mode, we won't load saved progress because, well, you're flying solo.
 */
async function loadUserProgress() {
  // If you're not logged in, skip progress loading—practice mode FTW.
  if (!Auth.isLoggedIn()) return;
  
  const problemId = getQueryParam('id') || '0';
  
  try {
    const progress = await API.progress.getOne(problemId);
    if (!progress) return;
    
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
 * In practice mode, progress isn't sent to the backend—you just vibe through the session.
 * @param {string} status - Problem status.
 * @param {string} solutionCode - User's solution code.
 * @returns {boolean} - Whether progress was "saved" successfully.
 */
async function saveUserProgress(status, solutionCode) {
  const problemId = getQueryParam('id') || '0';
  
  // If not logged in, simulate progress update without backend interaction.
  if (!Auth.isLoggedIn()) {
    updateProblemStatus(status);
    console.info('Practice mode: progress not persisted, but you can still practice like a champ.');
    return true;
  }
  
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

function loadStarterCode(problem) {
  // This function needs to be implemented if you're using an editor
  // For example, if you're using Ace editor:
  try {
    const editor = ace.edit('codeEditor');
    
    // Check if the problem has starter code
    if (problem.starter_code) {
      // Set the editor content to the starter code
      editor.setValue(problem.starter_code, -1); // -1 moves cursor to start
    } else {
      // If no starter code is available, provide a generic template
      const genericTemplate = `% Write your solution for "${problem.title}" here\n\nfunction res = solution()\n  % Your code here\n\nend`;
      editor.setValue(genericTemplate, -1);
    }
  } catch (error) {
    console.error("Error loading starter code:", error);
  }
}

/**
 * Load problem data and update the UI.
 */
async function loadProblem() {
  try {
    // Add debugging output
    console.log("Starting to load problem data");
    
    // Get the problem ID from the URL
    const id = getQueryParam('id') || '0';
    console.log("Problem ID from URL:", id);
    
    // Fetch problem data
    const response = await fetch('/data/problems.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch problems data: ${response.status} ${response.statusText}`);
    }
    
    const problems = await response.json();
    console.log("Loaded problems:", problems);
    
    if (!Array.isArray(problems)) {
      throw new Error("Retrieved problems data is not an array");
    }
    
    // Get the specific problem
    currentProblem = problems[parseInt(id)];
    console.log("Current problem:", currentProblem);
    
    if (!currentProblem) {
      throw new Error(`No problem found with ID: ${id}`);
    }
    
    // Update problem title and description in the UI
    const problemTitleEl = document.getElementById('problemTitle');
    const problemDescriptionEl = document.getElementById('problemDescription');
    
    if (problemTitleEl) {
      problemTitleEl.textContent = currentProblem.title || 'Untitled Problem';
    } else {
      console.error("Problem title element not found in the DOM");
    }
    
    if (problemDescriptionEl) {
      problemDescriptionEl.textContent = currentProblem.description || 'No description available.';
    } else {
      console.error("Problem description element not found in the DOM");
    }
    
    // Display problem image
    displayProblemImage(currentProblem.image, currentProblem.title);
    
    // Update examples and constraints
    updateExamples(currentProblem);
    updateConstraints(currentProblem);
    
    // Update difficulty tag
    const difficultyTag = document.getElementById('difficultyTag');
    if (difficultyTag) {
      const difficulty = currentProblem.difficulty || 'Easy';
      difficultyTag.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      difficultyTag.className = 'difficulty-tag ' + difficulty.toLowerCase();
    }
    
    // Load the starter code if available
    loadStarterCode(currentProblem);
    
    // Load the user's progress for the problem (only if logged in)
    loadUserProgress();
    
  } catch (error) {
    console.error('Error loading problem:', error);
    
    // Display a user-friendly error message
    const problemTitleEl = document.getElementById('problemTitle');
    const problemDescriptionEl = document.getElementById('problemDescription');
    
    if (problemTitleEl) {
      problemTitleEl.textContent = 'Error loading problem';
    }
    
    if (problemDescriptionEl) {
      problemDescriptionEl.textContent = `We encountered an error while loading this problem. Details: ${error.message}`;
    }
    
    // Show an error alert
    showError('Failed to load problem data. Please try refreshing the page.');
  }
}

/**
 * Update the examples section with problem examples.
 * @param {Object} problem - The problem data.
 */
function updateExamples(problem) {
  const examplesDiv = document.getElementById('problemExamples');
  if (!examplesDiv) {
    console.error("Problem examples container not found!");
    return;
  }
  examplesDiv.innerHTML = '';
  
  if (Array.isArray(problem.examples) && problem.examples.length > 0) {
    problem.examples.forEach(example => {
      const exDiv = document.createElement('div');
      exDiv.classList.add('example-item');
      exDiv.innerHTML = `<strong>Input:</strong> ${example.input || 'N/A'}<br>
                         <strong>Output:</strong> ${example.output || 'N/A'}
                         ${example.explanation ? '<br><strong>Explanation:</strong> ' + example.explanation : ''}`;
      examplesDiv.appendChild(exDiv);
    });
  } else {
    examplesDiv.textContent = 'No examples provided.';
  }
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Get all the tab elements
  const tabs = document.querySelectorAll('.tabs-container .tab');
  const codeTab = document.querySelector('.tabs-container .tab:nth-child(1)');
  const testcaseTab = document.querySelector('.tabs-container .tab:nth-child(2)');
  
  // Get content containers
  const codeContainer = document.querySelector('.code-container');
  const terminalSection = document.querySelector('.terminal-section');
  
  // Add click event listeners to all tabs
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', function() {
      // First, remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to the clicked tab
      this.classList.add('active');
      
      // Handle content display based on which tab was clicked
      if (index === 0) { // Code tab
        // Show code editor and terminal
        if (codeContainer) codeContainer.style.display = 'flex';
        if (terminalSection) terminalSection.style.display = 'flex';
        
        // Hide testcase content if it exists
        const testcaseContent = document.getElementById('testcaseContent');
        if (testcaseContent) {
          testcaseContent.style.display = 'none';
        }
      } else if (index === 1) { // Testcase tab
        // If testcase content doesn't exist yet, create it
        let testcaseContent = document.getElementById('testcaseContent');
        if (!testcaseContent) {
          // Create the test case content area
          testcaseContent = document.createElement('div');
          testcaseContent.id = 'testcaseContent';
          testcaseContent.className = 'test-case-content';
          
          // Create a test case results container
          const testResultsContainer = document.createElement('div');
          testResultsContainer.id = 'testResultsContainer';
          testResultsContainer.className = 'test-results-container';
          testResultsContainer.innerHTML = '<h3>No tests have been run yet</h3><p>Submit your solution to run tests.</p>';
          testcaseContent.appendChild(testResultsContainer);
          
          // Add the test case content to the editor section
          const editorSection = document.querySelector('.editor-section');
          if (editorSection) {
            editorSection.appendChild(testcaseContent);
          }
        }
        
        // Hide code editor and terminal
        if (codeContainer) codeContainer.style.display = 'none';
        if (terminalSection) terminalSection.style.display = 'none';
        
        // Show testcase content
        testcaseContent.style.display = 'block';
      }
    });
  });

  // Function to run a test and get results
  async function runTest(code) {
    try {
      // Make the API call to run Octave code
      const response = await fetch(`${API_URL}/run-octave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error running test:', error);
      throw error;
    }
  }
  
  // Export the runTest function for use in problem.js
  window.runTest = runTest;
});

/**
 * Display problem image with proper error handling.
 * @param {string} imagePath - Relative path to the image.
 * @param {string} problemTitle - Problem title for alt text.
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
           onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'image-placeholder\\'><p>Image not available</p></div>';"
           style="max-width: 100%; border: 1px solid var(--border-color); margin-bottom: 1rem;">
    `;
  } else {
    imageContainer.innerHTML = `
      <div class="image-placeholder">
        <i class="fas fa-image"></i>
        <p>No illustration available</p>
      </div>
    `;
  }
}

