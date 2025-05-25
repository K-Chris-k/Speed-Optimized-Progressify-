/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/javascripts/utils.js
/**
 * Throttle execution of function
 *
 * @param {Function} callback function to be throttled
 * @param {number} interval milliseconds
 * @returns {Function}
 */
function throttle(callback, interval) {
  let enableCall = true;
  let calledWhenDisabled = false;


  return (...args) =>{
    const onTimeout = () => {
      if (calledWhenDisabled) {
        callback.apply(this, args);
        setTimeout(onTimeout, interval);
      } else {
        enableCall = true;
      }
      calledWhenDisabled = false;
    }

    if (!enableCall) {
      calledWhenDisabled = true;
      return;
    }

    enableCall = false;
    callback.apply(this, args);
    setTimeout(onTimeout, interval);
  }
}

/**
 * Take monetary value and format it as money
 *
 * @param {number | string} cents - Price in cents (hundreds of base unit)
 * @param {string} [format] - Format for money; store format will be used if undefined
 * @return {string} - HTML string with the formatted money value
 */
function formatMoney(cents, format) {
  var moneyFormat = format || '${{amount}}';
  if (typeof cents === 'string') {
    cents = cents.replace('.', '');
  }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = moneyFormat;

  function formatWithDelimiters(number, precision, thousands, decimal) {
    if (precision === null || precision === undefined) {
      precision = 2;
    }
    thousands = thousands || ',';
    decimal = decimal || '.';

    if (isNaN(number) || number == null) {
      return '0';
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.');
    var dollarsAmount = parts[0].replace(
      /(\d)(?=(\d{3})+(?!\d))/g,
      '$1' + thousands
    );
    var centsAmount = parts[1] ? decimal + parts[1] : '';

    return dollarsAmount + centsAmount;
  }

  var match = formatString.match(placeholderRegex);

  if (!match) {
    throw new Error(
      `Invalid format string: '${formatString}'. Expected '{{amount}}' or similar placeholders.`
    );
  }

  switch (match[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_with_space_separator':
      value = formatWithDelimiters(cents, 2, ' ', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
    case 'amount_no_decimals_with_space_separator':
      value = formatWithDelimiters(cents, 0, ' ');
      break;
    default:
      throw new Error(`Unknown format type: ${match[1]}`);
  }

  return formatString.replace(placeholderRegex, value);
}

// FocusTrap class for managing focus within a container
class FocusTrap {
  /**
   * @param {HTMLElement} container - The container within which to trap focus.
   * @param {HTMLElement} [initialElement=null] - The element to focus initially. If not provided, the first focusable element is focused.
   * @param {Function} [onEscape=null] - Optional callback to execute when the Escape key is pressed.
   */
  constructor(container, initialElement = null, onEscape = null) {
    this.container = container;
    this.initialElement = initialElement;
    this.onEscape = onEscape;
    this.focusableElements = [];
    this.firstElement = null;
    this.lastElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.updateFocusableElements = this.updateFocusableElements.bind(this);
    this.observer = new MutationObserver(this.updateFocusableElements);
    this.init();
  }

  /**
   * Initializes the focus trap by removing the 'inert' attribute,
   * updating focusable elements, setting initial focus, and attaching necessary event listeners.
   */
  init() {
    if (!this.container) return;

    // Remove the 'inert' attribute from the container
    this.container.removeAttribute('inert');

    this.updateFocusableElements();

    if (this.initialElement && this.isFocusable(this.initialElement)) {
      this.initialElement.focus();
    } else if (this.firstElement) {
      this.firstElement.focus();
    }

    this.container.addEventListener('keydown', this.handleKeyDown);
    this.observer.observe(this.container, { childList: true, subtree: true, attributes: true });
  }

  /**
   * Determines if an element is focusable.
   * @param {HTMLElement} el - The element to check.
   * @returns {boolean} - True if the element is focusable, else false.
   */
  isFocusable(el) {
    if (!el) return false;
    return (
      el.offsetParent !== null &&
      el.getAttribute('tabindex') !== '-1' &&
      !this.isInsideClosedDetails(el)
    );
  }

  /**
   * Determines if an element is inside a closed <details> element.
   * Allows <summary> elements to remain focusable even if their parent <details> is closed.
   * @param {HTMLElement} el - The element to check.
   * @returns {boolean} - True if inside a closed <details> and not a <summary>, else false.
   */
  isInsideClosedDetails(el) {
    let parent = el.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'details') {
        if (!parent.hasAttribute('open')) {
          // Allow the <summary> element itself to be focusable
          if (el.tagName.toLowerCase() === 'summary' && parent.querySelector('summary') === el) {
            return false;
          }
          return true;
        }
      }
      parent = parent.parentElement;
    }
    return false;
  }

  /**
   * Updates the list of focusable elements, excluding those inside closed <details> (except <summary>).
   */
  updateFocusableElements() {
    this.focusableElements = Array.from(this.container.querySelectorAll(
      'a[href], area[href], input:not([type=hidden]), select, textarea, button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable], summary'
    )).filter(el => this.isFocusable(el));

    if (this.focusableElements.length > 0) {
      this.firstElement = this.focusableElements[0];
      this.lastElement = this.focusableElements[this.focusableElements.length - 1];
    } else {
      this.firstElement = null;
      this.lastElement = null;
      console.warn('No focusable elements found within the container.');
    }
  }

  /**
   * Handles the keydown event to trap focus within the container.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  handleKeyDown(e) {
    if (e.key === 'Tab') {
      if (this.focusableElements.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === this.firstElement) {
          e.preventDefault();
          this.lastElement.focus();
        }
      } else { // Tab
        if (document.activeElement === this.lastElement) {
          e.preventDefault();
          this.firstElement.focus();
        }
      }
    } else if (e.key === 'Escape') {
      if (this.onEscape) {
        this.onEscape();
      }
    }
  }

  /**
   * Destroys the focus trap by removing event listeners and disconnecting observers.
   */
  destroy() {
    this.container.setAttribute('inert', '');
    this.container.removeEventListener('keydown', this.handleKeyDown);
    this.observer.disconnect();
  }
}

;// ./src/javascripts/webcomponents/filtering.js


class CollectionFiltersForm extends HTMLElement {
  // Define class properties for bound functions
  handleSortByChangeBound = this.handleSortByChange.bind(this);
  stopInputPropagationBound = this.stopInputPropagation.bind(this);

  constructor() {
    super();
    this.filterData = [];
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.productGridId = 'CollectionProductGrid';
    this.filterFormsId = 'CollectionFiltersForm';
    this.searchTemplate = document.querySelector('body.template-search');
    this.collectionTemplate = document.querySelector('body.template-collection');
    this.sections = this.getSections();
    this.buttonAriaLabel = this.getAttribute('data-button-aria-label');
    this.filterForm = this.querySelector(`#${this.filterFormsId}`);
    this.sortByDesktop = this.querySelector('#SortBydesktop');
    this.sortByMobile = this.querySelector('#SortBymobile');
    this.sortByInput = this.querySelector('#sort_by_input');
    
    // Store initial window width to detect significant resize
    this.prevWindowWidth = window.innerWidth;
    this.resizeThreshold = 100; // Only care about resizes larger than this
    
    // Setup proper inert attribute only on initial page load
    if (window.innerWidth <= 991) {
      // On mobile, only set inert when drawer is closed
      if (!document.body.classList.contains('js-drawer-open-filter')) {
        this.filterForm.setAttribute('inert', '');
      }
    } else {
      // On desktop, form should never be inert
      this.filterForm.removeAttribute('inert');
    }

    this.debouncedOnSubmit = this.debounce(this.onSubmitHandler.bind(this), 800);
    
    // Bind this for the resize handler for proper context
    this.handleResize = this.handleResize.bind(this);

    // Add event listeners using bound functions
    if (this.sortByDesktop && this.sortByMobile) {
      this.sortByDesktop.addEventListener('change', this.handleSortByChangeBound);
      this.sortByMobile.addEventListener('change', this.handleSortByChangeBound);

      this.sortByDesktop.addEventListener('input', this.stopInputPropagationBound);
      this.sortByMobile.addEventListener('input', this.stopInputPropagationBound);
    }

    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit);
    document.querySelector('[data-drawer-open-btn]').addEventListener('click', this.handleDrawerOpen.bind(this));
    document.querySelector('[data-drawer-close-btn]').addEventListener('click', this.handleDrawerClose.bind(this));
    const drawerOverlay = document.querySelector('[data-filtering-drawer-overlay]');
    if (drawerOverlay) drawerOverlay.addEventListener('click', this.handleDrawerClose.bind(this));
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('popstate', this.onHistoryChange.bind(this));

    this.bindActiveFacetButtonEvents();
    this.onDropDownBlur();
  }

  // Define debounce as a class method
  debounce = (fn, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  };

  // Define stopInputPropagation as a class method
  stopInputPropagation(event) {
    event.stopPropagation();
  }

  onDropDownBlur() {
    const getDropDowns = document.querySelectorAll('details');

    for (let item of getDropDowns) {
      document.addEventListener('click', function (event) {
        var isClickInside = item.contains(event.target);

        if (!isClickInside) {
          // The click was outside the specified element, close the dropdown
          item.removeAttribute('open');
        }
      });
    }
  }

  isHidden(el) {
    return (el.offsetParent === null);
  }

  handleResize() {
    // Only react to significant resize events
    const currentWidth = window.innerWidth;
    const widthDiff = Math.abs(currentWidth - this.prevWindowWidth);
    
    // Check if the resize is significant (crossing the mobile/desktop threshold)
    const crossedBreakpoint = 
      (this.prevWindowWidth <= 991 && currentWidth > 991) || 
      (this.prevWindowWidth > 991 && currentWidth <= 991);
    
    if (widthDiff > this.resizeThreshold || crossedBreakpoint) {
      // Update previous width
      this.prevWindowWidth = currentWidth;
      
      const filterDrawer = document.querySelector('collection-filtering-form');
      
      if (!filterDrawer) return;
      
      // Handle drawer attributes
      filterDrawer.removeAttribute('role');
      filterDrawer.removeAttribute('aria-modal');
      filterDrawer.removeAttribute('aria-label');
      
      // Manage inert attribute properly
      if (currentWidth <= 991) {
        // On mobile - only set inert if drawer is closed
        if (!document.body.classList.contains('js-drawer-open-filter')) {
          this.filterForm.setAttribute('inert', '');
        }
        
        // Set drawer attributes
        filterDrawer.setAttribute('role', 'dialog');
        filterDrawer.setAttribute('aria-modal', 'true');
        filterDrawer.setAttribute('aria-label', this.buttonAriaLabel);
      } else {
        // On desktop - never use inert
        this.filterForm.removeAttribute('inert');
      }
    }
  }

  handleDrawerOpen() {
    const filterDrawer = this.querySelector('#CollectionFiltersForm');
    
    // Remove inert attribute when drawer opens on mobile
    if (window.innerWidth <= 991 && this.filterForm) {
      this.filterForm.removeAttribute('inert');
    }
  
    document.body.classList.add('js-drawer-open-filter', 'js-drawer-open');
    this.focusTrap = new FocusTrap(filterDrawer, null, this.handleDrawerClose.bind(this));
  }
  
  handleDrawerClose() {
    const filterBtn = document.querySelector('[data-drawer-open-btn]');
    document.body.classList.remove('js-drawer-open-filter', 'js-drawer-open');
    
    // Only set inert attribute on mobile when drawer closes
    if (window.innerWidth <= 991 && this.filterForm) {
      this.filterForm.setAttribute('inert', '');
    }
  
    filterBtn.setAttribute('tabIndex', '0');
    filterBtn.focus();
  
    if (this.focusTrap) {
      this.focusTrap.destroy();
      this.focusTrap = null;
    }
  }

  handleSortByChange(event) {
    event.preventDefault();
    event.stopPropagation();

    const newValue = event.target.value;

    if (!this.sortByInput) {
      console.warn('Sort by input element not found');
      return;
    }

    // Update the hidden input
    this.sortByInput.value = newValue;

    // Determine which select was changed and update the other accordingly
    if (event.target === this.sortByDesktop) {
      // Update SortBymobile without triggering its change event
      if (this.sortByMobile.value !== newValue) {
        this.sortByMobile.value = newValue;
      }
    } else if (event.target === this.sortByMobile) {
      // Update SortBydesktop without triggering its change event
      if (this.sortByDesktop.value !== newValue) {
        this.sortByDesktop.value = newValue;
      }
    }

    // Dispatch the input event to trigger form's input listener
    this.sortByInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  onSubmitHandler(event) {
    event.preventDefault();

    const processForm = (formData, uniqueFormData) => {
      // Track price filter values to sync mobile and desktop
      let priceGte = null;
      let priceLte = null;

      // If this event was triggered by a price input, use its value
      if (event.target && event.target.matches('input[data-price-range-min]')) {
        priceGte = event.target.value;
      } else if (event.target && event.target.matches('input[data-price-range-max]')) {
        priceLte = event.target.value;
      }

      // Create a map to store unique values for each parameter
      const paramMap = new Map();

      // First collect all form values into our map
      for (const [key, value] of formData.entries()) {
        if (value === '') continue;

        // For checkboxes, we need to maintain an array of values
        if (!paramMap.has(key)) {
          paramMap.set(key, new Set());
        }
        paramMap.get(key).add(value);
      }

      // Handle checkbox unchecking
      if (event.target?.type === 'checkbox' && !event.target.checked) {
        if (paramMap.has(event.target.name)) {
          paramMap.get(event.target.name).delete(event.target.value);
          if (paramMap.get(event.target.name).size === 0) {
            paramMap.delete(event.target.name);
          }
        }
      }

      // Special handling for price filters
      if (priceGte !== null) {
        paramMap.set('filter.v.price.gte', new Set([priceGte]));
        this.filterForm.querySelectorAll('input[data-price-range-min]')
          .forEach(input => input.value = priceGte);
      }
      if (priceLte !== null) {
        paramMap.set('filter.v.price.lte', new Set([priceLte]));
        this.filterForm.querySelectorAll('input[data-price-range-max]')
          .forEach(input => input.value = priceLte);
      }

      // Build final URL parameters
      for (const [key, values] of paramMap.entries()) {
        // Delete any existing values for this key
        uniqueFormData.delete(key);
        // Add each value for this key
        values.forEach(value => {
          uniqueFormData.append(key, value);
        });
      }
    };

    if (this.collectionTemplate) {
      const formData = new FormData(this.filterForm);
      const uniqueFormData = new URLSearchParams();
      
      processForm(formData, uniqueFormData);
      const searchParams = uniqueFormData.toString();
      this.renderPage(searchParams, event);
    } else if (this.searchTemplate) {
      // Store the initial URL so that we can get the search query from it to add to the formData object
      const searchParamsInitial = new URLSearchParams(window.location.search);

      // Get the selected result types, we will need to use them later on
      const activeTypes = document.querySelector('#page-type-input').value;
      const types = Array.from(activeTypes.split(','));
      const defaultTypes = document.querySelector('.search--header input[name="type"]');

      if (activeTypes === "") {
        const getInput = document.querySelector('#page-type-input');
        getInput.value = defaultTypes.value;
      }

      // Create a new FormData object from the filter form
      const formData = new FormData(this.filterForm);
      const uniqueFormData = new URLSearchParams();
      
      processForm(formData, uniqueFormData);
      uniqueFormData.append('q', searchParamsInitial.get('q'));

      // If the result type is not of type product, we want to disable the filter inputs and remove product type queries from the URL
      if ((types.includes('article') && !types.includes('product')) || (types.includes('page') && !types.includes('product'))) {
        const getInputs = document.querySelectorAll(`#${this.filterFormsId} input:not(#page-type-input)`);
        const getLabels = document.querySelectorAll(`#${this.filterFormsId} label:not(.collection-filters__label)`);

        for (let item of getInputs) {
          item.setAttribute('disabled', 'disabled');
        }

        for (let inputLabel of getLabels) {
          inputLabel.classList.add('facet-checkbox--disabled');
        }

        if (searchParamsInitial.has('filter.p.product_type')) {
          uniqueFormData.delete('filter.p.product_type');
        }

        if (searchParamsInitial.has('filter.p.vendor')) {
          uniqueFormData.delete('filter.p.vendor');
        }

        if (searchParamsInitial.has('filter.v.availability')) {
          uniqueFormData.delete('filter.v.availability');
        }

        if (searchParamsInitial.has('filter.v.price.gte')) {
          uniqueFormData.delete('filter.v.price.gte');
        }

        if (searchParamsInitial.has('filter.v.price.lte')) {
          uniqueFormData.delete('filter.v.price.lte');
        }
      } else {
        // Re-enable the filter inputs
        const getInputs = document.querySelectorAll(`#${this.filterFormsId} input:not(#page-type-input)`);
        const getLabels = document.querySelectorAll(`#${this.filterFormsId} label:not(.collection-filters__label)`);

        for (let item of getInputs) {
          item.removeAttribute('disabled');
        }

        for (let inputLabel of getLabels) {
          inputLabel.classList.remove('facet-checkbox--disabled');
        }
      }

      const searchParams = uniqueFormData.toString();
      this.renderPage(searchParams, event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    event.currentTarget.setAttribute('loading', 'true');
    this.toggleActiveFacets();

    // Clear the price filters
    if (event.currentTarget.classList.contains('price-filter-reset') || event.currentTarget.classList.contains('js-clear-all-filters')) {
      this.filterForm.querySelectorAll('input[data-price-range-min]').forEach(input => input.value = '');
      this.filterForm.querySelectorAll('input[data-price-range-max]').forEach(input => input.value = '');
    }

    this.renderPage(new URL(event.currentTarget.href).searchParams.toString());
  }

  onHistoryChange(event) {
    const searchParams = event.state?.searchParams || '';
    this.renderPage(searchParams, null, false);
  }

  toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  renderPage(searchParams, event, updateURLHash = true) {
    document.querySelector(`#${this.productGridId}>div`).classList.add('loading');

    this.sections.forEach((section) => {
      if (this.collectionTemplate) {
        const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
        const filterDataUrl = element => element.url === url;

        this.filterData.some(filterDataUrl) ?
          this.renderSectionFromCache(filterDataUrl, section, event) :
          this.renderSectionFromFetch(url, section, event);
      } else if (this.searchTemplate) {
        const url = `${window.location.pathname}?${searchParams}`;
        const filterDataUrl = element => element.url === url;

        this.filterData.some(filterDataUrl) ?
          this.renderSectionFromCache(filterDataUrl, section, event) :
          this.renderSectionFromFetch(url, section, event);
      }
    });

    if (updateURLHash) this.updateURLHash(searchParams);
  }

  renderSectionFromFetch(url, section, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        this.filterData = [...this.filterData, { html, url }];

        switch (section.id) {
          case this.productGridId:
            this.renderProductGrid(html);
            break;
          case this.filterFormsId:
            this.renderFilters(html, event);
            break;
          default:
            return;
        }
      });
  }

  renderSectionFromCache(filterDataUrl, section, event) {
    const cachedData = this.filterData.find(filterDataUrl);
    if (!cachedData) return;

    const html = cachedData.html;
    this.renderFilters(html, event);
    this.renderProductGrid(html);
  }

  renderProductGrid(html) {
    const innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById(this.productGridId).innerHTML;

    document.getElementById(this.productGridId).innerHTML = innerHTML;

    // Force a scroll to trigger show-on-scroll load in animations
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);

    const event = new CustomEvent('paginate');
    document.dispatchEvent(event);
  }

  renderFilters(html) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
  
    // Update only elements with data-filter-update attribute
    const elementsToUpdate = parsedHTML.querySelectorAll('[data-filter-update]');
    elementsToUpdate.forEach(newElement => {
      const targetElement = document.querySelector(`[data-filter-update="${newElement.getAttribute('data-filter-update')}"]`);
      if (targetElement) {
        // Only update the inner content, preserving the container and its listeners
        targetElement.innerHTML = newElement.innerHTML;
      }
    });
  
    this.bindSortByEventListeners();
    this.bindActiveFacetButtonEvents();
  }

  bindSortByEventListeners() {
    this.sortByDesktop = this.querySelector('#SortBydesktop');
    this.sortByMobile = this.querySelector('#SortBymobile');

    if (this.sortByDesktop && this.sortByMobile) {
      // Remove existing listeners using bound functions
      this.sortByDesktop.removeEventListener('change', this.handleSortByChangeBound);
      this.sortByMobile.removeEventListener('change', this.handleSortByChangeBound);

      this.sortByDesktop.removeEventListener('input', this.stopInputPropagationBound);
      this.sortByMobile.removeEventListener('input', this.stopInputPropagationBound);

      // Re-attach event listeners
      this.sortByDesktop.addEventListener('change', this.handleSortByChangeBound);
      this.sortByMobile.addEventListener('change', this.handleSortByChangeBound);

      this.sortByDesktop.addEventListener('input', this.stopInputPropagationBound);
      this.sortByMobile.addEventListener('input', this.stopInputPropagationBound);
    }
  }

  bindActiveFacetButtonEvents() {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      // Remove existing listeners to prevent duplicates
      element.removeEventListener('click', this.onActiveFilterClick);
      // Add event listener
      element.addEventListener('click', this.onActiveFilterClick, { once: true });
    });
  }

  updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams ? '?'.concat(searchParams) : ''}`);
  }

  getSections() {
    return [
      {
        id: this.productGridId,
        section: document.getElementById(this.productGridId).dataset.sectionId
      },
      {
        id: this.filterFormsId,
        section: document.getElementById('main-collection-filters').dataset.id
      }
    ];
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('popstate', this.onHistoryChange.bind(this));
  }
}

customElements.define('collection-filtering-form', CollectionFiltersForm);

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', this.onRangeChange.bind(this));
      element.addEventListener('keydown', this.onKeyDown.bind(this));
    });

    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  onKeyDown(event) {
    if (event.metaKey) return;

    const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
    if (!event.key.match(pattern)) event.preventDefault();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('data-min', 0);
    if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('data-min'));
    const max = Number(input.getAttribute('data-max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range-selector', PriceRange);

class PageType extends HTMLElement {
  constructor() {
    super()
    this.selector = document.querySelector('[data-page-type-selector]');
    this.selector.addEventListener('change', this.setValue);
  }

  setValue(e) {
    const selectedTypes = e.currentTarget.querySelectorAll('input:checked');
    const types = Array.from(selectedTypes).map(option => option.value).join(',');

    const typeInput = document.querySelector('#page-type-input');
    typeInput.value = types;

    const event = new Event('input');
    typeInput.closest('form').dispatchEvent(event);
  }
}

customElements.define('page-type-selector', PageType);
/******/ })()
;