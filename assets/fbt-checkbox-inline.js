// 用于修复主产品复选框样式的内联脚本
(function() {
  // 立即执行一次
  fixMainCheckbox();
  
  // DOM加载完成后再执行一次
  document.addEventListener('DOMContentLoaded', fixMainCheckbox);
  
  // 在窗口加载完成后也执行一次（确保样式已应用）
  window.addEventListener('load', fixMainCheckbox);
  
  function fixMainCheckbox() {
    setTimeout(function() {
      var mainCheckboxes = document.querySelectorAll('.alone-product-checkbox');
      mainCheckboxes.forEach(function(checkbox) {
        if (checkbox.disabled && checkbox.checked) {
          // 移除可能干扰的样式
          checkbox.style.appearance = 'checkbox';
          checkbox.style.webkitAppearance = 'checkbox';
          checkbox.style.mozAppearance = 'checkbox';
          
          // 应用我们想要的样式
          checkbox.style.accentColor = '#000';
          checkbox.style.backgroundColor = '#000';
          checkbox.style.borderColor = '#000';
          checkbox.style.opacity = '1';
          
          // 尝试替换复选框为自定义元素
          if (!checkbox.parentNode.querySelector('.custom-checkbox-replacement')) {
            var customCheckbox = document.createElement('span');
            customCheckbox.className = 'custom-checkbox-replacement';
            customCheckbox.style.display = 'inline-block';
            customCheckbox.style.width = '16px';
            customCheckbox.style.height = '16px';
            customCheckbox.style.backgroundColor = '#000';
            customCheckbox.style.borderRadius = '2px';
            customCheckbox.style.position = 'relative';
            customCheckbox.style.marginRight = '5px';
            
            var checkmark = document.createElement('span');
            checkmark.innerHTML = '✓';
            checkmark.style.color = 'white';
            checkmark.style.position = 'absolute';
            checkmark.style.top = '-1px';
            checkmark.style.left = '2px';
            checkmark.style.fontSize = '14px';
            
            customCheckbox.appendChild(checkmark);
            
            // 隐藏原始复选框
            checkbox.style.display = 'none';
            
            // 在复选框前插入自定义元素
            checkbox.parentNode.insertBefore(customCheckbox, checkbox);
          }
        }
      });
    }, 100);
  }
})();

