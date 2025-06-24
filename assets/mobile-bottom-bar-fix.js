document.addEventListener('DOMContentLoaded', function () {
  const isProductPage = document.body.classList.contains('template-product') || 
                        window.location.pathname.includes('/products/');

  if (!isProductPage) {
    console.log('不是产品页面，不初始化底部购买栏');
    return;
  }

  let lastScrollTop = 0;
  const scrollThreshold = 5;
  const isMobile = window.innerWidth < 768;

  if (!isMobile) return;

  console.log('移动端产品页面，优化底部购买栏');

  function setupScrollListener() {
    window.addEventListener('scroll', function () {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      const bottomBar = document.querySelector('.bottom-purchase-info');
      if (!bottomBar) return;

      if (!bottomBar.hasAttribute('data-slide-transition')) {
        bottomBar.style.transition = 'bottom 0.3s ease-out, opacity 0.3s ease-out';
        bottomBar.setAttribute('data-slide-transition', 'true');
      }

      if (document.querySelector('.drawer.drawer--right.drawer--cart')) return;
      if (Math.abs(lastScrollTop - st) <= scrollThreshold) return;

      if (st > lastScrollTop && st > 150) {
        bottomBar.style.bottom = '0px';
        bottomBar.style.opacity = '1';
      } else if (st < lastScrollTop && st > 10) {
        bottomBar.style.bottom = '-100px';
        bottomBar.style.opacity = '0';
      }

      lastScrollTop = st <= 0 ? 0 : st;
    }, { passive: true });
  }

  function setupMobileBottomBar() {
    let bottomBar = document.querySelector('.bottom-purchase-info');
    if (bottomBar) bottomBar.parentNode.removeChild(bottomBar);

    const productTitle = document.querySelector('.product-details-product-title, h1.title');
    const productPrice = document.querySelector('#ProductPrice, .product-single__price');

    if (!productTitle || !productPrice) {
      console.error('无法找到产品信息，无法创建底部购买栏');
      return;
    }

    const productHasMultipleVariants = document.querySelectorAll('.product-form__variants option, select[name^="id"] option').length > 1;
    const hasColorVariant = document.querySelector('.swatch.color');
    const hasTitleVariant = document.querySelector('select[name^="option-"], .single-option-selector') && productHasMultipleVariants;
    const hasRealVariants = productHasMultipleVariants || hasColorVariant || hasTitleVariant;

    bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-purchase-info is-visible mobile-bottom-bar';
    bottomBar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background-color: #fff;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      padding: 10px 15px;
      transition: bottom 0.3s ease-out, opacity 0.3s ease-out;
    `;

    if (hasRealVariants) {
      bottomBar.innerHTML = `
        <div class="bottom-purchase-info__container" style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
          <div class="bottom-purchase-info__variant-row" style="display: flex; width: 100%;">
            <div class="bottom-variant-selector" style="flex-grow: 1; width: 100%;">
              <select id="BottomVariantSelector" class="bottom-variant-selector__select" style="height: 44px; padding: 0 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; font-size: 14px; background-color: #fff; position: relative; z-index: 10000;">
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
      bottomBar.innerHTML = `
        <div class="bottom-purchase-info__container" style="width: 100%;">
          <div class="bottom-purchase-info__btn-container" style="width: 100%;">
            <button type="button" aria-label="Add to cart" name="add" id="AddToCart" class="btn bottom-add-to-cart-button" data-bottom-add-to-cart style="width: 100%; height: 50px; font-size: 16px; font-weight: 600; border-radius: 4px; background-color: var(--color-accent, #3a3a3a); color: #fff;">
              <span>Add to cart</span>
            </button>
          </div>
        </div>
      `;
    }

    document.body.appendChild(bottomBar);
    setupMobileBottomBarEvents(bottomBar, hasRealVariants);
  }

  function setupMobileBottomBarEvents(bottomBar, hasRealVariants) {
    const bottomSelector = bottomBar.querySelector('#BottomVariantSelector');
    if (bottomSelector && hasRealVariants) {
      const mainSelector = document.querySelector('select.product-form__variants, select[name^="id"], select[name="properties[Title]"], .bottom-purchase-dropdown__select[name="option-1"]');
      if (mainSelector) {
        bottomSelector.value = mainSelector.value;

        mainSelector.addEventListener('change', function () {
          bottomSelector.value = this.value;
        });

        bottomSelector.addEventListener('change', function () {
          mainSelector.value = this.value;
          const event = new Event('change', { bubbles: true });
          mainSelector.dispatchEvent(event);
        });
      }
    }

    const bottomButton = bottomBar.querySelector('.bottom-add-to-cart-button');
    if (bottomButton) {
      bottomButton.addEventListener('click', function (e) {
        e.preventDefault();
        const mainButton = document.querySelector('form[action*="/cart/add"] [type="submit"], button[name="add"]:not(.bottom-add-to-cart-button)');
        if (mainButton) {
          console.log('点击主添加到购物车按钮');
          mainButton.click();
        } else {
          console.error('主添加到购物车按钮未找到，尝试提交表单');
          const form = document.querySelector('form[action*="/cart/add"]');
          if (form) form.submit();
          else console.error('无法找到添加到购物车表单');
        }
      });
    }

    function checkCartDrawer() {
      const cartDrawer = document.querySelector('.drawer.drawer--right.drawer--cart');

      if (cartDrawer) {
        bottomBar.style.bottom = '-100px';
        bottomBar.style.opacity = '0';
        setTimeout(() => {
          if (document.querySelector('.drawer.drawer--right.drawer--cart')) {
            bottomBar.style.display = 'none';
          }
        }, 300);
      } else if (bottomBar.style.display === 'none') {
        bottomBar.style.display = 'block';
        bottomBar.offsetHeight; // 强制重排
        bottomBar.style.opacity = '1';
        bottomBar.style.bottom = '0';
      }
    }

    checkCartDrawer();
    setInterval(checkCartDrawer, 500);
  }

  setupMobileBottomBar();
  setupScrollListener();

  const mainContent = document.querySelector('main') || document.querySelector('#MainContent');
  if (mainContent) {
    mainContent.style.paddingBottom = '120px';
  }

  const originalBottomBar = document.querySelector('.bottom-purchase-info:not(.mobile-bottom-bar)');
  if (originalBottomBar) {
    originalBottomBar.style.display = 'none';
  }
});
