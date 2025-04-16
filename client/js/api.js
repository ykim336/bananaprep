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
          // Not authenticated, but no worries—practice mode doesn't require a profile.
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
          // We know stats are cool, but if you're not logged in, stats are just chillin’ in the background.
          console.warn('No user stats available in practice mode.');
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
          // Hey, you're not logged in and that's totally fine—practice mode activated.
          console.warn('Not logged in, returning empty progress data.');
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
          // No login, no progress. We're all about practicing without the drama.
          console.warn('Not logged in, returning null for progress on problem:', problemId);
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
          // Update failed because you aren't logged in, but that's cool—we won't hold it against you.
          console.warn('Not logged in, skipping progress update for problem:', problemId);
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
          // You're not logged in; in practice mode we won't harsh your vibe with answer validation.
          console.warn('Not logged in, answer validation skipped for problem:', problemId);
          return { correct: false, message: "Practice mode: answer validation skipped (no login detected)." };
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
          // MATLAB/Octave code execution is chillin'—practice mode means skipping auth.
          console.warn('Not logged in, skipping MATLAB/Octave execution.');
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
    
    // In practice mode, we don't force the user to login on auth errors.
    if (error.status === 401 && redirectOnAuth) {
      // Commented out the login redirect for our chill practice session.
      // window.location.href = `${API_URL}/login`;
    }
    
    return {
      error: true,
      message: error.message || 'An unknown error occurred'
    };
  }
};
