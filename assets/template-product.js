document.addEventListener('DOMContentLoaded', function () {
  var sectionRoot = document.querySelector('[data-wetheme-section-type="template--product"][data-wetheme-section-id]');
  if (!sectionRoot) return;

  // Money format helpers
  function defaultTo(value, fallback) {
    return value == null || value !== value ? fallback : value;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultTo(precision, 2);
    thousands = defaultTo(thousands, ',');
    decimal = defaultTo(decimal, '.');

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);
    var parts = number.split('.');
    var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    var centsAmount = parts[1] ? decimal + parts[1] : '';
    return dollarsAmount + centsAmount;
  }

  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || '¥{{amount}}';

    switch ((formatString.match(placeholderRegex) || [,'amount'])[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      default:
        value = formatWithDelimiters(cents, 2);
    }
    return formatString.replace(placeholderRegex, value);
  }

  function throttle(func, limit) {
    var inThrottle;
    return function () {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          inThrottle = false;
        }, limit);
      }
    };
  }

  // Read money format and initial prices from data attributes
  var moneyFormat = sectionRoot.getAttribute('data-money-format') || '¥{{amount}}';

  // Price update based on variant
  function updateQuantityDiscountPrices(variantPrice) {
    if (!variantPrice) return;
    var options = document.querySelectorAll('.quantity-option');
    if (!options.length) return;

    options.forEach(function (option) {
      var quantity = parseInt(option.getAttribute('data-quantity'));
      var discountPercent = parseFloat(option.getAttribute('data-discount')) || 0;
      if (!quantity || quantity <= 0) return;

      var totalRegularPrice = variantPrice * quantity;
      var discountedPrice = totalRegularPrice;
      if (discountPercent > 0) {
        var discountAmount = totalRegularPrice * (discountPercent / 100);
        discountedPrice = totalRegularPrice - discountAmount;
      }
      var unitPrice = discountedPrice / quantity;

      var finalPriceElement = option.querySelector('.final-price .money');
      var originalPriceElement = option.querySelector('.original-price .money');
      var unitPriceElement = option.querySelector('.unit-price-container .money');

      if (finalPriceElement) {
        finalPriceElement.innerHTML = formatMoney(discountedPrice, moneyFormat);
      }
      if (originalPriceElement) {
        originalPriceElement.innerHTML = formatMoney(totalRegularPrice, moneyFormat);
        var originalPriceContainer = option.querySelector('.original-price');
        if (originalPriceContainer) {
          originalPriceContainer.style.display = discountPercent > 0 ? 'block' : 'none';
        }
      }
      if (unitPriceElement) {
        unitPriceElement.innerHTML = formatMoney(unitPrice, moneyFormat);
      }
    });
  }

  var throttledUpdate = throttle(updateQuantityDiscountPrices, 100);

  // Initialize with inline JSON if available
  var productJSON = null;
  try {
    var productJsonElement = document.getElementById('ProductJson-' + sectionRoot.getAttribute('data-wetheme-section-id'));
    if (productJsonElement) {
      productJSON = JSON.parse(productJsonElement.innerHTML);
    }
  } catch (e) {}

  var currentVariantPrice = parseInt(sectionRoot.getAttribute('data-initial-price')) || 0;
  if (currentVariantPrice) throttledUpdate(currentVariantPrice);

  // Vue instance hooks (best-effort)
  var vueInstance = null;
  try {
    var vueApp = document.querySelector('wetheme-product-form');
    if (vueApp && vueApp.__vue__) {
      vueInstance = vueApp.__vue__;
      if (vueInstance.variant && vueInstance.variant.price) {
        currentVariantPrice = vueInstance.variant.price;
        throttledUpdate(currentVariantPrice);
      }
      if (vueInstance.$watch) {
        vueInstance.$watch('variant', function (newVariant) {
          if (newVariant && newVariant.price) {
            currentVariantPrice = newVariant.price;
            throttledUpdate(currentVariantPrice);
          }
        });
      }
    }
  } catch (e) {}

  // Other variant change events
  document.addEventListener('variant:changed', function (event) {
    if (event.detail && event.detail.variant && event.detail.variant.price) {
      currentVariantPrice = event.detail.variant.price;
      throttledUpdate(currentVariantPrice);
    }
  });

  document.addEventListener('product:variant:change', function (event) {
    if (event.detail && event.detail.variant && event.detail.variant.price) {
      currentVariantPrice = event.detail.variant.price;
      throttledUpdate(currentVariantPrice);
    }
  });

  if (window.jQuery) {
    jQuery(document).on('variant:changed variantChange product:variant:change', function (event, data) {
      if (data && data.variant && data.variant.price) {
        currentVariantPrice = data.variant.price;
        throttledUpdate(currentVariantPrice);
      }
    });
  }

  // Quantity option interactions
  function updateDisplayElements(qty) {
    var bottomQuantityDisplay = document.querySelector('.div-js-qty-bottom-qty-container .quantity-display, .bottom-quantity, .qty-count');
    if (bottomQuantityDisplay) {
      bottomQuantityDisplay.textContent = qty;
    }
    var qtyContainers = document.querySelectorAll('.div-js-qty-bottom-qty-container, .js-qty, [class*="qty-container"]');
    qtyContainers.forEach(function (container) {
      var qtyDisplay = container.querySelector('span:not([class]), .qty-number');
      if (qtyDisplay) {
        qtyDisplay.textContent = qty;
      }
    });
  }

  setTimeout(function () {
    var quantityOptions = document.querySelectorAll('.quantity-option');
    if (!quantityOptions.length) return;
    quantityOptions[0].classList.add('selected');

    var allQuantityInputs = document.querySelectorAll('input[aria-label="quantity"], .js-qty__num, [id^="Quantity"], input[name="quantity"], input[name="quantity-js"]');

    quantityOptions.forEach(function (option) {
      option.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var qty = parseInt(this.getAttribute('data-quantity'));
        if (isNaN(qty)) return;

        quantityOptions.forEach(function (opt) { opt.classList.remove('selected'); });
        this.classList.add('selected');

        allQuantityInputs.forEach(function (input) {
          input.value = qty;
          try {
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            if (window.jQuery) {
              window.jQuery(input).trigger('change').trigger('input');
            }
          } catch (e) {}
        });

        if (vueInstance) {
          try {
            vueInstance.quantity = qty;
            if (typeof vueInstance.updateQuantity === 'function') {
              vueInstance.updateQuantity(qty);
            }
          } catch (e) {}
        }

        updateDisplayElements(qty);

        var form = document.getElementById('AddToCartForm');
        if (form) {
          var hiddenQty = form.querySelector('input[name="quantity"]');
          if (hiddenQty) hiddenQty.value = qty;
        }
      });
    });

    var defaultQty = parseInt(quantityOptions[0].getAttribute('data-quantity')) || 1;
    updateDisplayElements(defaultQty);
    allQuantityInputs.forEach(function (input) { input.value = defaultQty; });
    if (vueInstance) {
      try { vueInstance.quantity = defaultQty; } catch (e) {}
    }
  }, 1000);

  // Direct listeners to variant controls (fallback)
  function setupVariantListeners() {
    var selector = [
      '.variant-input label',
      '.swatch-element label',
      '.swatch label',
      '[data-option-value]',
      '.single-option-selector-item',
      '.product-form__input input[type="radio"]',
      '.product-form__swatch input[type="radio"]'
    ].join(',');

    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener('click', function () {
        setTimeout(function () {
          if (vueInstance && vueInstance.variant && vueInstance.variant.price) {
            currentVariantPrice = vueInstance.variant.price;
            throttledUpdate(currentVariantPrice);
            return;
          }
          var variantInput = document.querySelector('input[name="id"], select[name="id"]');
          if (variantInput && productJSON && productJSON.variants) {
            var variantId = parseInt(variantInput.value);
            var selectedVariant = productJSON.variants.find(function (v) { return v.id === variantId; });
            if (selectedVariant && selectedVariant.price) {
              currentVariantPrice = selectedVariant.price;
              throttledUpdate(currentVariantPrice);
            }
          }
        }, 50);
      });
    });

    document.querySelectorAll('select.single-option-selector, select[id^="ProductSelect-"]').forEach(function (select) {
      select.addEventListener('change', function () {
        setTimeout(function () {
          if (vueInstance && vueInstance.variant && vueInstance.variant.price) {
            currentVariantPrice = vueInstance.variant.price;
            throttledUpdate(currentVariantPrice);
          }
        }, 50);
      });
    });
  }

  setTimeout(setupVariantListeners, 500);
});


