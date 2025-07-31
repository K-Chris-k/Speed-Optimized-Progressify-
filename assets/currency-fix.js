document.addEventListener('DOMContentLoaded', function() {
  // 检查价格是否为0或空
  function isPriceZeroOrEmpty(priceText) {
    if (!priceText) return true;
    
    // 移除所有货币符号、空格和特殊字符，只保留数字和小数点
    const numericValue = priceText.replace(/[^0-9.,]/g, '').replace(',', '.');
    return !numericValue || parseFloat(numericValue) === 0;
  }

  // 更新价格比较元素的可见性
  function updateComparePriceVisibility() {
    // 获取当前产品价格
    const productPrice = document.getElementById('ProductPrice');
    let currentPrice = 0;
    if (productPrice) {
      const productPriceText = productPrice.querySelector('.money')?.textContent.trim();
      if (productPriceText) {
        const numericValue = productPriceText.replace(/[^0-9.,]/g, '').replace(',', '.');
        currentPrice = parseFloat(numericValue) || 0;
      }
    }

    const comparePrice = document.getElementById('ComparePrice');
    if (comparePrice) {
      const moneyElement = comparePrice.querySelector('.money');
      if (moneyElement) {
        const priceText = moneyElement.textContent.trim();
        
        // 如果比较价格为0或空，尝试从产品数据中获取原始比较价格
        if (isPriceZeroOrEmpty(priceText)) {
          // 如果当前价格有效，尝试从原始产品数据中计算比较价格
          if (currentPrice > 0) {
            // 使用原始价格比例计算比较价格
            let calculatedComparePrice;
            
            if (window.originalPriceRatio && window.originalPriceRatio > 1) {
              // 使用原始价格比例
              calculatedComparePrice = currentPrice * window.originalPriceRatio;
            } else if (window.originalPriceDifference && window.originalPriceDifference > 0) {
              // 使用原始价格差值
              calculatedComparePrice = currentPrice + window.originalPriceDifference;
            } else {
              // 默认比例 (20% 折扣)
              calculatedComparePrice = currentPrice * 1.25;
            }
            
            // 更新比较价格元素
            if (calculatedComparePrice > currentPrice) {
              // 获取当前货币符号
              const currencySymbol = priceText.replace(/[0-9.,]/g, '').trim() || '€';
              moneyElement.textContent = currencySymbol + ' ' + calculatedComparePrice.toFixed(2);
              comparePrice.style.display = 'block';
            } else {
              comparePrice.style.display = 'none';
            }
          } else {
            comparePrice.style.display = 'none';
          }
        } else {
          // 如果比较价格有效，确保它大于当前价格
          const comparePriceValue = priceText.replace(/[^0-9.,]/g, '').replace(',', '.');
          const comparePriceNumber = parseFloat(comparePriceValue) || 0;
          
          if (comparePriceNumber > currentPrice) {
            comparePrice.style.display = 'block';
          } else {
            comparePrice.style.display = 'none';
          }
        }
      }
    }
    
    // 检查百分比折扣元素
    const percentageWrappers = document.querySelectorAll('.variant-percentage-wrapper');
    percentageWrappers.forEach(function(wrapper) {
      const percentageElement = wrapper.querySelector('.variant-percentage');
      if (percentageElement) {
        const percentText = percentageElement.textContent.trim();
        if (percentText === '0%' || percentText === '-0%') {
          // 如果当前价格和比较价格有效，计算折扣百分比
          if (currentPrice > 0 && comparePrice) {
            const comparePriceElement = comparePrice.querySelector('.money');
            if (comparePriceElement) {
              const comparePriceText = comparePriceElement.textContent.trim();
              const comparePriceValue = comparePriceText.replace(/[^0-9.,]/g, '').replace(',', '.');
              const comparePriceNumber = parseFloat(comparePriceValue) || 0;
              
              if (comparePriceNumber > currentPrice) {
                const discountPercentage = Math.round((comparePriceNumber - currentPrice) / comparePriceNumber * 100);
                percentageElement.textContent = discountPercentage + '%';
                wrapper.style.display = 'inline-block';
              } else {
                wrapper.style.display = 'none';
              }
            }
          } else {
            wrapper.style.display = 'none';
          }
        } else {
          wrapper.style.display = 'inline-block';
        }
      }
    });
    
    // 检查值折扣元素
    const valueWrappers = document.querySelectorAll('.variant-value-wrapper');
    valueWrappers.forEach(function(wrapper) {
      const valueElement = wrapper.querySelector('.money');
      if (valueElement) {
        const valueText = valueElement.textContent.trim();
        if (isPriceZeroOrEmpty(valueText)) {
          // 如果当前价格和比较价格有效，计算折扣值
          if (currentPrice > 0 && comparePrice) {
            const comparePriceElement = comparePrice.querySelector('.money');
            if (comparePriceElement) {
              const comparePriceText = comparePriceElement.textContent.trim();
              const comparePriceValue = comparePriceText.replace(/[^0-9.,]/g, '').replace(',', '.');
              const comparePriceNumber = parseFloat(comparePriceValue) || 0;
              
              if (comparePriceNumber > currentPrice) {
                const discountValue = comparePriceNumber - currentPrice;
                // 获取当前货币符号
                const currencySymbol = comparePriceText.replace(/[0-9.,]/g, '').trim();
                valueElement.textContent = currencySymbol + ' ' + discountValue.toFixed(2);
                wrapper.style.display = 'inline-block';
              } else {
                wrapper.style.display = 'none';
              }
            }
          } else {
            wrapper.style.display = 'none';
          }
        } else {
          wrapper.style.display = 'inline-block';
        }
      }
    });
  }
  
  // 监听货币切换事件
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // 当DOM变化时，更新价格比较元素的可见性
        updateComparePriceVisibility();
      }
    });
  });
  
  // 观察整个文档的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  // 初始检查
  updateComparePriceVisibility();
  
  // 定期检查价格比较元素的可见性（每500毫秒检查一次）
  setInterval(updateComparePriceVisibility, 500);
  
  // 监听货币选择器的点击事件
  document.addEventListener('click', function(event) {
    // 检查点击的是否是货币选择器
    if (event.target.closest('.disclosure__button') || 
        event.target.closest('.localization-form') ||
        event.target.closest('#CountryList')) {
      // 延迟执行，确保货币切换后更新价格比较元素的可见性
      setTimeout(updateComparePriceVisibility, 100);
      setTimeout(updateComparePriceVisibility, 500);
      setTimeout(updateComparePriceVisibility, 1000);
    }
  });
  
  // 保存原始产品价格信息
  function saveOriginalPrices() {
    const productPrice = document.getElementById('ProductPrice');
    const comparePrice = document.getElementById('ComparePrice');
    
    if (productPrice && comparePrice) {
      const productPriceText = productPrice.querySelector('.money')?.textContent.trim();
      const comparePriceText = comparePrice.querySelector('.money')?.textContent.trim();
      
      if (productPriceText && comparePriceText) {
        const productPriceValue = productPriceText.replace(/[^0-9.,]/g, '').replace(',', '.');
        const comparePriceValue = comparePriceText.replace(/[^0-9.,]/g, '').replace(',', '.');
        
        window.originalProductPrice = parseFloat(productPriceValue) || 0;
        window.originalComparePrice = parseFloat(comparePriceValue) || 0;
        window.originalPriceRatio = window.originalComparePrice / window.originalProductPrice;
      }
    }
  }
  
  // 初始保存原始价格
  saveOriginalPrices();
}); 