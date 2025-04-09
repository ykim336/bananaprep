/**
 * Home Page Script for BananaPrep
 * Handles loading featured problems and initialization
 */

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load featured problems
    loadFeaturedProblems();
  });
  
  /**
   * Load featured problems from the JSON data
   */
  async function loadFeaturedProblems() {
    try {
      // Get all problems
      const problems = await API.problems.getAll();
      
      // Define the IDs of problems to feature (the ones in the original HTML)
      const featuredIds = [0, 4, 16, 11]; // Ohm's Law, Transformer, Fourier, AND Gate
      
      // Get the container element
      const problemContainer = document.getElementById('featuredProblems');
      
      // Clear any existing content
      problemContainer.innerHTML = '';
      
      // Create and append featured problem cards
      featuredIds.forEach(id => {
        if (problems[id]) {
          const problem = problems[id];
          const card = createProblemCard(problem, id);
          problemContainer.appendChild(card);
        }
      });
    } catch (error) {
      console.error('Error loading featured problems:', error);
    }
  }
  
  /**
   * Create a problem card element
   * @param {Object} problem - The problem data object
   * @param {number} id - The problem ID
   * @returns {HTMLElement} - The problem card element
   */
  function createProblemCard(problem, id) {
    const card = document.createElement('div');
    card.className = 'problem-card';
    card.onclick = () => window.location.href = `problem.html?id=${id}`;
    
    // Create card content
    const title = document.createElement('h3');
    title.textContent = problem.title || 'Untitled Problem';
    
    const description = document.createElement('p');
    description.textContent = problem.description || 'No description available.';
    
    // Create tags container
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags';
    
    // Add tags if they exist
    if (problem.tags) {
      const tags = problem.tags.split(',');
      tags.forEach(tagText => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = tagText.trim();
        tagsContainer.appendChild(tag);
      });
    }
    
    // Append all elements to the card
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(tagsContainer);
    
    return card;
  }
  
  /**
   * Utility function to get a random number of featured problems
   * @param {Array} problems - Array of all problems
   * @param {number} count - Number of problems to get
   * @returns {Array} - Array of randomly selected problems
   */
  function getRandomProblems(problems, count) {
    // Create a copy of the problems array to avoid modifying the original
    const problemsCopy = [...problems];
    
    // Shuffle the array
    for (let i = problemsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [problemsCopy[i], problemsCopy[j]] = [problemsCopy[j], problemsCopy[i]];
    }
    
    // Return the first 'count' elements
    return problemsCopy.slice(0, count);
  }