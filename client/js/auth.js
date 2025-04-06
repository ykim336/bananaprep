/**
 * Authentication Service for BananaPrep
 * Handles authentication state and user operations
 */

const Auth = {
    /**
     * Get authentication token
     * @returns {string|null} The auth token or null if not logged in
     */
    getToken: () => {
      return localStorage.getItem('BananaPrepToken');
    },
    
    /**
     * Check if user is logged in
     * @returns {boolean} True if logged in, false otherwise
     */
    isLoggedIn: () => {
      return !!localStorage.getItem('BananaPrepToken');
    },
    
    /**
     * Get current user's name
     * @returns {string} User's name or empty string if not logged in
     */
    getUserName: () => {
      return localStorage.getItem('BananaPrepUserName') || '';
    },
    
    /**
     * Get current user's ID
     * @returns {string} User's ID or empty string if not logged in
     */
    getUserId: () => {
      return localStorage.getItem('BananaPrepUserId') || '';
    },
    
    /**
     * Save authentication info after login/register
     * @param {string} token - JWT token
     * @param {string} userId - User ID
     * @param {string} userName - User's name
     */
    saveAuthInfo: (token, userId, userName) => {
      localStorage.setItem('BananaPrepToken', token);
      localStorage.setItem('BananaPrepUserId', userId);
      localStorage.setItem('BananaPrepUserName', userName || '');
    },
    
    /**
     * Clear authentication info (logout)
     */
    logout: () => {
      localStorage.removeItem('BananaPrepToken');
      localStorage.removeItem('BananaPrepUserId');
      localStorage.removeItem('BananaPrepUserName');
    },
    
    /**
     * Update user account section in the UI
     * @param {string} elementId - ID of the element to update
     */
    updateUserAccountSection: (elementId = 'userAccountSection') => {
      const userAccountSection = document.getElementById(elementId);
      if (!userAccountSection) return;
      
      if (Auth.isLoggedIn()) {
        const userName = Auth.getUserName();
        userAccountSection.innerHTML = `
          <div class="user-name">Welcome, ${userName}</div>
          <div class="user-avatar">${userName.charAt(0)}</div>
          <button class="logout-btn" id="logoutBtn">Logout</button>
        `;
        
        // Set up logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
          Auth.logout();
          window.location.reload();
        });
      } else {
        userAccountSection.innerHTML = `
          <a href="login.html" class="login-btn">Login</a>
        `;
      }
    }
  };