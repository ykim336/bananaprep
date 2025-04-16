// problemLoader.js - Handles loading problem data and initializing the page

// Import other modules
import { updateUI } from './uiController.js';
import { setupCodeEditor } from './codeExecutor.js';
import { loadUserProgress } from './progressManager.js';

/**
 * Load problem data and initialize the page
 */
export async function loadProblem() {
  try {
    const problems = await API.problems.getAll();
    const id = getQueryParam('id') || '0';
    const currentProblem = problems[parseInt(id)] || problems[0];
    
    if (!currentProblem) {
      console.error("No problem found for id:", id);
      updateUI({
        title: 'Error: Problem not found',
        description: 'No problem found with the specified ID.'
      });
      return null;
    }
    
    // Update the UI with problem data
    updateUI(currentProblem);
    
    // Load the starter code if available
    setupCodeEditor(currentProblem);
    
    // Load the user's progress for the problem (only if logged in)
    loadUserProgress(id);
    
    return currentProblem;
  } catch (error) {
    console.error('Error loading problem:', error);
    updateUI({
      title: 'Error loading problem',
      description: error.message
    });
    return null;
  }
}

/**
 * Utility: Retrieve query parameter from URL.
 * @param {string} param - Parameter name.
 * @returns {string|null} - Parameter value.
 */
export function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}