// Product Card Variant Selector
(function() {
  'use strict';
  
  function setupProductCardVariants() {
    const variantSelects = document.querySelectorAll('.product-card-basic__variant-select');
    
    // 调试：输出找到的变体选择器数量
    if (window.location.hostname.includes('localhost') && variantSelects.length > 0) {
      console.log('找到产品卡片变体选择器数量:', variantSelects.length);
      
      // 分析第一个产品卡片的价格结构
      const firstCard = document.querySelector('.product-card-basic');
      if (firstCard) {
        const priceContainer = firstCard.querySelector('.product-card-basic__price');
        if (priceContainer) {
          console.log('价格容器HTML结构:', priceContainer.innerHTML);
          console.log('找到的.money元素:', priceContainer.querySelectorAll('.money').length);
          console.log('找到的.product-price--sale:', !!priceContainer.querySelector('.product-price--sale'));
          console.log('找到的.product-price--regular:', !!priceContainer.querySelector('.product-price--regular'));
        }
      }
    }
    
    variantSelects.forEach(select => {
      if (select.hasAttribute('data-variant-handler-set')) return;
      select.setAttribute('data-variant-handler-set', 'true');
      
      select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (!selectedOption) return;
        
        const productCard = this.closest('.product-card-basic');
        if (!productCard) return;
        
        // 调试信息（开发环境）
        if (window.location.hostname.includes('localhost') || window.location.hostname.includes('dev')) {
          console.log('变体选择:', {
            variantId: selectedOption.value,
            price: selectedOption.getAttribute('data-price'),
            comparePrice: selectedOption.getAttribute('data-compare-price'),
            available: selectedOption.getAttribute('data-available')
          });
        }
        
        // 更新产品图片
        const productImage = productCard.querySelector('.product-card-basic__image img');
        const newImageSrc = selectedOption.getAttribute('data-image-src');
        
        if (productImage && newImageSrc && productImage.src !== newImageSrc) {
          productImage.src = newImageSrc;
        }
        
        // 更新价格
        updateCardPrice(productCard, selectedOption);
        
        // 更新隐藏的变体ID输入框（用于加购）
        const hiddenVariantInput = productCard.querySelector('input[name="id"]');
        if (hiddenVariantInput) {
          hiddenVariantInput.value = selectedOption.value;
        }
        
        // 更新加购按钮状态
        updateAddToCartButton(productCard, selectedOption);
      });
    });
  }
  
  function updateCardPrice(productCard, selectedOption) {
    const priceContainer = productCard.querySelector('.product-card-basic__price');
    if (!priceContainer) return;
    
    const price = parseInt(selectedOption.getAttribute('data-price'));
    const comparePrice = selectedOption.getAttribute('data-compare-price');
    const isAvailable = selectedOption.getAttribute('data-available') === 'true';
    
    // 格式化价格
    let formattedPrice = '';
    let formattedComparePrice = '';
    
    if (window.Shopify && window.Shopify.formatMoney) {
      formattedPrice = window.Shopify.formatMoney(price);
      if (comparePrice) {
        formattedComparePrice = window.Shopify.formatMoney(parseInt(comparePrice));
      }
    } else {
      // 备用格式化 - 使用HK$符号
      formattedPrice = 'HK$' + (price / 100).toFixed(2);
      if (comparePrice) {
        formattedComparePrice = 'HK$' + (parseInt(comparePrice) / 100).toFixed(2);
      }
    }
    
    const isOnSale = comparePrice && parseInt(comparePrice) > price;
    
    // 查找价格显示区域
    const saleContainer = priceContainer.querySelector('.product-price--sale');
    const regularContainer = priceContainer.querySelector('.product-price--regular');
    
    if (isOnSale) {
      // 显示销售价格
      if (saleContainer && regularContainer) {
        // 更新销售价格容器
        const salePriceElement = saleContainer.querySelector('.money.price--sale-price');
        const comparePriceElement = saleContainer.querySelector('.money.price--compare-at-price');
        
        if (salePriceElement) {
          salePriceElement.textContent = formattedPrice;
        }
        
        if (comparePriceElement) {
          comparePriceElement.textContent = formattedComparePrice;
        }
        
        // 显示销售容器，隐藏常规容器
        saleContainer.classList.remove('hidden');
        regularContainer.classList.add('hidden');
      }
    } else {
      // 显示常规价格
      if (saleContainer && regularContainer) {
        // 更新常规价格容器
        const regularPriceElement = regularContainer.querySelector('.money.price--regular-price');
        
        if (regularPriceElement) {
          regularPriceElement.textContent = formattedPrice;
        }
        
        // 显示常规容器，隐藏销售容器
        regularContainer.classList.remove('hidden');
        saleContainer.classList.add('hidden');
      }
    }
    
    // 备用方案：如果找不到特定的价格容器，尝试更新所有money元素
    if (!saleContainer && !regularContainer) {
      const allMoneyElements = priceContainer.querySelectorAll('.money');
      
      if (window.location.hostname.includes('localhost')) {
        console.log('使用备用价格更新方案，找到money元素:', allMoneyElements.length);
      }
      
      if (allMoneyElements.length > 0) {
        // 更新第一个money元素为当前价格
        allMoneyElements[0].textContent = formattedPrice;
        
        // 如果有第二个money元素且有比较价格，更新它
        if (allMoneyElements.length > 1 && comparePrice) {
          allMoneyElements[1].textContent = formattedComparePrice;
        }
      } else {
        // 最终备用方案：查找任何价格相关的元素
        const anyPriceElement = priceContainer.querySelector('[data-price-text], .price, .product-price, .money, span');
        if (anyPriceElement) {
          anyPriceElement.textContent = formattedPrice;
        }
        
        if (window.location.hostname.includes('localhost')) {
          console.log('使用最终备用方案更新价格');
        }
      }
    }
    
    // 强制价格更新 - 如果上面的方法都失败了
    forceUpdatePrice(priceContainer, formattedPrice, formattedComparePrice, isOnSale);
    
    // 调试信息
    if (window.location.hostname.includes('localhost')) {
      console.log('价格更新完成:', {
        isOnSale: isOnSale,
        formattedPrice: formattedPrice,
        formattedComparePrice: formattedComparePrice,
        foundSaleContainer: !!saleContainer,
        foundRegularContainer: !!regularContainer
      });
    }
  }
  
  // 强制价格更新函数
  function forceUpdatePrice(priceContainer, formattedPrice, formattedComparePrice, isOnSale) {
    // 尝试多种选择器来更新价格
    const priceSelectors = [
      '.money',
      '.price',
      '.product-price',
      '[data-price-text]',
      '.product-grid--price .money',
      'span'
    ];
    
    let updated = false;
    
    for (let selector of priceSelectors) {
      const priceElements = priceContainer.querySelectorAll(selector);
      if (priceElements.length > 0) {
        // 更新第一个找到的元素
        priceElements[0].textContent = formattedPrice;
        updated = true;
        
        if (window.location.hostname.includes('localhost')) {
          console.log(`通过选择器 "${selector}" 更新价格:`, formattedPrice);
        }
        break;
      }
    }
    
    // 如果还是没更新成功，直接替换整个价格容器的内容
    if (!updated) {
      let priceHTML = '';
      
      if (isOnSale && formattedComparePrice) {
        priceHTML = `
          <div class="product-price--sale">
            <span class="money price-line-through price--compare-at-price">${formattedComparePrice}</span>
            <span class="money price--sale-price">${formattedPrice}</span>
          </div>
        `;
      } else {
        priceHTML = `
          <div class="product-price--regular">
            <span class="money price--regular-price">${formattedPrice}</span>
          </div>
        `;
      }
      
      priceContainer.innerHTML = priceHTML;
      
      if (window.location.hostname.includes('localhost')) {
        console.log('通过innerHTML更新价格');
      }
    }
  }
  
  function updateAddToCartButton(productCard, selectedOption) {
    const isAvailable = selectedOption.getAttribute('data-available') === 'true';
    const addButton = productCard.querySelector('button[type="submit"]');
    
    if (!addButton) return;
    
    if (isAvailable) {
      addButton.disabled = false;
      addButton.classList.remove('disabled');
      
      // 更新按钮文本为正常状态
      const buttonText = addButton.querySelector('span');
      if (buttonText) {
        // 检查是否是预购产品
        const originalText = buttonText.textContent.trim();
        if (!originalText.includes('Sold out')) {
          // 保持原始文本（Add to cart 或 Preorder）
        }
      }
    } else {
      addButton.disabled = true;
      addButton.classList.add('disabled');
      
      // 更新按钮文本为售罄状态
      const buttonText = addButton.querySelector('span');
      if (buttonText) {
        const soldOutText = document.querySelector('[data-sold-out-text]')?.textContent || 'Sold out';
        buttonText.textContent = soldOutText;
      }
    }
  }
  
  // 初始化
  function init() {
    setupProductCardVariants();
  }
  
  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 500);
    });
  } else {
    setTimeout(init, 500);
  }
  
  // 监听新添加的产品卡片
  const observer = new MutationObserver(function(mutations) {
    let hasNewCards = false;
    
    for (let mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1 && 
              (node.classList?.contains('product-card-basic') ||
               node.querySelector?.('.product-card-basic__variant-select'))) {
            hasNewCards = true;
            break;
          }
        }
        if (hasNewCards) break;
      }
    }
    
    if (hasNewCards) {
      setTimeout(init, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();
