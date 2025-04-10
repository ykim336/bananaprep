/**
 * Handles the resizing of the problem description panel
 * Allows users to drag the divider to adjust the width of panels
 */
document.addEventListener('DOMContentLoaded', function() {
    const handle = document.getElementById('resizeHandle');
    const leftCard = document.querySelector('.card-left');
    
    if (!handle || !leftCard) {
      console.error('Resize handle or left card not found');
      return;
    }
    
    let isResizing = false;
    
    // Start resizing when the handle is clicked
    handle.addEventListener('mousedown', function(e) {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });
    
    // Resize as the mouse moves
    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position
      const containerWidth = document.querySelector('.problem-container').offsetWidth;
      const newWidth = (e.clientX / containerWidth) * 100;
      
      // Ensure width stays within reasonable bounds (40% to 60%)
      if (newWidth >= 30 && newWidth <= 70) {
        leftCard.style.flex = `0 0 ${newWidth}%`;
      }
    });
    
    // Stop resizing when mouse is released
    document.addEventListener('mouseup', function() {
      isResizing = false;
      document.body.style.cursor = '';
    });
    
    // Stop resizing if mouse leaves the window
    document.addEventListener('mouseleave', function() {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    });
  });