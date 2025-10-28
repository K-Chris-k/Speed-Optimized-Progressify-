// Bottom Bar Fix Simple - 简化版底部购买栏修复
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否在产品页面
  const isProductPage = document.body.classList.contains('template-product') || 
                       window.location.pathname.includes('/products/');
  
  if (!isProductPage) {
    return;
  }
  
  // 监听滚动事件，处理移动端上下滑动效果
  let lastScrollTop = 0;
  let scrollThreshold = 5;
  let isMobile = window.innerWidth < 768;
  
  window.addEventListener('scroll', function() {
    if (!isMobile) return;
    
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
      bottomBar.classList.add('is-visible');
    } else if (st < lastScrollTop) {
      // 向上滑动，隐藏
      bottomBar.style.transform = 'translateY(100%)';
      bottomBar.style.opacity = '0';
      bottomBar.classList.remove('is-visible');
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
        bottomBar.classList.add('is-visible');
      }
    }
  }, {passive: true});
  
  // 确保页面有足够的底部填充，以防止内容被底部栏遮挡
  const mainContent = document.querySelector('main') || document.querySelector('#MainContent');
  if (mainContent) {
    mainContent.style.paddingBottom = '70px';
  }
});
