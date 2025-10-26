// Bottom Select Sync - 真正的select元素同步（使用捕获阶段优先拦截）
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  if (!document.body.classList.contains('template-product')) {
    return;
  }
  
  console.log('[Bottom Select Sync] 初始化 - 使用事件捕获优先级');
  
  let isSyncingFromBottom = false;
  let isSyncingFromMain = false;
  let bottomSelectLockedValue = null;
  
  // ========== 监听底部select变化（使用捕获阶段，触发完整更新） ==========
  document.addEventListener('change', function(e) {
    if (!e.target.classList.contains('bottom-purchase-select')) {
      return;
    }
    
    // 如果正在从主swatch同步，忽略
    if (isSyncingFromMain) {
      console.log('[Bottom Select Sync] ⚠️ 忽略：正在从主swatch同步');
      return;
    }
    
    // ⚠️ 阻止事件传播到其他旧脚本，但我们会手动触发正确的更新
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // 记录用户选择的值
    bottomSelectLockedValue = e.target.value;
    
    // 设置同步标志
    isSyncingFromBottom = true;
    
    const select = e.target;
    const optionIndex = parseInt(select.getAttribute('data-option-index'), 10);
    const selectedValue = select.value;
    
    console.log(`[Bottom Select Sync] ========== 底部select变化 ==========`);
    console.log(`[Bottom Select Sync] 选项索引: ${optionIndex}`);
    console.log(`[Bottom Select Sync] 选中值: "${selectedValue}"`);
    
    // 找到对应的主swatch
    const swatches = document.querySelectorAll(`.swatch-element[data-option-index="${optionIndex}"]`);
    
    console.log(`[Bottom Select Sync] 找到 ${swatches.length} 个swatch元素`);
    
    let found = false;
    let matchedSwatch = null;
    
    swatches.forEach(function(swatch) {
      const radio = swatch.querySelector('input[type="radio"]');
      
      if (radio) {
        const radioValue = radio.value;
        
        // 尝试多种匹配方式
        if (radioValue === selectedValue || 
            radioValue.trim() === selectedValue.trim() ||
            selectedValue.includes(radioValue) ||
            radioValue.includes(selectedValue)) {
          
          console.log('[Bottom Select Sync] ✓✓✓ 找到匹配的swatch！');
          matchedSwatch = swatch;
          found = true;
        }
      }
    });
    
    if (found && matchedSwatch) {
      const radio = matchedSwatch.querySelector('input[type="radio"]');
      
      if (radio) {
        console.log('[Bottom Select Sync] 准备更新swatch...');
        
        // 1. 更新radio状态
        radio.checked = true;
        
        // 2. 更新active class
        const allSwatches = document.querySelectorAll(`.swatch-element[data-option-index="${optionIndex}"]`);
        allSwatches.forEach(s => s.classList.remove('active'));
        matchedSwatch.classList.add('active');
        
        // 3. 手动触发change事件（让swatch组件处理）
        console.log('[Bottom Select Sync] 触发swatch change事件');
        const changeEvent = new Event('change', { bubbles: true });
        radio.dispatchEvent(changeEvent);
        
        // 4. 如果swatch有label，也点击它（确保所有逻辑都执行）
        const label = matchedSwatch.querySelector('label');
        if (label) {
          console.log('[Bottom Select Sync] 点击swatch label');
          setTimeout(function() {
            label.click();
          }, 50);
        }
        
        console.log('[Bottom Select Sync] ========== 完成触发 ==========');
      }
    } else {
      console.log('[Bottom Select Sync] ✗✗✗ 未找到匹配的swatch');
    }
    
    // 延迟解除锁定
    setTimeout(function() {
      console.log('[Bottom Select Sync] 解除底部同步锁定');
      isSyncingFromBottom = false;
      bottomSelectLockedValue = null;
    }, 2000);
  }, true); // true = 使用捕获阶段，比其他监听器更早执行
  
  // ========== 防御性监听：阻止其他脚本改变底部select ==========
  document.addEventListener('change', function(e) {
    if (!e.target.classList.contains('bottom-purchase-select')) {
      return;
    }
    
    // 如果有锁定值，且当前值不是锁定值，强制改回
    if (bottomSelectLockedValue !== null && e.target.value !== bottomSelectLockedValue) {
      console.log(`[Bottom Select Sync] 🛡️ 防御：强制恢复锁定值 "${bottomSelectLockedValue}"`);
      e.target.value = bottomSelectLockedValue;
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);
  
  // ========== 监听主swatch变化，更新底部select ==========
  document.addEventListener('change', function(e) {
    const radio = e.target;
    
    if (radio.type !== 'radio' || !radio.closest('product-swatch')) {
      return;
    }
    
    // 如果正在从底部同步，不要反向同步回去！
    if (isSyncingFromBottom) {
      console.log('[Bottom Select Sync] ⚠️ 阻止反向同步：正在从底部同步');
      return;
    }
    
    isSyncingFromMain = true;
    
    const swatchElement = radio.closest('.swatch-element');
    if (!swatchElement) {
      isSyncingFromMain = false;
      return;
    }
    
    const optionIndex = parseInt(swatchElement.getAttribute('data-option-index'), 10);
    const selectedValue = radio.value;
    
    console.log(`[Bottom Select Sync] 主swatch变化[${optionIndex}]: "${selectedValue}"`);
    
    // 更新对应的底部select
    const bottomSelect = document.querySelector(`.bottom-purchase-select[data-option-index="${optionIndex}"]`);
    
    if (bottomSelect && bottomSelect.value !== selectedValue) {
      // 查找匹配的option
      for (let i = 0; i < bottomSelect.options.length; i++) {
        if (bottomSelect.options[i].value === selectedValue) {
          bottomSelect.selectedIndex = i;
          console.log('[Bottom Select Sync] 已更新底部select');
          break;
        }
      }
    }
    
    setTimeout(function() {
      isSyncingFromMain = false;
    }, 200);
  });
  
  // ========== 数量同步 ==========
  
  if (typeof eventBus !== 'undefined') {
    eventBus.on('qty:change', function(data) {
      const bottomInput = document.querySelector('#BottomQuantity');
      if (bottomInput && bottomInput.value !== String(data.value)) {
        bottomInput.value = data.value;
        console.log('[Bottom Select Sync] 主数量→底部:', data.value);
      }
    });
  }
  
  document.addEventListener('click', function(e) {
    const button = e.target.closest('.bottom-qty-container .js-qty__adjust');
    if (!button) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const isPlus = button.classList.contains('js-qty__adjust--plus');
    const mainContainer = document.querySelector('quantity-input .js-qty');
    
    if (mainContainer) {
      const mainButton = mainContainer.querySelector(isPlus ? 'button[name="plus"]' : 'button[name="minus"]');
      
      if (mainButton) {
        mainButton.click();
        
        setTimeout(function() {
          const mainInput = document.querySelector('#Quantity, quantity-input input[name="quantity-js"]');
          const bottomInput = document.querySelector('#BottomQuantity');
          
          if (mainInput && bottomInput) {
            bottomInput.value = mainInput.value;
          }
        }, 100);
      }
    }
    
    return false;
  }, true);
  
  document.addEventListener('input', function(e) {
    if (e.target.id !== 'BottomQuantity') return;
    
    const mainInput = document.querySelector('#Quantity, quantity-input input[name="quantity-js"]');
    if (mainInput) {
      mainInput.value = e.target.value;
      mainInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  
  // ========== 底部加购按钮点击事件 ==========
  document.addEventListener('click', function(e) {
    // 检查是否点击了底部购买栏的加购按钮或其子元素
    const bottomButton = e.target.closest('.bottom-purchase-info__btn-container .product--add-to-cart-button, .bottom-purchase-info__btn-container button[name="add"]');
    if (!bottomButton) return;
    
    console.log('[Bottom Select Sync] ========== 底部加购按钮被点击 ==========');
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // 查找主产品表单和product-form组件
    const productFormElement = document.querySelector('product-form');
    const mainForm = productFormElement ? productFormElement.querySelector('form') : document.querySelector('form[action*="/cart/add"]');
    
    if (!mainForm) {
      console.error('[Bottom Select Sync] 未找到主产品表单');
      return;
    }
    
    console.log('[Bottom Select Sync] 找到主产品表单');
    
    // 确保数量已同步
    const bottomInput = document.querySelector('#BottomQuantity');
    const mainInput = mainForm.querySelector('input[name="quantity"]');
    
    if (bottomInput && mainInput) {
      mainInput.value = bottomInput.value;
      console.log('[Bottom Select Sync] 同步数量:', bottomInput.value);
    }
    
    // 查找主表单的提交按钮（优先查找product--add-to-cart-button类）
    let mainSubmitButton = mainForm.querySelector('.product--add-to-cart-button[type="submit"]');
    
    if (!mainSubmitButton) {
      // 备用：查找任何name="add"的按钮
      mainSubmitButton = mainForm.querySelector('button[type="submit"][name="add"]');
    }
    
    if (!mainSubmitButton) {
      // 备用：查找任何submit按钮
      mainSubmitButton = mainForm.querySelector('button[type="submit"]');
    }
    
    if (mainSubmitButton) {
      console.log('[Bottom Select Sync] 找到主提交按钮，准备点击');
      console.log('[Bottom Select Sync] 按钮状态 - disabled:', mainSubmitButton.disabled);
      
      // 检查按钮是否被禁用
      if (mainSubmitButton.disabled) {
        console.warn('[Bottom Select Sync] 主按钮被禁用（可能是售罄或无效变体）');
        
        // 更新底部按钮显示状态
        const btnTextSoldout = bottomButton.querySelector('.btn-text-soldout');
        const btnTextReady = bottomButton.querySelector('.btn-text-ready');
        const btnTextUnavailable = bottomButton.querySelector('.btn-text-unavailable');
        
        if (btnTextSoldout) {
          btnTextSoldout.style.display = 'inline';
        }
        if (btnTextReady) {
          btnTextReady.style.display = 'none';
        }
        if (btnTextUnavailable) {
          btnTextUnavailable.style.display = 'none';
        }
        
        return;
      }
      
      // ========== 显示底部按钮加载状态 ==========
      showBottomButtonLoading(bottomButton);
      
      // 点击主按钮，触发所有正常的表单处理逻辑
      mainSubmitButton.click();
      console.log('[Bottom Select Sync] ========== 已触发主按钮点击 ==========');
      
      // 监听加购完成事件，隐藏加载状态
      const hideLoadingOnCartAdded = function() {
        setTimeout(function() {
          hideBottomButtonLoading(bottomButton);
          showBottomButtonAdded(bottomButton);
          
          // 2秒后恢复正常状态
          setTimeout(function() {
            resetBottomButtonState(bottomButton);
          }, 2000);
        }, 300);
        
        // 移除监听器（只触发一次）
        if (typeof eventBus !== 'undefined') {
          eventBus.off('cart:added', hideLoadingOnCartAdded);
        } else {
          document.removeEventListener('cart:added', hideLoadingOnCartAdded);
        }
      };
      
      // 监听cart:added事件
      if (typeof eventBus !== 'undefined') {
        eventBus.on('cart:added', hideLoadingOnCartAdded);
      } else {
        document.addEventListener('cart:added', hideLoadingOnCartAdded);
      }
      
      // 备用：如果5秒后还没有收到cart:added事件，自动隐藏加载状态
      setTimeout(function() {
        if (bottomButton.classList.contains('loading')) {
          console.warn('[Bottom Select Sync] 加购超时，自动隐藏加载状态');
          hideBottomButtonLoading(bottomButton);
          resetBottomButtonState(bottomButton);
        }
      }, 5000);
      
    } else {
      console.error('[Bottom Select Sync] 未找到主提交按钮');
    }
  }, true);
  
  // ========== 底部按钮状态管理函数 ==========
  
  function showBottomButtonLoading(button) {
    console.log('[Bottom Select Sync] 显示加载状态');
    
    // 添加loading类
    button.classList.add('loading');
    button.disabled = true;
    
    // 隐藏所有文本
    const btnTextReady = button.querySelector('.btn-text-ready');
    const btnTextAdded = button.querySelector('.btn-text-added');
    const btnTextSoldout = button.querySelector('.btn-text-soldout');
    const btnTextUnavailable = button.querySelector('.btn-text-unavailable');
    
    if (btnTextReady) btnTextReady.style.display = 'none';
    if (btnTextAdded) btnTextAdded.style.display = 'none';
    if (btnTextSoldout) btnTextSoldout.style.display = 'none';
    if (btnTextUnavailable) btnTextUnavailable.style.display = 'none';
    
    // 显示加载图标
    const loadingIcon = button.querySelector('.bottom-loading-icon');
    if (loadingIcon) {
      loadingIcon.style.display = 'inline-block';
    }
  }
  
  function hideBottomButtonLoading(button) {
    console.log('[Bottom Select Sync] 隐藏加载状态');
    
    // 移除loading类
    button.classList.remove('loading');
    button.disabled = false;
    
    // 隐藏加载图标
    const loadingIcon = button.querySelector('.bottom-loading-icon');
    if (loadingIcon) {
      loadingIcon.style.display = 'none';
    }
  }
  
  function showBottomButtonAdded(button) {
    console.log('[Bottom Select Sync] 显示"已添加"状态');
    
    // 显示"已添加"文本
    const btnTextAdded = button.querySelector('.btn-text-added');
    if (btnTextAdded) {
      btnTextAdded.style.display = 'inline';
    }
  }
  
  function resetBottomButtonState(button) {
    console.log('[Bottom Select Sync] 重置按钮状态');
    
    // 隐藏所有状态文本
    const btnTextAdded = button.querySelector('.btn-text-added');
    const btnTextSoldout = button.querySelector('.btn-text-soldout');
    const btnTextUnavailable = button.querySelector('.btn-text-unavailable');
    
    if (btnTextAdded) btnTextAdded.style.display = 'none';
    if (btnTextSoldout) btnTextSoldout.style.display = 'none';
    if (btnTextUnavailable) btnTextUnavailable.style.display = 'none';
    
    // 显示正常的"加购"文本
    const btnTextReady = button.querySelector('.btn-text-ready');
    if (btnTextReady) {
      btnTextReady.style.display = 'inline';
    }
  }
  
  // ========== 初始同步 ==========
  setTimeout(function() {
    console.log('[Bottom Select Sync] 执行初始同步');
    
    // 同步数量
    const mainInput = document.querySelector('#Quantity, quantity-input input[name="quantity-js"]');
    const bottomInput = document.querySelector('#BottomQuantity');
    
    if (mainInput && bottomInput) {
      bottomInput.value = mainInput.value;
    }
    
    // 同步变体选择
    const swatches = document.querySelectorAll('product-swatch');
    swatches.forEach(function(swatch) {
      const checkedRadio = swatch.querySelector('input[type="radio"]:checked');
      if (checkedRadio) {
        const swatchElement = checkedRadio.closest('.swatch-element');
        if (swatchElement) {
          const optionIndex = parseInt(swatchElement.getAttribute('data-option-index'), 10);
          const radioValue = checkedRadio.value;
          
          if (!isNaN(optionIndex)) {
            const bottomSelect = document.querySelector(`.bottom-purchase-select[data-option-index="${optionIndex}"]`);
            
            if (bottomSelect) {
              for (let i = 0; i < bottomSelect.options.length; i++) {
                if (bottomSelect.options[i].value === radioValue) {
                  bottomSelect.selectedIndex = i;
                  console.log(`[Bottom Select Sync] 初始同步[${optionIndex}]: "${radioValue}"`);
                  break;
                }
              }
            }
          }
        }
      }
    });
    
    console.log('[Bottom Select Sync] 初始同步完成');
  }, 800);
});
