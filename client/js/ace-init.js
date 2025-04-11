/**
 * Initialize the Ace Editor for BananaPrep
 * This script initializes the Ace editor for the MATLAB code editor
 */
document.addEventListener("DOMContentLoaded", function() {
  // Check if Ace editor is available
  if (typeof ace === 'undefined') {
    console.error('Ace editor not loaded! Please check the script import.');
    return;
  }

  // Get the code editor element
  const codeEditorElement = document.getElementById('codeEditor');
  if (!codeEditorElement) {
    console.error('Code editor element not found! Check if the element with ID "codeEditor" exists.');
    return;
  }

  // Initialize Ace editor
  const editor = ace.edit("codeEditor");
  
  // Set theme and mode
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/matlab");
  
  // Configure editor options
  editor.setOptions({
    fontFamily: "Menlo, Monaco, Courier New, monospace",
    fontSize: "14px",
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    showPrintMargin: false,
    highlightActiveLine: true,
    wrap: true
  });
  
  // Set initial content if empty
  if (!editor.getValue().trim()) {
    editor.setValue(`% Write your MATLAB/Octave code here
% For example:

function result = calculateCurrent(voltage, resistance)
  % Using Ohm's law: I = V/R
  result = voltage / resistance;
end

% Call the function
voltage = 10;
resistance = 5;
current = calculateCurrent(voltage, resistance)
`);
    editor.clearSelection();
    editor.gotoLine(1);
  }
  
  // Make editor accessible to other scripts
  window.codeEditor = editor;
  
  console.log('Ace editor initialized successfully.');
  
  // Connect editor to run and submit buttons
  connectEditorToButtons();
})

/**
 * Connect the editor to the run and submit buttons
 */
function connectEditorToButtons() {
  const runBtn = document.getElementById('runBtn');
  const submitBtn = document.getElementById('submitBtn');
  
  if (runBtn) {
    runBtn.addEventListener('click', function() {
      if (!window.runMatlabCode && typeof window.runMatlabCode !== 'function') {
        const code = window.codeEditor.getValue();
        const outputElement = document.getElementById('matlabOutput');
        
        if (outputElement) {
          outputElement.textContent = "Running code...\n\n" + 
            "Note: This is a simulated run. In a production environment, " +
            "this would send the code to the backend for execution.";
          
          // Simulate a response after a delay
          setTimeout(() => {
            outputElement.textContent = "// Simulated output:\n";
            if (code.includes('calculateCurrent') && code.includes('voltage') && code.includes('resistance')) {
              outputElement.textContent += "current = 2\n";
            } else {
              outputElement.textContent += "Executed successfully.\n";
            }
          }, 1000);
        }
      }
    });
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      if (!window.submitCode && typeof window.submitCode !== 'function') {
        alert("Your solution has been submitted successfully!");
      }
    });
  }
}