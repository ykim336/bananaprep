/**
 * API Service for BananaPrep
 * Handles all API calls to the backend
 */

// API URL - Change this to your actual API URL when deploying
const API_URL = 'http://localhost:3000/api';

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('BananaPrepToken');
}

// API Service object
const API = {
  /**
   * Authentication APIs
   */
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      return response.json();
    },
    
    register: async (fullName, email, password) => {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, email, password })
      });
      
      return response.json();
    }
  },
  
  /**
   * User APIs
   */
  user: {
    getProfile: async () => {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      return response.json();
    },
    
    getStats: async () => {
      const response = await fetch(`${API_URL}/user/stats`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      return response.json();
    }
  },
  
  /**
   * Progress APIs
   */
  progress: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/progress/all`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to load progress data');
      }
      
      return response.ok ? response.json() : [];
    },
    
    getOne: async (problemId) => {
      const response = await fetch(`${API_URL}/progress/${problemId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to load progress');
      }
      
      return response.ok ? response.json() : null;
    },
    
    update: async (problemId, status, solutionCode) => {
      const response = await fetch(`${API_URL}/progress/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          problemId,
          status,
          solutionCode
        })
      });
      
      return response.json();
    },
    
    validateAnswer: async (problemId, userAnswer) => {
      const response = await fetch(`${API_URL}/validate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          problemId,
          userAnswer
        })
      });
      
      return response.json();
    }
  },
  
  /**
   * Problem APIs
   */
  problems: {
    getAll: async () => {
      const response = await fetch('problems.json');
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      return response.json();
    }
  }
};