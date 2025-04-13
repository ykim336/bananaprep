/**
 * API Service for BananaPrep
 * Handles all API calls to the backend
 */

// API URL - Change this to your actual API URL when deploying
// const API_URL = 'http://localhost:3000/api';
const API_URL = '/api'; // For same-origin requests

// API Service object
const API = {
  /**
   * User APIs
   */
  user: {
    getProfile: async () => {
      const response = await fetch(`${API_URL}/user/profile`);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated
          return null;
        }
        throw new Error('Failed to fetch user profile');
      }
      
      return response.json();
    },
    
    getStats: async () => {
      const response = await fetch(`${API_URL}/user/stats`);
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `${API_URL}/login`;
          return null;
        }
        throw new Error('Failed to fetch user stats');
      }
      
      return response.json();
    }
  },
  
  /**
   * Progress APIs
   */
  progress: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/progress/all`);
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `${API_URL}/login`;
          return [];
        }
        if (response.status !== 404) {
          throw new Error('Failed to load progress data');
        }
        return [];
      }
      
      return response.json();
    },
    
    getOne: async (problemId) => {
      const response = await fetch(`${API_URL}/progress/${problemId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `${API_URL}/login`;
          return null;
        }
        if (response.status !== 404) {
          throw new Error('Failed to load progress');
        }
        return null;
      }
      
      return response.json();
    },
    
    update: async (problemId, status, solutionCode) => {
      const response = await fetch(`${API_URL}/progress/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problemId,
          status,
          solutionCode
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `${API_URL}/login`;
          return null;
        }
        throw new Error('Failed to update progress');
      }
      
      return response.json();
    },
    
    validateAnswer: async (problemId, userAnswer) => {
      const response = await fetch(`${API_URL}/validate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problemId,
          userAnswer
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `${API_URL}/login`;
          return null;
        }
        throw new Error('Failed to validate answer');
      }
      
      return response.json();
    }
  },
  
  /**
   * Problem APIs
   */
  problems: {
    getAll: async () => {
      // Use the correct path to problems.json relative to the client directory
      const response = await fetch('/data/problems.json');
      
      if (!response.ok) {
        console.error(`Failed to fetch problems.json: ${response.status} ${response.statusText}`);
        throw new Error('Network response was not ok');
      }
      
      return response.json();
    }
  },
  
  /**
   * MATLAB/Octave APIs
   */
  matlab: {
    run: async (code, input) => {
      const response = await fetch(`${API_URL}/run-octave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, input })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `${API_URL}/login`;
          return null;
        }
        throw new Error('Failed to run MATLAB/Octave code');
      }
      
      return response.json();
    }
  },
  
  /**
   * Utility to handle API errors
   */
  handleError: (error, redirectOnAuth = true) => {
    console.error('API Error:', error);
    
    if (error.status === 401 && redirectOnAuth) {
      // Redirect to login page
      window.location.href = `${API_URL}/login`;
    }
    
    return {
      error: true,
      message: error.message || 'An unknown error occurred'
    };
  }
};