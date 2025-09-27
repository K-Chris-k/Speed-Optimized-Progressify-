// 保护主价格元素不被其他脚本干扰
document.addEventListener('DOMContentLoaded', function() {
  console.log('主价格保护脚本加载...');
  
  // 保护主价格元素
  function protectMainPrice() {
    const mainPriceElements = document.querySelectorAll('[data-product-price], #ProductPrice, .product-price');
    
    mainPriceElements.forEach(priceElement => {
      const moneyElement = priceElement.querySelector('.money, [data-price-text]');
      if (!moneyElement) return;
      
      // 保存原始价格
      const originalPrice = moneyElement.textContent.trim();
      
      // 如果当前显示的是"Unavailable"，恢复正确的价格
      if (originalPrice.toLowerCase().includes('unavailable')) {
        // 尝试从data属性获取正确价格
        const priceData = priceElement.getAttribute('data-price');
        if (priceData) {
          let formattedPrice = '';
          if (window.Shopify && window.Shopify.formatMoney) {
            formattedPrice = window.Shopify.formatMoney(parseInt(priceData));
          } else {
            formattedPrice = '$' + (parseInt(priceData) / 100).toFixed(2);
          }
          moneyElement.textContent = formattedPrice;
          console.log('恢复主价格:', formattedPrice);
        }
      }
      
      // 设置保护标记
      priceElement.setAttribute('data-price-protected', 'true');
      moneyElement.setAttribute('data-price-protected', 'true');
    });
  }
  
  // 立即保护价格
  protectMainPrice();
  
  // 每隔一段时间检查并保护价格
  setInterval(function() {
    protectMainPrice();
  }, 1000);
  
  // 监听DOM变化，保护新添加的价格元素
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        protectMainPrice();
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  console.log('主价格保护已激活');
});



