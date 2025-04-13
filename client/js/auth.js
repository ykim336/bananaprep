/**
 * Authentication Service for BananaPrep
 * Handles authentication state and user operations with Auth0
 */

const Auth = {
  /**
   * Check if user is logged in by verifying if session data exists
   * @returns {boolean} True if logged in, false otherwise
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('BananaPrepUserProfile');
  },
  
  /**
   * Get current user's name
   * @returns {string} User's name or empty string if not logged in
   */
  getUserName: () => {
    const profile = Auth.getUserProfile();
    return profile ? profile.full_name : '';
  },
  
  /**
   * Get current user's ID
   * @returns {string} User's ID or empty string if not logged in
   */
  getUserId: () => {
    const profile = Auth.getUserProfile();
    return profile ? profile.id : '';
  },
  
  /**
   * Get user profile
   * @returns {Object|null} User profile object or null if not logged in
   */
  getUserProfile: () => {
    const profileJson = localStorage.getItem('BananaPrepUserProfile');
    return profileJson ? JSON.parse(profileJson) : null;
  },
  
  /**
   * Save user profile from API response
   * @param {Object} profile - User profile object from API
   */
  saveUserProfile: (profile) => {
    localStorage.setItem('BananaPrepUserProfile', JSON.stringify(profile));
  },
  
  /**
   * Fetch current user profile from API
   * @returns {Promise} Promise that resolves to user profile
   */
  fetchUserProfile: async () => {
    try {
      const response = await fetch('/api/user/profile');
      
      if (response.ok) {
        const profile = await response.json();
        Auth.saveUserProfile(profile);
        return profile;
      } else if (response.status === 401) {
        // Not authenticated
        Auth.clearUserProfile();
        return null;
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  
  /**
   * Clear authentication info (logout)
   */
  clearUserProfile: () => {
    localStorage.removeItem('BananaPrepUserProfile');
  },
  
  /**
   * Logout user through Auth0
   */
  logout: () => {
    Auth.clearUserProfile();
    window.location.href = '/api/logout';
  },
  
  /**
   * Update user account section in the UI
   * @param {string} elementId - ID of the element to update
   */
  updateUserAccountSection: async (elementId = 'userAccountSection') => {
    const userAccountSection = document.getElementById(elementId);
    if (!userAccountSection) return;
    
    // Fetch the latest user profile
    const profile = Auth.isLoggedIn() ? Auth.getUserProfile() : await Auth.fetchUserProfile();
    
    if (profile) {
      const userName = profile.full_name;
      userAccountSection.innerHTML = `
        <div class="user-name">Welcome, ${userName}</div>
        <div class="user-avatar">${userName.charAt(0)}</div>
        <button class="logout-btn" id="logoutBtn">Logout</button>
      `;
      
      // Set up logout button
      document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
      });
    } else {
      userAccountSection.innerHTML = `
        <a href="/api/login" class="login-btn">Login</a>
      `;
    }
  },
  
  /**
   * Initialize authentication on page load
   */
  init: async () => {
    // Fetch user profile on page load if not already available
    if (!Auth.isLoggedIn()) {
      await Auth.fetchUserProfile();
    }
    
    // Update user account section
    Auth.updateUserAccountSection();
  }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', Auth.init);