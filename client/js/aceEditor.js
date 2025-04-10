/**
 * Initializes the ACE code editor with Source Code Pro font
 * Sets up proper syntax highlighting and editor options
 */
document.addEventListener("DOMContentLoaded", function() {
  // Defensive check for the codeEditor element
  var editorElement = document.getElementById("codeEditor");
  if (!editorElement) {
    console.error("Error: 'codeEditor' element not found!");
    return;
  }

  // Initialize ACE Editor
  var editor = ace.edit("codeEditor");

  // Set dark theme
  editor.setTheme("ace/theme/monokai");

  // Set MATLAB mode for proper syntax highlighting
  editor.session.setMode("ace/mode/matlab");

  // Set font family to Source Code Pro
  editor.setOptions({
    fontFamily: 'Menlo',
    fontSize: "16px",
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    highlightActiveLine: true,
    showPrintMargin: false,
    wrap: true
  });

  // Make the editor accessible to the global scope for problem.js to interact with
  window.codeEditor = editor;

  console.log("ACE Editor initialized with Source Code Pro font");
});