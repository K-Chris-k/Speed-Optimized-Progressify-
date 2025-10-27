// Quantity Sync Fix
document.addEventListener('DOMContentLoaded', function() {
  // Track initialization to prevent multiple initializations
  let lastInitTime = 0;
  const initCooldown = 500; // Minimum time between initializations in ms
  
  // Function to initialize quantity synchronization
  function initQuantitySync() {
    // Prevent multiple initializations in quick succession
    const now = Date.now();
    if (now - lastInitTime < initCooldown) {
      return;
    }
    lastInitTime = now;
    
    // Find all quantity inputs on the page
    const allQuantityInputs = document.querySelectorAll('input.js-qty__num, [name="quantity"], [id="Quantity"], [id="BottomQuantity"]');
    if (allQuantityInputs.length === 0) {
      return;
    }
    
    // Find the bottom quantity input
    const bottomQuantityInput = document.querySelector('#BottomQuantity');
    if (!bottomQuantityInput) {
      return;
    }
    
    // Find the main quantity input (try different possible selectors)
    const mainQuantityInputs = Array.from(allQuantityInputs).filter(input => 
      input.id !== 'BottomQuantity' && 
      !input.closest('.bottom-purchase-dropdown__quantity-wrapper')
    );
    
    if (mainQuantityInputs.length === 0) {
      return;
    }
    
    const mainQuantityInput = mainQuantityInputs[0];
    
    // Initialize with a consistent value
    const initialValue = mainQuantityInput.value || bottomQuantityInput.value || '1';
    
    // Set all quantity inputs to the same initial value
    allQuantityInputs.forEach(input => {
      input.value = initialValue;
    });
    
    // Find all quantity adjustment buttons
    const allIncreaseButtons = document.querySelectorAll('.js-qty__adjust--plus');
    const allDecreaseButtons = document.querySelectorAll('.js-qty__adjust--minus');
    
    // Function to update all quantity inputs and trigger change events
    function updateAllQuantities(newValue) {
      // Ensure value is at least 1
      newValue = Math.max(1, parseInt(newValue, 10) || 1);
      
      // Update Vue quantity if available
      if (window.themeProductComponent) {
        try {
          window.themeProductComponent.quantity = newValue;
        } catch (e) {}
      }
      
      // Update all inputs
      allQuantityInputs.forEach(input => {
        if (input.value !== String(newValue)) {
          input.value = newValue;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
        }
      });
    }
    
    // Direct click handlers for bottom quantity buttons
    const bottomIncreaseBtn = document.querySelector('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--plus');
    const bottomDecreaseBtn = document.querySelector('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--minus');
    
    if (bottomIncreaseBtn) {
      bottomIncreaseBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const currentValue = parseInt(bottomQuantityInput.value, 10) || 1;
        updateAllQuantities(currentValue + 1);
        return false;
      };
    }
    
    if (bottomDecreaseBtn) {
      bottomDecreaseBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const currentValue = parseInt(bottomQuantityInput.value, 10) || 2;
        updateAllQuantities(Math.max(1, currentValue - 1));
        return false;
      };
    }
    
    // Sync when any quantity input changes
    allQuantityInputs.forEach(input => {
      input.onchange = function() {
        const value = parseInt(this.value, 10) || 1;
        updateAllQuantities(value);
      };
    });
    
    // Try to hook into Vue.js if available
    if (window.themeProductComponent && !window._vueQtyWatcherAdded) {
      try {
        window.themeProductComponent.$watch('quantity', function(newVal) {
          updateAllQuantities(newVal);
        });
        window._vueQtyWatcherAdded = true;
      } catch (e) {}
    }
  }
  
  // Initialize quantity sync
  initQuantitySync();
  
  // Also initialize on window load
  window.addEventListener('load', function() {
    setTimeout(initQuantitySync, 500);
  });
  
  // Add direct click handlers to quantity buttons
  document.addEventListener('click', function(e) {
    // Check if clicked element is a quantity button
    if (e.target.classList.contains('js-qty__adjust--plus') || 
        e.target.closest('.js-qty__adjust--plus')) {
      
      const button = e.target.classList.contains('js-qty__adjust--plus') ? 
                     e.target : e.target.closest('.js-qty__adjust--plus');
      
      // Find the quantity input
      const container = button.closest('.js-qty');
      if (!container) return;
      
      const input = container.querySelector('.js-qty__num');
      if (!input) return;
      
      // Update the quantity
      const currentValue = parseInt(input.value, 10) || 1;
      input.value = currentValue + 1;
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
      
      // Reinitialize to sync all inputs
      setTimeout(initQuantitySync, 10);
      
    } else if (e.target.classList.contains('js-qty__adjust--minus') || 
               e.target.closest('.js-qty__adjust--minus')) {
      
      const button = e.target.classList.contains('js-qty__adjust--minus') ? 
                     e.target : e.target.closest('.js-qty__adjust--minus');
      
      // Find the quantity input
      const container = button.closest('.js-qty');
      if (!container) return;
      
      const input = container.querySelector('.js-qty__num');
      if (!input) return;
      
      // Update the quantity
      const currentValue = parseInt(input.value, 10) || 2;
      input.value = Math.max(1, currentValue - 1);
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
      
      // Reinitialize to sync all inputs
      setTimeout(initQuantitySync, 10);
    }
  }, true);
}); 