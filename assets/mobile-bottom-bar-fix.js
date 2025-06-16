// Mobile Bottom Bar Fix - 确保移动端底部购买栏适配良好
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否在产品页面
  const isProductPage = document.body.classList.contains('template-product') || 
                       window.location.pathname.includes('/products/');
  
  if (!isProductPage) {
    console.log('不是产品页面，不初始化底部购买栏');
    return;
  }
  
  // 用于移动端滑动检测
  let lastScrollTop = 0;
  let scrollThreshold = 5;
  const isMobile = window.innerWidth < 768;
  
  // 如果不是移动设备，不执行以下代码
  if (!isMobile) return;

  console.log('移动端产品页面，优化底部购买栏');
  
  // 监听滚动事件，处理移动端上下滑动效果
  function setupScrollListener() {
    window.addEventListener('scroll', function() {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      const bottomBar = document.querySelector('.bottom-purchase-info');
      if (!bottomBar) return;
      
      // 确保底部栏有滑动过渡效果
      if (!bottomBar.hasAttribute('data-slide-transition')) {
        bottomBar.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        bottomBar.setAttribute('data-slide-transition', 'true');
      }
      
      // 如果购物车抽屉打开，不处理滑动效果
      if (document.querySelector('.drawer.drawer--right.drawer--cart')) return;
      
      if (Math.abs(lastScrollTop - st) <= scrollThreshold) return;
      
      if (st > lastScrollTop && st > 150) {
        // 向下滑动且不在页面顶部，显示
        bottomBar.style.transform = 'translateY(0)';
        bottomBar.style.opacity = '1';
      } else if (st < lastScrollTop && st > 10) {
        // 向上滑动，隐藏（除非在很顶部）
        bottomBar.style.transform = 'translateY(100%)';
        bottomBar.style.opacity = '0';
      }
      
      lastScrollTop = st <= 0 ? 0 : st;
    }, {passive: true});
  }
  
  // 创建或修改移动端底部购买栏
  function setupMobileBottomBar() {
    // 移除现有底部栏（如果存在）
    let bottomBar = document.querySelector('.bottom-purchase-info');
    if (bottomBar) {
      bottomBar.parentNode.removeChild(bottomBar);
    }
    
    // 获取产品信息
    const productTitle = document.querySelector('.product-details-product-title, h1.title');
    const productPrice = document.querySelector('#ProductPrice, .product-single__price');
    
    if (!productTitle || !productPrice) {
      console.error('无法找到产品信息，无法创建底部购买栏');
      return;
    }
    
    // 检查产品是否有变体选项
    const productHasMultipleVariants = document.querySelectorAll('.product-form__variants option, select[name^="id"] option').length > 1;
    const hasColorVariant = document.querySelector('.swatch.color');
    const hasTitleVariant = document.querySelector('select[name^="option-"], .single-option-selector') && productHasMultipleVariants;
    const hasRealVariants = productHasMultipleVariants || hasColorVariant || hasTitleVariant;
    
    // 创建底部购买栏
    bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-purchase-info is-visible mobile-bottom-bar';
    bottomBar.style.position = 'fixed';
    bottomBar.style.bottom = '0';
    bottomBar.style.left = '0';
    bottomBar.style.right = '0';
    bottomBar.style.zIndex = '9999';
    bottomBar.style.backgroundColor = '#fff';
    bottomBar.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
    bottomBar.style.padding = '10px 15px';
    bottomBar.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    
    // 构建底部栏HTML
    if (hasRealVariants) {
      // 有变体 - 只显示变体选择器和加购按钮，且各自独占一行
      bottomBar.innerHTML = `
        <div class="bottom-purchase-info__container" style="width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 10px;">
          <div class="bottom-purchase-info__variant-row" style="display: flex; width: 100%;">
            <div class="bottom-variant-selector" style="flex-grow: 1; width: 100%;">
              <select id="BottomVariantSelector" class="bottom-variant-selector__select" style="height: 44px; padding: 0 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 14px; background-color: #fff;">
                ${Array.from(document.querySelectorAll('select.product-form__variants option, select[name^="id"] option, select[name="properties[Title]"] option, .bottom-purchase-dropdown__select[name="option-1"] option')).map(option => {
                  return option.disabled ? '' : `<option value="${option.value}" ${option.selected ? 'selected' : ''}>${option.textContent}</option>`;
                }).join('')}
              </select>
            </div>
          </div>
          <div class="bottom-purchase-info__btn-container" style="width: 100%;">
            <button type="button" aria-label="Add to cart" name="add" id="AddToCart" class="btn bottom-add-to-cart-button" data-bottom-add-to-cart style="width: 100%; height: 44px; font-size: 16px; font-weight: 600; border-radius: 4px; background-color: var(--color-accent, #3a3a3a); color: #fff;">
              <span>Add to cart</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // 无变体 - 只显示一个加购按钮一行
      bottomBar.innerHTML = `
        <div class="bottom-purchase-info__container" style="width: 100%; margin: 0 auto;">
          <div class="bottom-purchase-info__btn-container" style="width: 100%;">
            <button type="button" aria-label="Add to cart" name="add" id="AddToCart" class="btn bottom-add-to-cart-button" data-bottom-add-to-cart style="width: 100%; height: 50px; font-size: 16px; font-weight: 600; border-radius: 4px; background-color: var(--color-accent, #3a3a3a); color: #fff;">
              <span>Add to cart</span>
            </button>
          </div>
        </div>
      `;
    }
    
    // 添加到页面
    document.body.appendChild(bottomBar);
    
    // 设置底部购买栏事件处理
    setupMobileBottomBarEvents(bottomBar, hasRealVariants);
  }
  
  // 设置移动端底部购买栏事件处理
  function setupMobileBottomBarEvents(bottomBar, hasRealVariants) {
    // 同步变体选择器
    const bottomSelector = bottomBar.querySelector('#BottomVariantSelector');
    if (bottomSelector && hasRealVariants) {
      const mainSelector = document.querySelector('select.product-form__variants, select[name^="id"], select[name="properties[Title]"], .bottom-purchase-dropdown__select[name="option-1"]');
      if (mainSelector) {
        // 设置初始值
        bottomSelector.value = mainSelector.value;
        
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
    }
    
    // 设置添加到购物车按钮
    const bottomButton = bottomBar.querySelector('.bottom-add-to-cart-button');
    if (bottomButton) {
      bottomButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 找到主添加到购物车按钮并点击它
        const mainButton = document.querySelector('form[action*="/cart/add"] [type="submit"], button[name="add"]:not(.bottom-add-to-cart-button)');
        if (mainButton) {
          console.log('点击主添加到购物车按钮');
          mainButton.click();
        } else {
          console.error('主添加到购物车按钮未找到，尝试直接提交表单');
          
          // 尝试提交表单
          const form = document.querySelector('form[action*="/cart/add"]');
          if (form) {
            console.log('提交添加到购物车表单');
            form.submit();
          } else {
            console.error('无法找到添加到购物车表单');
          }
        }
      });
    }
    
    // 处理购物车抽屉显示时隐藏底部栏
    function checkCartDrawer() {
      const cartDrawer = document.querySelector('.drawer.drawer--right.drawer--cart');
      
      if (cartDrawer) {
        // 购物车抽屉打开，隐藏底部栏
        bottomBar.style.transform = 'translateY(100%)';
        bottomBar.style.opacity = '0';
        
        // 等待过渡效果完成后再隐藏元素
        setTimeout(() => {
          if (document.querySelector('.drawer.drawer--right.drawer--cart')) {
            bottomBar.style.display = 'none';
          }
        }, 300);
      } else if (bottomBar.style.display === 'none') {
        // 购物车抽屉关闭，显示底部栏
        bottomBar.style.display = 'block';
        
        // 强制重排
        bottomBar.offsetHeight;
        
        // 应用过渡效果
        bottomBar.style.opacity = '1';
        bottomBar.style.transform = 'translateY(0)';
      }
    }
    
    // 初始检查购物车抽屉状态
    checkCartDrawer();
    
    // 定期检查购物车抽屉状态
    setInterval(checkCartDrawer, 500);
  }

  // 执行移动端底部购买栏设置
  setupMobileBottomBar();
  // 设置滚动监听
  setupScrollListener();
  
  // 确保页面底部有足够的空间，防止底部栏遮挡内容
  const mainContent = document.querySelector('main') || document.querySelector('#MainContent');
  if (mainContent) {
    mainContent.style.paddingBottom = '120px';
  }

  // 处理原始底部栏（如果还存在）
  const originalBottomBar = document.querySelector('.bottom-purchase-info:not(.mobile-bottom-bar)');
  if (originalBottomBar) {
    originalBottomBar.style.display = 'none';
  }
}); 