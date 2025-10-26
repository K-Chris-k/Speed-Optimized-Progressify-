// Quantity Buttons Fix
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否已经有主题内置的quantity-input组件
  const hasNativeQuantityComponent = document.querySelector('quantity-input');
  if (hasNativeQuantityComponent) {
    // 主题已经有内置的quantity组件，不需要我们的修复
    return;
  }
  
  // Create a flag to track if we're currently processing a quantity change
  // This prevents multiple handlers from firing for the same click
  let isProcessingQuantityChange = false;
  
  // Function to completely remove all quantity button handlers
  function removeAllQuantityButtonHandlers() {
    console.log('Removing all quantity button handlers');
    
    // Clone and replace all quantity buttons to remove any attached event listeners
    document.querySelectorAll('.js-qty__adjust--minus, .js-qty__adjust--plus').forEach(button => {
      const clone = button.cloneNode(true);
      if (button.parentNode) {
        button.parentNode.replaceChild(clone, button);
      }
    });
  }
  
  // First, remove all existing handlers
  removeAllQuantityButtonHandlers();
  
  // Function to set up our single source of truth for quantity buttons
  function setupQuantityButtons() {
    console.log('Setting up quantity buttons with single handlers');
    
    // Get references to the main and bottom quantity inputs
    function findQuantityInputs() {
      const mainInput = document.querySelector('.js-qty.input-radius .js-qty__num') || 
                       document.querySelector('input[aria-label="quantity"]') ||
                       document.querySelector('#Quantity');
      const bottomInput = document.querySelector('.bottom-qty-container .js-qty__num') || 
                         document.querySelector('.bottom-purchase-dropdown__quantity-wrapper .js-qty__num') ||
                         document.querySelector('#BottomQuantity');
      return { mainInput, bottomInput };
    }
    
    const { mainInput, bottomInput } = findQuantityInputs();
    
    // Function to handle quantity changes
    function handleQuantityChange(direction, sourceButton) {
      // If we're already processing a change, don't process another one
      if (isProcessingQuantityChange) {
        console.log('Already processing a quantity change, ignoring');
        return;
      }
      
      // Set the flag to prevent multiple handlers
      isProcessingQuantityChange = true;
      
      // 立即设置保护标志，防止其他脚本干扰
      document.body.setAttribute('data-quantity-changing', 'true');
      document.body.setAttribute('data-quantity-button-clicked', 'true');
      
      try {
        // 动态获取所有数量输入框
        const { mainInput: currentMainInput, bottomInput: currentBottomInput } = findQuantityInputs();
        
        // Determine which input is associated with the clicked button
        const container = sourceButton.closest('.js-qty');
        if (!container) {
          console.log('No container found for button');
          return;
        }
        
        const input = container.querySelector('.js-qty__num');
        if (!input) {
          console.log('No input found in container');
          return;
        }
        
        // Get the current value
        let value = parseInt(input.value, 10) || 1;
        
        // Adjust the value based on direction
        if (direction === 'decrease') {
          value = Math.max(1, value - 1);
        } else {
          value++;
        }
        
        console.log(`${direction === 'decrease' ? 'Decreasing' : 'Increasing'} quantity to ${value}`);
        
        // Update all quantity inputs
        const allInputs = [input, currentMainInput, currentBottomInput].filter(Boolean);
        allInputs.forEach(inp => {
          if (inp && inp !== input) {
            inp.value = value;
          }
        });
        
        // 也更新点击的输入框
        input.value = value;
        
        // Dispatch change events
        if (input) {
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
        }
        
        // Emit eventBus event if available
        if (window.eventBus && typeof window.eventBus.emit === 'function') {
          const sectionId = container.closest('[data-section-id]')?.getAttribute('data-section-id') || '';
          window.eventBus.emit('qty:change', { value: value, sectionId: sectionId });
        }
        
        // 防止数量变化触发变体价格更新为Unavailable
        console.log('数量已更新，保持保护标志');
      } catch (error) {
        console.error('Error handling quantity change:', error);
      } finally {
        // Reset the flag after a longer delay to prevent interference
        setTimeout(() => {
          isProcessingQuantityChange = false;
          // 清理所有保护标志
          document.body.removeAttribute('data-quantity-changing');
          document.body.removeAttribute('data-quantity-button-clicked');
          console.log('数量变化处理完成，清理保护标志');
        }, 1000); // 延长到1秒以确保所有相关事件完成
      }
    }
    
    // Set up click handlers for all minus buttons
    document.querySelectorAll('.js-qty__adjust--minus').forEach(button => {
      // 检查是否已经设置过事件监听器
      if (button.hasAttribute('data-qty-listener-set')) {
        return;
      }
      button.setAttribute('data-qty-listener-set', 'true');
      
      // Add our single handler
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('减少按钮被点击');
        
        // 立即设置保护标志
        document.body.setAttribute('data-quantity-changing', 'true');
        document.body.setAttribute('data-quantity-button-clicked', 'true');
        
        handleQuantityChange('decrease', this);
      });
    });
    
    // Set up click handlers for all plus buttons
    document.querySelectorAll('.js-qty__adjust--plus').forEach(button => {
      // 检查是否已经设置过事件监听器
      if (button.hasAttribute('data-qty-listener-set')) {
        return;
      }
      button.setAttribute('data-qty-listener-set', 'true');
      
      // Add our single handler
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('增加按钮被点击');
        
        // 立即设置保护标志
        document.body.setAttribute('data-quantity-changing', 'true');
        document.body.setAttribute('data-quantity-button-clicked', 'true');
        
        handleQuantityChange('increase', this);
      });
    });
    
    // Sync inputs on page load
    if (mainInput && bottomInput && mainInput.value) {
      bottomInput.value = mainInput.value;
    }
  }
  
  // Set up the quantity buttons after a short delay to ensure DOM is ready
  setTimeout(function() {
    removeAllQuantityButtonHandlers();
    setupQuantityButtons();
    
    // 调试：显示找到的按钮数量
    const minusButtons = document.querySelectorAll('.js-qty__adjust--minus');
    const plusButtons = document.querySelectorAll('.js-qty__adjust--plus');
    console.log(`找到 ${minusButtons.length} 个减少按钮和 ${plusButtons.length} 个增加按钮`);
  }, 500);
  
  // Set up a MutationObserver to handle dynamically added buttons
  const observer = new MutationObserver(function(mutations) {
    let shouldReinit = false;
    
    // Check if any quantity buttons were added
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        for (const node of addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.querySelector && (
              node.querySelector('.js-qty__adjust--minus') || 
              node.querySelector('.js-qty__adjust--plus')
            )) {
              shouldReinit = true;
              break;
            }
          }
        }
        
        if (shouldReinit) break;
      }
    }
    
    if (shouldReinit) {
      console.log('New quantity buttons detected, reinitializing');
      setTimeout(setupQuantityButtons, 100);
    }
  });
  
  // Start observing the document body
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Additional safety check - reinitialize after a longer delay
  setTimeout(function() {
    setupQuantityButtons();
  }, 2000);
  
  console.log('Quantity buttons fix initialized');
});