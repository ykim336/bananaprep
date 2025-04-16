// main.js - The main entry point for the problem page
// This file coordinates all the modules

import { loadProblem, getQueryParam } from './modules/problemLoader.js';
import { setupTabs, clearTerminal } from './modules/uiController.js';
import { runMatlabCode, getCurrentCode } from './codeExecutor.js';
import { submitSolution } from './modules/testRunner.js';

// Global state
let currentProblem = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
  // Set up event listeners
  setupEventListeners();
  
  // Set up tab switching
  setupTabs();
  
  // Load the problem data
  currentProblem = await loadProblem();
  
  // Check auth status (practice mode means no forced login)
  checkAuthStatus();
});

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
  // Code run button
  const runBtn = document.getElementById('runBtn');
  if (runBtn) {
    runBtn.addEventListener('click', async function () {
      const problemId = getQueryParam('id') || '0';
      await runMatlabCode(problemId);
    });
  }
  
  // Code submit button
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async function () {
      if (!currentProblem) return;
      
      const problemId = getQueryParam('id') || '0';
      const code = getCurrentCode();
      await submitSolution(problemId, code, currentProblem.test_cases);
    });
  }

  // Clear terminal button
  const clearTerminalBtn = document.getElementById('clearTerminal');
  if (clearTerminalBtn) {
    clearTerminalBtn.addEventListener('click', function() {
      clearTerminal();
    });
  }
}

/**
 * Check authentication status and update the UI accordingly.
 * In practice mode, we don't force you to log in.
 */
function checkAuthStatus() {
  const authPrompt = document.getElementById('authPrompt');
  // Regardless of login status, hide the auth prompt—practice mode is in full effect.
  if (authPrompt) authPrompt.style.display = 'none';
  return Auth.isLoggedIn();
}