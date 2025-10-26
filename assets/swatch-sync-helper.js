// Swatch Sync Helper - 改进swatch变体选择事件处理
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // 只在产品页面执行
  if (!document.body.classList.contains('template-product') && 
      !window.location.pathname.includes('/products/')) {
    return;
  }
  
  // 监听swatch点击事件
  document.addEventListener('click', function(e) {
    // 检查是否点击了swatch元素
    const swatchElement = e.target.closest('.swatch-element');
    if (swatchElement) {
      // 获取swatch元素的数据
      const optionIndex = swatchElement.closest('[data-option-index]')?.getAttribute('data-option-index');
      const optionValue = swatchElement.getAttribute('data-value');
      
      if (optionIndex && optionValue) {
        // 触发自定义事件，通知其他组件
        const event = new CustomEvent('swatch:clicked', {
          bubbles: true,
          detail: {
            optionIndex: optionIndex,
            optionValue: optionValue,
            element: swatchElement
          }
        });
        document.dispatchEvent(event);
        
        // 延迟执行，确保底部栏同步更新
        setTimeout(() => {
          // 查找底部变体选择器
          const bottomBar = document.querySelector('.bottom-purchase-info');
          if (bottomBar) {
            const bottomSelectors = bottomBar.querySelectorAll('.bottom-purchase-dropdown__select, #BottomVariantSelector');
            
            // 更新对应的底部选择器
            bottomSelectors.forEach(selector => {
              const selectorIndex = selector.getAttribute('data-option-index') || 
                                   selector.getAttribute('name')?.match(/option-(\d+)/)?.[1];
              
              if (selectorIndex === optionIndex) {
                // 查找匹配的选项
                for (let i = 0; i < selector.options.length; i++) {
                  if (selector.options[i].text.includes(optionValue)) {
                    selector.selectedIndex = i;
                    
                    // 触发change事件
                    const event = new Event('change', { bubbles: true });
                    selector.dispatchEvent(event);
                    break;
                  }
                }
              }
            });
          }
        }, 100);
      }
    }
  });
  
  // 监听底部变体选择器变化
  document.addEventListener('change', function(e) {
    // 检查是否是底部变体选择器
    if (e.target.classList.contains('bottom-purchase-dropdown__select') || 
        e.target.id === 'BottomVariantSelector') {
      
      const optionIndex = e.target.getAttribute('data-option-index') || 
                         e.target.getAttribute('name')?.match(/option-(\d+)/)?.[1];
      const optionValue = e.target.options[e.target.selectedIndex]?.value;
      
      if (optionIndex && optionValue) {
        // 查找对应的swatch元素
        const swatchElements = document.querySelectorAll(`.swatch-element[data-option-index="${optionIndex}"]`);
        
        swatchElements.forEach(swatch => {
          const dataValue = swatch.getAttribute('data-value');
          const input = swatch.querySelector('input[type="radio"]');
          
          if (dataValue === optionValue || (input && input.value === optionValue)) {
            // 模拟点击swatch元素
            const input = swatch.querySelector('input[type="radio"]');
            if (input && !input.checked) {
              input.checked = true;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // 添加active类
            document.querySelectorAll('.swatch-element').forEach(el => {
              if (el.getAttribute('data-option-index') === optionIndex) {
                el.classList.remove('active');
              }
            });
            swatch.classList.add('active');
            
            // 更新颜色名称显示
            const colorName = document.querySelector('[data-color-swatch-name]');
            if (colorName) {
              colorName.textContent = optionValue;
            }
          }
        });
      }
    }
  });
});
