/******/ (() => { // webpackBootstrap
/* eslint-disable */
class ProductSwatch extends HTMLElement {
  constructor() {
    super();

    /* ===== Bind the event handlers in order to maintain the correct context of 'this' ===== */
    this.onSwatchChangeBound = this.onSwatchChange.bind(this);
    this.onColorSwatchMouseEnterBound = this.onColorSwatchMouseEnter.bind(this);
    this.onSwatchMouseLeaveBound = this.onSwatchMouseLeave.bind(this);
    this.onSwatchClickBound = this.onSwatchClick.bind(this);
  }

  connectedCallback() {
    this.colorLabelContainer = this.querySelector('[data-color-swatch-name-container]');
    this.colorLabel = this.querySelector('[data-color-swatch-name]');
    this.colorLabelState = this.querySelector('[data-color-swatch-state]');
    this.soldOutString = this.getAttribute('data-swatch-sold-out-string');
    this.colorSwatches = this.querySelectorAll('.swatch-element.color');
    this.allSwatches = this.querySelectorAll('.swatch-element');
    this.sectionId = this.getAttribute('data-section-id');
    this.productId = this.getAttribute('data-product-id');
    this.optionIndex = parseInt(this.getAttribute('data-option-index'), 10);
    
    this.setEventListeners();
    this.setColorLabelState();
    this.setupBottomAddToCartButton();
  }

  setEventListeners() {
    /* ===== Attach the event listeners to the DOM elements ===== */
    this.colorSwatches.forEach(swatch => {
      swatch.addEventListener('mouseenter', this.onColorSwatchMouseEnterBound);
      swatch.addEventListener('mouseleave', this.onSwatchMouseLeaveBound);
    });
    
    // Add click event to all swatches
    this.allSwatches.forEach(swatch => {
      swatch.addEventListener('click', this.onSwatchClickBound);
    });

    this.addEventListener('change', this.onSwatchChangeBound);
    
    // Listen for variant changes from bottom purchase component
    document.addEventListener('bottom-purchase:variant-change', this.handleBottomPurchaseVariantChange.bind(this));
  }
  
  handleBottomPurchaseVariantChange(event) {
    const { productId, optionIndex, optionValue } = event.detail;
    
    // Check if this event is for this product and option
    if (productId !== this.productId || optionIndex !== this.optionIndex) {
      return;
    }
    
    // Find the swatch with matching value
    const matchingSwatch = Array.from(this.allSwatches).find(swatch => {
      return swatch.getAttribute('data-value') === optionValue;
    });
    
    if (matchingSwatch) {
      // Find the input and check it
      const input = matchingSwatch.querySelector('input');
      if (input && !input.checked) {
        input.checked = true;
        
        // Update active class
        this.updateActiveClass(matchingSwatch);
        
        // Update color label if needed
        if (matchingSwatch.classList.contains('color')) {
          this.updateColorLabel(matchingSwatch);
        }
      }
    }
  }
  
  updateActiveClass(activeSwatch) {
    // Remove active class from all swatches
    this.allSwatches.forEach(swatch => {
      swatch.classList.remove('active');
      swatch.classList.remove('sibling-hover-active');
    });
    
    // Add active class to the selected swatch
    activeSwatch.classList.add('active');
  }
  
  onSwatchClick(event) {
    const swatch = event.currentTarget;
    const input = swatch.querySelector('input');
    
    if (!input) return;
    
    // Update active class
    this.updateActiveClass(swatch);
    
    // Dispatch custom event for bottom purchase component
    this.dispatchBottomPurchaseEvent(swatch);
  }
  
  dispatchBottomPurchaseEvent(swatch) {
    const variantId = swatch.getAttribute('data-swatch-variant-id');
    const optionValue = swatch.getAttribute('data-value');
    
    if (!variantId || !optionValue || !this.productId) return;
    
    // Create and dispatch a custom event for the bottom purchase component
    const event = new CustomEvent('swatch:variant-change', {
      bubbles: true,
      detail: {
        productId: this.productId,
        variantId: variantId,
        optionIndex: this.optionIndex,
        optionValue: optionValue
      }
    });
    
    document.dispatchEvent(event);
  }

  setColorLabelState() {
    /* ===== Set the color label state based on the active swatch ===== */
    const activeSwatch = this.querySelector('.swatch-element.color.active');
    if (!activeSwatch) return;

    const activeSwatchAvailable = activeSwatch.getAttribute('data-swatch-option-available');
    if (!this.soldOutString || !this.colorLabelState) return;

    // Set color label state (sold out or not)
    this.updateColorLabelState(activeSwatchAvailable);

    /* ===== Keep track of the current label ===== */
    this.currentLabel = '';
    if (this.colorLabel) this.currentLabel = this.colorLabel.textContent;
  }

  updateColorLabelState(available) {
    /* ===== Set the color label state (sold out or not) ===== */
    if (this.colorLabelState) {
      this.colorLabelState.innerText = available === 'false' ? `(${this.soldOutString})` : '';
    }
  }

  onSwatchChange(event) {
    const input = event.target;
    const currentVariant = this.getVariantData(input.id);
    const productUrl = input.getAttribute('data-product-url');
    const productFetchUrl = input.getAttribute('data-product-fetch-url');
    const isCombinedListing = input.getAttribute('data-is-combined-listing') === 'true';

    // Update the active class on the swatch element
    const swatchElement = input.closest('.swatch-element');
    if (swatchElement) {
      this.updateActiveClass(swatchElement);
    }

    this.emitVariantChangeEvent(currentVariant, productFetchUrl, productUrl, isCombinedListing);
    
    // Update bottom button text when variant changes
    setTimeout(() => this.updateBottomButtonText(), 100);
  }

  emitVariantChangeEvent(variant, productFetchUrl, productUrl, isCombinedListing = false) {
    /* ===== Emit the variant:change event ===== */
    if (typeof eventBus !== 'undefined' && eventBus.emit) {
      eventBus.emit('variant:change', {
        sectionId: this.sectionId,
        variant: variant,
        fetchURL: productFetchUrl,
        productURL: productUrl,
        isCombinedListing: isCombinedListing
      });
    } else {
      // Fallback to custom event
      const event = new CustomEvent('variant:change', {
        bubbles: true,
        detail: {
          sectionId: this.sectionId,
          variant: variant,
          fetchURL: productFetchUrl,
          productURL: productUrl,
          isCombinedListing: isCombinedListing
        }
      });
      
      document.dispatchEvent(event);
    }
  }

  onColorSwatchMouseEnter(event) {
    /* ===== Update the color label on mouse enter ===== */
    this.updateColorLabel(event.currentTarget);
    
    // Add sibling hover active class
    const activeSwatch = this.querySelector('.swatch-element.color.active');
    if (activeSwatch && !event.currentTarget.classList.contains('active')) activeSwatch.classList.add('sibling-hover-active');
  }

  onSwatchMouseLeave() {
    /* ===== Reset the color label on mouse leave ===== */
    // Remove sibling hover active class
    const siblingHoverActiveSwatch = this.querySelector('.swatch-element.sibling-hover-active');
    if (siblingHoverActiveSwatch) siblingHoverActiveSwatch.classList.remove('sibling-hover-active');

    // Reset color label
    this.resetColorLabel();
  }

  updateColorLabel = (swatch) => {
    /* ===== Update the color label based on the swatch value ===== */
    if (!swatch) return;
    const label = swatch.getAttribute('data-value');
    const swatchAvailable = swatch.getAttribute('data-swatch-option-available');

    if (!label || !this.colorLabel) return;
    // Set color label text
    this.colorLabel.textContent = label;
    this.animateColorLabel(label);
    // Set color label state (sold out or not)
    this.updateColorLabelState(swatchAvailable);
  }

  resetColorLabel = () => {
    /* ===== Reset the color label to the active swatch value ===== */
    const activeSwatch = this.querySelector('.swatch-element.color.active');
    if (!activeSwatch || !this.colorLabel) return;

    const activeSwatchValue = activeSwatch.getAttribute('data-value');
    const swatchAvailable = activeSwatch.getAttribute('data-swatch-option-available');
    if (!activeSwatchValue) return;

    // Reset color label text
    this.colorLabel.textContent = activeSwatchValue;
    this.animateColorLabel(activeSwatchValue);
    // Reset color label state (sold out or not)
    this.updateColorLabelState(swatchAvailable);
  }

  animateColorLabel(label) {
    if (label === this.currentLabel) return;

    /* ===== Animate the color label if label has changed ===== */
    this.colorLabelContainer.classList.remove('fade-in-label');
    void this.colorLabelContainer.offsetWidth; // Force reflow to reset the animation
    this.colorLabelContainer.classList.add('fade-in-label');

    /* ===== Keep track of the current label ===== */
    this.currentLabel = label;
  }

  removeEventListeners() {
    /* ===== Remove the event listeners from the DOM elements ===== */
    this.colorSwatches.forEach(swatch => {
      swatch.removeEventListener('mouseenter', this.onColorSwatchMouseEnterBound);
      swatch.removeEventListener('mouseleave', this.onSwatchMouseLeaveBound);
    });
    
    this.allSwatches.forEach(swatch => {
      swatch.removeEventListener('click', this.onSwatchClickBound);
    });

    this.removeEventListener('change', this.onSwatchChangeBound);
    document.removeEventListener('bottom-purchase:variant-change', this.handleBottomPurchaseVariantChange);
  }

  getVariantData(inputId) {
    const dataElement = this.getVariantDataElement(inputId);
    if (!dataElement) return null;
    
    try {
      return JSON.parse(dataElement.textContent);
    } catch (e) {
      console.error('Error parsing variant data:', e);
      return null;
    }
  }

  getVariantDataElement(inputId) {
    return this.querySelector(`script[type="application/json"][data-resource="${inputId}"]`);
  }

  setupBottomAddToCartButton() {
    /* ===== Setup bottom add to cart button functionality ===== */
    const bottomButton = this.querySelector('[data-bottom-add-to-cart-swatch]');
    if (!bottomButton) return;

    // Update bottom button text based on variant availability
    this.updateBottomButtonText();

    // Listen for variant changes to update button text
    document.addEventListener('variant:change', () => {
      setTimeout(() => this.updateBottomButtonText(), 100);
    });

    // Listen for dropdown changes in bottom bar
    const bottomDropdowns = this.querySelectorAll('.bottom-purchase-dropdown__select');
    bottomDropdowns.forEach(dropdown => {
      dropdown.addEventListener('change', () => {
        setTimeout(() => this.updateBottomButtonText(), 50);
      });
    });

    bottomButton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (bottomButton.disabled) return;

      // Show loading state
      this.showBottomButtonLoading();

      try {
        // Get current variant ID and quantity
        const variantId = this.getCurrentVariantId();
        const quantity = this.querySelector('#BottomQuantity')?.value || 1;

        if (!variantId) {
          console.error('No variant ID found');
          this.hideBottomButtonLoading();
          return;
        }

        // Add to cart via AJAX
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            id: variantId,
            quantity: parseInt(quantity, 10)
          })
        });

        if (response.ok) {
          // Show success state briefly
          this.showBottomButtonSuccess();
          
          // Fetch updated cart drawer content
          const cartResponse = await fetch(window.Shopify.routes.root + "?sections=cart-drawer");
          const cartData = await cartResponse.json();
          
          // Trigger cart drawer update with new content
          if (typeof eventBus !== 'undefined' && eventBus.emit) {
            // Update cart drawer with new content
            if (cartData && cartData['cart-drawer']) {
              eventBus.emit('update:cart:drawer', { 
                sections: { 'cart-drawer': cartData['cart-drawer'] }
              });
            }
            
            // Emit cart added event
            eventBus.emit('cart:added', { sectionId: this.sectionId });
            
            // Open cart drawer
            eventBus.emit('open:cart:drawer', { scrollToTop: true });
          } else {
            // Fallback: dispatch custom events
            document.dispatchEvent(new CustomEvent('cart:added', {
              detail: { sectionId: this.sectionId }
            }));
            document.dispatchEvent(new CustomEvent('cart:open'));
          }

          // Reset button after delay
          setTimeout(() => {
            this.hideBottomButtonLoading();
          }, 2000);
        } else {
          throw new Error('Failed to add to cart');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.hideBottomButtonLoading();
      }
    });
  }

  getCurrentVariantId() {
    /* ===== Get current variant ID from bottom dropdowns or main form ===== */
    // First try to get from main form
    const mainVariantInput = document.querySelector('form[action*="/cart/add"] input[name="id"]');
    if (mainVariantInput && mainVariantInput.value) {
      return mainVariantInput.value;
    }

    // Try to get from bottom dropdowns by finding matching variant
    const bottomDropdowns = this.querySelectorAll('.bottom-purchase-dropdown__select');
    if (bottomDropdowns.length > 0) {
      // Get selected options from dropdowns
      const selectedOptions = Array.from(bottomDropdowns).map(dropdown => dropdown.value);
      
      // Find variant that matches these options
      const productJsonEl = document.querySelector('[data-product-json]');
      if (productJsonEl) {
        try {
          const productData = JSON.parse(productJsonEl.textContent);
          const matchingVariant = productData.variants.find(variant => {
            return selectedOptions.every((option, index) => variant.options[index] === option);
          });
          if (matchingVariant) {
            return matchingVariant.id;
          }
        } catch (e) {
          console.error('Error parsing product data:', e);
        }
      }
    }

    return null;
  }

  showBottomButtonLoading() {
    /* ===== Show loading state on bottom button ===== */
    const bottomButton = this.querySelector('[data-bottom-add-to-cart-swatch]');
    if (!bottomButton) return;

    const loadingIcon = bottomButton.querySelector('.bottom-loading-icon');
    const readyText = bottomButton.querySelector('.btn-text-ready');
    const soldOutText = bottomButton.querySelector('.btn-text-soldout');
    const addedText = bottomButton.querySelector('.btn-text-added');

    if (loadingIcon) {
      loadingIcon.style.display = 'inline-block';
      loadingIcon.style.marginRight = '8px';
    }
    if (readyText) readyText.style.display = 'none';
    if (soldOutText) soldOutText.style.display = 'none';
    if (addedText) addedText.style.display = 'none';
    
    // Add loading text
    const loadingText = document.createElement('span');
    loadingText.className = 'bottom-loading-text';
    loadingText.textContent = 'Loading...';
    loadingText.style.display = 'inline';
    bottomButton.appendChild(loadingText);
    
    bottomButton.disabled = true;
  }

  showBottomButtonSuccess() {
    /* ===== Show success state on bottom button ===== */
    const bottomButton = this.querySelector('[data-bottom-add-to-cart-swatch]');
    if (!bottomButton) return;

    const loadingIcon = bottomButton.querySelector('.bottom-loading-icon');
    const loadingText = bottomButton.querySelector('.bottom-loading-text');
    const addedText = bottomButton.querySelector('.btn-text-added');
    const readyText = bottomButton.querySelector('.btn-text-ready');
    const soldOutText = bottomButton.querySelector('.btn-text-soldout');

    if (loadingIcon) loadingIcon.style.display = 'none';
    if (loadingText) loadingText.remove();
    if (addedText) addedText.style.display = 'inline';
    if (readyText) readyText.style.display = 'none';
    if (soldOutText) soldOutText.style.display = 'none';
  }

  hideBottomButtonLoading() {
    /* ===== Hide loading state and restore normal state ===== */
    const bottomButton = this.querySelector('[data-bottom-add-to-cart-swatch]');
    if (!bottomButton) return;

    const loadingIcon = bottomButton.querySelector('.bottom-loading-icon');
    const loadingText = bottomButton.querySelector('.bottom-loading-text');
    const addedText = bottomButton.querySelector('.btn-text-added');

    if (loadingIcon) loadingIcon.style.display = 'none';
    if (loadingText) loadingText.remove();
    if (addedText) addedText.style.display = 'none';
    
    // Restore normal button state
    this.updateBottomButtonText();
  }

  updateBottomButtonText() {
    /* ===== Update bottom button text based on current variant availability ===== */
    const bottomButton = this.querySelector('[data-bottom-add-to-cart-swatch]');
    if (!bottomButton) return;

    const readyText = bottomButton.querySelector('.btn-text-ready');
    const soldOutText = bottomButton.querySelector('.btn-text-soldout');
    
    if (!readyText || !soldOutText) return;

    // Check if current variant is available
    let isAvailable = true;

    // Method 1: Check main form submit button state
    const mainSubmitButton = document.querySelector('form[action*="/cart/add"] button[type="submit"]');
    if (mainSubmitButton && mainSubmitButton.disabled) {
      isAvailable = false;
    }

    // Method 2: Check if any bottom dropdown has a disabled selected option
    const bottomDropdowns = this.querySelectorAll('.bottom-purchase-dropdown__select');
    bottomDropdowns.forEach(dropdown => {
      const selectedOption = dropdown.options[dropdown.selectedIndex];
      if (selectedOption && selectedOption.disabled) {
        isAvailable = false;
      }
    });

    // Method 3: Check main form variant input
    const mainVariantInput = document.querySelector('form[action*="/cart/add"] input[name="id"]');
    if (mainVariantInput && mainVariantInput.disabled) {
      isAvailable = false;
    }

    // Update button text and state
    if (isAvailable) {
      readyText.style.display = 'inline';
      soldOutText.style.display = 'none';
      bottomButton.disabled = false;
      bottomButton.classList.remove('disabled');
    } else {
      readyText.style.display = 'none';
      soldOutText.style.display = 'inline';
      bottomButton.disabled = true;
      bottomButton.classList.add('disabled');
    }
  }

  disconnectedCallback() {
    /* ===== Remove the event listeners when the element is removed from the DOM ===== */
    this.removeEventListeners();
  }
}

if (!window.customElements.get('product-swatch')) {
  window.customElements.define('product-swatch', ProductSwatch);
}

/******/ })();