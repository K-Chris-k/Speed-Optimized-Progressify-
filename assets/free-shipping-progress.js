/**
 * Free Shipping Progress Bar Component
 * Handles dynamic updates of shipping progress based on cart total
 */

// Prevent duplicate class declaration
if (typeof window.FreeShippingProgress === 'undefined') {
  window.FreeShippingProgress = class FreeShippingProgress {
  constructor() {
    this.progressContainer = null;
    this.progressBar = null;
    this.progressText = null;
    this.updateTimeout = null;
    this.currentCurrency = null;
    this.cartObserver = null;
    this.headerObserver = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupElements());
    } else {
      this.setupElements();
    }

    // Listen for cart updates
    if (window.eventBus) {
      window.eventBus.on('update:cart:drawer', (response) => {
        // Wait for DOM to update after cart drawer re-renders
        setTimeout(() => {
          this.setupElements();
          this.updateProgressFromDOM();
        }, 100);
      });
      
      // Listen for cart added event
      window.eventBus.on('cart:added', () => {
        // Wait for cart drawer to update
        setTimeout(() => {
          this.setupElements();
          this.updateProgressFromDOM();
        }, 350);
      });
      
      // Listen for cart drawer opening
      window.eventBus.on('open:cart:drawer', () => {
        // Re-setup elements in case they were re-rendered
        setTimeout(() => {
          this.setupElements();
          this.updateProgressFromDOM();
        }, 250);
      });
      
      // Listen for drawer opened event
      window.eventBus.on('drawer:opened', (drawer) => {
        // Only update if it's the cart drawer
        if (drawer && drawer.tagName === 'CART-DRAWER') {
          setTimeout(() => {
            this.setupElements();
            this.updateProgressFromDOM();
          }, 150);
        }
      });
    }
  }

  setupElements() {
    this.progressContainer = document.querySelector('.shipping-progress-container');
    this.progressBar = document.querySelector('.shipping-progress-bar__fill');
    this.progressText = document.querySelector('.shipping-progress-text');
    
    // Check cart item count
    const cartItemCount = this.getCartItemCount();
    
    // Show or hide progress container based on item count
    if (this.progressContainer) {
      if (cartItemCount > 0) {
        this.progressContainer.style.display = 'flex';
        this.progressContainer.style.visibility = 'visible';
        this.progressContainer.style.opacity = '1';
        
        // Wait for currency config to be available
        this.waitForCurrencyConfig(() => {
          this.currentCurrency = window.currencyConfig.getCurrentCurrency();
          
          // Update progress based on current cart
          this.updateProgressFromDOM();
          
          // Set up mutation observer to watch for cart updates
          this.setupMutationObserver();
        });
      } else {
        // Hide container if cart is empty (item_count = 0)
        this.progressContainer.style.display = 'none';
      }
    }
  }
  
  getCartItemCount() {
    // Get cart item count from the heading
    const cartHeading = document.querySelector('.cart-drawer__heading');
    if (cartHeading) {
      const match = cartHeading.textContent.match(/\((\d+)\)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  waitForCurrencyConfig(callback) {
    if (typeof window.currencyConfig !== 'undefined') {
      callback();
    } else {
      // Wait up to 3 seconds for currency config to load
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof window.currencyConfig !== 'undefined') {
          clearInterval(checkInterval);
          callback();
        } else if (attempts > 30) { // 30 * 100ms = 3 seconds
          clearInterval(checkInterval);
          console.warn('Currency config not loaded, using fallback');
          callback();
        }
      }, 100);
    }
  }

  setupMutationObserver() {
    // Watch for changes in the cart body area (where products are listed)
    const cartBody = document.querySelector('[data-cart-dynamic-content="cart-body"]');
    if (cartBody && window.MutationObserver) {
      // Disconnect existing observer if any
      if (this.cartObserver) {
        this.cartObserver.disconnect();
      }
      
      this.cartObserver = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            shouldUpdate = true;
          }
        });
        
        if (shouldUpdate) {
          // Debounce updates to avoid excessive calls
          if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
          }
          this.updateTimeout = setTimeout(() => {
            this.setupElements();
            this.updateProgressFromDOM();
          }, 150);
        }
      });
      
      this.cartObserver.observe(cartBody, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    
    // Also watch for changes in the cart header (item count)
    const cartHeader = document.querySelector('[data-cart-dynamic-content="cart-header"]');
    if (cartHeader && window.MutationObserver) {
      // Disconnect existing observer if any
      if (this.headerObserver) {
        this.headerObserver.disconnect();
      }
      
      this.headerObserver = new MutationObserver(() => {
        if (this.updateTimeout) {
          clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
          this.setupElements();
          this.updateProgressFromDOM();
        }, 100);
      });
      
      this.headerObserver.observe(cartHeader, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  updateProgressFromDOM() {
    // Get current cart total from the subtotal element
    const subtotalElement = document.querySelector('.cart-drawer__subtotal--price .cart-drawer__subtotal--sale, .cart-drawer__subtotal--price span:last-child');
    
    if (subtotalElement) {
      const priceText = subtotalElement.textContent.trim();
      const cartTotal = this.parsePriceFromText(priceText);
      this.updateProgressDisplay(cartTotal);
    } else {
      // Fallback: try to get from cart object if available
      if (typeof window.cart !== 'undefined' && window.cart.total_price) {
        this.updateProgressDisplay(window.cart.total_price);
      }
    }
  }

  updateProgress(cartResponse) {
    if (cartResponse && cartResponse.total_price !== undefined) {
      this.updateProgressDisplay(cartResponse.total_price);
    }
  }

  parsePriceFromText(priceText) {
    if (!priceText || typeof priceText !== 'string') return 0;
    
    // Remove currency symbols, spaces, and convert to number
    // Handle formats like "¥100.00", "$100.00", "100,00 €", etc.
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');
    
    // Handle different decimal separators
    let price = 0;
    if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
      // Format like "1,234.56"
      price = parseFloat(cleanPrice.replace(/,/g, ''));
    } else if (cleanPrice.includes(',')) {
      // Could be "1,234" or "12,34" (European format)
      const parts = cleanPrice.split(',');
      if (parts[1] && parts[1].length <= 2) {
        // European decimal format "12,34"
        price = parseFloat(cleanPrice.replace(',', '.'));
      } else {
        // Thousands separator "1,234"
        price = parseFloat(cleanPrice.replace(/,/g, ''));
      }
    } else {
      price = parseFloat(cleanPrice);
    }
    
    // Convert to cents (multiply by 100)
    return Math.round((price || 0) * 100);
  }

  updateProgressDisplay(cartTotal) {
    if (!this.progressBar || !this.progressText) return;
    
    // Use currency config if available, otherwise fallback to simple calculation
    if (typeof window.currencyConfig !== 'undefined') {
      this.updateProgressWithCurrencyConfig(cartTotal);
    } else {
      this.updateProgressFallback(cartTotal);
    }
  }

  updateProgressWithCurrencyConfig(cartTotal) {
    const currency = this.currentCurrency || window.currencyConfig.getCurrentCurrency();
    const progressData = window.currencyConfig.calculateShippingProgress(cartTotal, currency);
    
    // Get USD comparison container
    const usdComparisonContainer = document.querySelector('.shipping-progress-usd-comparison');
    const usdComparisonText = document.querySelector('.usd-comparison-text');
    
    // Get custom text from config
    const configData = window.currencyConfig.getConfigData();
    const successText = configData?.successText || 'Congrats! You are eligible for FREE Shipping';
    const progressText = configData?.progressText || 'Buy [amount] more to enjoy FREE Shipping';
    
    // Update progress bar width
    this.progressBar.style.width = `${progressData.progressPercentage}%`;

    // Update text content
    if (progressData.isEligible) {
      // Eligible for free shipping
      this.progressText.innerHTML = `
        <span class="shipping-progress-success">${successText}</span>
      `;
      this.progressText.className = 'shipping-progress-text shipping-progress-success-container';
    } else {
      // Still need more for free shipping
      const remainingFormatted = window.currencyConfig.formatCurrency(progressData.remainingAmount, currency);
      // Replace both {amount} and [amount] placeholders with bold wrapped amount
      const boldAmount = `<span class="shipping-progress-amount">${remainingFormatted}</span>`;
      const formattedProgressText = progressText.replace('{amount}', boldAmount).replace('[amount]', boldAmount);
      this.progressText.innerHTML = `
        <span class="free-shipping-message">${formattedProgressText}</span>
      `;
      this.progressText.className = 'shipping-progress-text';
    }
    
    // Update USD comparison information
    if (usdComparisonContainer && usdComparisonText) {
      // Calculate USD values
      const cartTotalUSD = progressData.cartTotalUSD / 100; // Convert cents to dollars
      const thresholdUSD = progressData.thresholdUSD / 100; // Convert cents to dollars
      const difference = thresholdUSD - cartTotalUSD; // How much more needed to reach threshold
      
      // Get currency symbol
      const currencySymbol = window.currencyConfig.currencySymbols[currency] || currency;
      const cartTotalInCurrentCurrency = cartTotal / 100;
      
      // Format the message based on whether the cart exceeds the threshold
      let comparisonMessage = '';
      if (difference <= 0) {
        // Already reached threshold
        comparisonMessage = `当前购物车 ${this.formatCurrencyAmount(cartTotalInCurrentCurrency, currencySymbol, currency)} 相当于 $${cartTotalUSD.toFixed(2)} USD，已超过 $${thresholdUSD.toFixed(2)} USD 免邮门槛`;
      } else {
        // Still need more
        comparisonMessage = `当前购物车 ${this.formatCurrencyAmount(cartTotalInCurrentCurrency, currencySymbol, currency)} 相当于 $${cartTotalUSD.toFixed(2)} USD，还差 $${difference.toFixed(2)} USD 达到 $${thresholdUSD.toFixed(2)} USD 免邮门槛`;
      }
      
      usdComparisonText.textContent = comparisonMessage;
      usdComparisonContainer.style.display = 'block';
    }

    this.updateContainerVisibility();
  }

  updateProgressFallback(cartTotal) {
    // Fallback to original logic if currency config is not available
    const threshold = 10000; // 100 yuan in cents
    const progressPercentage = Math.min((cartTotal / threshold) * 100, 100);
    const remainingAmount = Math.max(threshold - cartTotal, 0);
    
    // Get USD comparison container
    const usdComparisonContainer = document.querySelector('.shipping-progress-usd-comparison');
    const usdComparisonText = document.querySelector('.usd-comparison-text');
    
    // Try to get custom text from config element
    let successText = 'Congrats! You are eligible for FREE Shipping';
    let progressText = 'Buy [amount] more to enjoy FREE Shipping';
    
    const configElement = document.getElementById('currency-config-data');
    if (configElement) {
      try {
        const configData = JSON.parse(configElement.textContent);
        if (configData.successText) successText = configData.successText;
        if (configData.progressText) progressText = configData.progressText;
      } catch (e) {
        // Use default values
      }
    }

    // Update progress bar width
    this.progressBar.style.width = `${progressPercentage}%`;

    // Update text content
    if (cartTotal >= threshold) {
      this.progressText.innerHTML = `
        <span class="shipping-progress-success">${successText}</span>
      `;
      this.progressText.className = 'shipping-progress-text shipping-progress-success-container';
    } else {
      const remainingFormatted = this.formatPrice(remainingAmount);
      // Replace both {amount} and [amount] placeholders with bold wrapped amount
      const boldAmount = `<span class="shipping-progress-amount">${remainingFormatted}</span>`;
      const formattedProgressText = progressText.replace('{amount}', boldAmount).replace('[amount]', boldAmount);
      this.progressText.innerHTML = `
        <span class="free-shipping-message">${formattedProgressText}</span>
      `;
      this.progressText.className = 'shipping-progress-text';
    }
    
    // Add fallback USD comparison (using a fixed exchange rate if currency config is not available)
    if (usdComparisonContainer && usdComparisonText) {
      // Use a fallback exchange rate (CNY to USD) of 7.25
      const fallbackExchangeRate = 7.25;
      const cartTotalUSD = (cartTotal / 100) / fallbackExchangeRate;
      const thresholdUSD = 100; // $100 USD
      const difference = thresholdUSD - cartTotalUSD; // How much more needed
      const cartTotalInCurrentCurrency = cartTotal / 100;
      
      // Format the message based on whether the cart exceeds the threshold
      let comparisonMessage = '';
      if (difference <= 0) {
        comparisonMessage = `当前购物车 ¥${cartTotalInCurrentCurrency.toFixed(2)} 相当于 $${cartTotalUSD.toFixed(2)} USD，已超过 $${thresholdUSD.toFixed(2)} USD 免邮门槛`;
      } else {
        comparisonMessage = `当前购物车 ¥${cartTotalInCurrentCurrency.toFixed(2)} 相当于 $${cartTotalUSD.toFixed(2)} USD，还差 $${difference.toFixed(2)} USD 达到 $${thresholdUSD.toFixed(2)} USD 免邮门槛`;
      }
      
      usdComparisonText.textContent = comparisonMessage;
      usdComparisonContainer.style.display = 'block';
    }

    this.updateContainerVisibility();
  }

  updateContainerVisibility() {
    // Show/hide container based on cart content
    if (!this.progressContainer) return;
    
    const itemCount = this.getCartItemCount();
    
    if (itemCount > 0) {
      // Show container when cart has items (item_count > 0)
      this.progressContainer.style.display = 'flex';
      this.progressContainer.style.visibility = 'visible';
      this.progressContainer.style.opacity = '1';
    } else {
      // Hide entire container when cart is empty (item_count = 0)
      this.progressContainer.style.display = 'none';
    }
  }

  formatPrice(priceInCents) {
    // Convert cents back to yuan and format
    const price = priceInCents / 100;
    return `¥${price.toFixed(2)}`;
  }

  formatCurrencyAmount(amount, symbol, currency) {
    // Format currency amount with proper symbol placement and decimal places
    let decimals = 2;
    
    // Special handling for currencies without decimal places
    if (['JPY', 'KRW', 'VND', 'IDR', 'PYG', 'CLP'].includes(currency)) {
      decimals = 0;
    }
    
    const formattedAmount = amount.toFixed(decimals);
    
    // Special handling for Albanian Lek - symbol after amount with comma separator
    if (currency === 'ALL') {
      return `${formattedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${symbol}`;
    }
    
    // Currencies with symbol after amount
    if (['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON'].includes(currency)) {
      return `${formattedAmount} ${symbol}`;
    }
    
    // Default: symbol before amount
    return `${symbol}${formattedAmount}`;
  }

  // Method to update threshold if needed
  setThreshold(newThreshold) {
    this.freeShippingThreshold = newThreshold;
    this.updateProgressFromDOM();
  }
  };
}

// Initialize when DOM is ready (only if not already initialized)
if (typeof window !== 'undefined' && !window.freeShippingProgress) {
  window.freeShippingProgress = new window.FreeShippingProgress();
}
