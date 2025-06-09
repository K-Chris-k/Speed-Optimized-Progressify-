// Bottom Bar Fix - 确保底部购买栏始终可见
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否在产品页面
  const isProductPage = document.body.classList.contains('template-product') || 
                       window.location.pathname.includes('/products/');
  
  if (!isProductPage) {
    console.log('不是产品页面，不初始化底部购买栏');
    return;
  }
  
  console.log('产品页面，确保底部购买栏可见');
  
  // 监听购物车抽屉的显示状态
  function setupCartDrawerObserver() {
    // 初始检查购物车抽屉的状态
    updateBottomBarVisibility();
    
    // 定期检查购物车抽屉元素是否存在（降低检查频率以优化性能）
    const checkInterval = setInterval(updateBottomBarVisibility, 500);
    
    // 添加事件监听器以响应用户交互
    document.addEventListener('click', function(e) {
      // 检查是否点击了添加到购物车按钮或类似元素
      if (e.target.closest('[name="add"], [data-bottom-add-to-cart], .add-to-cart-button')) {
        // 用户点击了添加到购物车，立即检查并设置一个短时间内的多次检查
        setTimeout(updateBottomBarVisibility, 300);
        setTimeout(updateBottomBarVisibility, 600);
        setTimeout(updateBottomBarVisibility, 900);
      }
      
      // 检查是否点击了关闭购物车抽屉的按钮
      if (e.target.closest('.drawer__close, .close-button, .drawer-close')) {
        // 用户可能关闭了购物车抽屉，立即检查并设置短时间内的多次检查
        setTimeout(updateBottomBarVisibility, 300);
        setTimeout(updateBottomBarVisibility, 600);
      }
    }, { passive: true });
  }
  
  // 更新底部购买栏的可见性
  function updateBottomBarVisibility() {
    const cartDrawer = document.querySelector('.drawer.drawer--right.drawer--cart');
    const bottomBar = document.querySelector('.bottom-purchase-info');
    
    if (!bottomBar) return;
    
    // 确保底部栏有过渡效果的样式
    if (!bottomBar.hasAttribute('data-transition-set')) {
      bottomBar.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
      bottomBar.setAttribute('data-transition-set', 'true');
    }
    
    // 获取当前状态
    const currentlyVisible = bottomBar.style.display !== 'none' && bottomBar.style.opacity !== '0';
    const shouldBeVisible = !cartDrawer;
    
    // 只在状态需要改变时执行
    if (currentlyVisible !== shouldBeVisible) {
      if (cartDrawer) {
        // 购物车抽屉元素存在，隐藏底部购买栏（向下滑出）
        bottomBar.style.transform = 'translateY(100%)';
        bottomBar.style.opacity = '0';
        // 等待过渡效果完成后再隐藏元素
        setTimeout(() => {
          if (document.querySelector('.drawer.drawer--right.drawer--cart')) {
            bottomBar.style.display = 'none';
          }
        }, 300);
      } else {
        // 购物车抽屉元素不存在，显示底部购买栏（向上滑入）
        // 先确保元素是显示的，但在屏幕外
        bottomBar.style.display = 'flex';
        bottomBar.style.opacity = '0';
        bottomBar.style.transform = 'translateY(100%)';
        
        // 强制重排，确保浏览器应用上面的样式
        bottomBar.offsetHeight;
        
        // 应用过渡效果
        bottomBar.style.opacity = '1';
        bottomBar.style.transform = 'translateY(0)';
        bottomBar.style.visibility = 'visible';
        bottomBar.classList.add('is-visible');
      }
    }
  }
  
  // 启动购物车抽屉观察器
  setupCartDrawerObserver();
  
  // 尝试查找底部购买栏元素
  let bottomBar = document.querySelector('.bottom-purchase-info');
  if (!bottomBar) {
    console.log('底部购买栏元素未找到，尝试加载底部购买栏');
    
    // 尝试加载底部购买栏（如果不存在）
    fetch('/products/' + window.location.pathname.split('/products/')[1])
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const barFromDoc = doc.querySelector('.bottom-purchase-info');
        
        if (barFromDoc) {
          console.log('从HTML中提取底部购买栏');
          
          // 检查是否有评论组件并确保显示
          const reviewBadge = barFromDoc.querySelector('.bottom-purchase-info__review-badge');
          if (reviewBadge) {
            // 查找页面上的星级评分显示
            const existingStars = document.querySelector('.jdgm-prev-badge__stars, .spr-badge-starrating');
            const reviewCount = document.querySelector('.jdgm-prev-badge__text, .spr-badge-caption')?.textContent || '1 Review';
            
            if (existingStars) {
              // 如果页面上已有星级组件，复制它并替换到底部购买栏
              reviewBadge.innerHTML = `<div class="bottom-stars-container">
                ${existingStars.outerHTML}
                <span class="bottom-review-count">${reviewCount}</span>
              </div>`;
            }
          }
          
          document.body.appendChild(barFromDoc);
          setupBottomBar(barFromDoc);
          // 初始检查购物车抽屉的状态
          updateBottomBarVisibility();
        } else {
          console.log('无法从HTML中提取底部购买栏，创建新的底部购买栏');
          createBottomBar();
        }
      })
      .catch(error => {
        console.error('获取产品页面失败：', error);
        createBottomBar();
      });
  } else {
    setupBottomBar(bottomBar);
    // 初始检查购物车抽屉的状态
    updateBottomBarVisibility();
  }
  
  // 确保页面有足够的底部填充，以防止内容被底部栏遮挡
  const mainContent = document.querySelector('main') || document.querySelector('#MainContent');
  if (mainContent) {
    mainContent.style.paddingBottom = '70px';
  }
  
  // 创建新的底部购买栏
  function createBottomBar() {
    // 检查是否有产品信息
    const productTitle = document.querySelector('.product-details-product-title, h1.title');
    const productPrice = document.querySelector('#ProductPrice, .product-single__price');
    const productImage = document.querySelector('.product-single__photo img, .product-featured-img');
    
    if (!productTitle || !productPrice) {
      console.error('无法找到产品信息，无法创建底部购买栏');
      return;
    }
    
    // 检查产品是否有真正的变体选项（非默认Title）
    // 产品有多个变体时才显示变体选择器
    const productHasMultipleVariants = document.querySelectorAll('.product-form__variants option, select[name^="id"] option').length > 1;
    // 检查是否有变体选择器，并且不是单纯的默认Title变体
    const hasTitleVariant = document.querySelector('select[name^="option-"], .single-option-selector') && productHasMultipleVariants;
    // 检查产品是否有颜色变体
    const hasColorVariant = document.querySelector('.swatch.color');
    // 产品是否有真正的变体选项
    const hasRealVariants = productHasMultipleVariants || hasColorVariant || hasTitleVariant;
    
    // 创建底部购买栏
    const bar = document.createElement('div');
    bar.className = 'bottom-purchase-info is-visible';
    bar.style.position = 'fixed';
    bar.style.bottom = '0';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.zIndex = '9999';
    bar.style.backgroundColor = '#fff';
    bar.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
    bar.style.display = 'flex';
    bar.style.alignItems = 'center';
    bar.style.justifyContent = 'center';
    bar.style.padding = '10px 0';
    
    // 查找页面上的评论组件
    const existingBadge = document.querySelector('.prorw_preview_badge_setup');
    let badgeHTML = '';
    
    if (existingBadge) {
      // 获取产品ID和评分信息
      const productId = existingBadge.getAttribute('data-product-id');
      const averageRatings = existingBadge.getAttribute('data-average-ratings') || '5';
      const reviewCount = existingBadge.getAttribute('data-count') || '1';
      
      // 找到页面上的星级评分显示
      const existingStars = document.querySelector('.jdgm-prev-badge__stars, .spr-badge-starrating');
      const reviewLink = document.querySelector('a.spr-badge, a.jdgm-prev-badge');
      
      // 创建直接显示的星级评分
      if (existingStars) {
        // 如果页面上已有星级组件，复制它
        badgeHTML = `<div class="bottom-stars-container">
          ${existingStars.outerHTML}
          <span class="bottom-review-count">${reviewCount} Review${reviewCount > 1 ? 's' : ''}</span>
        </div>`;
      } else {
        // 否则创建一个新的星级组件
        const fullStars = Math.floor(parseFloat(averageRatings));
        const halfStar = parseFloat(averageRatings) - fullStars >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHTML = '';
        // 添加满星
        for (let i = 0; i < fullStars; i++) {
          starsHTML += `<span class="fa fa-star" aria-hidden="true"></span>`;
        }
        // 添加半星
        if (halfStar) {
          starsHTML += `<span class="fa fa-star-half-o" aria-hidden="true"></span>`;
        }
        // 添加空星
        for (let i = 0; i < emptyStars; i++) {
          starsHTML += `<span class="fa fa-star-o" aria-hidden="true"></span>`;
        }
        
        badgeHTML = `<div class="bottom-stars-container" style="display: flex; align-items: center;">
          <div class="bottom-stars" style="color: #ffc107; margin-right: 5px;">${starsHTML}</div>
          <span class="bottom-review-count">${reviewCount} Review${reviewCount > 1 ? 's' : ''}</span>
        </div>`;
      }
    } else {
      // 如果没有评论组件，查找页面上显示的评分
      const reviewSection = document.querySelector('.product-single__review, .product-reviews');
      if (reviewSection) {
        badgeHTML = reviewSection.innerHTML;
      } else {
        // 创建默认的5星评分
        badgeHTML = `<div class="bottom-stars-container" style="display: flex; align-items: center;">
          <div class="bottom-stars" style="color: #ffc107; margin-right: 5px;">
            <span class="fa fa-star" aria-hidden="true"></span>
            <span class="fa fa-star" aria-hidden="true"></span>
            <span class="fa fa-star" aria-hidden="true"></span>
            <span class="fa fa-star" aria-hidden="true"></span>
            <span class="fa fa-star" aria-hidden="true"></span>
          </div>
          <span class="bottom-review-count">1 Review</span>
        </div>`;
      }
    }
    
    // 构建内部HTML
    bar.innerHTML = `
      <div class="bottom-purchase-info__container" style="max-width: 1600px; width: 100%; margin: 0 auto; display: flex; align-items: center; padding: 0 15px;">
        <div class="bottom-purchase-info__image" style="flex: 0 0 70px; margin-right: 15px;">
          <img src="${productImage ? productImage.src : ''}" alt="${productTitle.textContent}" width="70" height="70" style="object-fit: contain;">
        </div>
        <div class="bottom-purchase-info__content" style="flex: 1; min-width: 0; padding-right: 15px; overflow: hidden;">
          <h3 class="bottom-purchase-info__title" style="margin: 0 0 5px; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${productTitle.textContent}</h3>
          <div class="bottom-purchase-info__review-badge">
          ${badgeHTML}
          </div>
          <span id="BottomProductPrice" class="bottom-purchase-info__price" style="font-weight: bold;">
            <span class="money">${productPrice.textContent}</span>
          </span>
        </div>
        <div class="bottom-purchase-info__dropdown-wrapper-new-style" style="display: flex; align-items: center;">
          ${hasRealVariants ? `
          <div class="bottom-variant-selector" style="margin-right: 15px;">
            <div class="bottom-purchase-dropdown__header" style="margin-bottom: 5px; font-size: 14px;">Title</div>
            <select id="BottomVariantSelector" class="bottom-variant-selector__select" style="height: 40px; padding: 0 10px; border: 1px solid #ddd; border-radius: 4px; min-width: 120px;">
              ${Array.from(document.querySelectorAll('select.product-form__variants option, select[name^="id"] option, select[name="properties[Title]"] option, .bottom-purchase-dropdown__select[name="option-1"] option')).map(option => {
                return option.disabled ? '' : `<option value="${option.value}" ${option.selected ? 'selected' : ''}>${option.textContent}</option>`;
              }).join('')}
            </select>
          </div>` : ''}
          <div class="bottom-purchase-dropdown__quantity-wrapper" style="margin-right: 10px;">
            <div class="js-qty" style="display: flex; align-items: center;">
              <button type="button" aria-label="-" class="js-qty__adjust js-qty__adjust--minus icon-fallback-text" data-action="decrease">
                <i class="fa fa-minus" aria-hidden="true"></i>
                <span class="fallback-text">−</span>
              </button>
              <input type="number" class="js-qty__num" value="1" min="1" aria-label="quantity" pattern="[0-9]*" name="quantity-bottom" id="BottomQuantity" data-quantity-input="bottom" style="width: 40px; height: 30px; text-align: center; border: 1px solid #ddd; border-left: none; border-right: none;">
              <button type="button" aria-label="+" class="js-qty__adjust js-qty__adjust--plus icon-fallback-text" data-action="increase">
                <i class="fa fa-plus" aria-hidden="true"></i>
                <span class="fallback-text">+</span>
              </button>
            </div>
          </div>
          <div class="bottom-purchase-info__btn-container">
            <button type="button" aria-label="Add to cart" name="add" id="AddToCart" class="btn bottom-add-to-cart-button" data-bottom-add-to-cart style="min-width: 120px; height: 40px;">
              <span>Add to cart</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 添加到页面
    document.body.appendChild(bar);
    
    // 设置底部购买栏
    setupBottomBar(bar);
  }
  
  // 设置底部购买栏
  function setupBottomBar(bottomBar) {
    // 确保样式
    bottomBar.style.position = 'fixed';
    bottomBar.style.bottom = '0';
    bottomBar.style.left = '0';
    bottomBar.style.right = '0';
    bottomBar.style.zIndex = '9999';
    bottomBar.style.backgroundColor = '#fff';
    bottomBar.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
    bottomBar.style.opacity = '1';
    bottomBar.style.visibility = 'visible';
    bottomBar.style.transform = 'translateY(0)';
    bottomBar.style.padding = '10px 0';
    
    // 添加过渡效果
    bottomBar.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
    bottomBar.setAttribute('data-transition-set', 'true');
    
    // 添加可见类
    bottomBar.classList.add('is-visible');
    
    // 检查是否有多个变体选项
    const hasMultipleVariants = document.querySelectorAll('.product-form__variants option, select[name^="id"] option').length > 1;
    const hasColorVariant = document.querySelector('.swatch.color');
    const hasTitleVariant = document.querySelector('select[name^="option-"], .single-option-selector') && hasMultipleVariants;
    const hasRealVariants = hasMultipleVariants || hasColorVariant || hasTitleVariant;
    
    // 处理变体选择器显示
    const variantSelector = bottomBar.querySelector('.bottom-variant-selector');
    if (variantSelector) {
      if (!hasRealVariants) {
        // 如果没有真正的变体，隐藏变体选择器
        variantSelector.style.display = 'none';
      }
    }
    
    // 优化容器布局
    const container = bottomBar.querySelector('.bottom-purchase-info__container');
    if (container) {
      container.style.maxWidth = '1600px';
      container.style.width = '100%';
      container.style.margin = '0 auto';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.padding = '0 15px';
    }
    
    // 优化图片容器
    const imageContainer = bottomBar.querySelector('.bottom-purchase-info__image');
    if (imageContainer) {
      imageContainer.style.flex = '0 0 70px';
      imageContainer.style.marginRight = '15px';
      
      const img = imageContainer.querySelector('img');
      if (img) {
        img.style.objectFit = 'contain';
      }
    }
  
    // 优化内容容器，确保标题完整显示
    const contentContainer = bottomBar.querySelector('.bottom-purchase-info__content');
    if (contentContainer) {
      contentContainer.style.flex = '1';
      contentContainer.style.minWidth = '0';
      contentContainer.style.paddingRight = '15px';
      contentContainer.style.overflow = 'hidden';
      
      const title = contentContainer.querySelector('.bottom-purchase-info__title');
      if (title) {
        title.style.margin = '0 0 5px';
        title.style.fontSize = '16px';
        title.style.whiteSpace = 'nowrap';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
      }
      
      const price = contentContainer.querySelector('.bottom-purchase-info__price');
      if (price) {
        price.style.fontWeight = 'bold';
      }
    }
    
    // 优化按钮区域
    const buttonWrapper = bottomBar.querySelector('.bottom-purchase-info__dropdown-wrapper-new-style');
    if (buttonWrapper) {
      buttonWrapper.style.display = 'flex';
      buttonWrapper.style.alignItems = 'center';
      
      // 设置变体选择器
      setupVariantSelector(bottomBar);
      
      // 同步数量选择器
      syncQuantity();
      
      const quantityWrapper = buttonWrapper.querySelector('.bottom-purchase-dropdown__quantity-wrapper');
      if (quantityWrapper) {
        quantityWrapper.style.marginRight = '10px';
        
        const jsQty = quantityWrapper.querySelector('.js-qty');
        if (jsQty) {
          jsQty.style.display = 'flex';
          jsQty.style.alignItems = 'center';
          
          const buttons = jsQty.querySelectorAll('.js-qty__adjust');
          buttons.forEach(button => {

            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
          });
          
          const input = jsQty.querySelector('.js-qty__num');
          if (input) {
   
            input.style.borderLeft = 'none';
            input.style.borderRight = 'none';
          }
        }
      }
      
      const addToCartButton = buttonWrapper.querySelector('.bottom-add-to-cart-button');
      if (addToCartButton) {
        addToCartButton.style.minWidth = '120px';
        addToCartButton.style.height = '40px';
      }
    }
    
    // 确保评论显示
    const reviewBadge = bottomBar.querySelector('.bottom-purchase-info__review-badge');
    if (reviewBadge) {
      // 检查是否已经有星级评分显示
      if (!reviewBadge.querySelector('.bottom-stars-container, .fa-star')) {
        // 查找页面上的星级评分显示
        const existingStars = document.querySelector('.jdgm-prev-badge__stars, .spr-badge-starrating');
        const reviewCount = document.querySelector('.jdgm-prev-badge__text, .spr-badge-caption')?.textContent || '1 Review';
        
        if (existingStars) {
          // 如果页面上已有星级组件，复制它并替换到底部购买栏
          reviewBadge.innerHTML = `<div class="bottom-stars-container">
            ${existingStars.outerHTML}
            <span class="bottom-review-count">${reviewCount}</span>
          </div>`;
        } else {
          // 创建默认的5星评分
          reviewBadge.innerHTML = `<div class="bottom-stars-container" style="display: flex; align-items: center;">
            <div class="bottom-stars" style="color: #ffc107; margin-right: 5px;">
              <span class="fa fa-star" aria-hidden="true"></span>
              <span class="fa fa-star" aria-hidden="true"></span>
              <span class="fa fa-star" aria-hidden="true"></span>
              <span class="fa fa-star" aria-hidden="true"></span>
              <span class="fa fa-star" aria-hidden="true"></span>
            </div>
            <span class="bottom-review-count">1 Review</span>
          </div>`;
        }
      }
    }
    
    // 设置添加到购物车按钮
    setupAddToCartButton();
    
    console.log('底部购买栏已设置');
  }
  
  // 设置变体选择器
  function setupVariantSelector(bottomBar) {
    const bottomSelector = bottomBar.querySelector('#BottomVariantSelector');
    if (!bottomSelector) return;
    
    // 检查是否有多个变体选项
    const hasMultipleVariants = document.querySelectorAll('.product-form__variants option, select[name^="id"] option').length > 1;
    if (!hasMultipleVariants) return; // 如果没有多个变体，不需要设置选择器
    
    // 获取主变体选择器
    const mainSelector = document.querySelector('select.product-form__variants, select[name^="id"], select[name="properties[Title]"], .bottom-purchase-dropdown__select[name="option-1"]');
    if (!mainSelector) return;
    
    // 设置初始值
    if (mainSelector.value) {
      bottomSelector.value = mainSelector.value;
    }
    
    // 主选择器变化时更新底部选择器
    mainSelector.addEventListener('change', function() {
      bottomSelector.value = this.value;
    });
    
    // 底部选择器变化时更新主选择器
    bottomSelector.addEventListener('change', function() {
      mainSelector.value = this.value;
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      mainSelector.dispatchEvent(event);
    });
  }
  
  // 同步数量选择器
  function syncQuantity() {
    const mainQuantityInput = document.querySelector('#Quantity, [name="quantity"]:not(#BottomQuantity)');
    const bottomQuantityInput = document.querySelector('#BottomQuantity');
    
    if (!mainQuantityInput || !bottomQuantityInput) {
      console.log('找不到数量输入框，无法同步数量');
      return;
    }
    
    // 设置初始值
    bottomQuantityInput.value = mainQuantityInput.value || '1';
    
    // 主数量变化时更新底部数量
    mainQuantityInput.addEventListener('change', function() {
      bottomQuantityInput.value = this.value;
    });
    
    // 底部数量变化时更新主数量
    bottomQuantityInput.addEventListener('change', function() {
      mainQuantityInput.value = this.value;
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      mainQuantityInput.dispatchEvent(event);
    });
    
    // 确保一次只添加一个事件监听器
    const increaseBtn = document.querySelector('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--plus');
    const decreaseBtn = document.querySelector('.bottom-purchase-dropdown__quantity-wrapper .js-qty__adjust--minus');
    
    if (increaseBtn && !increaseBtn.hasAttribute('data-event-added')) {
      increaseBtn.setAttribute('data-event-added', 'true');
      increaseBtn.addEventListener('click', function() {
        let value = parseInt(bottomQuantityInput.value, 10) || 1;
        value++;
        bottomQuantityInput.value = value;
        mainQuantityInput.value = value;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        mainQuantityInput.dispatchEvent(event);
      });
    }
    
    if (decreaseBtn && !decreaseBtn.hasAttribute('data-event-added')) {
      decreaseBtn.setAttribute('data-event-added', 'true');
      decreaseBtn.addEventListener('click', function() {
        let value = parseInt(bottomQuantityInput.value, 10) || 2;
        value = Math.max(1, value - 1);
        bottomQuantityInput.value = value;
        mainQuantityInput.value = value;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        mainQuantityInput.dispatchEvent(event);
      });
    }
  }
  
  // 设置添加到购物车按钮行为
  function setupAddToCartButton() {
    const bottomButton = document.querySelector('[data-bottom-add-to-cart]');
    if (!bottomButton) {
      console.log('找不到底部添加到购物车按钮');
      return;
    }
    
    // 移除旧的事件监听器（如果有）
    const newButton = bottomButton.cloneNode(true);
    bottomButton.parentNode.replaceChild(newButton, bottomButton);
    
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 同步变体选择
      const bottomSelector = document.querySelector('#BottomVariantSelector');
      const mainSelector = document.querySelector('select.product-form__variants, select[name^="id"], select[name="properties[Title]"], .bottom-purchase-dropdown__select[name="option-1"]');
      if (bottomSelector && mainSelector) {
        mainSelector.value = bottomSelector.value;
        const event = new Event('change', { bubbles: true });
        mainSelector.dispatchEvent(event);
      }
      
      // 同步数量
      const bottomQuantity = document.querySelector('#BottomQuantity');
      const mainQuantity = document.querySelector('[name="quantity"]:not(#BottomQuantity)');
      if (bottomQuantity && mainQuantity) {
        mainQuantity.value = bottomQuantity.value;
      }
      
      // 找到主添加到购物车按钮并点击它
      const mainButton = document.querySelector('form[action="/cart/add"] [type="submit"], button[name="add"]:not([data-bottom-add-to-cart])');
      if (mainButton) {
        console.log('点击主添加到购物车按钮');
        mainButton.click();
        
        // 当添加到购物车后，等待购物车抽屉打开，并隐藏底部栏
        setTimeout(function() {
          updateBottomBarVisibility();
          
          // 连续检查几次以确保状态正确
          setTimeout(updateBottomBarVisibility, 500);
          setTimeout(updateBottomBarVisibility, 1000);
          setTimeout(updateBottomBarVisibility, 2000);
        }, 300);
      } else {
        console.error('主添加到购物车按钮未找到，尝试直接提交表单');
        
        // 尝试提交表单
        const form = document.querySelector('form[action="/cart/add"]');
        if (form) {
          console.log('提交添加到购物车表单');
          form.submit();
          
          // 当添加到购物车后，等待购物车抽屉打开，并隐藏底部栏
          setTimeout(updateBottomBarVisibility, 500);
          setTimeout(updateBottomBarVisibility, 1000);
          setTimeout(updateBottomBarVisibility, 2000);
        } else {
          console.error('无法找到添加到购物车表单');
        }
      }
    });
  }
  
  console.log('底部购买栏修复脚本已完成');
}); 