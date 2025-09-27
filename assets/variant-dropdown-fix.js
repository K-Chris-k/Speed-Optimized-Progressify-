// 变体选择器修复脚本 - 解决底部购买栏与swatch同步问题
document.addEventListener('DOMContentLoaded', function() {
  // 只在产品页面执行
  if (!document.body.classList.contains('template-product') && 
      !window.location.pathname.includes('/products/')) {
    return;
  }
  
  console.log('初始化变体下拉框修复...');
  
  let isInitialized = false;
  let initTimeout = null;
  
  // 延迟执行以确保所有元素都已加载
  setTimeout(function() {
    initializeVariantFix();
  }, 1000);
  
  // 优化的MutationObserver - 只监听特定变化，避免过度触发
  const observer = new MutationObserver(function(mutations) {
    let shouldReinitialize = false;
    
    mutations.forEach(function(mutation) {
      // 只在添加了相关元素时才重新初始化
      if (mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1 && // Element node
              (node.classList?.contains('bottom-purchase-dropdown__select') ||
               node.classList?.contains('swatch-element') ||
               node.querySelector?.('.bottom-purchase-dropdown__select, .swatch-element'))) {
            shouldReinitialize = true;
            break;
          }
        }
      }
    });
    
    if (shouldReinitialize && !initTimeout) {
      initTimeout = setTimeout(() => {
        initializeVariantFix();
        initTimeout = null;
      }, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  function initializeVariantFix() {
    // 防止重复初始化
    if (isInitialized) {
      return;
    }
    
    // 获取Vue实例（如果存在）
    let vueInstance = null;
    try {
      const vueApp = document.querySelector('wetheme-product-form');
      if (vueApp && vueApp.__vue__) {
        vueInstance = vueApp.__vue__;
        console.log('找到Vue实例:', vueInstance);
      }
    } catch (e) {
      console.error('获取Vue实例失败:', e);
    }
    
    // 1. 修复底部dropdown选择器
    setupBottomDropdowns(vueInstance);
    
    // 2. 修复swatch与dropdown的同步
    setupSwatchSync(vueInstance);
    
    // 3. 修复价格显示
    setupPriceDisplay(vueInstance);
    
    isInitialized = true;
  }
  
  // 底部dropdown选择器设置
  function setupBottomDropdowns(vueInstance) {
    const dropdowns = document.querySelectorAll('.bottom-purchase-dropdown__select');
    console.log('找到底部下拉框数量:', dropdowns.length);
    
    if (!dropdowns.length) {
      // 如果没有找到，尝试等待一下再查找
      setTimeout(() => {
        const retryDropdowns = document.querySelectorAll('.bottom-purchase-dropdown__select');
        if (retryDropdowns.length > 0) {
          console.log('重试后找到底部下拉框:', retryDropdowns.length);
          setupBottomDropdownEvents(retryDropdowns, vueInstance);
        }
      }, 500);
      return;
    }
    
    setupBottomDropdownEvents(dropdowns, vueInstance);
  }
  
  function setupBottomDropdownEvents(dropdowns, vueInstance) {
    dropdowns.forEach((dropdown, index) => {
      // 检查是否已经设置过事件监听器
      if (dropdown.hasAttribute('data-variant-listener-set')) {
        return;
      }
      
      console.log('设置下拉框事件监听器:', dropdown);
      dropdown.setAttribute('data-variant-listener-set', 'true');
      
      // 添加change事件监听器
      dropdown.addEventListener('change', function(e) {
        // 确保这不是数量按钮触发的事件
        if (e.target.classList.contains('js-qty__num') || 
            e.target.closest('.js-qty')) {
          return;
        }
        
        console.log('下拉框值改变:', this.value);
        const optionValue = this.value;
        const optionIndex = index;
        
        // 1. 更新Vue实例（如果存在）
        if (vueInstance) {
          const optionKey = 'option' + (optionIndex + 1);
          if (vueInstance.hasOwnProperty(optionKey)) {
            console.log('更新Vue实例:', optionKey, '=', optionValue);
            vueInstance[optionKey] = optionValue;
            
            // 强制Vue更新
            if (vueInstance.$forceUpdate) {
              vueInstance.$forceUpdate();
            }
          }
        }
        
        // 2. 同步到swatch
        syncToSwatch(optionIndex, optionValue);
        
        // 3. 同步到其他dropdown
        syncToMainDropdown(optionIndex, optionValue);
        
        // 4. 只更新按钮状态，不更新价格
        setTimeout(() => {
          if (vueInstance && vueInstance.variant) {
            updateButtonState(vueInstance.variant);
          }
        }, 100);
      });
      
      // 也添加click事件以确保能响应
      dropdown.addEventListener('click', function(e) {
        console.log('下拉框被点击');
      });
    });
  }
  
  // 同步到swatch
  function syncToSwatch(optionIndex, value) {
    // 查找所有匹配的swatch元素
    const swatchElements = document.querySelectorAll('.swatch-element[data-option-index="' + optionIndex + '"]');
    
    // 移除所有active类
    swatchElements.forEach(element => {
      element.classList.remove('active');
      const input = element.querySelector('input[type="radio"]');
      if (input) input.checked = false;
    });
    
    // 找到匹配值的swatch并设置为active
    const targetSwatch = Array.from(swatchElements).find(element => 
      element.getAttribute('data-value') === value || 
      element.classList.contains(value.toLowerCase().replace(/\s+/g, '-'))
    );
    
    if (targetSwatch) {
      targetSwatch.classList.add('active');
      const input = targetSwatch.querySelector('input[type="radio"]');
      if (input) {
        input.checked = true;
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
    
    // 更新颜色名称显示
    const colorNameElement = document.querySelector('[data-color-swatch-name]');
    if (colorNameElement && targetSwatch) {
      colorNameElement.textContent = value;
    }
  }
  
  // 同步到主dropdown
  function syncToMainDropdown(optionIndex, value) {
    // 查找主选择器
    const mainSelectors = [
      'select.product-form__variants',
      'select[name^="id"]',
      'select[name="properties[Title]"]',
      '.single-option-selector',
      'select[name="option-' + (optionIndex + 1) + '"]'
    ];
    
    mainSelectors.forEach(selector => {
      const mainDropdown = document.querySelector(selector);
      if (mainDropdown && mainDropdown.value !== value) {
        mainDropdown.value = value;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        mainDropdown.dispatchEvent(event);
      }
    });
  }
  
  // 设置swatch同步
  function setupSwatchSync(vueInstance) {
    const swatchInputs = document.querySelectorAll('.swatch-element input[type="radio"]');
    
    swatchInputs.forEach(input => {
      input.addEventListener('change', function() {
        if (!this.checked) return;
        
        // 获取选项索引和值
        const optionMatch = this.name.match(/option-(\d+)/);
        if (!optionMatch) return;
        
        const optionIndex = parseInt(optionMatch[1]) - 1;
        const optionValue = this.value;
        
        // 1. 更新Vue实例
        if (vueInstance) {
          const optionKey = 'option' + (optionIndex + 1);
          if (vueInstance.hasOwnProperty(optionKey)) {
            vueInstance[optionKey] = optionValue;
          }
        }
        
        // 2. 同步到底部dropdown
        const bottomDropdown = document.querySelector(`.bottom-purchase-dropdown__select[name="option-${optionIndex + 1}"]`);
        if (bottomDropdown && bottomDropdown.value !== optionValue) {
          bottomDropdown.value = optionValue;
          
          // 触发change事件
          const event = new Event('change', { bubbles: true });
          bottomDropdown.dispatchEvent(event);
        }
        
        // 3. 更新swatch active状态
        const swatchElements = document.querySelectorAll('.swatch-element[data-option-index="' + optionIndex + '"]');
        swatchElements.forEach(element => {
          element.classList.remove('active');
        });
        
        const parentElement = this.closest('.swatch-element');
        if (parentElement) {
          parentElement.classList.add('active');
        }
        
        // 4. 更新颜色名称显示
        const colorNameElement = document.querySelector('[data-color-swatch-name]');
        if (colorNameElement) {
          colorNameElement.textContent = optionValue;
        }
      });
    });
  }
  
  // 设置价格显示 - 仅处理底部购买栏
  function setupPriceDisplay(vueInstance) {
    // 只有在确实需要时才监听变体变化
    console.log('设置价格显示监听器');
    // 不自动监听Vue变体变化，避免干扰主价格
  }
  
  // 更新价格显示（完全禁用以避免干扰主价格）
  function updatePriceDisplay(variant) {
    console.log('价格更新已禁用，避免干扰主价格显示');
    // 不再更新任何价格元素
    return;
  }
  
  // 更新按钮状态
  function updateButtonState(variant) {
    const buttons = document.querySelectorAll('.bottom-purchase-info__btn-container button[name="add"]');
    
    buttons.forEach(button => {
      if (!variant || !variant.available) {
        button.disabled = true;
        button.classList.add('disabled');
        
        // 隐藏所有span
        button.querySelectorAll('span').forEach(span => {
          if (span.classList.contains('sr-only')) return;
          span.style.display = 'none';
        });
        
        // 显示售罄或不可用span
        const soldOutSpan = button.querySelector('span[v-if*="soldOut"], span[v-if*="unavailable"]');
        if (soldOutSpan) {
          soldOutSpan.style.display = 'inline';
        }
      } else {
        button.disabled = false;
        button.classList.remove('disabled');
        
        // 隐藏所有span
        button.querySelectorAll('span').forEach(span => {
          if (span.classList.contains('sr-only')) return;
          span.style.display = 'none';
        });
        
        // 显示添加到购物车span
        const readySpan = button.querySelector('span[v-if*="ready"]');
        if (readySpan) {
          readySpan.style.display = 'inline';
        }
      }
    });
  }
  
  // 优化的数量按钮点击监听 - 使用事件委托和缓存
  let quantityProtectionTimeout = null;
  
  document.addEventListener('click', function(e) {
    // 使用更精确的选择器检查
    const isQuantityButton = e.target.matches('.js-qty__adjust--minus, .js-qty__adjust--plus') ||
                            e.target.closest('.js-qty__adjust--minus, .js-qty__adjust--plus');
    
    if (isQuantityButton) {
      // 清除之前的timeout
      if (quantityProtectionTimeout) {
        clearTimeout(quantityProtectionTimeout);
      }
      
      // 设置标记防止变体逻辑运行
      document.body.setAttribute('data-quantity-button-clicked', 'true');
      quantityProtectionTimeout = setTimeout(() => {
        document.body.removeAttribute('data-quantity-button-clicked');
        quantityProtectionTimeout = null;
      }, 600);
      
      console.log('数量按钮被点击，设置保护标志');
    }
  }, { passive: true }); // 使用passive监听器提高性能

  // 优化的全局事件委托 - 减少不必要的处理
  let changeEventTimeout = null;
  
  document.addEventListener('change', function(e) {
    // 快速检查 - 只处理相关元素
    if (!e.target.matches('select.bottom-purchase-dropdown__select')) {
      return;
    }
    
    // 检查是否是数量按钮相关的事件
    if (document.body.hasAttribute('data-quantity-button-clicked') ||
        document.body.hasAttribute('data-quantity-changing')) {
      console.log('数量变化中，跳过变体处理');
      return;
    }
    
    // 防抖处理 - 避免快速连续触发
    if (changeEventTimeout) {
      clearTimeout(changeEventTimeout);
    }
    
    changeEventTimeout = setTimeout(() => {
      processVariantChange(e.target);
      changeEventTimeout = null;
    }, 50);
  });
  
  // 提取变体处理逻辑到单独函数
  function processVariantChange(target) {
    console.log('全局事件委托检测到下拉框变化:', target.value);
    
    // 缓存Vue实例查询
    let vueInstance = getVueInstance();
    
    // 获取选项索引
    const optionName = target.name;
    const optionMatch = optionName.match(/option-(\d+)/);
    if (!optionMatch) return;
    
    const optionIndex = parseInt(optionMatch[1]) - 1;
    const optionValue = target.value;
    
    console.log('处理选项变化:', optionIndex + 1, '=', optionValue);
    
    // 防止与数量变化冲突 - 检查当前变体是否真的存在且可用
    let validVariantChange = false;
    
    // 更新Vue实例
    if (vueInstance) {
      const optionKey = 'option' + (optionIndex + 1);
      if (vueInstance.hasOwnProperty(optionKey) && vueInstance[optionKey] !== optionValue) {
        console.log('通过全局委托更新Vue实例:', optionKey, '=', optionValue);
        vueInstance[optionKey] = optionValue;
        validVariantChange = true;
        
        // 强制Vue更新
        if (vueInstance.$forceUpdate) {
          vueInstance.$forceUpdate();
        }
        
        // 等待Vue处理变体变化，只更新按钮状态
        setTimeout(() => {
          if (vueInstance.variant) {
            updateButtonState(vueInstance.variant);
          }
        }, 200);
      }
    }
    
    // 只有在确实是变体变化时才同步
    if (validVariantChange) {
      // 同步到swatch
      syncToSwatch(optionIndex, optionValue);
      
      // 同步到主dropdown
      syncToMainDropdown(optionIndex, optionValue);
    }
  }
  
  // 缓存Vue实例获取
  let cachedVueInstance = null;
  let vueInstanceCacheTime = 0;
  
  function getVueInstance() {
    const now = Date.now();
    // 缓存5秒
    if (cachedVueInstance && (now - vueInstanceCacheTime) < 5000) {
      return cachedVueInstance;
    }
    
    try {
      const vueApp = document.querySelector('wetheme-product-form');
      if (vueApp && vueApp.__vue__) {
        cachedVueInstance = vueApp.__vue__;
        vueInstanceCacheTime = now;
        return cachedVueInstance;
      }
    } catch (error) {
      console.error('获取Vue实例失败:', error);
    }
    
    return null;
  }
  
  // 优化的调试点击事件 - 仅在开发模式下启用
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    document.addEventListener('click', function(e) {
      if (e.target.matches('.bottom-purchase-dropdown__select') || 
          e.target.closest('.bottom-purchase-dropdown__wrapper')) {
        // 排除数量按钮区域
        if (!e.target.closest('.js-qty') && 
            !e.target.matches('.js-qty__adjust--minus, .js-qty__adjust--plus')) {
          console.log('检测到底部下拉框区域点击');
        }
      }
    }, { passive: true });
  }
});
