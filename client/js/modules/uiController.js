// uiController.js - Handles UI updates and interactions

/**
 * Update the UI with problem data
 * @param {Object} problem - The problem data
 */
export function updateUI(problem) {
    updateProblemTitle(problem.title);
    updateProblemDescription(problem.description);
    updateDifficultyTag(problem.difficulty);
    displayProblemImage(problem.image, problem.title);
    updateExamples(problem.examples);
    updateConstraints(problem.constraints);
  }
  
  /**
   * Update problem title in the UI
   */
  function updateProblemTitle(title) {
    const problemTitleEl = document.getElementById('problemTitle');
    if (problemTitleEl) {
      problemTitleEl.textContent = title || 'Untitled Problem';
    }
  }
  
  /**
   * Update problem description in the UI
   */
  function updateProblemDescription(description) {
    const problemDescriptionEl = document.getElementById('problemDescription');
    if (problemDescriptionEl) {
      problemDescriptionEl.textContent = description || 'No description available.';
    }
  }
  
  /**
   * Update difficulty tag in the UI
   */
  function updateDifficultyTag(difficulty) {
    const difficultyTag = document.getElementById('difficultyTag');
    if (difficultyTag) {
      difficultyTag.textContent = difficulty || 'Easy';
      difficultyTag.className = 'difficulty-tag';
      difficultyTag.classList.add(difficulty ? difficulty.toLowerCase() : 'easy');
    }
  }
  
  /**
   * Display problem image with proper error handling.
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
  
  /**
   * Update the examples section with problem examples.
   */
  function updateExamples(examples) {
    const examplesDiv = document.getElementById('problemExamples');
    if (!examplesDiv) {
      console.error("Problem examples container not found!");
      return;
    }
    examplesDiv.innerHTML = '';
    
    if (Array.isArray(examples) && examples.length > 0) {
      examples.forEach(example => {
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
   */
  function updateConstraints(constraints) {
    const constraintsUl = document.getElementById('problemConstraints');
    if (!constraintsUl) {
      console.error("Problem constraints container not found!");
      return;
    }
    constraintsUl.innerHTML = '';
    
    if (Array.isArray(constraints) && constraints.length > 0) {
      constraints.forEach(constraint => {
        const li = document.createElement('li');
        li.classList.add('constraint-item');
        li.textContent = constraint;
        constraintsUl.appendChild(li);
      });
    } else {
      constraintsUl.textContent = 'No constraints provided.';
    }
  }
  
  /**
   * Show error alert with a message.
   */
  export function showError(message) {
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
   */
  export function showSuccess(message) {
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
   * Update the problem status display
   */
  export function updateProblemStatus(status) {
    const statusElement = document.getElementById('problemStatus');
    if (statusElement) {
      statusElement.className = 'user-status';
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
   * Toggle the loading state for various buttons
   */
  export function toggleLoading(buttonId, isLoading) {
    const spinnerMap = {
      'runBtn': 'runSpinner',
      'submitBtn': 'submitSpinner',
      'submitAnswerBtn': 'answerSpinner'
    };
    
    const spinnerId = spinnerMap[buttonId];
    const button = document.getElementById(buttonId);
    const spinner = document.getElementById(spinnerId);
    
    if (spinner) {
      spinner.style.display = isLoading ? 'block' : 'none';
    }
    if (button) {
      button.disabled = isLoading;
    }
  }
  
  /**
   * Setup tab switching functionality 
   */
  export function setupTabs() {
    // Get all the tab elements
    const tabs = document.querySelectorAll('.tabs-container .tab');
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
          showTestCaseTab();
        }
      });
    });
  }
  
  /**
   * Show test case tab and prepare content area
   */
  export function showTestCaseTab() {
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
        testResultsContainer.innerHTML = '<h3>No tests have been run yet</h3><p>Submit your solution to run tests.</p>';
        testcaseContent.appendChild(testResultsContainer);
        
        // Add the test case content to the editor section
        const editorSection = document.querySelector('.editor-section');
        if (editorSection) {
          editorSection.appendChild(testcaseContent);
        }
      }
      
      // Hide code editor and terminal
      const codeContainer = document.querySelector('.code-container');
      const terminalSection = document.querySelector('.terminal-section');
      if (codeContainer) codeContainer.style.display = 'none';
      if (terminalSection) terminalSection.style.display = 'none';
      
      // Show testcase content
      testcaseContent.style.display = 'block';
    }
  }
  
  /**
   * Clear terminal output
   */
  export function clearTerminal() {
    const terminalOutput = document.getElementById('terminalOutput');
    if (terminalOutput) {
      terminalOutput.innerHTML = 'Run your code to see the output here.';
    } else {
      console.error("Terminal output element not found!");
    }
  }