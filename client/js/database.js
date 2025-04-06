/**
 * Database Page Script for BananaPrep
 * Handles problem database display and filtering
 */

// State management
let problemsData = [];
let userProgress = {};
let currentFilters = {
  status: 'all',
  difficulty: 'all',
  tag: 'all',
  search: ''
};

/**
 * Initialize page when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page data
  initializePageData();
  
  // Set up event listeners
  setupEventListeners();
  
  // Listen for page visibility changes to reload data when returning to the tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshUserData();
    }
  });
});

/**
 * Initialize page data
 */
function initializePageData() {
  // Update user account section
  Auth.updateUserAccountSection();
  
  // Show/hide user profile section based on login status
  toggleUserProfileVisibility();
  
  // Load problems and user data
  loadProblems();
}

/**
 * Set up all event listeners for the page
 */
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.toLowerCase();
      renderTable(filterProblems(problemsData));
    });
  }
  
  // Pick random problem button
  const pickOneBtn = document.getElementById('pickOneBtn');
  if (pickOneBtn) {
    pickOneBtn.addEventListener('click', () => {
      if (!problemsData.length) return;
      const randomIndex = Math.floor(Math.random() * problemsData.length);
      window.location.href = `problem.html?id=${randomIndex}`;
    });
  }
  
  // Set up difficulty filter listeners
  document.querySelectorAll('[data-difficulty]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.difficulty = e.target.dataset.difficulty;
      renderTable(filterProblems(problemsData));
    });
  });
  
  // Set up status filter listeners
  document.querySelectorAll('[data-filter]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.status = e.target.dataset.filter;
      renderTable(filterProblems(problemsData));
    });
  });
  
  // Refresh stats button
  const refreshStatsBtn = document.getElementById('refreshStatsBtn');
  if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener('click', () => {
      loadUserStats();
      loadUserProgress();
    });
  }
}

/**
 * Show/hide user profile section based on login status
 */
function toggleUserProfileVisibility() {
  const userProfile = document.getElementById('userProfile');
  if (userProfile) {
    userProfile.style.display = Auth.isLoggedIn() ? 'block' : 'none';
  }
}

/**
 * Load problems from the server
 */
async function loadProblems() {
  try {
    problemsData = await API.problems.getAll();
    
    // Defensive check: Ensure the JSON is an array
    if (!Array.isArray(problemsData)) {
      throw new Error('JSON is not in expected array format.');
    }
    
    renderTable(problemsData);
    populateTagFilters(problemsData);
    
    // After problems are loaded, load user progress if logged in
    if (Auth.isLoggedIn()) {
      await loadUserProgress();
      await loadUserStats();
    }
  } catch (error) {
    console.error('Failed to load problems:', error);
    const tbody = document.querySelector('#problemsTable tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6">Error loading problems. Check console for details.</td></tr>';
    }
  }
}

/**
 * Load user progress for all problems
 */
async function loadUserProgress() {
  if (!Auth.isLoggedIn()) return;
  
  try {
    const progressData = await API.progress.getAll();
    
    // Convert array to object with problem_id as key for easier lookup
    userProgress = {};
    if (Array.isArray(progressData)) {
      progressData.forEach(item => {
        userProgress[item.problem_id] = item;
      });
    }
    
    // Re-render table with progress data
    renderTable(filterProblems(problemsData));
  } catch (error) {
    console.error('Error loading user progress:', error);
  }
}

/**
 * Load user stats from API
 */
async function loadUserStats() {
  if (!Auth.isLoggedIn()) return;
  
  try {
    const stats = await API.user.getStats();
    
    // Update stats display
    updateStatsDisplay(stats);
    
    // Calculate and update progress bar
    updateProgressBar(stats);
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

/**
 * Update stats display in the UI
 * @param {Object} stats - User stats object
 */
function updateStatsDisplay(stats) {
  const easySolved = document.getElementById('easySolved');
  const mediumSolved = document.getElementById('mediumSolved');
  const hardSolved = document.getElementById('hardSolved');
  
  if (easySolved) easySolved.textContent = stats.easy_solved || 0;
  if (mediumSolved) mediumSolved.textContent = stats.medium_solved || 0;
  if (hardSolved) hardSolved.textContent = stats.hard_solved || 0;
}

/**
 * Update progress bar in the UI
 * @param {Object} stats - User stats object
 */
function updateProgressBar(stats) {
  const totalSolved = (stats.easy_solved || 0) + (stats.medium_solved || 0) + (stats.hard_solved || 0);
  const totalProblems = problemsData.length;
  const percentage = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
  
  const progressBarFill = document.getElementById('progressBarFill');
  const completionText = document.getElementById('completionText');
  
  if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
  if (completionText) completionText.textContent = `${percentage}% Completed`;
}

/**
 * Refresh user data without reloading problems
 */
function refreshUserData() {
  if (Auth.isLoggedIn()) {
    loadUserStats();
    loadUserProgress();
  }
}

/**
 * Render table with provided data
 * @param {Array} data - Array of problem objects
 */
/**
 * Render table with provided data
 * @param {Array} data - Array of problem objects
 */
function renderTable(data) {
  const tbody = document.querySelector('#problemsTable tbody');
  if (!tbody) return;
  
  tbody.innerHTML = ''; // Clear existing rows
  
  data.forEach((problem, index) => {
    const row = document.createElement('tr');
    
    // Make row clickable
    row.addEventListener('click', () => {
      window.location.href = `problem.html?id=${index}`;
    });
    
    // Populate row cells
    const cellIndex = document.createElement('td');
    cellIndex.textContent = index + 1;
    row.appendChild(cellIndex);
    
    const cellTitle = document.createElement('td');
    cellTitle.textContent = problem.title || "Untitled";
    row.appendChild(cellTitle);

    const cellDifficulty = document.createElement('td');
    const difficulty = (problem.difficulty || "easy").toLowerCase();
    cellDifficulty.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    if (["easy", "medium", "hard"].includes(difficulty)) {
      cellDifficulty.classList.add(`difficulty-${difficulty}`);
    }
    row.appendChild(cellDifficulty);

    const cellStatus = document.createElement('td');
    const status = getProblemStatus(index);
    cellStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    cellStatus.classList.add(`status-${status === 'not-done' ? 'not-done' : status}`);
    row.appendChild(cellStatus);

    const cellTags = document.createElement('td');
    cellTags.textContent = problem.tags || "None";
    row.appendChild(cellTags);

    const cellConcept = document.createElement('td');
    cellConcept.textContent = problem.concept || "General";
    row.appendChild(cellConcept);

    tbody.appendChild(row);
  });
}

/**
 * Get problem status from user progress
 * @param {number} problemId - The problem ID
 * @returns {string} Status: 'solved', 'attempted', or 'not-done'
 */
function getProblemStatus(problemId) {
  if (!userProgress[problemId]) return 'not-done';
  return userProgress[problemId].status || 'not-done';
}

/**
 * Apply filters to problems data
 * @param {Array} data - Array of problem objects
 * @returns {Array} Filtered problems
 */
function filterProblems(data) {
  return data.filter(problem => {
    // Filter by status
    if (currentFilters.status !== 'all') {
      const problemId = problemsData.indexOf(problem);
      const progressStatus = getProblemStatus(problemId);
      
      if (currentFilters.status === 'solved' && progressStatus !== 'solved') return false;
      if (currentFilters.status === 'attempted' && progressStatus !== 'attempted') return false;
      if (currentFilters.status === 'unsolved' && progressStatus !== 'not-done') return false;
    }
    
    // Filter by difficulty
    if (currentFilters.difficulty !== 'all' && problem.difficulty?.toLowerCase() !== currentFilters.difficulty) {
      return false;
    }
    
    // Filter by tag
    if (currentFilters.tag !== 'all' && !(problem.tags?.toLowerCase().includes(currentFilters.tag.toLowerCase()))) {
      return false;
    }
    
    // Filter by search text
    if (currentFilters.search && !(
      problem.title?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
      problem.tags?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
      problem.concept?.toLowerCase().includes(currentFilters.search.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  });
}

/**
 * Populate tag filters from unique tags in problems
 * @param {Array} problems - Array of problem objects
 */
function populateTagFilters(problems) {
  const tagFiltersContainer = document.getElementById('tagFilters');
  if (!tagFiltersContainer) return;
  
  tagFiltersContainer.innerHTML = ''; // Clear existing filters
  
  const allTags = new Set();
  
  // Collect all tags
  problems.forEach(problem => {
    if (problem.tags) {
      problem.tags.split(',').forEach(tag => {
        allTags.add(tag.trim());
      });
    }
  });
  
  // Add "All Tags" option
  const allTagsLink = document.createElement('a');
  allTagsLink.href = '#';
  allTagsLink.textContent = 'All Tags';
  allTagsLink.dataset.tag = 'all';
  allTagsLink.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilters.tag = 'all';
    renderTable(filterProblems(problemsData));
  });
  tagFiltersContainer.appendChild(allTagsLink);
  
  // Add each unique tag
  Array.from(allTags).sort().forEach(tag => {
    const tagLink = document.createElement('a');
    tagLink.href = '#';
    tagLink.textContent = tag;
    tagLink.dataset.tag = tag;
    tagLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.tag = tag;
      renderTable(filterProblems(problemsData));
    });
    tagFiltersContainer.appendChild(tagLink);
  });
}