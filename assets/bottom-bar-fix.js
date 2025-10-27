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
  
  // 用于移动端滑动检测
  let lastScrollTop = 0;
  let scrollThreshold = 5; // 滑动多少像素才触发显示/隐藏
  let isMobile = window.innerWidth < 768;

  // 监听滚动事件，处理移动端上下滑动效果
  window.addEventListener('scroll', function() {
    if (!isMobile) return; // 只在移动端处理滑动效果
    
    const st = window.pageYOffset || document.documentElement.scrollTop;
    const bottomBar = document.querySelector('.bottom-purchase-info');
    if (!bottomBar) return;
    
    // 确保底部栏有滑动过渡效果
    if (!bottomBar.hasAttribute('data-slide-transition-set')) {
      bottomBar.style.transition = 'transform 0.3s ease-out';
      bottomBar.setAttribute('data-slide-transition-set', 'true');
    }
    
    // 如果购物车抽屉打开，不处理滑动效果
    if (document.querySelector('.drawer.drawer--right.drawer--cart')) return;
    
    if (Math.abs(lastScrollTop - st) <= scrollThreshold) return;
    
    if (st > lastScrollTop && st > 100) {
      // 向下滑动且不在页面顶部，显示
      bottomBar.style.transform = 'translateY(0)';
      bottomBar.style.opacity = '1';
    } else if (st < lastScrollTop) {
      // 向上滑动，隐藏
      bottomBar.style.transform = 'translateY(100%)';
      bottomBar.style.opacity = '0';
    }
    
    lastScrollTop = st <= 0 ? 0 : st;
  }, {passive: true});
  
  // 监听窗口大小变化
  window.addEventListener('resize', function() {
    isMobile = window.innerWidth < 768;
    // 如果从移动端切换到桌面端，恢复底部栏显示
    if (!isMobile) {
      const bottomBar = document.querySelector('.bottom-purchase-info');
      if (bottomBar) {
        bottomBar.style.transform = 'translateY(0)';
        bottomBar.style.opacity = '1';
      }
    }
  }, {passive: true});
  
  // 监听产品图片变化
  function setupProductImageObserver() {
    // 图片容器的可能选择器
    const imageContainers = [
      '.product-single__photos',
      '.product-single__media-group',
      '.product__media-list',
      '.product-image-main',
      '.product-single__media-wrapper'
    ];
    
    let container = null;
    for (const selector of imageContainers) {
      container = document.querySelector(selector);
      if (container) break;
    }
    
    // 监听Vue组件变体变化
    monitorVueProductForm();
    
    if (!container) return; // 没有找到图片容器
    
    // 创建 MutationObserver 以监视图片变化
    const observer = new MutationObserver(function(mutations) {
      // 检查图片是否发生变化
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' || mutation.type === 'childList') {
          // 产品图片可能已更改，更新底部栏图片
          setTimeout(updateVariantImage, 100);
          break;
        }
      }
    });
    
    // 开始监视图片容器的变化
    observer.observe(container, { 
      childList: true,      // 监视子元素的添加或删除
      attributes: true,     // 监视属性的变化
      subtree: true         // 监视所有后代元素
    });
    
    // 监听图片的点击事件，更新底部栏图片
    container.addEventListener('click', function(e) {
      if (e.target.tagName === 'IMG' || e.target.closest('.product__media-item')) {
        setTimeout(updateVariantImage, 100);
      }
    });
    
    // 监听其他可能的图片切换事件，例如缩略图点击
    const thumbnails = document.querySelectorAll('.product-single__thumbnails-item, .product__thumbnails-item');
    thumbnails.forEach(function(thumbnail) {
      thumbnail.addEventListener('click', function() {
        setTimeout(updateVariantImage, 100);
      });
    });

    // 监听变体选择器的变化
    monitorAllVariantSelectors();
  }

  // 监控所有可能的变体选择器
  function monitorAllVariantSelectors() {
    // 所有可能的变体选择器
    const variantSelectors = [
      'select.single-option-selector',
      'select[name^="option-"]',
      '.swatch input[type="radio"]',
      '.selector-wrapper select',
      '.product-form__variants',
      '.product-form__swatch input[type="radio"]',
      '.product-form__swatch input[type="checkbox"]',
      '.product-form__swatch .swatches__item',
      'input[name="id"]',
      '.color-option input',
      '.size-option input'
    ];

    // 为每个选择器添加事件监听
    variantSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // 避免重复添加事件监听器
        if (element.hasAttribute('data-variant-monitor')) return;
        
        element.setAttribute('data-variant-monitor', 'true');
        element.addEventListener('change', function() {
          console.log('变体选择器改变:', this);
          setTimeout(updateVariantImage, 100);
        });
        
        // 对于非标准控件，监听点击事件
        if (selector.includes('input[type="radio"]') || selector.includes('swatches__item')) {
          element.addEventListener('click', function() {
            console.log('变体选择器点击:', this);
            setTimeout(updateVariantImage, 200);
          });
        }
      });
    });
    
    // 每500ms检查一次DOM，以防止动态加载的选择器
    setTimeout(monitorAllVariantSelectors, 500);
  }
  
  // 监控Vue产品表单变化
  function monitorVueProductForm() {
    // 检查是否有Vue组件
    const vueForm = document.querySelector('.product-form-vue');
    if (!vueForm) return;
    
    // 监听Vue组件的变化
    const observer = new MutationObserver(function(mutations) {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' || mutation.type === 'childList') {
          setTimeout(updateVariantImage, 100);
          break;
        }
      }
    });
    
    // 观察Vue表单的变化
    observer.observe(vueForm, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });
    
    // 检查页面中的Vue实例
    if (window.Vue) {
      console.log('检测到Vue实例，尝试监控Vue事件');
      // 如果Vue实例在全局可用，我们可以尝试监听Vue事件（这取决于主题实现）
    }
    
    // 对于WeTheme特定的组件，添加额外的监听
    const weThemeForm = document.querySelector('wetheme-product-form');
    if (weThemeForm) {
      // 监听WeTheme特定组件的属性变化
      observer.observe(weThemeForm, { 
        attributes: true,
        attributeFilter: ['class', 'data-variant-id', 'data-variant-image'] 
      });
      
      // 获取其中的图片容器
      const mediaContainer = weThemeForm.querySelector('.product-media');
      if (mediaContainer) {
        observer.observe(mediaContainer, { childList: true, subtree: true });
      }
    }

    // 对当前可见的变体图像添加特定监听
    const currentVariantImage = document.querySelector('.product-single__media--active, .is-active .product-single__media');
    if (currentVariantImage) {
      observer.observe(currentVariantImage, { attributes: true, childList: true });
    }
  }
  
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
    const shouldBeVisible = !cartDrawer && (!isMobile || (isMobile && lastScrollTop > 0)); 
    
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
  
  // 启动产品图片观察器
  setupProductImageObserver();
  
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
  
  // 查找页面上的评论组件（支持 Judge.me, Shopify Product Reviews, Loox, Yotpo, Ali Reviews 等）
  function getReviewBadgeHTML() {
    const selectors = [
      // Judge.me
      '.jdgm-prev-badge',
      '.jdgm-widget .jdgm-prev-badge__stars',
      '.jdgm-preview-badge',

      // Shopify Product Reviews (SPR)
      '.spr-badge',
      '.spr-badge-starrating',

      // Loox
      '.loox-rating',

      // Yotpo
      '.yotpo-bottomline',
      '[data-review-count] .yotpo-icon-star',

      // Ali Reviews
      '.ali-review-badge',

      // 通用 fallback
      '[class*="review"] [class*="star"]',
      '[class*="rating"]'
    ];

    let starsHTML = '';
    let reviewCount = '0 Reviews';

    // 1. 尝试直接复制已有星级组件
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const parent = el.closest('[class*="badge"], [class*="rating"], [class*="review"]');
        if (parent) {
          const countEl = parent.querySelector('[class*="count"], [class*="review"], text, span:last-child');
          if (countEl) reviewCount = countEl.textContent.trim() || reviewCount;

          // 复制整个 badge
          const cloned = parent.cloneNode(true);
          cloned.style.cssText = 'display: flex; align-items: center; margin: 0; font-size: 14px;';
          return `<div class="bottom-stars-container">${cloned.outerHTML}</div>`;
        }
      }
    }

    // 2. 手动提取评分数字 + 星级
    const ratingText = document.body.textContent.match(/(\d+\.\d|\d) ?out of 5/i) ||
                       document.body.textContent.match(/(\d+\.\d|\d) ?stars?/i);

    let averageRating = 5;
    if (ratingText) averageRating = parseFloat(ratingText[1]);

    // 提取评论数量
    const countMatch = document.body.textContent.match(/(\d+) ?reviews?/i);
    if (countMatch) reviewCount = `${countMatch[1]} Review${countMatch[1] > 1 ? 's' : ''}`;

    // 生成星级
    const full = Math.floor(averageRating);
    const half = averageRating % 1 >= 0.4 ? 1 : 0;
    const empty = 5 - full - half;

    starsHTML = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);

    return `
      <div class="bottom-stars-container" style="display: flex; align-items: center; font-size: 14px; color: #ffc107;">
        <span style="margin-right: 4px; letter-spacing: 1px;">${starsHTML}</span>
        <span style="color: #666; font-size: 13px;">${reviewCount}</span>
      </div>
    `;
  }
  
  // 创建新的底部购买栏
  function createBottomBar() {
    // 检查是否有产品信息
    const productTitle = document.querySelector('.product-details-product-title, h1.title');
    const productPrice = document.querySelector('#ProductPrice, .product-single__price');
    // 扩展选择器以查找产品图片，包括单变体产品的图片
    const productImage = document.querySelector('.product-single__photo img, .product-featured-img, .product__media-item img, .product__image, .product-single__media img');
    
    // 如果没有找到主要的产品图像，尝试查找其他可能的图像元素
    let productImageSrc = '';
    if (productImage) {
      productImageSrc = productImage.src;
    } else {
      // 尝试查找任何产品图像
      const anyImage = document.querySelector('img[src*="products/"], .product_image img');
      if (anyImage) {
        productImageSrc = anyImage.src;
      } else {
        // 查找featuredImage数据
        const productData = document.querySelector('[data-product-json]');
        if (productData) {
          try {
            const jsonData = JSON.parse(productData.textContent);
            if (jsonData.featured_image) {
              productImageSrc = jsonData.featured_image;
            }
          } catch (e) {
            console.error('无法解析产品JSON数据', e);
          }
        }
      }
    }
    
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
    
    // 检查是否为移动设备
    const isMobile = window.innerWidth < 768;
    
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
    bar.style.padding = isMobile ? '10px 15px' : '10px 0';
    bar.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    
    if (isMobile) {
      bar.setAttribute('data-slide-transition-set', 'true');
    }
    
    // 获取badgeHTML
    let badgeHTML = getReviewBadgeHTML();
    
    // 构建内部HTML
    if (isMobile) {
      // 移动端布局 - 根据是否有变体选择器决定显示一行还是两行
      if (hasRealVariants) {
        // 有变体 - 两行显示（变体一行，购买按钮一行）
        bar.innerHTML = `
          <div class="bottom-purchase-info__container" style="width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 8px;">
            <div class="bottom-purchase-info__variant-row" style="display: flex; align-items: center; width: 100%;">
              <div class="bottom-variant-selector" style="flex-grow: 1; margin-right: 5px;">
                <select id="BottomVariantSelector" class="bottom-variant-selector__select" style="height: 40px; padding: 0 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                  ${Array.from(document.querySelectorAll('select.product-form__variants option, select[name^="id"] option, select[name="properties[Title]"] option, .bottom-purchase-dropdown__select[name="option-1"] option')).map(option => {
                    return option.disabled ? '' : `<option value="${option.value}" ${option.selected ? 'selected' : ''}>${option.textContent}</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="bottom-purchase-dropdown__quantity-wrapper">
                <div class="js-qty" style="display: flex; align-items: center;">
                  <button type="button" aria-label="-" class="js-qty__adjust js-qty__adjust--minus icon-fallback-text" data-action="decrease" style="width: 35px; height: 40px; border: 1px solid #ddd; border-radius: 4px 0 0 4px;">
                    <i class="fa fa-minus" aria-hidden="true"></i>
                  </button>
                  <input type="number" class="js-qty__num" value="1" min="1" aria-label="quantity" pattern="[0-9]*" name="quantity-bottom" id="BottomQuantity" data-quantity-input="bottom" style="width: 40px; height: 40px; text-align: center;  border-bottom: 1px solid #ddd; border-left: none; border-right: none;">
                  <button type="button" aria-label="+" class="js-qty__adjust js-qty__adjust--plus icon-fallback-text" data-action="increase" style="width: 35px; height: 40px; border: 1px solid #ddd; border-radius: 0 4px 4px 0;">
                    <i class="fa fa-plus" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="bottom-purchase-info__btn-container" style="width: 100%;">
              <button type="button" aria-label="Add to cart" name="add" id="AddToCart" class="btn bottom-add-to-cart-button" data-bottom-add-to-cart style="width: 100%; height: 44px;">
                <span>Add to cart</span>
              </button>
            </div>
          </div>
        `;
      } else {
        // 无变体 - 只显示一行购买按钮
        bar.innerHTML = `
          <div class="bottom-purchase-info__container" style="width: 100%; margin: 0 auto;">
            <div class="bottom-purchase-info__btn-container" style="width: 100%;">
              <button type="button" aria-label="Add to cart" name="add" id="AddToCart" class="btn bottom-add-to-cart-button" data-bottom-add-to-cart style="width: 100%; height: 44px;">
                <span>Add to cart</span>
              </button>
            </div>
          </div>
        `;
      }
    } else {
      // 桌面端布局 - 保持原样
      bar.innerHTML = `
        <div class="bottom-purchase-info__container" style="max-width: 1600px; width: 100%; margin: 0 auto; display: flex; align-items: center; padding: 0 15px;">
          <div class="bottom-purchase-info__image" style="flex: 0 0 70px; margin-right: 15px;">
            <img src="${productImageSrc}" alt="${productTitle.textContent}" 
                 width="70" height="70" style="object-fit: contain;"
                 class="js-bottom-variant-image"
                 onerror="this.onerror=null;this.src='//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif'">
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
    }
    
    // 添加到页面
    document.body.appendChild(bar);
    
    // 设置底部购买栏
    setupBottomBar(bar);
    
    // 添加窗口大小变化监听，以适应横竖屏切换
    window.addEventListener('resize', function() {
      const isMobileNow = window.innerWidth < 768;
      // 如果设备类型改变，重新生成底部购买栏
      if (isMobileNow !== isMobile) {
        // 移除现有的底部购买栏
        if (bar && bar.parentNode) {
          bar.parentNode.removeChild(bar);
        }
        // 重新创建底部购买栏
        createBottomBar();
      }
    });
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
        // 添加错误处理
        img.onerror = function() {
          this.src = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
        };
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
        reviewBadge.innerHTML = getReviewBadgeHTML();
      }
    }
    
    // 设置添加到购物车按钮
    setupAddToCartButton();
    
    // 立即更新变体图片
    updateVariantImage();
    
    // 在1秒后再尝试一次更新变体图片（防止延迟加载的图片）
    setTimeout(updateVariantImage, 1000);
    
    // 强制刷新review badge（防止异步加载）
    setTimeout(() => {
      const reviewBadge = bottomBar.querySelector('.bottom-purchase-info__review-badge');
      if (reviewBadge && !reviewBadge.querySelector('.bottom-stars-container')) {
        reviewBadge.innerHTML = getReviewBadgeHTML();
      }
    }, 1500);
    
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
      // 更新变体图片
      updateVariantImage();
    });
    
    // 底部选择器变化时更新主选择器
    bottomSelector.addEventListener('change', function() {
      mainSelector.value = this.value;
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      mainSelector.dispatchEvent(event);
      // 更新变体图片
      updateVariantImage();
    });

    // 初始更新变体图片
    updateVariantImage();
  }
  
  // 更新变体图片
  function updateVariantImage() {
    // 获取当前选中的变体ID
    let currentVariantId = null;
    
    // 监听Vue可能提供的当前变体ID
    try {
      // 检查WeTheme可能在DOM中存储的当前变体ID
      const vueForm = document.querySelector('wetheme-product-form');
      if (vueForm && vueForm.hasAttribute('data-current-variant-id')) {
        currentVariantId = vueForm.getAttribute('data-current-variant-id');
      }
    } catch (e) {
      console.error('尝试从Vue组件获取变体ID时出错', e);
    }
    
    // 如果从Vue中没有找到，继续检查其他选择器
    if (!currentVariantId) {
      // 检查各种可能的变体选择器
      const selectors = [
        'select[name^="id"]',
        'input[name="id"]:checked',
        '[name="id"][data-variant-id]',
        '[name="id"][data-product-select]',
        'select.product-form__variants',
        'input[type="hidden"][name="id"]',
        '[data-product-select]',
        'form[action*="/cart/add"] [data-variant-id]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          currentVariantId = element.value || element.getAttribute('data-variant-id');
          break;
        }
      }
    }
    
    // 如果没有找到变体ID，尝试从URL获取
    if (!currentVariantId && window.location.search.includes('variant=')) {
      const params = new URLSearchParams(window.location.search);
      currentVariantId = params.get('variant');
    }
    
    // 查找底部栏图片元素
    const bottomImage = document.querySelector('.js-bottom-variant-image');
    if (!bottomImage) return;
    
    // 查找当前显示的主图片（无论变体ID是否已知）
    const currentMainImage = findCurrentlyDisplayedImage();
    if (currentMainImage && currentMainImage.src) {
      bottomImage.src = currentMainImage.src;
      if (currentVariantId) {
        bottomImage.setAttribute('data-variant-id', currentVariantId);
      }
      return; // 成功找到当前显示的图片
    }
    
    // 如果未找到当前显示的图片并且变体ID未知，使用后备方案
    if (!currentVariantId) {
      updateBottomImageWithFallback();
      return;
    }
    
    let imageUpdated = false;
    
    // 尝试从页面获取变体图片映射
    try {
      // 1. 检查theme-specific变体数据
      const variantImageEls = document.querySelectorAll('[data-variant-id="' + currentVariantId + '"] img, [data-image-id][data-variant-id="' + currentVariantId + '"]');
      if (variantImageEls.length) {
        const variantImage = variantImageEls[0];
        if (variantImage.src || variantImage.getAttribute('data-src')) {
          bottomImage.src = variantImage.src || variantImage.getAttribute('data-src');
          bottomImage.setAttribute('data-variant-id', currentVariantId);
          imageUpdated = true;
        }
      }
      
      // 2. 检查是否有product_json数据
      if (!imageUpdated) {
        const productJsonEl = document.querySelector('[data-product-json]');
        if (productJsonEl) {
          try {
            const productData = JSON.parse(productJsonEl.textContent);
            const currentVariant = productData.variants.find(v => v.id.toString() === currentVariantId.toString());
            
            if (currentVariant && currentVariant.featured_image) {
              bottomImage.src = currentVariant.featured_image.src;
              bottomImage.setAttribute('data-variant-id', currentVariantId);
              imageUpdated = true;
            }
          } catch (e) {
            console.error('解析产品JSON数据出错', e);
          }
        }
      }
      
      // 如果仍未找到图片，使用后备方案
      if (!imageUpdated) {
        updateBottomImageWithFallback();
      }
    } catch (error) {
      console.error('更新变体图片时出错：', error);
      updateBottomImageWithFallback();
    }
  }
  
  // 查找当前显示的主图片
  function findCurrentlyDisplayedImage() {
    // 主题特定的活动图片类和选择器
    const activeImageSelectors = [
      // 常见的活动图片选择器
      '.product-single__photo.slick-current img', 
      '.product__media-item.is-active img', 
      '.product-featured-media',
      '.product-single__media--active img',
      '.product__media.is-active img',
      '.slick-current .product__slide-image',
      '.active .product-single__media img',
      '.active .product-media-item img',
      '.main-img-container img', 
      '.product-image-main img',
      '.product-gallery__image.slick-active',
      '.product__image-container--active img',
      // WeTheme特定选择器
      '.product-single__media--active img',
      '.product-medias__primary .product-medias__primary-image img',
      '.slick-current .product-single__photo img',
      // 常见的Shopify主题选择器
      '.is-selected .product__slide img',
      '[aria-current="true"] .product__media img',
      '.flickity-slider .is-selected img',
      // 最后尝试任何可见的产品图片
      '.product-single__photo:not(.hide) img',
      '.product__media:not(.hide) img'
    ];
    
    // 检查每个选择器
    for (const selector of activeImageSelectors) {
      const img = document.querySelector(selector);
      if (img && img.src && img.offsetParent !== null) { // 确保图片是可见的
        return img;
      }
    }
    
    // 如果没有找到活动图片，尝试找第一个产品图片
    const allProductImages = document.querySelectorAll('.product-single__media img, .product-single__photo img');
    if (allProductImages.length) {
      return allProductImages[0];
    }
    
    return null;
  }
  
  // 使用后备方案更新底部栏图片
  function updateBottomImageWithFallback() {
    const bottomImage = document.querySelector('.js-bottom-variant-image');
    if (!bottomImage) return;
    
    // 如果底部图片已经有src而且不是默认的no-image，就保留现有图片
    if (bottomImage.src && !bottomImage.src.includes('no-image')) {
      return;
    }
    
    // 尝试获取任何产品图片作为后备方案
    const imageSelectors = [
      '.product__media-item img',
      '.product-single__photo img',
      '.product-featured-img',
      '.product__image',
      '.product-single__media img',
      '.featured-img',
      '.product-single__image',
      '.product-image img',
      '[data-product-featured-image]'
    ];
    
    for (const selector of imageSelectors) {
      const img = document.querySelector(selector);
      if (img && img.src) {
        bottomImage.src = img.src;
        return;
      }
    }
    
    // 最后的后备方案 - 使用no-image图片
    bottomImage.src = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
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
        // 更新变体图片
        updateVariantImage();
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

  // 启动购物车抽屉观察器
  setupCartDrawerObserver();
  
  // 启动产品图片观察器
  setupProductImageObserver();

  // 定期检查图片更新（兜底方案）
  setInterval(updateVariantImage, 2000);

  // 每3秒检测一次评分（终极兜底）
  setInterval(() => {
    const badge = document.querySelector('.bottom-purchase-info__review-badge');
    if (badge && !badge.querySelector('.bottom-stars-container, .jdgm-prev-badge, .spr-badge')) {
      badge.innerHTML = getReviewBadgeHTML();
    }
  }, 3000);
});