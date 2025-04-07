/**
 * Login Page Script for BananaPrep
 * Handles login, registration, and form switching
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Element References
    const signinTab = document.getElementById('signinTab');
    const signupTab = document.getElementById('signupTab');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const authPrompt = document.getElementById('authPrompt');
    
    // Alert elements
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    // Loading elements
    const signinSpinner = document.getElementById('signinSpinner');
    const signupSpinner = document.getElementById('signupSpinner');
    const signinButton = document.getElementById('signinButton');
    const signupButton = document.getElementById('signupButton');
    
    // Check if user is already logged in
    checkAuthStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    /**
     * Set up all event listeners for the page
     */
    function setupEventListeners() {
      // Tab switching
      signinTab.addEventListener('click', showSignIn);
      signupTab.addEventListener('click', showSignUp);
      toggleAuth.addEventListener('click', showSignUp);
      
      // Form submissions
      signinForm.addEventListener('submit', handleSignIn);
      signupForm.addEventListener('submit', handleSignUp);
    }
    
    /**
     * Check if user is already logged in
     */
    function checkAuthStatus() {
      if (Auth.isLoggedIn()) {
        // Redirect to database page
        window.location.href = 'database.html';
      }
    }
    
    /**
     * Show error alert
     * @param {string} message - Error message to display
     */
    function showError(message) {
      errorAlert.textContent = message;
      errorAlert.style.display = 'block';
      successAlert.style.display = 'none';
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        errorAlert.style.display = 'none';
      }, 5000);
    }
    
    /**
     * Show success alert
     * @param {string} message - Success message to display
     */
    function showSuccess(message) {
      successAlert.textContent = message;
      successAlert.style.display = 'block';
      errorAlert.style.display = 'none';
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        successAlert.style.display = 'none';
      }, 5000);
    }
    
    /**
     * Toggle loading state for sign in form
     * @param {boolean} isLoading - Whether to show loading state
     */
    function toggleSigninLoading(isLoading) {
      signinSpinner.style.display = isLoading ? 'block' : 'none';
      signinButton.disabled = isLoading;
    }
    
    /**
     * Toggle loading state for sign up form
     * @param {boolean} isLoading - Whether to show loading state
     */
    function toggleSignupLoading(isLoading) {
      signupSpinner.style.display = isLoading ? 'block' : 'none';
      signupButton.disabled = isLoading;
    }
    
    /**
     * Show sign in form
     */
    function showSignIn() {
      signinTab.classList.add('active');
      signupTab.classList.remove('active');
      signinForm.style.display = 'block';
      signupForm.style.display = 'none';
      authPrompt.innerHTML = 'Don\'t have an account? <a href="#" id="toggleAuth">Sign up now</a>';
      document.getElementById('toggleAuth').addEventListener('click', showSignUp);
      
      // Clear any visible alerts
      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';
    }
    
    /**
     * Show sign up form
     */
    function showSignUp() {
      signupTab.classList.add('active');
      signinTab.classList.remove('active');
      signupForm.style.display = 'block';
      signinForm.style.display = 'none';
      authPrompt.innerHTML = 'Already have an account? <a href="#" id="toggleAuth">Sign in</a>';
      document.getElementById('toggleAuth').addEventListener('click', showSignIn);
      
      // Clear any visible alerts
      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';
    }
    
    /**
     * Handle sign in form submission
     * @param {Event} e - Form submit event
     */
    async function handleSignIn(e) {
      e.preventDefault();
      
      // Get form data
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const remember = document.getElementById('remember').checked;
      
      // Simple validation
      let isValid = true;
      
      // Email validation
      if (!email.includes('@')) {
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('emailError').style.display = 'none';
      }
      
      // Password validation
      if (password.length < 8) {
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('passwordError').style.display = 'none';
      }
      
      if (isValid) {
        try {
          // Show loading
          toggleSigninLoading(true);
          
          // Make API request
          const data = await API.auth.login(email, password);
          
          // Save auth token
          Auth.saveAuthInfo(data.token, data.userId, data.fullName);
          
          // Show success message
          showSuccess('Sign in successful! Redirecting...');
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            window.location.href = 'database.html';
          }, 1500);
        } catch (error) {
          showError(error.message || 'Failed to sign in');
        } finally {
          toggleSigninLoading(false);
        }
      }
    }
    
    /**
     * Handle sign up form submission
     * @param {Event} e - Form submit event
     */
    async function handleSignUp(e) {
      e.preventDefault();
      
      // Get form data
      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Simple validation
      let isValid = true;
      
      // Full name validation
      if (!fullName.trim()) {
        document.getElementById('fullNameError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('fullNameError').style.display = 'none';
      }
      
      // Email validation
      if (!email.includes('@')) {
        document.getElementById('signupEmailError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('signupEmailError').style.display = 'none';
      }
      
      // Password validation
      if (password.length < 8) {
        document.getElementById('signupPasswordError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('signupPasswordError').style.display = 'none';
      }
      
      // Confirm password
      if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').style.display = 'block';
        isValid = false;
      } else {
        document.getElementById('confirmPasswordError').style.display = 'none';
      }
      
      if (isValid) {
        try {
          // Show loading
          toggleSignupLoading(true);
          
          // Make API request
          const data = await API.auth.register(fullName, email, password);
          
          // Show success message
          showSuccess('Account created successfully! Please sign in.');
          
          // Clear form
          signupForm.reset();
          
          // Switch to sign in tab after short delay
          setTimeout(() => {
            showSignIn();
          }, 1500);
        } catch (error) {
          showError(error.message || 'Failed to create account');
        } finally {
          toggleSignupLoading(false);
        }
      }
    }
  });