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
 * In practice mode, we won't load saved progress because, well, you're flying solo.
 */
async function loadUserProgress() {
  // If you're not logged in, skip progress loading—practice mode FTW.
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
 * Run MATLAB code from the editor and update the terminal output.
 */
async function runMatlabCode() {
  const editor = ace.edit("codeEditor");
  const code = editor.getValue();
  
  // Optional: get user input
  const input = prompt("Enter input for your MATLAB function (optional):");
  
  toggleRunLoading(true);
  const matlabOutput = document.getElementById("terminalOutput");
  if (matlabOutput) {
    matlabOutput.innerHTML = 'Running MATLAB code...\n';
  }
  
  try {
    // Conditionally add the Authorization header only if you're logged in.
    const headers = { 'Content-Type': 'application/json' };
    if (Auth.isLoggedIn()) {
      headers['Authorization'] = `Bearer ${Auth.getToken()}`;
    }
    
    // Make API call to run Octave code
    const response = await fetch(`${API_URL}/run-octave`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ code, input })
    });
    
    const result = await response.json();
    
    // Output the full response to the console for debugging
    console.log("Response from Octave:", result);

    // Update terminal with the execution output
    if (matlabOutput) {
      if (result.success) {
        // Display text output
        matlabOutput.innerHTML += result.output + '\n' || 'No output generated.\n';
        
        // If there's an image, display it below the text output
        if (result.hasImage && result.imageData) {
          const imageElement = document.createElement('img');
          imageElement.src = result.imageData;
          imageElement.alt = 'Generated Plot';
          imageElement.style.maxWidth = '100%';
          imageElement.style.marginTop = '10px';
          
          // Clear previous images first
          const existingImages = matlabOutput.querySelectorAll('img');
          existingImages.forEach(img => img.remove());
          
          // Append the new image
          matlabOutput.appendChild(imageElement);
        }
      } else {
        // Display error in the terminal
        matlabOutput.innerHTML += `<span style="color: #ff5555;">Error: ${result.output || 'Execution failed'}</span>\n`;
      }
      
      // Ensure we scroll to the bottom to see the latest output
      matlabOutput.scrollTop = matlabOutput.scrollHeight;
    }
    
    // Save progress as "attempted"
    await saveUserProgress('attempted', code);
  } catch (error) {
    console.error("Error running MATLAB code:", error);
    if (matlabOutput) {
      matlabOutput.innerHTML += `<span style="color: #ff5555;">Error: ${error.message || 'Failed to run code'}</span>\n`;
      matlabOutput.scrollTop = matlabOutput.scrollHeight;
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
    // First, save the user's progress
    const saved = await saveUserProgress('attempted', solutionCode);
    
    // If there are test cases for this problem, run the verification
    if (currentProblem && currentProblem.test_cases) {
      // Show test case tab
      showTestCaseTab();
      
      // Run the test cases with the simplified approach
      runTestCases(solutionCode, currentProblem.test_cases);
    } else {
      // If no test cases, just mark as solved
      const solved = await saveUserProgress('solved', solutionCode);
      if (solved) {
        showSuccess('Solution submitted successfully!');
      }
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
    
    // Load the starter code if available
    loadStarterCode(currentProblem);
    
    // Load the user's progress for the problem (only if logged in)
    loadUserProgress();
    
  } catch (error) {
    console.error('Error loading problem:', error);
    const problemTitleEl = document.getElementById('problemTitle');
    const problemDescriptionEl = document.getElementById('problemDescription');
    if (problemTitleEl) problemTitleEl.textContent = 'Error loading problem';
    if (problemDescriptionEl) problemDescriptionEl.textContent = error.message;
  }
}

function loadStarterCode(problem) {
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


async function runTestCases(solutionCode, testCases) {
  const testResultsContainer = document.getElementById('testResultsContainer');
  if (!testResultsContainer) return;
  
  // Display a loading indicator
  testResultsContainer.innerHTML = '<h3>Running Tests...</h3><div class="test-loading"></div>';
  
  try {
    // Count the number of test cases (test1, test2, test3, etc.)
    const testCount = Object.keys(testCases).filter(key => key.startsWith('test')).length;
    
    // Prepare the test results HTML
    let resultsHTML = '<h3>Test Results</h3>';
    
    let allTestsPassed = true;
    let testsPassed = 0;
    let testResults = [];
    
    // For each test case, create the test code and run it
    for (let i = 1; i <= testCount; i++) {
      const testKey = `test${i}`;
      const solutionKey = `solution${i}`;
      
      // Skip if this test or solution doesn't exist
      if (!testCases[testKey] || !testCases[solutionKey]) {
        continue;
      }
      
      const testCall = testCases[testKey];
      const expectedSolution = testCases[solutionKey];
      
      // Create the test code - append the user's function and the test call
      const testCode = `${solutionCode}\n\n% Test case ${i}\n${testCall}`;
      
      try {
        // Run the test case using the MATLAB/Octave API
        const response = await runTest(testCode);
        
        // Get the actual output string
        const actualOutput = response.output.trim();
        
        // Compare with expected solution - simple string matching with whitespace normalization
        const normalizedExpected = expectedSolution.replace(/\s+/g, ' ').trim();
        const normalizedActual = actualOutput.replace(/\s+/g, ' ').trim();
        
        // Check if the output contains the expected solution
        const passed = normalizedActual.includes(normalizedExpected);
        
        // Store the results
        testResults.push({
          id: i,
          call: testCall,
          expected: expectedSolution,
          actual: actualOutput,
          passed: passed,
          error: null
        });
        
        // Update the test summary
        if (passed) {
          testsPassed++;
        } else {
          allTestsPassed = false;
        }
      } catch (error) {
        // Handle test execution error
        testResults.push({
          id: i,
          call: testCall,
          expected: expectedSolution,
          actual: null,
          passed: false,
          error: error.message || 'Test execution failed'
        });
        
        allTestsPassed = false;
      }
    }
    
    // Add the test summary at the top
    if (allTestsPassed) {
      resultsHTML += `<div class="test-summary test-summary-passed">
                        <span>All tests passed! (${testsPassed}/${testCount})</span>
                      </div>`;
    } else {
      resultsHTML += `<div class="test-summary test-summary-failed">
                        <span>Some tests failed (${testsPassed}/${testCount} passed)</span>
                      </div>`;
    }
    
    // Add the test cases
    resultsHTML += '<div class="test-cases">';
    
    // Add each test result
    testResults.forEach(result => {
      const statusClass = result.error ? 'test-error' : (result.passed ? 'test-passed' : 'test-failed');
      const statusText = result.error ? 'Error' : (result.passed ? 'Passed' : 'Failed');
      const outputText = result.error ? result.error : (result.actual || 'No output');
      
      resultsHTML += `
        <div class="test-case">
          <div class="test-case-header">
            <span class="test-case-title">Test Case ${result.id}: Test with ${result.call}</span>
            <span class="test-status ${statusClass}">${statusText}</span>
          </div>
          <div class="test-case-details">
            <div>
              <strong>Function Call:</strong>
              <div class="function-call">${result.call}</div>
            </div>
            <div>
              <strong>Expected Output:</strong>
              <div class="expected-output">${result.expected}</div>
            </div>
            <div class="test-actual-output">
              <strong>Actual Output:</strong>
              <div class="actual-output">${outputText}</div>
            </div>
          </div>
        </div>
      `;
    });
    
    resultsHTML += '</div>';
    
    // Add a "Submit as Complete" button at the bottom
    resultsHTML += `
      <div class="test-actions">
        <button id="markAsSolvedBtn" ${!allTestsPassed && Auth.isLoggedIn() ? 'disabled' : ''}>
          <i class="fas fa-check"></i>
          <span>Submit as Complete</span>
        </button>
      </div>
      <button id="backToCodeBtn" class="back-to-code-btn">
        <i class="fas fa-arrow-left"></i> Back to Code
      </button>
    `;
    
    // Update the results container
    testResultsContainer.innerHTML = resultsHTML;
    
    // Add event listener to the "Submit as Complete" button
    const markAsSolvedBtn = document.getElementById('markAsSolvedBtn');
    if (markAsSolvedBtn) {
      markAsSolvedBtn.addEventListener('click', async function() {
        try {
          // Save progress as solved
          const solved = await saveUserProgress('solved', solutionCode);
          if (solved) {
            showSuccess('Solution marked as complete!');
            // Update the status display
            updateProblemStatus('solved');
          }
        } catch (error) {
          showError(error.message || 'Failed to mark solution as complete');
        }
      });
    }
    
    // Add event listener to the "Back to Code" button
    const backToCodeBtn = document.getElementById('backToCodeBtn');
    if (backToCodeBtn) {
      backToCodeBtn.addEventListener('click', function() {
        // Find the tab elements
        const codeTabs = document.querySelectorAll('.tabs-container .tab');
        const codeTab = document.querySelector('.tabs-container .tab:nth-child(1)');
        const testcaseTab = document.querySelector('.tabs-container .tab:nth-child(2)');
        
        if (codeTab && testcaseTab) {
          // Deactivate all tabs first
          codeTabs.forEach(tab => tab.classList.remove('active'));
          // Activate the code tab
          codeTab.classList.add('active');
          
          // Hide test case content
          const testcaseContent = document.getElementById('testcaseContent');
          if (testcaseContent) {
            testcaseContent.style.display = 'none';
          }
          
          // Show the code container and terminal
          const codeContainer = document.querySelector('.code-container');
          const terminalSection = document.querySelector('.terminal-section');
          if (codeContainer) codeContainer.style.display = 'flex';
          if (terminalSection) terminalSection.style.display = 'flex';
        }
      });
    }
    
  } catch (error) {
    // Handle overall test execution error
    testResultsContainer.innerHTML = `<h3>Test Error</h3><p class="test-error">${error.message || 'Failed to run tests'}</p>`;
  }
}

function showTestCaseTab() {
  // Find the tab elements
  const codeTab = document.querySelector('.tabs-container .tab.active');
  const testcaseTab = document.querySelector('.tabs-container .tab:nth-child(2)');
  
  if (codeTab && testcaseTab) {
    // Activate the test case tab
    codeTab.classList.remove('active');
    testcaseTab.classList.add('active');
    
    // Prepare the test case display area if it doesn't exist
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
      testcaseContent.appendChild(testResultsContainer);
      
      // Add a "Back to Code" button
      const backToCodeBtn = document.createElement('button');
      backToCodeBtn.id = 'backToCodeBtn';
      backToCodeBtn.className = 'back-to-code-btn';
      backToCodeBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Code';
      backToCodeBtn.addEventListener('click', function() {
        // Switch back to the code tab
        testcaseTab.classList.remove('active');
        codeTab.classList.add('active');
        testcaseContent.style.display = 'none';
        document.querySelector('.code-container').style.display = 'flex';
      });
      testcaseContent.appendChild(backToCodeBtn);
      
      // Add the test case content to the editor section
      const editorSection = document.querySelector('.editor-section');
      if (editorSection) {
        editorSection.appendChild(testcaseContent);
      }
    }
    
    // Hide the code editor and show the test case content
    document.querySelector('.code-container').style.display = 'none';
    testcaseContent.style.display = 'block';
    
    // Clear previous test results
    const testResultsContainer = document.getElementById('testResultsContainer');
    if (testResultsContainer) {
      testResultsContainer.innerHTML = '<h3>Running Tests...</h3>';
    }
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
      <figcaption>Illustration for ${problemTitle}</figcaption>
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

