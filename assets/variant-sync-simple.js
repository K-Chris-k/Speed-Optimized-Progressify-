// Simple Variant Sync - 简单可靠的变体同步
(function() {
  'use strict';
  
  // 只在产品页面执行
  if (!document.body.classList.contains('template-product')) {
    return;
  }
  
  let isProcessing = false;
  
  // 安全的元素查找
  function safeQuery(selector) {
    try {
      return document.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  
  function safeQueryAll(selector) {
    try {
      return document.querySelectorAll(selector);
    } catch (e) {
      return [];
    }
  }
  
  // 获取产品数据
  function getProductData() {
    const productElement = safeQuery('[data-product-json]');
    if (productElement) {
      try {
        return JSON.parse(productElement.textContent);
      } catch(e) {
        return null;
      }
    }
    return null;
  }
  
  // 从底部dropdown同步到swatch
  function syncFromBottomToSwatch(optionIndex, optionValue) {
    if (isProcessing) return;
    
    // 查找对应的swatch元素
    const swatchElements = safeQueryAll(`.swatch-element[data-option-index="${optionIndex}"]`);
    if (!swatchElements.length) return;
    
    // 查找匹配的swatch
    let targetSwatch = null;
    
    for (let element of swatchElements) {
      const dataValue = element.getAttribute('data-value');
      const input = element.querySelector('input[type="radio"]');
      
      if (dataValue === optionValue || (input && input.value === optionValue)) {
        targetSwatch = element;
        break;
      }
    }
    
    if (!targetSwatch) return;
    
    isProcessing = true;
    
    try {
      // 移除所有active状态
      swatchElements.forEach(el => {
        el.classList.remove('active');
        const inp = el.querySelector('input[type="radio"]');
        if (inp) inp.checked = false;
      });
      
      // 设置目标为active
      targetSwatch.classList.add('active');
      const input = targetSwatch.querySelector('input[type="radio"]');
      if (input) {
        input.checked = true;
      }
      
      // 更新颜色名称显示
      const colorName = safeQuery('[data-color-swatch-name]');
      if (colorName) {
        colorName.textContent = optionValue;
      }
      
      // 发送自定义事件通知其他组件
      const productData = getProductData();
      if (productData) {
        const event = new CustomEvent('bottom-purchase:variant-change', {
          bubbles: true,
          detail: {
            productId: productData.id,
            optionIndex: optionIndex,
            optionValue: optionValue
          }
        });
        document.dispatchEvent(event);
      }
      
    } finally {
      setTimeout(() => {
        isProcessing = false;
      }, 200);
    }
  }
  
  // 从swatch同步到底部dropdown
  function syncFromSwatchToBottom(optionIndex, optionValue) {
    if (isProcessing) return;
    
    const bottomDropdown = safeQuery(`.bottom-purchase-dropdown__select[name="option-${optionIndex + 1}"]`);
    if (!bottomDropdown || bottomDropdown.value === optionValue) return;
    
    isProcessing = true;
    
    try {
      bottomDropdown.value = optionValue;
    } finally {
      setTimeout(() => {
        isProcessing = false;
      }, 100);
    }
  }
  
  // 数量同步函数
  function syncQuantityFromMainToBottom(newValue) {
    if (isProcessing) return;
    
    const bottomQuantityInputs = safeQueryAll('.js-qty.bottom-qty-container .js-qty__num, .bottom-purchase-dropdown__quantity-wrapper .js-qty__num');
    
    bottomQuantityInputs.forEach(input => {
      if (input && input.value !== newValue) {
        input.value = newValue;
      }
    });
  }
  
  function syncQuantityFromBottomToMain(newValue) {
    if (isProcessing) return;
    
    const mainQuantityInputs = safeQueryAll('.js-qty.input-radius .js-qty__num, input[name="quantity-js"], #Quantity');
    
    mainQuantityInputs.forEach(input => {
      if (input && input.value !== newValue) {
        input.value = newValue;
        
        // 触发input事件通知其他组件
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
      }
    });
  }
  
  // 设置底部dropdown监听
  function setupBottomDropdowns() {
    const dropdowns = safeQueryAll('.bottom-purchase-dropdown__select');
    
    dropdowns.forEach((dropdown, index) => {
      if (!dropdown || dropdown.hasAttribute('data-simple-sync-set')) return;
      
      dropdown.setAttribute('data-simple-sync-set', 'true');
      
      dropdown.addEventListener('change', function(e) {
        if (isProcessing) return;
        
        // 跳过数量相关事件
        if (e.target.classList.contains('js-qty__num') || 
            e.target.closest('.js-qty')) return;
        
        const optionValue = this.value;
        const optionIndex = index;
        
        // 同步到swatch
        syncFromBottomToSwatch(optionIndex, optionValue);
      });
    });
  }
  
  // 设置swatch监听
  function setupSwatchSync() {
    const swatchInputs = safeQueryAll('.swatch-element input[type="radio"]');
    
    swatchInputs.forEach(input => {
      if (!input || input.hasAttribute('data-simple-sync-set')) return;
      
      input.setAttribute('data-simple-sync-set', 'true');
      
      input.addEventListener('change', function() {
        if (!this.checked || isProcessing) return;
        
        const optionMatch = this.name.match(/option-(\d+)/);
        if (!optionMatch) return;
        
        const optionIndex = parseInt(optionMatch[1]) - 1;
        const optionValue = this.value;
        
        // 同步到底部dropdown
        syncFromSwatchToBottom(optionIndex, optionValue);
      });
    });
  }
  
  // 设置数量同步监听
  function setupQuantitySync() {
    // 监听主数量选择器变化
    const mainQuantityInputs = safeQueryAll('.js-qty.input-radius .js-qty__num, input[name="quantity-js"], #Quantity');
    
    mainQuantityInputs.forEach(input => {
      if (!input || input.hasAttribute('data-qty-sync-set')) return;
      
      input.setAttribute('data-qty-sync-set', 'true');
      
      // 监听input和change事件
      ['input', 'change'].forEach(eventType => {
        input.addEventListener(eventType, function() {
          if (isProcessing) return;
          
          isProcessing = true;
          
          try {
            const newValue = this.value;
            syncQuantityFromMainToBottom(newValue);
          } finally {
            setTimeout(() => {
              isProcessing = false;
            }, 50);
          }
        });
      });
    });
    
    // 设置底部数量按钮的点击事件
    setupBottomQuantityButtons();
    
    // 监听底部数量选择器变化
    const bottomQuantityInputs = safeQueryAll('.js-qty.bottom-qty-container .js-qty__num, .bottom-purchase-dropdown__quantity-wrapper .js-qty__num');
    
    bottomQuantityInputs.forEach(input => {
      if (!input || input.hasAttribute('data-qty-sync-set')) return;
      
      input.setAttribute('data-qty-sync-set', 'true');
      
      // 监听input和change事件
      ['input', 'change'].forEach(eventType => {
        input.addEventListener(eventType, function() {
          if (isProcessing) return;
          
          isProcessing = true;
          
          try {
            const newValue = this.value;
            syncQuantityFromBottomToMain(newValue);
          } finally {
            setTimeout(() => {
              isProcessing = false;
            }, 50);
          }
        });
      });
    });
    
    // 监听eventBus的数量变化事件
    if (window.eventBus && typeof window.eventBus.on === 'function') {
      window.eventBus.on('qty:change', function(payload) {
        if (!payload || isProcessing) return;
        
        isProcessing = true;
        
        try {
          // 同步所有数量输入框
          const allQuantityInputs = safeQueryAll('.js-qty__num, input[name="quantity-js"], #Quantity');
          allQuantityInputs.forEach(input => {
            if (input && input.value !== payload.value) {
              input.value = payload.value;
            }
          });
        } finally {
          setTimeout(() => {
            isProcessing = false;
          }, 50);
        }
      });
    }
  }
  
  // 设置底部数量按钮
  function setupBottomQuantityButtons() {
    // 查找所有底部数量按钮
    const bottomMinusButtons = safeQueryAll('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--minus, .js-qty.bottom-qty-container .js-qty__adjust--minus');
    const bottomPlusButtons = safeQueryAll('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--plus, .js-qty.bottom-qty-container .js-qty__adjust--plus');
    
    // 处理减少按钮
    bottomMinusButtons.forEach(button => {
      if (!button || button.hasAttribute('data-bottom-qty-set')) return;
      
      button.setAttribute('data-bottom-qty-set', 'true');
      
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isProcessing) return;
        
        // 查找对应的输入框
        const container = this.closest('.js-qty');
        const input = container ? container.querySelector('.js-qty__num') : null;
        
        if (!input) return;
        
        isProcessing = true;
        
        try {
          let value = parseInt(input.value, 10) || 1;
          value = Math.max(1, value - 1);
          input.value = value;
          
          // 同步到主区域
          syncQuantityFromBottomToMain(value);
          
          // 触发eventBus事件（如果存在）
          if (window.eventBus && typeof window.eventBus.emit === 'function') {
            window.eventBus.emit('qty:change', { value: value, source: 'bottom' });
          }
        } finally {
          setTimeout(() => {
            isProcessing = false;
          }, 100);
        }
      });
    });
    
    // 处理增加按钮
    bottomPlusButtons.forEach(button => {
      if (!button || button.hasAttribute('data-bottom-qty-set')) return;
      
      button.setAttribute('data-bottom-qty-set', 'true');
      
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isProcessing) return;
        
        // 查找对应的输入框
        const container = this.closest('.js-qty');
        const input = container ? container.querySelector('.js-qty__num') : null;
        
        if (!input) return;
        
        isProcessing = true;
        
        try {
          let value = parseInt(input.value, 10) || 1;
          value++;
          input.value = value;
          
          // 同步到主区域
          syncQuantityFromBottomToMain(value);
          
          // 触发eventBus事件（如果存在）
          if (window.eventBus && typeof window.eventBus.emit === 'function') {
            window.eventBus.emit('qty:change', { value: value, source: 'bottom' });
          }
        } finally {
          setTimeout(() => {
            isProcessing = false;
          }, 100);
        }
      });
    });
  }
  
  // 初始化函数
  function init() {
    setupBottomDropdowns();
    setupSwatchSync();
    setupQuantitySync();
  }
  
  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 1500); // 延迟更长时间
    });
  } else {
    setTimeout(init, 1500);
  }
  
  // 监听新元素
  try {
    const observer = new MutationObserver(function(mutations) {
      let hasNewElements = false;
      
      for (let mutation of mutations) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              if (node.classList && 
                  (node.classList.contains('bottom-purchase-dropdown__select') ||
                   node.classList.contains('swatch-element'))) {
                hasNewElements = true;
                break;
              }
              if (node.querySelector) {
                const hasDropdown = node.querySelector('.bottom-purchase-dropdown__select');
                const hasSwatch = node.querySelector('.swatch-element');
                if (hasDropdown || hasSwatch) {
                  hasNewElements = true;
                  break;
                }
              }
            }
          }
          if (hasNewElements) break;
        }
      }
      
      if (hasNewElements) {
        setTimeout(init, 200);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (e) {
    // Observer setup failed, continue without it
  }
  
})();
