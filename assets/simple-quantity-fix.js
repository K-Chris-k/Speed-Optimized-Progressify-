// Simple Quantity Fix
document.addEventListener('DOMContentLoaded', function() {
  // Flag to prevent duplicate event handling
  let isHandlingClick = false;
  
  // Direct function to handle quantity button clicks
  function handleQuantityButtonClick(e) {
    // Prevent duplicate handling
    if (isHandlingClick) return;
    isHandlingClick = true;
    
    // Find the button that was clicked
    const button = e.target.classList.contains('js-qty__adjust') ? 
                  e.target : e.target.closest('.js-qty__adjust');
    
    if (!button) {
      isHandlingClick = false;
      return;
    }
    
    // Find the container and input
    const container = button.closest('.js-qty');
    if (!container) {
      isHandlingClick = false;
      return;
    }
    
    const input = container.querySelector('.js-qty__num');
    if (!input) {
      isHandlingClick = false;
      return;
    }
    
    // Get current value
    const currentValue = parseInt(input.value, 10) || 1;
    
    // Update the value based on which button was clicked
    if (button.classList.contains('js-qty__adjust--plus')) {
      input.value = currentValue + 1;
    } else if (button.classList.contains('js-qty__adjust--minus')) {
      input.value = Math.max(1, currentValue - 1);
    }
    
    // Trigger change event
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
    
    // Sync with Vue if available
    if (window.themeProductComponent) {
      window.themeProductComponent.quantity = parseInt(input.value, 10);
    }
    
    // Sync with other quantity inputs
    const allInputs = document.querySelectorAll('input.js-qty__num, [name="quantity"], [id="Quantity"], [id="BottomQuantity"]');
    allInputs.forEach(function(otherInput) {
      if (otherInput !== input) {
        otherInput.value = input.value;
      }
    });
    
    e.preventDefault();
    e.stopPropagation();
    
    // Reset the flag after a short delay to allow other events to complete
    setTimeout(function() {
      isHandlingClick = false;
    }, 100);
  }
  
  // Remove any existing event listeners by cloning buttons
  function resetQuantityButtons() {
    const allButtons = document.querySelectorAll('.js-qty__adjust');
    allButtons.forEach(function(button) {
      // Only process buttons that haven't been processed yet
      if (!button.hasAttribute('data-qty-processed')) {
        button.setAttribute('data-qty-processed', 'true');
        
        // Clone the button to remove existing event listeners
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
          button.parentNode.replaceChild(newButton, button);
        }
      }
    });
  }
  
  // Initial reset of buttons
  resetQuantityButtons();
  
  // Add global click handler for all quantity buttons
  document.addEventListener('click', function(e) {
    // Check if the click is on or within a quantity button
    if (e.target.classList.contains('js-qty__adjust') || 
        e.target.closest('.js-qty__adjust')) {
      handleQuantityButtonClick(e);
    }
  }, true);
  
  // Sync quantity inputs when they change
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('js-qty__num') || 
        e.target.id === 'Quantity' || 
        e.target.id === 'BottomQuantity' ||
        (e.target.name === 'quantity' && e.target.tagName === 'INPUT')) {
      
      const value = parseInt(e.target.value, 10) || 1;
      
      // Sync with Vue if available
      if (window.themeProductComponent) {
        window.themeProductComponent.quantity = value;
      }
      
      // Sync with other quantity inputs
      const allInputs = document.querySelectorAll('input.js-qty__num, [name="quantity"], [id="Quantity"], [id="BottomQuantity"]');
      allInputs.forEach(function(otherInput) {
        if (otherInput !== e.target) {
          otherInput.value = value;
        }
      });
    }
  }, true);
  
  // Also initialize on window load to catch any late-loading elements
  window.addEventListener('load', function() {
    resetQuantityButtons();
  });
}); 