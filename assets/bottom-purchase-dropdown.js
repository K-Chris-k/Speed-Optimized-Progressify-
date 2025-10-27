// Bottom Purchase Dropdown Sync
document.addEventListener('DOMContentLoaded', function() {
  // Function to synchronize dropdown with other variant selectors
  function initBottomPurchaseDropdown() {
    const bottomDropdowns = document.querySelectorAll('.bottom-purchase-dropdown__select');
    
    if (!bottomDropdowns.length) return;
    
    bottomDropdowns.forEach(function(dropdown) {
      // Listen for changes on the bottom dropdown
      dropdown.addEventListener('change', function(e) {
        const optionName = this.getAttribute('name');
        const selectedValue = this.value;
        
        // Find and update the corresponding main product option selector - Fix XSS vulnerability
        if (optionName) {
          const mainSelectors = document.querySelectorAll('[name="' + CSS.escape(optionName) + '"]');
          mainSelectors.forEach(function(selector) {
            if (!selector.classList.contains('bottom-purchase-dropdown__select')) {
              // Set the value of the main selector to match the bottom dropdown
              selector.value = selectedValue;
              
              // Trigger change event to update the product variant
              const event = new Event('change', { bubbles: true });
              selector.dispatchEvent(event);
            }
          });
        }
      });
    });
    
    // Update bottom dropdown when main product options change
    const mainSelectors = document.querySelectorAll('.single-option-selector, .form-control');
    mainSelectors.forEach(function(selector) {
      selector.addEventListener('change', function(e) {
        const optionName = this.getAttribute('name');
        const selectedValue = this.value;
        
        // Find and update the corresponding bottom dropdown - Fix XSS vulnerability
        if (optionName) {
          const bottomDropdowns = document.querySelectorAll('.bottom-purchase-dropdown__select[name="' + CSS.escape(optionName) + '"]');
          bottomDropdowns.forEach(function(dropdown) {
            dropdown.value = selectedValue;
          });
        }
      });
    });
  }
  
  // 处理底部数量选择器
  function initQuantitySelector() {
    // 获取底部数量选择器
    const bottomQuantityInput = document.querySelector('#BottomQuantity');
    if (!bottomQuantityInput) {
      console.log('底部数量选择器未找到');
      return;
    }
    
    // 获取主数量输入框 - 尝试多种可能的选择器
    const mainQuantityInputs = [
      document.querySelector('form[action="/cart/add"] [name="quantity"]'),
      document.querySelector('#Quantity'),
      document.querySelector('input.js-qty__num:not(#BottomQuantity)'),
      document.querySelector('form#AddToCartForm [name="quantity"]')
    ].filter(Boolean);
    
    if (mainQuantityInputs.length === 0) {
      console.log('主数量输入框未找到');
      return;
    }
    
    const mainQuantityInput = mainQuantityInputs[0];
    console.log('找到主数量输入框:', mainQuantityInput);
    
    // 同步初始值 - 确保底部数量与主数量相同
    if (mainQuantityInput.value) {
      bottomQuantityInput.value = mainQuantityInput.value;
      console.log('初始化底部数量为:', bottomQuantityInput.value);
    } else {
      mainQuantityInput.value = bottomQuantityInput.value || 1;
      console.log('初始化主数量为:', mainQuantityInput.value);
    }
    
    // 底部数量增加按钮
    const increaseBtn = document.querySelector('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--plus');
    if (increaseBtn) {
      // 清除之前所有的事件监听器
      const newIncreaseBtn = increaseBtn.cloneNode(true);
      increaseBtn.parentNode.replaceChild(newIncreaseBtn, increaseBtn);
      
      // 添加新的事件处理
      newIncreaseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 获取当前数量
        const currentValue = parseInt(mainQuantityInput.value, 10) || 1;
        const newValue = currentValue + 1;
        
        console.log('增加按钮点击 - 当前值:', currentValue, '新值:', newValue);
        
        // 更新主输入框和底部输入框
        mainQuantityInput.value = newValue;
        bottomQuantityInput.value = newValue;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        mainQuantityInput.dispatchEvent(event);
      });
    }
    
    // 底部数量减少按钮
    const decreaseBtn = document.querySelector('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--minus');
    if (decreaseBtn) {
      // 清除之前所有的事件监听器
      const newDecreaseBtn = decreaseBtn.cloneNode(true);
      decreaseBtn.parentNode.replaceChild(newDecreaseBtn, decreaseBtn);
      
      // 添加新的事件处理
      newDecreaseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 获取当前数量
        const currentValue = parseInt(mainQuantityInput.value, 10) || 1;
        const newValue = Math.max(1, currentValue - 1);
        
        console.log('减少按钮点击 - 当前值:', currentValue, '新值:', newValue);
        
        // 更新主输入框和底部输入框
        mainQuantityInput.value = newValue;
        bottomQuantityInput.value = newValue;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        mainQuantityInput.dispatchEvent(event);
      });
    }
    
    // 监听底部数量输入框的变化
    bottomQuantityInput.addEventListener('change', function() {
      let value = parseInt(this.value, 10);
      if (isNaN(value) || value < 1) {
        value = 1;
        this.value = 1;
      }
      
      // 同步到主数量输入框
      mainQuantityInput.value = value;
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      mainQuantityInput.dispatchEvent(event);
      
      console.log('底部数量直接修改为:', value, '主数量已更新为:', mainQuantityInput.value);
    });
    
    // 监听主数量输入框的变化
    mainQuantityInput.addEventListener('change', function() {
      let value = parseInt(this.value, 10);
      if (isNaN(value) || value < 1) {
        value = 1;
        this.value = 1;
      }
      
      // 同步到底部数量输入框
      bottomQuantityInput.value = value;
      
      console.log('主数量输入框变化为:', value, '底部数量已更新为:', bottomQuantityInput.value);
    });
    
    // 尝试监听Vue数据模型变化
    if (window.themeProductComponent && window.themeProductComponent.$watch) {
      try {
        window.themeProductComponent.$watch('quantity', function(newVal) {
          console.log('Vue数量变化为:', newVal);
          // 同步到底部数量输入框
          bottomQuantityInput.value = newVal;
          // 同步到主数量输入框
          mainQuantityInput.value = newVal;
        });
      } catch (e) {
        console.log('无法监听Vue数量变化', e);
      }
    }
  }
  
  // Handle scroll behavior for bottom purchase info
  function initBottomPurchaseScroll() {
    const bottomPurchaseInfo = document.querySelector('.bottom-purchase-info');
    if (!bottomPurchaseInfo) {
      console.log('底部购买信息元素未找到');
      return;
    }
    
    // 确保 wrapper-padded 类被移除，防止样式冲突
    bottomPurchaseInfo.classList.remove('wrapper-padded');
    
    // 设置底部按钮点击事件关联到主按钮
    const bottomButton = bottomPurchaseInfo.querySelector('#AddToCart');
    
    // 查找主表单和添加到购物车按钮（两种可能的方式）
    const mainForm = document.querySelector('form#AddToCartForm') || document.querySelector('form[action="/cart/add"]');
    const mainAddToCartBtn = document.querySelector('form[action="/cart/add"] [type="submit"]:not([form])');
    
    if (bottomButton) {
      // 移除之前的事件监听器
      const newBottomButton = bottomButton.cloneNode(true);
      bottomButton.parentNode.replaceChild(newBottomButton, bottomButton);
      
      newBottomButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('底部购买按钮被点击');
        
        // 获取底部数量
        const bottomQuantityInput = document.querySelector('#BottomQuantity');
        const quantity = bottomQuantityInput ? parseInt(bottomQuantityInput.value, 10) || 1 : 1;
        console.log('使用数量:', quantity);
        
        // 获取所有可能的主数量输入框
        const mainQuantityInputs = [
          document.querySelector('form[action="/cart/add"] [name="quantity"]'),
          document.querySelector('#Quantity'),
          document.querySelector('input.js-qty__num:not(#BottomQuantity)'),
          document.querySelector('form#AddToCartForm [name="quantity"]')
        ].filter(Boolean);
        
        // 更新所有找到的主数量输入框
        mainQuantityInputs.forEach(function(input) {
          input.value = quantity;
          console.log('更新数量输入框:', input, '值:', quantity);
        });
        
        // 记录是否成功添加到购物车
        let addedToCart = false;
        
        // 尝试多种方式提交表单 - 修改为尝试所有可能的方法
        // 1. 尝试使用主添加到购物车按钮
        if (mainAddToCartBtn) {
          console.log('尝试使用主添加到购物车按钮');
          
          // 确保再次检查并更新主表单中的数量
          const closestForm = mainAddToCartBtn.closest('form');
          if (closestForm) {
            const quantityInput = closestForm.querySelector('[name="quantity"]');
            if (quantityInput) {
              quantityInput.value = quantity;
              console.log('更新主按钮表单中的数量:', quantity);
            }
          }
          
          mainAddToCartBtn.click();
          addedToCart = true;
        }
        
        // 2. 尝试使用主表单提交
        if (mainForm) {
          console.log('尝试使用主表单提交');
          
          // 先更新主表单中的数量
          const mainQuantityInput = mainForm.querySelector('[name="quantity"]');
          if (mainQuantityInput) {
            mainQuantityInput.value = quantity;
            console.log('更新主表单中的数量:', quantity);
          }
          
          // 创建提交事件
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          mainForm.dispatchEvent(submitEvent);
          addedToCart = true;
        }
        
        // 3. 尝试通过Vue实例触发添加到购物车
        if (window.themeProductComponent) {
          console.log('尝试通过Vue实例触发添加到购物车');
          
          // 更新Vue实例中的数量
          if (window.themeProductComponent.quantity !== undefined) {
            window.themeProductComponent.quantity = quantity;
            console.log('更新Vue实例中的数量:', quantity);
          }
          
          if (typeof window.themeProductComponent.onAddToCart === 'function') {
            const fakeEvent = new Event('submit', { bubbles: true, cancelable: true });
            window.themeProductComponent.onAddToCart(fakeEvent);
            addedToCart = true;
          } else {
            console.log('Vue实例中没有onAddToCart方法');
          }
        }
        
        // 4. 最后的尝试：直接提交包含变体ID的表单
        if (!addedToCart) {
          const variantId = document.querySelector('input[name="id"]');
          if (variantId) {
            console.log('直接提交包含变体ID的表单，数量:', quantity);
            // 创建并提交临时表单
            const tempForm = document.createElement('form');
            tempForm.method = 'post';
            tempForm.action = '/cart/add';
            
            const idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'id';
            idInput.value = variantId.value;
            
            const quantityInput = document.createElement('input');
            quantityInput.type = 'hidden';
            quantityInput.name = 'quantity';
            quantityInput.value = quantity.toString();
            
            tempForm.appendChild(idInput);
            tempForm.appendChild(quantityInput);
            document.body.appendChild(tempForm);
            tempForm.submit();
            document.body.removeChild(tempForm);
            addedToCart = true;
          } else {
            console.error('无法找到变体ID，无法添加到购物车');
          }
        }
      });
    } else {
      console.log('底部购买按钮未找到');
    }
    
    // 修改显示逻辑 - 始终显示底部购买信息，不依赖滚动
    bottomPurchaseInfo.classList.add('is-visible');
    
    // 可选：保留滚动逻辑作为备份
    let lastScrollTop = 0;
    const scrollThreshold = 10; // 降低滚动阈值到10px，更容易触发
    
    // 移除之前可能存在的事件监听器
    window.removeEventListener('scroll', handleScroll);
    
    function handleScroll() {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 确保在滚动时保持可见
      if (currentScrollTop > scrollThreshold) {
        if (!bottomPurchaseInfo.classList.contains('is-visible')) {
          bottomPurchaseInfo.classList.add('is-visible');
        }
      }
      
      lastScrollTop = currentScrollTop;
    }
    
    window.addEventListener('scroll', handleScroll);
    
    // 同步价格
    function syncPrice() {
      const mainPrice = document.querySelector('#ProductPrice .money');
      const bottomPrice = document.querySelector('#BottomProductPrice .money');
      
      if (mainPrice && bottomPrice) {
        bottomPrice.textContent = mainPrice.textContent;
      }
    }
    
    // 初始同步价格
    syncPrice();
    
    // 监听价格变化
    let priceObserver;
    if (window.MutationObserver) {
      priceObserver = new MutationObserver(function(mutations) {
        syncPrice();
      });
      
      const mainPriceElement = document.querySelector('#ProductPrice');
      if (mainPriceElement) {
        priceObserver.observe(mainPriceElement, { 
          childList: true, 
          subtree: true,
          characterData: true
        });
      }
    }
    
    // 保存观察者以便后续清理
    if (priceObserver) {
      bottomPurchaseInfo.priceObserver = priceObserver;
    }
  }
  
  // 清理函数，用于在重新初始化前清除旧的事件监听器和观察者
  function cleanup() {
    const bottomPurchaseInfo = document.querySelector('.bottom-purchase-info');
    if (bottomPurchaseInfo && bottomPurchaseInfo.priceObserver) {
      bottomPurchaseInfo.priceObserver.disconnect();
      delete bottomPurchaseInfo.priceObserver;
    }
  }
  
  // 添加调试日志
  console.log('底部购买信息脚本已加载');
  
  // 在初始化之前先清理
  cleanup();
  
  // Initialize the dropdown sync
  initBottomPurchaseDropdown();
  
  // Initialize quantity selector
  initQuantitySelector();
  
  // Initialize the scroll behavior
  initBottomPurchaseScroll();
  
  // 确保在DOM完全加载后重试一次初始化
  setTimeout(function() {
    console.log('延迟后重新尝试初始化底部购买信息');
    cleanup(); // 先清理
    initBottomPurchaseScroll();
    initQuantitySelector();
  }, 1000);
  
  // Re-initialize on page changes (for SPAs) - 修复事件监听器
  document.addEventListener('page:load', function() {
    console.log('页面加载，重新初始化底部购买信息');
    cleanup();
    initBottomPurchaseDropdown();
    initBottomPurchaseScroll();
    initQuantitySelector();
  });
  
  document.addEventListener('page:change', function() {
    console.log('页面变更，重新初始化底部购买信息');
    cleanup();
    initBottomPurchaseDropdown();
    initBottomPurchaseScroll();
    initQuantitySelector();
  });
}); 