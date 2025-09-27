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

  disconnectedCallback() {
    /* ===== Remove the event listeners when the element is removed from the DOM ===== */
    this.removeEventListeners();
  }
}

if (!window.customElements.get('product-swatch')) {
  window.customElements.define('product-swatch', ProductSwatch);
}

/******/ })();