// Improved Variant Sync - 修复变体同步和底部购买栏按钮状态问题
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // 只在产品页面执行
  if (!document.body.classList.contains('template-product') && 
      !window.location.pathname.includes('/products/')) {
    return;
  }
  
  console.log('Improved Variant Sync: 初始化');
  
  // 全局变量
  let isProcessing = false;
  let mainForm = null;
  let mainVariantSelector = null;
  let mainAddToCartButton = null;
  let bottomBar = null;
  let bottomVariantSelectors = [];
  let bottomAddToCartButton = null;
  let productData = null;
  let lastSyncTime = 0;
  let syncInterval = null;
  
  // 初始化函数
  function init() {
    // 查找主要元素
    mainForm = document.querySelector('form[action*="/cart/add"]');
    mainVariantSelector = document.querySelector('select[name="id"], select.product-form__variants');
    mainAddToCartButton = mainForm ? mainForm.querySelector('button[type="submit"], button[name="add"]') : null;
    bottomBar = document.querySelector('.bottom-purchase-info');
    
    // 如果没有底部购买栏，则不需要继续
    if (!bottomBar) {
      console.log('Improved Variant Sync: 未找到底部购买栏，退出初始化');
      return;
    }
    
    // 查找底部变体选择器
    bottomVariantSelectors = Array.from(bottomBar.querySelectorAll('.bottom-purchase-dropdown__select, #BottomVariantSelector'));
    bottomAddToCartButton = bottomBar.querySelector('[data-bottom-add-to-cart], [data-bottom-add-to-cart-swatch]');
    
    // 获取产品数据
    loadProductData();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始同步
    syncVariantsInitial();
    
    // 更新底部按钮状态
    updateBottomButtonState();
    
    // 设置定期同步
    startPeriodicSync();
    
    console.log('Improved Variant Sync: 初始化完成');
  }
  
  // 加载产品数据
  function loadProductData() {
    const productJsonEl = document.querySelector('[data-product-json]');
    if (productJsonEl) {
      try {
        productData = JSON.parse(productJsonEl.textContent);
        console.log('Improved Variant Sync: 已加载产品数据');
      } catch (e) {
        console.error('Improved Variant Sync: 解析产品数据出错', e);
      }
    } else {
      console.warn('Improved Variant Sync: 未找到产品数据元素');
      
      // 尝试从其他可能的位置获取产品数据
      const metaElement = document.querySelector('meta[property="og:product_id"]');
      if (metaElement) {
        const productId = metaElement.getAttribute('content');
        if (productId) {
          console.log('Improved Variant Sync: 尝试从页面元数据获取产品ID:', productId);
        }
      }
    }
  }
  
  // 设置事件监听器
  function setupEventListeners() {
    // 主变体选择器变化
    if (mainVariantSelector) {
      // 移除旧的事件监听器
      const newMainSelector = mainVariantSelector.cloneNode(true);
      mainVariantSelector.parentNode.replaceChild(newMainSelector, mainVariantSelector);
      mainVariantSelector = newMainSelector;
      
      mainVariantSelector.addEventListener('change', function() {
        if (isProcessing) return;
        isProcessing = true;
        
        try {
          const variantId = this.value;
          syncFromMainToBottom(variantId);
          lastSyncTime = Date.now();
        } finally {
          setTimeout(() => { isProcessing = false; }, 100);
        }
      });
    }
    
    // 底部变体选择器变化
    bottomVariantSelectors.forEach(selector => {
      // 移除旧的事件监听器
      const newSelector = selector.cloneNode(true);
      selector.parentNode.replaceChild(newSelector, selector);
      
      newSelector.addEventListener('change', function() {
        if (isProcessing) return;
        isProcessing = true;
        
        try {
          syncFromBottomToMain();
          lastSyncTime = Date.now();
        } finally {
          setTimeout(() => { isProcessing = false; }, 100);
        }
      });
    });
    
    // 重新获取底部选择器（因为已经被替换）
    bottomVariantSelectors = Array.from(bottomBar.querySelectorAll('.bottom-purchase-dropdown__select, #BottomVariantSelector'));
    
    // 监听swatch变化事件
    document.addEventListener('variant:change', function(event) {
      if (isProcessing) return;
      isProcessing = true;
      
      try {
        const variant = event.detail.variant;
        if (variant && variant.id) {
          syncVariantById(variant.id);
          lastSyncTime = Date.now();
        }
      } finally {
        setTimeout(() => { isProcessing = false; }, 100);
      }
    });
    
    // 监听底部添加到购物车按钮点击
    if (bottomAddToCartButton) {
      // 移除旧的事件监听器
      const newButton = bottomAddToCartButton.cloneNode(true);
      bottomAddToCartButton.parentNode.replaceChild(newButton, bottomAddToCartButton);
      bottomAddToCartButton = newButton;
      
      bottomAddToCartButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 同步变体选择
        syncFromBottomToMain();
        
        // 检查主按钮状态
        if (mainAddToCartButton && !mainAddToCartButton.disabled) {
          // 点击主添加到购物车按钮
          mainAddToCartButton.click();
        } else {
          // 如果主按钮不可用，更新底部按钮状态
          updateBottomButtonState();
        }
      });
    }
    
    // 监听DOM变化，处理动态加载的元素
    setupMutationObserver();
    
    // 监听document点击事件，以捕获swatch点击
    document.addEventListener('click', function(e) {
      // 检查是否点击了swatch元素
      const swatchElement = e.target.closest('.swatch-element');
      if (swatchElement) {
        // 延迟执行同步，等待swatch处理完成
        setTimeout(() => {
          if (!isProcessing) {
            syncVariantsInitial();
            updateBottomButtonState();
          }
        }, 200);
      }
    });
  }
  
  // 设置DOM变化监听
  function setupMutationObserver() {
    try {
      const observer = new MutationObserver(function(mutations) {
        let needsSync = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && 
              (mutation.target.classList.contains('product--add-to-cart-button') || 
               mutation.target.classList.contains('btn'))) {
            // 按钮状态可能已更改
            needsSync = true;
            break;
          }
          
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1 && 
                  (node.classList && (
                    node.classList.contains('bottom-purchase-info') ||
                    node.classList.contains('swatch-element') ||
                    node.classList.contains('active')
                  ))) {
                // 底部购买栏或swatch元素已添加/更改
                needsSync = true;
                break;
              }
            }
          }
        }
        
        if (needsSync) {
          // 重新同步变体和更新按钮状态
          setTimeout(() => {
            syncVariantsInitial();
            updateBottomButtonState();
          }, 100);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'disabled', 'checked']
      });
    } catch (e) {
      console.error('Improved Variant Sync: 设置MutationObserver失败', e);
    }
  }
  
  // 从主变体选择器同步到底部变体选择器
  function syncFromMainToBottom(variantId) {
    if (!variantId || !bottomVariantSelectors.length) return;
    
    // 查找变体数据
    let variant = null;
    
    if (productData && productData.variants) {
      variant = productData.variants.find(v => v.id.toString() === variantId.toString());
    }
    
    if (!variant) {
      // 如果没有找到变体数据，尝试从主表单获取当前选项
      const optionSelectors = document.querySelectorAll('.single-option-selector, [name^="option-"]');
      const selectedOptions = Array.from(optionSelectors).map(selector => selector.value);
      
      if (selectedOptions.length > 0) {
        // 更新底部变体选择器
        bottomVariantSelectors.forEach((selector, index) => {
          if (index < selectedOptions.length) {
            const optionValue = selectedOptions[index];
            
            // 查找匹配的选项
            for (let i = 0; i < selector.options.length; i++) {
              if (selector.options[i].text.includes(optionValue)) {
                selector.selectedIndex = i;
                break;
              }
            }
          }
        });
      }
      
      // 更新底部按钮状态
      updateBottomButtonState();
      return;
    }
    
    // 更新底部变体选择器
    bottomVariantSelectors.forEach((selector, index) => {
      if (variant.options && variant.options[index]) {
        const optionValue = variant.options[index];
        
        // 查找匹配的选项
        for (let i = 0; i < selector.options.length; i++) {
          if (selector.options[i].text.includes(optionValue)) {
            selector.selectedIndex = i;
            break;
          }
        }
      }
    });
    
    // 更新底部按钮状态
    updateBottomButtonState();
  }
  
  // 从底部变体选择器同步到主变体选择器
  function syncFromBottomToMain() {
    if (!mainVariantSelector || !bottomVariantSelectors.length) return;
    
    // 获取底部选择器的值
    const selectedOptions = [];
    bottomVariantSelectors.forEach(selector => {
      const selectedOption = selector.options[selector.selectedIndex];
      if (selectedOption) {
        // 提取选项值（去除可能的 "- Sold Out" 后缀）
        let value = selectedOption.text;
        if (value.includes(' - ')) {
          value = value.split(' - ')[0];
        }
        selectedOptions.push(value);
      }
    });
    
    // 如果没有选择选项，则不继续
    if (selectedOptions.length === 0) return;
    
    // 查找匹配的变体
    let matchingVariantId = null;
    
    if (productData && productData.variants) {
      const matchingVariant = productData.variants.find(variant => {
        return selectedOptions.every((option, index) => {
          return variant.options[index] === option || variant.options[index].includes(option);
        });
      });
      
      if (matchingVariant) {
        matchingVariantId = matchingVariant.id;
      }
    }
    
    // 如果找不到匹配的变体，尝试使用其他方法
    if (!matchingVariantId) {
      // 尝试直接更新主选项选择器
      const optionSelectors = document.querySelectorAll('.single-option-selector, [name^="option-"]');
      
      if (optionSelectors.length > 0) {
        // 更新每个选项选择器
        selectedOptions.forEach((option, index) => {
          if (index < optionSelectors.length) {
            const selector = optionSelectors[index];
            
            // 查找匹配的选项
            for (let i = 0; i < selector.options.length; i++) {
              if (selector.options[i].text.includes(option)) {
                selector.selectedIndex = i;
                
                // 触发change事件
                const event = new Event('change', { bubbles: true });
                selector.dispatchEvent(event);
                break;
              }
            }
          }
        });
        
        // 更新底部按钮状态
        updateBottomButtonState();
        return;
      }
    }
    
    // 更新主变体选择器
    if (matchingVariantId && mainVariantSelector.value !== matchingVariantId.toString()) {
      mainVariantSelector.value = matchingVariantId.toString();
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      mainVariantSelector.dispatchEvent(event);
    }
    
    // 更新底部按钮状态
    updateBottomButtonState();
  }
  
  // 根据变体ID同步所有选择器
  function syncVariantById(variantId) {
    if (!variantId) return;
    
    // 查找变体数据
    let variant = null;
    
    if (productData && productData.variants) {
      variant = productData.variants.find(v => v.id.toString() === variantId.toString());
    }
    
    // 如果没有找到变体数据，则不继续
    if (!variant) return;
    
    // 更新主变体选择器
    if (mainVariantSelector && mainVariantSelector.value !== variantId.toString()) {
      mainVariantSelector.value = variantId.toString();
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      mainVariantSelector.dispatchEvent(event);
    }
    
    // 更新主选项选择器
    const optionSelectors = document.querySelectorAll('.single-option-selector, [name^="option-"]');
    
    if (optionSelectors.length > 0 && variant.options) {
      // 更新每个选项选择器
      variant.options.forEach((option, index) => {
        if (index < optionSelectors.length) {
          const selector = optionSelectors[index];
          
          // 查找匹配的选项
          for (let i = 0; i < selector.options.length; i++) {
            if (selector.options[i].text.includes(option)) {
              selector.selectedIndex = i;
              break;
            }
          }
        }
      });
    }
    
    // 更新底部变体选择器
    bottomVariantSelectors.forEach((selector, index) => {
      if (variant.options && variant.options[index]) {
        const optionValue = variant.options[index];
        
        // 查找匹配的选项
        for (let i = 0; i < selector.options.length; i++) {
          if (selector.options[i].text.includes(optionValue)) {
            selector.selectedIndex = i;
            break;
          }
        }
      }
    });
    
    // 更新底部按钮状态
    updateBottomButtonState();
  }
  
  // 初始同步变体
  function syncVariantsInitial() {
    // 重新获取元素（可能已经动态加载）
    mainForm = document.querySelector('form[action*="/cart/add"]');
    mainVariantSelector = document.querySelector('select[name="id"], select.product-form__variants');
    mainAddToCartButton = mainForm ? mainForm.querySelector('button[type="submit"], button[name="add"]') : null;
    bottomBar = document.querySelector('.bottom-purchase-info');
    
    if (bottomBar) {
      bottomVariantSelectors = Array.from(bottomBar.querySelectorAll('.bottom-purchase-dropdown__select, #BottomVariantSelector'));
      bottomAddToCartButton = bottomBar.querySelector('[data-bottom-add-to-cart], [data-bottom-add-to-cart-swatch]');
    }
    
    // 检查活动的swatch元素
    const activeSwatches = document.querySelectorAll('.swatch-element.active');
    if (activeSwatches.length > 0) {
      // 如果有活动的swatch，使用它们的值
      const selectedOptions = [];
      
      activeSwatches.forEach(swatch => {
        const value = swatch.getAttribute('data-value');
        if (value) {
          selectedOptions.push(value);
        }
      });
      
      if (selectedOptions.length > 0 && productData && productData.variants) {
        // 查找匹配的变体
        const matchingVariant = productData.variants.find(variant => {
          return selectedOptions.every((option, index) => {
            return variant.options[index] === option || variant.options[index].includes(option);
          });
        });
        
        if (matchingVariant) {
          // 同步到所有选择器
          syncVariantById(matchingVariant.id);
          return;
        }
      }
    }
    
    // 如果有主变体选择器，从主变体同步到底部
    if (mainVariantSelector && mainVariantSelector.value) {
      syncFromMainToBottom(mainVariantSelector.value);
    } 
    // 否则从底部同步到主变体
    else if (bottomVariantSelectors.length > 0) {
      syncFromBottomToMain();
    }
  }
  
  // 更新底部按钮状态
  function updateBottomButtonState() {
    if (!bottomAddToCartButton) return;
    
    // 检查主按钮状态
    let isAvailable = true;
    
    // 方法1：检查主按钮是否禁用
    if (mainAddToCartButton && mainAddToCartButton.disabled) {
      isAvailable = false;
    }
    
    // 方法2：检查底部选择器是否有禁用的选项
    bottomVariantSelectors.forEach(selector => {
      const selectedOption = selector.options[selector.selectedIndex];
      if (selectedOption && selectedOption.disabled) {
        isAvailable = false;
      }
    });
    
    // 方法3：检查当前选择的变体是否可用
    if (productData && mainVariantSelector) {
      const currentVariantId = mainVariantSelector.value;
      const currentVariant = productData.variants.find(v => v.id.toString() === currentVariantId.toString());
      if (currentVariant && !currentVariant.available) {
        isAvailable = false;
      }
    }
    
    // 更新按钮状态
    const readyText = bottomAddToCartButton.querySelector('.btn-text-ready');
    const soldOutText = bottomAddToCartButton.querySelector('.btn-text-soldout');
    const unavailableText = bottomAddToCartButton.querySelector('.btn-text-unavailable');
    
    if (readyText) {
      readyText.style.display = isAvailable ? 'inline' : 'none';
    }
    
    if (soldOutText) {
      soldOutText.style.display = !isAvailable ? 'inline' : 'none';
    }
    
    if (unavailableText) {
      unavailableText.style.display = 'none';
    }
    
    // 更新按钮禁用状态
    bottomAddToCartButton.disabled = !isAvailable;
    if (!isAvailable) {
      bottomAddToCartButton.classList.add('disabled');
    } else {
      bottomAddToCartButton.classList.remove('disabled');
    }
  }
  
  // 开始定期同步
  function startPeriodicSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    // 每秒检查一次，如果超过3秒没有同步，则强制同步
    syncInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastSyncTime > 3000 && !isProcessing) {
        syncVariantsInitial();
        updateBottomButtonState();
        lastSyncTime = now;
      }
    }, 1000);
  }
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 500);
    });
  } else {
    setTimeout(init, 500);
  }
  
  // 页面卸载时清理
  window.addEventListener('beforeunload', function() {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
  });
});