document.addEventListener("DOMContentLoaded", function () {
  const facetTags = document.querySelectorAll(".facet-tag");
  const products = document.querySelectorAll(".product-item-collection-tab");
  const facetsDisplay = document.querySelector('.facets__display');
  
  if (window.innerWidth <= 768) {
      // 创建一个占位元素
      const placeholder = document.createElement('div');
      placeholder.style.display = 'none';
      facetsDisplay.parentNode.insertBefore(placeholder, facetsDisplay);

      // 获取导航栏高度
      function getMobileNavHeight() {
          const mobileNavBar = document.querySelector('.nav-bar.mobile-nav-bar-wrapper');
          return mobileNavBar ? mobileNavBar.offsetHeight : 60;
      }

      // 更新导航栏高度
      function updateMobileNavHeight() {
          const height = getMobileNavHeight();
          document.documentElement.style.setProperty('--mobile-nav-height', height + 'px');
      }

      const sentinel = document.querySelector('.sticky-sentinel');
      const observer = new IntersectionObserver(
          ([entry]) => {
              if (!entry.isIntersecting) {
                  if (!facetsDisplay.classList.contains('is-sticky')) {
                      placeholder.style.height = facetsDisplay.offsetHeight + 'px';
                      placeholder.style.display = 'block';
                      facetsDisplay.classList.add('is-sticky');
                  }
              } else {
                  facetsDisplay.classList.remove('is-sticky');
                  placeholder.style.display = 'none';
              }
          },
          {
              threshold: 0,
              rootMargin: `-${getMobileNavHeight()}px 0px 0px 0px`
          }
      );

      observer.observe(sentinel);

      window.addEventListener('resize', () => {
          updateMobileNavHeight();
          observer.disconnect();
          observer.observe(sentinel);
      });

      window.addEventListener('scroll', () => {
          if (facetsDisplay.classList.contains('is-sticky')) {
              updateMobileNavHeight();
          }
      });

      updateMobileNavHeight();
  }

  filterProducts("all");

  facetTags.forEach(tag => {
      tag.addEventListener("click", function () {
          const selectedTag = this.getAttribute("data-tag") || this.textContent.trim();
          
          facetTags.forEach(t => t.classList.remove("active"));
          this.classList.add("active");

          filterProducts(selectedTag);
      });
  });

  function filterProducts(tag) {
      if (tag === "all") {
          products.forEach(product => {
              product.style.display = "block";
          });
      } else {
          
          products.forEach(product => {
              const productTags = product.getAttribute("data-tags");
              if (productTags && productTags.split(",").map(t => t.trim()).includes(tag)) {
                  product.style.display = "block";
              } else {
                  product.style.display = "none";
              }
          });
      }
    
      setTimeout(() => {
          window.equalizeProductTitleHeights();
      }, 50);
  }
});
