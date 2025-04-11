/**
 * Simplified Problem Page Script for BananaPrep
 * Includes fallback data if API fails
 */

// State management
let currentProblem = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing problem page...");
  
  // Get query parameters
  const currentProblemId = getQueryParam('id') || '0';
  console.log("Problem ID from URL:", currentProblemId);
  
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
  console.log("Setting up event listeners...");
  
  // Code run button
  const runBtn = document.getElementById('runBtn');
  if (runBtn) {
    runBtn.addEventListener('click', function() {
      console.log("Run button clicked");
      runMatlabCode();
    });
  }
  
  // Code submit button
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      console.log("Submit button clicked");
      submitCode();
    });
  }
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
  console.log("Checking authentication status...");
  const authPrompt = document.getElementById('authPrompt');
  
  if (!authPrompt) return;
  
  if (!Auth.isLoggedIn()) {
    console.log("User not logged in");
    authPrompt.style.display = 'block';
  } else {
    console.log("User logged in");
    authPrompt.style.display = 'none';
  }
}

/**
 * Update problem status display
 * @param {string} status - Problem status: 'solved', 'attempted', or 'unsolved'
 */
function updateProblemStatus(status) {
  console.log("Updating problem status to:", status);
  const statusElement = document.getElementById('problemStatus');
  if (!statusElement) return;
  
  statusElement.className = 'user-status';
  
  switch(status) {
    case 'solved':
      statusElement.textContent = 'Solved';
      statusElement.style.color = '#2cbb5d'; // Green
      break;
    case 'attempted':
      statusElement.textContent = 'Attempted';
      statusElement.style.color = '#ffbf23'; // Yellow/Orange
      break;
    default:
      statusElement.textContent = 'Unsolved';
      statusElement.style.color = ''; // Default
  }
}

/**
 * Display problem image
 * @param {string} imagePath - Path to image
 * @param {string} problemTitle - Problem title
 */
function displayProblemImage(imagePath, problemTitle) {
  console.log("Displaying image for problem:", problemTitle);
  const imageContainer = document.getElementById('problemImageContainer');
  
  if (!imageContainer) return;
  
  if (imagePath) {
    console.log("Image path:", imagePath);
    // Direct image display with inline error handling
    const fullImagePath = `images/problems/${imagePath}`;
    
    imageContainer.innerHTML = `
      <img src="${fullImagePath}" alt="${problemTitle} illustration" 
           onerror="this.onerror=null; this.parentNode.innerHTML='<div style=\\'text-align:center; padding:20px;\\'><i class=\\'fas fa-image\\'></i><p>Image not available</p></div>';"
           style="max-width: 100%; border: 1px solid var(--border-color);">
      <figcaption>Illustration for ${problemTitle}</figcaption>
    `;
  } else {
    console.log("No image available, hiding container");
    // No image provided, hide container
    imageContainer.style.display = 'none';
  }
}

/**
 * Run MATLAB code
 */
async function runMatlabCode() {
  alert("This would run your code on the server. Feature is in development.");
}

/**
 * Submit code solution
 */
async function submitCode() {
  alert("This would submit your solution to the server. Feature is in development.");
}

/**
 * Load problem data
 */
async function loadProblem() {
  console.log("Loading problem data...");
  
  try {
    console.log("Fetching problems from API...");
    let problems = [];
    
    try {
      // Try to load from API
      problems = await API.problems.getAll();
      console.log(`Loaded ${problems.length} problems from API`);
    } catch (apiError) {
      console.error("Error loading from API:", apiError);
      
      // Fallback to direct fetch
      try {
        const response = await fetch('/data/problems.json');
        if (response.ok) {
          problems = await response.json();
          console.log(`Loaded ${problems.length} problems from direct fetch`);
        } else {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
      } catch (fetchError) {
        console.error("Error loading from direct fetch:", fetchError);
        
        // Use hardcoded fallback data
        console.log("Using hardcoded fallback data");
        problems = [
          {
            "title": "Ohm's Law Calculation",
            "concept": "Circuits",
            "description": "Find the current through the circuit using Ohm's law. A 10V battery is connected to a 5Ω resistor. What is the current in amperes?",
            "tags": "Circuits, Ohm's Law",
            "solution": "The two resistors are in parallel, so use the formula I = V/R. Calculate the equivalent resistance first if needed. R_eq = (R1 * R2) / (R1 + R2). Then, I = V/R_eq.",
            "image": "ohms-law.png",
            "answer": "2",
            "difficulty": "easy",
            "examples": [
              {
                "input": "V = 10, R = 5",
                "output": "2",
                "explanation": "I = V/R = 10/5 = 2 amperes"
              }
            ],
            "constraints": [
              "Voltage (V) is between 1 and 100",
              "Resistance (R) is between 1 and 50"
            ]
          }
        ];
      }
    }
    
    // Get the problem ID from URL
    const id = parseInt(getQueryParam('id') || '0');
    console.log("Using problem ID:", id);
    
    // Make sure we have a problem
    if (!problems || problems.length === 0) {
      throw new Error("No problems loaded");
    }
    
    // Get current problem (with bounds checking)
    currentProblem = problems[Math.min(id, problems.length - 1)];
    
    if (!currentProblem) {
      throw new Error("Problem not found");
    }
    
    console.log("Loaded problem:", currentProblem);
    
    // Update problem details
    updateProblemDetails(currentProblem);
    
  } catch (error) {
    console.error('Error in loadProblem():', error);
    
    // Use hardcoded data as ultimate fallback
    const fallbackProblem = {
      "title": "Ohm's Law Calculation",
      "concept": "Circuits",
      "description": "Find the current through the circuit using Ohm's law. A 10V battery is connected to a 5Ω resistor. What is the current in amperes?",
      "tags": "Circuits, Ohm's Law",
      "solution": "The two resistors are in parallel, so use the formula I = V/R. Calculate the equivalent resistance first if needed. R_eq = (R1 * R2) / (R1 + R2). Then, I = V/R_eq.",
      "image": "ohms-law.png",
      "answer": "2",
      "difficulty": "easy",
      "examples": [
        {
          "input": "V = 10, R = 5",
          "output": "2",
          "explanation": "I = V/R = 10/5 = 2 amperes"
        }
      ],
      "constraints": [
        "Voltage (V) is between 1 and 100",
        "Resistance (R) is between 1 and 50"
      ]
    };
    
    console.log("Using ultimate fallback problem data");
    currentProblem = fallbackProblem;
    updateProblemDetails(fallbackProblem);
  }
}

/**
 * Update all problem details in the UI
 * @param {Object} problem - Problem data
 */
function updateProblemDetails(problem) {
  console.log("Updating UI with problem details");
  
  // Update title and description
  const titleElement = document.getElementById('problemTitle');
  const descElement = document.getElementById('problemDescription');
  
  if (titleElement) titleElement.textContent = problem.title || 'Untitled Problem';
  if (descElement) descElement.textContent = problem.description || 'No description available.';
  
  // Update difficulty tag
  updateDifficultyTag(problem.difficulty);
  
  // Display problem image
  displayProblemImage(problem.image, problem.title);
  
  // Update examples
  updateExamples(problem);
  
  // Update constraints
  updateConstraints(problem);
  
  console.log("Problem details updated successfully");
}

/**
 * Update the difficulty tag with proper styling
 * @param {string} difficulty - The problem difficulty level
 */
function updateDifficultyTag(difficulty) {
  console.log("Updating difficulty tag:", difficulty);
  const difficultyTag = document.getElementById('difficultyTag');
  if (!difficultyTag) return;
  
  // Default to easy if no difficulty specified
  const difficultyLevel = (difficulty || 'easy').toLowerCase();
  
  // Clear all existing classes except 'difficulty-tag'
  difficultyTag.className = 'difficulty-tag';
  
  // Add the appropriate class based on difficulty
  difficultyTag.classList.add(difficultyLevel);
  
  // Set the text with first letter capitalized
  difficultyTag.textContent = difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1);
}

/**
 * Update examples section with problem examples
 * @param {Object} problem - Problem data
 */
function updateExamples(problem) {
  console.log("Updating examples section");
  const examplesContainer = document.getElementById('examplesContainer');
  if (!examplesContainer) return;
  
  examplesContainer.innerHTML = '';
  
  if (Array.isArray(problem.examples) && problem.examples.length > 0) {
    problem.examples.forEach((example, index) => {
      const exampleDiv = document.createElement('div');
      exampleDiv.className = 'example';
      
      let exampleHtml = '';
      
      if (example.input !== undefined) {
        exampleHtml += `
          <div class="example-row">
            <div class="example-label">Input:</div>
            <div class="example-content font-mono">${example.input}</div>
          </div>
        `;
      }
      
      if (example.output !== undefined) {
        exampleHtml += `
          <div class="example-row">
            <div class="example-label">Output:</div>
            <div class="example-content">${example.output}</div>
          </div>
        `;
      }
      
      if (example.explanation) {
        exampleHtml += `
          <div class="example-row">
            <div class="example-label">Explanation:</div>
            <div class="example-content">${example.explanation}</div>
          </div>
        `;
      }
      
      exampleDiv.innerHTML = exampleHtml;
      examplesContainer.appendChild(exampleDiv);
    });
  } else {
    // Create a basic example
    const exampleDiv = document.createElement('div');
    exampleDiv.className = 'example';
    
    const exampleHtml = `
      <div class="example-row">
        <div class="example-label">Example:</div>
        <div class="example-content">
          ${problem.description || 'Solve the given problem.'}
        </div>
      </div>
      <div class="example-row">
        <div class="example-label">Expected Answer:</div>
        <div class="example-content font-mono">${problem.answer || 'Solve step by step following engineering principles.'}</div>
      </div>
    `;
    
    exampleDiv.innerHTML = exampleHtml;
    examplesContainer.appendChild(exampleDiv);
  }
}

/**
 * Update constraints section with problem constraints
 * @param {Object} problem - Problem data
 */
function updateConstraints(problem) {
  console.log("Updating constraints section");
  const constraintsUl = document.getElementById('problemConstraints');
  if (!constraintsUl) return;
  
  constraintsUl.innerHTML = '';
  
  if (Array.isArray(problem.constraints) && problem.constraints.length > 0) {
    problem.constraints.forEach(constraint => {
      const li = document.createElement('li');
      li.textContent = constraint;
      constraintsUl.appendChild(li);
    });
  } else {
    // Add default constraints
    const defaultConstraints = [
      `This problem involves ${problem.concept || 'engineering concepts'}.`,
      'Follow standard mathematical notation in your solution.',
      'Make sure to include appropriate units in your answer.'
    ];
    
    defaultConstraints.forEach(constraint => {
      const li = document.createElement('li');
      li.textContent = constraint;
      constraintsUl.appendChild(li);
    });
  }
}