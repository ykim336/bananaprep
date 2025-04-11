/**
 * Font Switcher for BananaPrep
 * Allows dynamic font changing across the application
 */

// Font options to choose from
const fontOptions = {
    'default': {
      primary: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      monospace: "'Source Code Pro', 'Menlo', 'Monaco', 'Courier New', monospace"
    },
    'system': {
      primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      monospace: "'Menlo', 'Monaco', 'Courier New', monospace"
    },
    'serif': {
      primary: "'Georgia', 'Times New Roman', serif",
      monospace: "'Source Code Pro', 'Courier New', monospace"
    },
    'openDyslexic': {
      primary: "'Open-Dyslexic', 'DM Sans', sans-serif",
      monospace: "'Source Code Pro', 'Courier New', monospace"
    }
  };
  
  /**
   * Change the application font
   * @param {string} fontKey - Key from fontOptions to use
   */
  function changeFont(fontKey) {
    // Get the font settings or use default if not found
    const fontSetting = fontOptions[fontKey] || fontOptions.default;
    
    // Update CSS variables
    document.documentElement.style.setProperty('--font-primary', fontSetting.primary);
    document.documentElement.style.setProperty('--font-monospace', fontSetting.monospace);
    
    // Save preference to localStorage
    localStorage.setItem('BananaPrepFontPreference', fontKey);
  }
  
  /**
   * Initialize font system
   */
  function initFontSystem() {
    // Check for saved preference
    const savedFont = localStorage.getItem('BananaPrepFontPreference');
    
    // Apply saved font or default
    if (savedFont && fontOptions[savedFont]) {
      changeFont(savedFont);
    }
    
    // Create font switcher UI if container exists
    const fontSwitcherContainer = document.getElementById('fontSwitcherContainer');
    if (fontSwitcherContainer) {
      createFontSwitcherUI(fontSwitcherContainer);
    }
  }
  
  /**
   * Create UI for font switching
   * @param {HTMLElement} container - Container element to append switcher
   */
  function createFontSwitcherUI(container) {
    // Create dropdown select
    const select = document.createElement('select');
    select.id = 'fontSelector';
    select.className = 'font-selector';
    
    // Add options
    Object.keys(fontOptions).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize
      
      // Set selected if matches saved preference
      const savedFont = localStorage.getItem('BananaPrepFontPreference');
      if (savedFont === key) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });
    
    // Add event listener
    select.addEventListener('change', (e) => {
      changeFont(e.target.value);
    });
    
    // Create label
    const label = document.createElement('label');
    label.htmlFor = 'fontSelector';
    label.textContent = 'Font: ';
    
    // Add to container
    container.appendChild(label);
    container.appendChild(select);
  }
  
  // Initialize when DOM content is loaded
  document.addEventListener('DOMContentLoaded', initFontSystem);
  
  // Export for use in other scripts if needed
  window.BananaPrepFonts = {
    changeFont,
    fontOptions
  };