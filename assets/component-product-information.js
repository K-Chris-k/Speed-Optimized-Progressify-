/******/ (() => { // webpackBootstrap
/* eslint-disable */
if (!customElements.get('product-information')) {
  customElements.define('product-information', class ProductInformation extends HTMLElement {
    constructor() {
      super();
      this.dataCache = new Map(); // Cache for pre-fetched data
      this.init();
    }

    init() {
      this.cacheDOMElements();
      this.bindEventHandlers();
    }

    cacheDOMElements() {
      /* ===== Cache any information that we'll need later ===== */
      this.sectionId = this.getAttribute('data-section-id');
      this.originalSectionId = this.getAttribute('data-original-section-id');
      this.isQuickView = this.dataset.quickView === 'true';
      this.productForm = this.querySelector('product-form');
      this.stickyContainer = this.classList.contains('product-sticky') ? this : null;
      this.stickyHeader = document.querySelector('.header-section:has(.header-is-sticky)');
      this.enableURLUpdate = this.dataset.enableUrlUpdate === 'true';
      this.mainProductURL = this.dataset.url;
      this.hasInitialized = false;
      this.initTime = Date.now();
    }

    connectedCallback() {
      /* ===== Gather options for the current variant, handle sticky form offset, attach event listeners ===== */
      this.setStickyOffset();
      this.attachEventListeners();
      this.prefetchVariantData();
      this.isCombinedListing = this.dataset.isCombinedListing === 'true';
      
      // Initialize with correct button state
      setTimeout(() => {
        this.initializeButtonState();
      }, 100);
    }

    disconnectedCallback() {
      /* ===== Clean up event listeners ===== */
      this.removeEventListeners();
    }

    bindEventHandlers() {
      /* ===== Bind methods to maintain the 'this' context ===== */
      this.resizeHandler = this.handleResize.bind(this);
      this.onQuantityChange = this.handleQuantityChange.bind(this);
      this.onVariantChange = this.handleVariantChange.bind(this);
      this.prefetchVariantData = this.prefetchVariantData.bind(this);
    }

    attachEventListeners() {
      // On resize we need to update the sticky form offset
      window.addEventListener('resize', this.resizeHandler);
      // Listen for quantity changes
      eventBus.on('qty:change', this.onQuantityChange);
      // Listen for variant changes
      eventBus.on('variant:change', this.onVariantChange);
    }

    removeEventListeners() {
      /* ===== Remove any event listeners we've attached ===== */
      window.removeEventListener('resize', this.resizeHandler);
      eventBus.off('qty:change', this.onQuantityChange);
      eventBus.off('variant:change', this.onVariantChange);
    }

    prefetchVariantData() {
      const variants = this.querySelectorAll('[data-product-variant]');
      if (!variants.length) return;

      variants.forEach(variant => {
        const productFetchUrl = variant.getAttribute('data-product-fetch-url');

        if (productFetchUrl && !this.dataCache.has(productFetchUrl)) {
          this.fetchProductData(productFetchUrl).catch(error => {
            console.error(`Failed to fetch data for ${productFetchUrl}:`, error);
          });
        }
      });
    }

    async fetchProductData(productFetchUrl) {
      try {
        const response = await fetch(`${productFetchUrl}&section_id=${this.originalSectionId}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok for ${productFetchUrl}`);
        }
        const data = await response.text();
        const productData = this.extractProductData(data);
        this.dataCache.set(productFetchUrl, productData);
      } catch (error) {
        console.error(`Failed to fetch product data from ${productFetchUrl}:`, error);
      }
    }

    async fetchVariantData(productFetchUrl, context) {
      /* ===== Fetch the product data if it's not already cached ===== */
      if (!this.dataCache.has(productFetchUrl)) {
        await this.fetchProductData(productFetchUrl);
      }
      this.updateDOMWithData(context);
    }

    extractProductData(data) {
      /* ===== Parse the fetched data and return the new product data ===== */
      const parser = new DOMParser();
      const htmlDocument = parser.parseFromString(data, 'text/html');
      const productInformation = htmlDocument.querySelector('product-information');
      const quickViewContent = htmlDocument.querySelector('template[data-quick-view-product]')?.content;

      const quickViewContentInformation = quickViewContent?.querySelector('product-information');
      const productDataElement = this.isQuickView && quickViewContentInformation ? quickViewContentInformation : productInformation;

      const productMedia = htmlDocument.querySelector('[data-product-media-wrapper]');
      const quickViewMedia = quickViewContent?.querySelector('[data-product-media-wrapper]');
      const productBadges = this.isQuickView && quickViewMedia ? quickViewMedia.querySelectorAll('[data-product-badge]') : productMedia?.querySelectorAll('[data-product-badge]');

      if (this.isCombinedListing || productBadges.length) {
        const productMediaElement = this.isQuickView && quickViewMedia ? quickViewMedia : productMedia;
        const productDiv = document.createElement('div');
        productDiv.setAttribute('data-url', productInformation?.getAttribute('data-url'));
        productDiv.appendChild(productMediaElement);
        productDiv.appendChild(productDataElement);

        return productDiv.outerHTML;
      }

      return productDataElement.outerHTML;
    }

    handleResize() {
      /* ===== Handle resizing of the window ===== */
      if (window.Shopify.designMode) {
        // If we're in the theme editor we need to update the sticky form offset
        // We only do this in the editor because it's not necessary in the live site
        // because mobile devices can incorrectly trigger resize events when scrolling
        this.setStickyOffset();
      }
    }

    handleQuantityChange(event) {
      /* ===== Handle changes to the quantity input ===== */

      // Update the quantity input value
      this.productForm = this.querySelector('product-form');
      this.formQuantityInput = this.productForm?.querySelector('[name="quantity"]');

      if (this.formQuantityInput && event.value) {
        if (event.sectionId && event.sectionId !== this.sectionId) return;
        this.formQuantityInput.value = event.value;
      }
    }

    setStickyOffset() {
      if (this.stickyContainer && this.stickyHeader) {
        // Set the top offset of the sticky form to the height of the sticky header
        this.stickyContainer.style.top = `${this.stickyHeader.offsetHeight + 30}px`;
      }
    }

    async handleVariantChange(context) {
      /* ===== Handle changes to the variant ===== */
      if (context.sectionId && context.sectionId !== this.sectionId) return;

      // Update the current variant based on the selected options
      this.currentVariant = context.variant;
      this.productFetchUrl = context.fetchURL;
      this.productUrl = context.productURL;

      // If we don't have a valid variant, handle it and return
      // BUT SKIP if we're currently processing a quantity change OR during initial load
      if (!this.currentVariant) {
        // Check if we're processing a quantity change to avoid interfering
        if (document.body.hasAttribute('data-quantity-changing') || 
            document.body.hasAttribute('data-quantity-button-clicked')) {
          console.log('Skipping invalid variant handling during quantity change');
          return;
        }
        
        // Check if this is initial page load - try to get default variant first
        if (!this.hasInitialized) {
          this.tryGetDefaultVariant();
          this.hasInitialized = true;
          if (this.currentVariant) {
            // We found a default variant, continue with normal flow
            this.toggleAddButton(this.currentVariant.available);
            return;
          }
        }
        
        this.handleInvalidVariant();
        return;
      }

      if (!this.productFetchUrl || !this.productUrl) return;

      // If the variant is available, update the UI
      this.toggleAddButton(this.currentVariant.available);
      const isCached = this.dataCache.has(this.productFetchUrl);

      if (isCached) {
        this.updateDOMWithData(context);
      } else {
        // If the data is not cached, fetch the product data and then update the UI
        await this.fetchVariantData(this.productFetchUrl, context);
      }

      // Refocus on the active radio input
      const activeRadioInput = this.querySelector('input[type="radio"][name^="option-"]:checked');
      if (activeRadioInput && !context.fromSlideChange) {
        activeRadioInput.focus();
      }
    }

    handleInvalidVariant() {
      /* ===== Handle an invalid variant ===== */
      // Double-check: don't interfere during quantity changes
      if (document.body.hasAttribute('data-quantity-changing') || 
          document.body.hasAttribute('data-quantity-button-clicked')) {
        console.log('Aborting invalid variant handling - quantity change in progress');
        return;
      }
      
      // Additional protection: don't handle invalid variant during initial page load
      if (!this.hasInitialized) {
        console.log('Aborting invalid variant handling - page still initializing');
        return;
      }
      
      // Add a delay to prevent premature invalid variant handling
      if (Date.now() - (this.initTime || 0) < 2000) {
        console.log('Aborting invalid variant handling - too soon after initialization');
        return;
      }

      console.log('Handling invalid variant');
      const productFetchUrl = this.buildRequestUrlWithParams();
      this.fetchNullVariantData(productFetchUrl);

      // If the variant is invalid, disable the add to cart button
      this.toggleAddButton(false);
      // If the variant is invalid, set the add to cart button text to "unavailable"
      const addButton = this.productForm?.querySelector('[name="add"]');
      if (!addButton) return;
      const addButtonSpan = addButton.querySelector('[data-add-to-cart-text]');
      if (!addButtonSpan) return;

      addButtonSpan.textContent = addButtonSpan.getAttribute('data-unavailable-text');

      // If the variant is invalid, set the price to "Unavailable"
      const priceElement = this.querySelector('[data-product-price]');
      if (!priceElement) return;
      const priceElementSpan = priceElement.querySelector('span[data-price-text]');
      if (!priceElementSpan) return;

      priceElementSpan.textContent = priceElementSpan.getAttribute('data-unavailable-text');
    }

    tryGetDefaultVariant() {
      /* ===== Try to get the default/first available variant ===== */
      try {
        // Try to get variant from product JSON data
        const productJsonElement = document.querySelector('[data-product-json]');
        if (productJsonElement) {
          const productData = JSON.parse(productJsonElement.textContent);
          if (productData && productData.variants && productData.variants.length > 0) {
            // Fallback: try to get variant from URL parameters first
            const urlParams = new URLSearchParams(window.location.search);
            const variantId = urlParams.get('variant');
            if (variantId) {
              const urlVariant = productData.variants.find(v => v.id.toString() === variantId);
              if (urlVariant) {
                this.currentVariant = urlVariant;
                console.log('Found variant from URL:', variantId);
                return;
              }
            }
            
            // Find the first available variant or use the first variant
            const availableVariant = productData.variants.find(v => v.available) || productData.variants[0];
            if (availableVariant) {
              this.currentVariant = availableVariant;
              console.log('Found default variant:', availableVariant.id);
              return;
            }
          }
        }
        
        console.log('No default variant found');
      } catch (error) {
        console.error('Error getting default variant:', error);
      }
    }

    initializeButtonState() {
      /* ===== Initialize button with correct state on page load ===== */
      console.log('Initializing button state');
      
      try {
        // Try to get default variant if we don't have one
        if (!this.currentVariant) {
          this.tryGetDefaultVariant();
        }
        
        // If we still don't have a variant, try to get it from the page
        if (!this.currentVariant) {
          const productJsonElement = document.querySelector('[data-product-json]');
          if (productJsonElement) {
            const productData = JSON.parse(productJsonElement.textContent);
            if (productData && productData.variants && productData.variants.length > 0) {
              // Use the selected variant or first available variant
              this.currentVariant = productData.selected_or_first_available_variant || 
                                   productData.variants.find(v => v.available) || 
                                   productData.variants[0];
            }
          }
        }
        
        // Set correct button state
        if (this.currentVariant) {
          console.log('Setting button state for variant:', this.currentVariant.id, 'available:', this.currentVariant.available);
          this.toggleAddButton(this.currentVariant.available);
          this.setCorrectButtonText(this.currentVariant.available);
        } else {
          console.log('No variant found, using default available state');
          // Default to available state if no variant is found
          this.toggleAddButton(true);
          this.setCorrectButtonText(true);
        }
        
        this.hasInitialized = true;
      } catch (error) {
        console.error('Error initializing button state:', error);
        // Default to available state on error
        this.toggleAddButton(true);
        this.setCorrectButtonText(true);
      }
    }

    setCorrectButtonText(isAvailable) {
      /* ===== Set the correct button text based on availability ===== */
      const addButton = this.productForm?.querySelector('[name="add"]');
      if (!addButton) return;
      
      const addButtonSpan = addButton.querySelector('[data-add-to-cart-text]');
      if (!addButtonSpan) return;
      
      if (isAvailable) {
        // Reset to default text (remove any "Unavailable" text)
        const defaultText = addButtonSpan.textContent.includes('Unavailable') ? 
                           'Add to cart' : addButtonSpan.textContent;
        
        // Try to get the correct text from the original HTML
        const originalText = addButtonSpan.getAttribute('data-original-text') || 
                           addButtonSpan.dataset.originalText ||
                           'Add to cart';
        
        addButtonSpan.textContent = originalText;
      } else {
        // Set to sold out text
        addButtonSpan.textContent = 'Sold out';
      }
    }

    buildRequestUrlWithParams(shouldFetchFullPage = false) {
      const params = [];
      const optionValues = this.selectedOptionValues;

      !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);

      if (optionValues.length) {
        params.push(`option_values=${optionValues.join(',')}`);
      }

      return `${this.mainProductURL}?${params.join('&')}`;
    }

    get selectedOptionValues() {
      return Array.from(this.querySelectorAll('li[data-product-variant][selected], input[data-product-variant]:checked')).map(
        ({ dataset }) => dataset.optionValueId
      );
    }

    async fetchNullVariantData(productFetchUrl) {
      /* ===== Fetch the product data if it's not already cached ===== */
      try {
        const response = await fetch(`${productFetchUrl}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok for ${productFetchUrl}`);
        }
        const data = await response.text();
        const productData = this.extractProductData(data);
        this.dataCache.set(productFetchUrl, productData);
        this.updateNullVariant(data);
      } catch (error) {
        console.error(`Failed to fetch product data from ${productFetchUrl}:`, error);
      }
    }

    updateNullVariant(data) {
      const html = this.parseHTML(data);
      const productInformation = html.querySelector('product-information');
      
      // Replace the product options with the new data
      this.updateOptions(html, { productURL: productInformation?.getAttribute('data-url') });
    }

    updateDOMWithData(context) {
      /* ===== Update the UI with the cached data ===== */
      if (this.enableURLUpdate) this.updateURL();

      const data = this.dataCache.get(context.fetchURL);
      const html = this.parseHTML(data);
      this.updateDOM(html, context);
    }

    parseHTML(data) {
      /* ===== Parse the fetched data into a DOM object ===== */
      return new DOMParser().parseFromString(data, 'text/html');
    }

    updateDOM(html, context = {}) {
      /* ===== Update the DOM with the fetched data ===== */
      this.replaceElements(html, context);

      if (context.fromSlideChange) return;

      // Emit an event to let other components know the variant was updated
      eventBus.emit('variant:updated', {
        variant: this.currentVariant,
        sectionId: this.sectionId,
        isCombinedListing: context.isCombinedListing
      });
    }

    toggleAddButton(enable) {
      /* ===== Toggle the add to cart button based on the variant availability ===== */
      const addButton = this.productForm?.querySelector('[name="add"]');
      if (addButton) {
        addButton.toggleAttribute('disabled', !enable);
      }
    }

    updateURL() {
      /* ===== Update the URL with the current variant ID ===== */
      if (this.currentVariant) {
        window.history.replaceState({}, '', `${this.productFetchUrl}`);
      }
    }

    updateOptions(html, context = {}) {
      /* ===== Update the product options with the new data ===== */
      if (!html) return;

      const productInformation = html.querySelector(`product-information[data-url="${context.productURL}"]`);
      if (!productInformation) return;
    
      const currentElements = Array.from(this.querySelectorAll('[data-product-options]'));

      // Update existing options
      currentElements.forEach(currentElement => {
        const currentUpdateId = currentElement.getAttribute('data-update-id');
        const newElement = productInformation.querySelector(`[data-update-id="${currentUpdateId}"]`);
        if (newElement) {
          // Replace the element if it has the data-replace-content attribute, otherwise update the innerHTML
          currentElement.replaceWith(newElement);
        }
      });
    }

    replaceElements(html, context = {}) {
      /* ===== Replace elements in the DOM with new elements ===== */
      if (!html) return;
    
      const productInformation = html.querySelector(`product-information[data-url="${context.productURL}"]`);
      if (!productInformation) return;

      const currentElements = Array.from(this.querySelectorAll('[data-update-id]'));
      const newElements = Array.from(productInformation.querySelectorAll('[data-update-id]'));
    
      // Update existing elements and track their order
      currentElements.forEach(currentElement => {
        const currentUpdateId = currentElement.getAttribute('data-update-id');
        const newElement = productInformation.querySelector(`[data-update-id="${currentUpdateId}"]`);
        if (newElement) {
          // Replace the element if it has the data-replace-content attribute, otherwise update the innerHTML
          newElement.hasAttribute('data-replace-content') ? currentElement.replaceWith(newElement) : currentElement.innerHTML = newElement.innerHTML;
        }
      });
    
      // Add new elements in the correct order
      newElements.forEach(newElement => {
        const newUpdateId = newElement.getAttribute('data-update-id');
        const existingElement = this.querySelector(`[data-update-id="${newUpdateId}"]`);
    
        if (!existingElement) {
          // Determine the correct position to insert the new element
          let inserted = false;
          for (let i = 0; i < currentElements.length; i++) {
            const currentElement = currentElements[i];
            const currentUpdateId = currentElement.getAttribute('data-update-id');
            if (currentUpdateId > newUpdateId) {
              currentElement.insertAdjacentElement('beforebegin', newElement.cloneNode(true));
              inserted = true;
              break;
            }
          }
          // If not inserted, append to the end
          if (!inserted) {
            this.appendChild(newElement.cloneNode(true));
          }
        }
      });

      const productMedia = html.querySelector('[data-product-media-wrapper]');
      const productWrapper = this.closest('[data-product-content-wrapper]');
      const currentProductMedia = productWrapper?.querySelector('[data-product-media-wrapper]');

      // Update the badges if they exist
      const currentBadges = currentProductMedia ? currentProductMedia.querySelectorAll('[data-product-badge]') : null;
      const newBadges = productMedia ? productMedia.querySelectorAll('[data-product-badge]') : null;

      if (currentBadges && newBadges) {
        currentBadges.forEach((badge, index) => {
          const newBadge = newBadges[index];
          if (newBadge) {
            badge.replaceWith(newBadge);
          }
        });
      }
    
      if (this.isCombinedListing && context.isCombinedListing) {
        if (productMedia && currentProductMedia) currentProductMedia.replaceWith(productMedia);
      }
    
      if (window.Shopify && window.Shopify.PaymentButton) {
        window.Shopify.PaymentButton.init();
      }
    }    
  });
}
/******/ })()
;