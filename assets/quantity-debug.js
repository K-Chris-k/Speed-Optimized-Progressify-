// Quantity Debug - 诊断数量按钮重复处理问题
(function() {
  'use strict';
  
  // 等待页面完全加载
  window.addEventListener('load', function() {
    setTimeout(() => {
      console.log('=== 数量按钮诊断开始 ===');
      
      // 检查quantity-input组件
      const quantityInputs = document.querySelectorAll('quantity-input');
      console.log('找到 quantity-input 组件数量:', quantityInputs.length);
      
      // 检查所有数量按钮
      const minusButtons = document.querySelectorAll('.js-qty__adjust--minus, button[name="minus"]');
      const plusButtons = document.querySelectorAll('.js-qty__adjust--plus, button[name="plus"]');
      console.log('找到减少按钮数量:', minusButtons.length);
      console.log('找到增加按钮数量:', plusButtons.length);
      
      // 专门检查底部数量按钮
      const bottomMinusButtons = document.querySelectorAll('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--minus, .js-qty.bottom-qty-container .js-qty__adjust--minus');
      const bottomPlusButtons = document.querySelectorAll('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--plus, .js-qty.bottom-qty-container .js-qty__adjust--plus');
      console.log('找到底部减少按钮数量:', bottomMinusButtons.length);
      console.log('找到底部增加按钮数量:', bottomPlusButtons.length);
      
      // 检查底部按钮的详细信息
      bottomMinusButtons.forEach((button, index) => {
        console.log(`底部减少按钮 ${index}:`, button.className);
        console.log('  - 父容器:', button.closest('.js-qty') ? '找到' : '未找到');
      });
      
      bottomPlusButtons.forEach((button, index) => {
        console.log(`底部增加按钮 ${index}:`, button.className);
        console.log('  - 父容器:', button.closest('.js-qty') ? '找到' : '未找到');
      });
      
      // 检查每个按钮的事件监听器数量（Chrome Dev Tools支持）
      minusButtons.forEach((button, index) => {
        console.log(`减少按钮 ${index}:`, button.outerHTML.substring(0, 100));
        if (button.hasAttribute('data-qty-listener-set')) {
          console.log('  - 有 data-qty-listener-set 标记');
        }
        if (button.hasAttribute('data-event-added')) {
          console.log('  - 有 data-event-added 标记');
        }
        
        // 临时添加计数器来检测重复触发
        let clickCount = 0;
        const originalClick = button.onclick;
        
        button.addEventListener('click', function(e) {
          clickCount++;
          console.log(`减少按钮 ${index} 被点击，次数: ${clickCount}`);
        }, { once: false, capture: true });
      });
      
      plusButtons.forEach((button, index) => {
        console.log(`增加按钮 ${index}:`, button.outerHTML.substring(0, 100));
        if (button.hasAttribute('data-qty-listener-set')) {
          console.log('  - 有 data-qty-listener-set 标记');
        }
        if (button.hasAttribute('data-event-added')) {
          console.log('  - 有 data-event-added 标记');
        }
        
        // 临时添加计数器来检测重复触发
        let clickCount = 0;
        
        button.addEventListener('click', function(e) {
          clickCount++;
          console.log(`增加按钮 ${index} 被点击，次数: ${clickCount}`);
        }, { once: false, capture: true });
      });
      
      // 检查数量输入框
      const quantityInputFields = document.querySelectorAll('.js-qty__num, input[name="quantity"], input[name="quantity-js"]');
      console.log('找到数量输入框数量:', quantityInputFields.length);
      
      quantityInputFields.forEach((input, index) => {
        console.log(`数量输入框 ${index}:`, input.outerHTML.substring(0, 80));
        console.log(`  当前值: ${input.value}`);
        
        // 监听值变化
        let changeCount = 0;
        input.addEventListener('input', function() {
          changeCount++;
          console.log(`输入框 ${index} 值变化为: ${this.value}, 触发次数: ${changeCount}`);
        });
      });
      
      console.log('=== 诊断完成，请点击数量按钮测试 ===');
    }, 2000);
  });
})();
