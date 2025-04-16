// progressManager.js - Handles saving and loading user progress

import { updateProblemStatus } from './uiController.js';
import { setCode } from './codeExecutor.js';
import { getQueryParam } from './problemLoader.js';

/**
 * Load user progress for this problem.
 * In practice mode, we won't load saved progress because, well, you're flying solo.
 */
export async function loadUserProgress(problemId) {
  // If you're not logged in, skip progress loading—practice mode FTW.
  if (!Auth.isLoggedIn()) return;
  
  try {
    const progress = await API.progress.getOne(problemId);
    if (!progress) return;
    
    // Update code editor with saved solution, if any
    if (progress.solution_code) {
      setCode(progress.solution_code);
    }
    
    // Update problem status display
    updateProblemStatus(progress.status);
    
  } catch (error) {
    console.error('Error loading progress:', error);
  }
}

/**
 * Save user progress.
 * In practice mode, progress isn't sent to the backend—you just vibe through the session.
 * @param {string} problemId - Problem ID.
 * @param {string} status - Problem status.
 * @param {string} solutionCode - User's solution code.
 * @returns {boolean} - Whether progress was "saved" successfully.
 */
export async function saveUserProgress(problemId, status, solutionCode) {
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