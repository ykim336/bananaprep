// js/ace-init.js

document.addEventListener("DOMContentLoaded", function() {
    // Defensive check for the codeEditor element
    var editorElement = document.getElementById("codeEditor");
    if (!editorElement) {
      console.error("Error: 'codeEditor' element not found!");
      return;
    }
  
    // Initialize ACE Editor
    var editor = ace.edit("codeEditor");
  
    // Set a cool theme
    editor.setTheme("ace/theme/twilight");
  
    // Set MATLAB mode for proper syntax highlighting
    editor.session.setMode("ace/mode/matlab");
  
    // Optional settings
    editor.setOptions({
      fontSize: "14px",
      fontFamily: "Source Code Pro, Monaco, 'Courier New', monospace"
    });
  
    console.log("ACE Editor initialized on #codeEditor");
  });
  