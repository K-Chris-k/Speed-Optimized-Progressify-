// Safe Sync - 超保守的同步脚本，不影响任何其他功能
(function() {
  'use strict';
  
  if (!document.body.classList.contains('template-product')) return;
  
  let syncLock = false;
  
  // 纯数值同步，不触发事件
  function syncQuantityValues() {
    if (syncLock) return;
    syncLock = true;
    
    try {
      // 查找所有数量输入框
      const mainInputs = document.querySelectorAll('.js-qty.input-radius .js-qty__num, #Quantity, input[name="quantity-js"]');
      const bottomInputs = document.querySelectorAll('.js-qty.bottom-qty-container .js-qty__num, .bottom-purchase-dropdown__quantity-wrapper .js-qty__num');
      
      // 找到最新的值（假设是最后被修改的）
      let latestValue = null;
      let sourceInput = null;
      
      // 检查哪个输入框最近被修改
      const allInputs = [...mainInputs, ...bottomInputs];
      for (let input of allInputs) {
        if (input && input.dataset.lastChanged) {
          const timestamp = parseInt(input.dataset.lastChanged);
          if (!latestValue || timestamp > latestValue.timestamp) {
            latestValue = { value: input.value, timestamp: timestamp };
            sourceInput = input;
          }
        }
      }
      
      if (!latestValue) {
        // 如果没有lastChanged标记，使用主输入框的值
        const mainInput = mainInputs[0];
        if (mainInput) {
          latestValue = { value: mainInput.value };
          sourceInput = mainInput;
        }
      }
      
      if (latestValue) {
        // 同步到所有其他输入框
        allInputs.forEach(input => {
          if (input && input !== sourceInput && input.value !== latestValue.value) {
            input.value = latestValue.value;
          }
        });
      }
    } finally {
      setTimeout(() => {
        syncLock = false;
      }, 100);
    }
  }
  
  // 设置底部数量按钮
  function setupBottomButtons() {
    // 减少按钮
    const minusButtons = document.querySelectorAll('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--minus, .js-qty.bottom-qty-container .js-qty__adjust--minus');
    
    minusButtons.forEach(button => {
      if (button.hasAttribute('data-safe-handler-set')) return;
      button.setAttribute('data-safe-handler-set', 'true');
      
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const container = this.closest('.js-qty');
        const input = container ? container.querySelector('.js-qty__num') : null;
        if (!input) return;
        
        let value = parseInt(input.value, 10) || 1;
        value = Math.max(1, value - 1);
        input.value = value;
        input.dataset.lastChanged = Date.now();
        
        // 只做数值同步，不触发任何事件
        setTimeout(syncQuantityValues, 10);
      });
    });
    
    // 增加按钮
    const plusButtons = document.querySelectorAll('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--plus, .js-qty.bottom-qty-container .js-qty__adjust--plus');
    
    plusButtons.forEach(button => {
      if (button.hasAttribute('data-safe-handler-set')) return;
      button.setAttribute('data-safe-handler-set', 'true');
      
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const container = this.closest('.js-qty');
        const input = container ? container.querySelector('.js-qty__num') : null;
        if (!input) return;
        
        let value = parseInt(input.value, 10) || 1;
        value++;
        input.value = value;
        input.dataset.lastChanged = Date.now();
        
        // 只做数值同步，不触发任何事件
        setTimeout(syncQuantityValues, 10);
      });
    });
  }
  
  // 监听主输入框变化
  function setupMainInputSync() {
    const mainInputs = document.querySelectorAll('.js-qty.input-radius .js-qty__num, #Quantity, input[name="quantity-js"]');
    
    mainInputs.forEach(input => {
      if (input.hasAttribute('data-main-sync-set')) return;
      input.setAttribute('data-main-sync-set', 'true');
      
      input.addEventListener('input', function() {
        this.dataset.lastChanged = Date.now();
        setTimeout(syncQuantityValues, 10);
      });
      
      input.addEventListener('change', function() {
        this.dataset.lastChanged = Date.now();
        setTimeout(syncQuantityValues, 10);
      });
    });
  }
  
  // 监听底部输入框变化
  function setupBottomInputSync() {
    const bottomInputs = document.querySelectorAll('.js-qty.bottom-qty-container .js-qty__num, .bottom-purchase-dropdown__quantity-wrapper .js-qty__num');
    
    bottomInputs.forEach(input => {
      if (input.hasAttribute('data-bottom-sync-set')) return;
      input.setAttribute('data-bottom-sync-set', 'true');
      
      input.addEventListener('input', function() {
        this.dataset.lastChanged = Date.now();
        setTimeout(syncQuantityValues, 10);
      });
      
      input.addEventListener('change', function() {
        this.dataset.lastChanged = Date.now();
        setTimeout(syncQuantityValues, 10);
      });
    });
  }
  
  // 简化版变体同步（只做视觉同步，不触发事件）
  function setupVariantVisualSync() {
    // 底部dropdown → swatch视觉同步
    const dropdowns = document.querySelectorAll('.bottom-purchase-dropdown__select');
    
    dropdowns.forEach((dropdown, index) => {
      if (dropdown.hasAttribute('data-visual-sync-set')) return;
      dropdown.setAttribute('data-visual-sync-set', 'true');
      
      dropdown.addEventListener('change', function() {
        if (syncLock) return;
        
        const optionValue = this.value;
        const optionIndex = index;
        
        // 只更新视觉状态，不触发任何事件
        const swatchElements = document.querySelectorAll(`.swatch-element[data-option-index="${optionIndex}"]`);
        
        swatchElements.forEach(el => el.classList.remove('active'));
        
        for (let element of swatchElements) {
          const dataValue = element.getAttribute('data-value');
          const input = element.querySelector('input[type="radio"]');
          
          if (dataValue === optionValue || (input && input.value === optionValue)) {
            element.classList.add('active');
            if (input) input.checked = true;
            break;
          }
        }
        
        // 更新颜色名称显示
        const colorName = document.querySelector('[data-color-swatch-name]');
        if (colorName) {
          colorName.textContent = optionValue;
        }
      });
    });
    
    // swatch → 底部dropdown视觉同步
    const swatchInputs = document.querySelectorAll('.swatch-element input[type="radio"]');
    
    swatchInputs.forEach(input => {
      if (input.hasAttribute('data-visual-sync-set')) return;
      input.setAttribute('data-visual-sync-set', 'true');
      
      input.addEventListener('change', function() {
        if (!this.checked || syncLock) return;
        
        const optionMatch = this.name.match(/option-(\d+)/);
        if (!optionMatch) return;
        
        const optionIndex = parseInt(optionMatch[1]) - 1;
        const optionValue = this.value;
        
        // 只更新底部dropdown的值，不触发change事件
        const bottomDropdown = document.querySelector(`.bottom-purchase-dropdown__select[name="option-${optionIndex + 1}"]`);
        if (bottomDropdown && bottomDropdown.value !== optionValue) {
          syncLock = true;
          bottomDropdown.value = optionValue;
          setTimeout(() => {
            syncLock = false;
          }, 100);
        }
      });
    });
  }
  
  // 初始化
  function init() {
    setupBottomButtons();
    setupMainInputSync();
    setupBottomInputSync();
    setupVariantVisualSync();
  }
  
  // 延迟初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 1000);
    });
  } else {
    setTimeout(init, 1000);
  }
  
  // 监听新元素（但不重新初始化变体同步，避免冲突）
  const observer = new MutationObserver(function(mutations) {
    let hasNewQuantityElements = false;
    
    for (let mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.querySelector) {
            if (node.querySelector('.js-qty__adjust, .js-qty__num')) {
              hasNewQuantityElements = true;
              break;
            }
          }
        }
        if (hasNewQuantityElements) break;
      }
    }
    
    if (hasNewQuantityElements) {
      setTimeout(() => {
        setupBottomButtons();
        setupMainInputSync();
        setupBottomInputSync();
      }, 200);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();
