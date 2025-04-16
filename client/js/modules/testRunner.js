// testRunner.js - Handles test case execution and reporting

import { saveUserProgress } from './progressManager.js';
import { runTest } from './codeExecutor.js';
import { showSuccess, showError, updateProblemStatus, showTestCaseTab } from './uiController.js';

/**
 * Submit the user's solution code for testing
 */
export async function submitSolution(problemId, solutionCode, testCases) {
  if (!solutionCode || solutionCode.trim() === '') {
    showError('Please provide a solution before submitting');
    return;
  }
  
  try {
    // First, save the user's progress
    const saved = await saveUserProgress(problemId, 'attempted', solutionCode);
    
    // If there are test cases for this problem, run the verification
    if (testCases) {
      // Show test case tab
      showTestCaseTab();
      
      // Run the test cases
      await runTestCases(solutionCode, testCases, problemId);
    } else {
      // If no test cases, just mark as solved
      const solved = await saveUserProgress(problemId, 'solved', solutionCode);
      if (solved) {
        showSuccess('Solution submitted successfully!');
      }
    }
  } catch (error) {
    showError(error.message || 'Failed to submit solution');
  }
}

/**
 * Run test cases for the solution
 */
async function runTestCases(solutionCode, testCases, problemId) {
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
          const solved = await saveUserProgress(problemId, 'solved', solutionCode);
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
        
        if (codeTab) {
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