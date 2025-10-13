cart.js


class GiftWrapButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', async (event) => {
      event.preventDefault();

      const giftWrapVariantId = this.dataset.giftWrapVariantId;
      if (!giftWrapVariantId) {
        console.error('Gift wrap variant ID not set.');
        return;
      }

      const spinner = this.querySelector('.loading__spinner');
      this.classList.add('loading');
      spinner.classList.remove('hidden');

      this.setAttribute('aria-busy', 'true');
      try {
        await fetch(`${routes.cart_add_url}`, {
          ...fetchConfig(),
          body: JSON.stringify({
            items: [{ id: giftWrapVariantId, quantity: 1 }]
          })
        });

        const cartItemsComponent = document.querySelector('cart-items-component') || document.querySelector('cart-drawer-items');
        if (cartItemsComponent && typeof cartItemsComponent.onCartUpdate === 'function') {
          cartItemsComponent.onCartUpdate();
        }
      } catch (e) {
        console.error('Error adding gift wrap:', e);
      } finally {
        this.removeAttribute('aria-busy');
      }
    });
  }
}
if (!customElements.get('gift-wrap-button')) customElements.define('gift-wrap-button', GiftWrapButton);

class CartItemsComponent extends HTMLElement {
  #debouncedOnChange;

  constructor() {
    super();
    // Debounced handler for quantity changes
    this.#debouncedOnChange = this.#debounce(this.#onQuantityChange, 300).bind(this);

    // Listen for custom remove events from on:click handlers
    this.addEventListener('onLineItemRemove', (event) => {
      // event.detail.line should be the 1-based line index
      if (event?.detail?.line) {
        this.onLineItemRemove(event.detail.line);
      }
    });
  }

  // Debounce utility as a private method
  #debounce(fn, wait) {
    let timeout;
    function debounced(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    }
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
  }

  // Animation end utility
  #onAnimationEnd(elements, callback, options = { subtree: true }) {
    const animations = Array.isArray(elements)
      ? elements.flatMap((element) => element.getAnimations(options))
      : elements.getAnimations(options);
    const animationPromises = animations.reduce((acc, animation) => {
      if (animation.timeline instanceof DocumentTimeline) {
        acc.push(animation.finished);
      }
      return acc;
    }, []);
    return Promise.allSettled(animationPromises).then(callback);
  }

  // Reduced motion check
  #prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Remove shimmer effect
  #resetShimmer(container = document.body) {
    const shimmer = container.querySelectorAll('[shimmer]');
    shimmer.forEach((item) => item.removeAttribute('shimmer'));
  }

  connectedCallback() {
    document.addEventListener('cart:update', this.#handleCartUpdate);
    document.addEventListener('discount:update', this.handleDiscountUpdate);
    document.addEventListener('quantity-selector:update', this.#debouncedOnChange);
  }

  disconnectedCallback() {
    document.removeEventListener('cart:update', this.#handleCartUpdate);
    document.removeEventListener('discount:update', this.handleDiscountUpdate);
    document.removeEventListener('quantity-selector:update', this.#debouncedOnChange);
  }

  /**
   * Handles QuantitySelectorUpdateEvent change event.
   * @param {QuantitySelectorUpdateEvent} event - The event.
   */
  #onQuantityChange(event) {
    const { quantity, cartLine: line } = event.detail || {};
    if (!line) return;

    if (quantity === 0) {
      this.onLineItemRemove(line);
      return;
    }

    this.updateQuantity({
      line,
      quantity,
      action: 'change',
    });

    // Find the cart row by its class and data-line attribute (cart-items__table-row)
    const lineItemRow = this.querySelector(`.cart-items__table-row[data-line="${line}"]`);
    if (!lineItemRow) return;

    const textComponent = lineItemRow.querySelector?.('text-component');
    textComponent?.shimmer?.();
  }

  /**
   * Handles the line item removal.
   * @param {number} line - The line item index (1-based).
   */
  onLineItemRemove(line) {
    // Remove logic: set quantity to 0 for the given line
    this.updateQuantity({
      line,
      quantity: 0,
      action: 'clear',
    });

    // Animate removal of the row(s) in the UI
    const cartItemRowToRemove = this.querySelector(`.cart-items__table-row[data-line="${line}"]`);
    if (!cartItemRowToRemove) return;

    // Remove any child rows (e.g., bundled items) that have this row as parent
    const rowsToRemove = [
      cartItemRowToRemove,
      ...(this.querySelectorAll(`.cart-items__table-row[data-line="${line}"]`).filter?.(
        (row) => row.dataset.parentKey === cartItemRowToRemove.dataset.key
      ) || []),
    ];

    rowsToRemove.forEach((row) => {
      const remove = () => row.remove();
      if (this.#prefersReducedMotion()) return remove();
      row.style.setProperty('--row-height', `${row.clientHeight}px`);
      row.classList.add('removing');
      this.#onAnimationEnd(row, remove);
    });
  }

  /**
   * Updates the quantity for a cart line.
   * @param {Object} config - The config.
   * @param {number} config.line - The line (1-based).
   * @param {number} config.quantity - The quantity.
   * @param {string} config.action - The action ('change' or 'clear').
   */
  updateQuantity(config) {
    // Use CartPerformance from global.js if available
    let cartPerformanceUpdateMarker = null;
    if (
      typeof CartPerformance !== 'undefined' &&
      CartPerformance &&
      typeof CartPerformance.createStartingMarker === 'function'
    ) {
      cartPerformanceUpdateMarker = CartPerformance.createStartingMarker(`${config.action}:user-action`);
    }
    this.#disableCartItems();

    const { line, quantity } = config;
    const cartTotal = this.querySelector('.cart-total');

    // Collect all section IDs to update
    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    const sectionsToUpdate = new Set([this.sectionId]);
    cartItemsComponents.forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionsToUpdate.add(item.dataset.sectionId);
      }
    });

    const body = JSON.stringify({
      line,
      quantity,
      sections: Array.from(sectionsToUpdate),
      sections_url: window.location.pathname,
    });

    cartTotal?.shimmer?.();
    fetch(`${routes.cart_change_url}`, { ...fetchConfig('json'), ...{ body } })
      .then((response) => response.text())
      .then((responseText) => {
        console.log(
          "line:", line,
          "quantity:", quantity,
          "sections:", Array.from(sectionsToUpdate),
          "sections_url:", window.location.pathname
        );
        let parsedResponseText;
        try {
          parsedResponseText = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse cart update response:', e);
          this.#enableCartItems();
          return;
        }

        this.#resetShimmer(this);

        if (!parsedResponseText.sections || typeof parsedResponseText.sections !== 'object') {
          this.#enableCartItems();
          return;
        }

        if (parsedResponseText.errors) {
          this.#handleCartError(line, parsedResponseText);
          return;
        }

        let newSectionHTML = null;
        if (
          this.sectionId &&
          parsedResponseText.sections[this.sectionId]
        ) {
          newSectionHTML = new DOMParser().parseFromString(
            parsedResponseText.sections[this.sectionId],
            'text/html'
          );
        } else {
          // Enhanced error logging for missing section HTML
          console.error(
            `Section HTML not found for sectionId: "${this.sectionId}".\n` +
            `Available section IDs in response: ${
              parsedResponseText.sections
                ? Object.keys(parsedResponseText.sections).join(', ')
                : 'none'
            }\nFull response:`,
            parsedResponseText
          );
          this.#enableCartItems();
          return;
        }

        // Get new cart item count
        const newCartHiddenItemCount = newSectionHTML.querySelector('.cart-item-count')?.textContent;
        const newCartItemCount = newCartHiddenItemCount ? parseInt(newCartHiddenItemCount, 10) : 0;

        // Use a plain CustomEvent instead of CartUpdateEvent to avoid ReferenceError
        this.dispatchEvent(
          new CustomEvent('cart:update', {
            bubbles: true,
            detail: {
              sectionId: this.sectionId,  
              itemCount: newCartItemCount,
              source: 'cart-items-component',
              sections: parsedResponseText.sections,
            }
          })
        );

        if (typeof morphSection === 'function') {
          morphSection(this.sectionId, parsedResponseText.sections[this.sectionId]);
        } else {
          const sectionEl = document.getElementById(`shopify-section-${this.sectionId}`);
          if (sectionEl) sectionEl.outerHTML = parsedResponseText.sections[this.sectionId];
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.#enableCartItems();
        if (
          typeof CartPerformance !== 'undefined' &&
          CartPerformance &&
          typeof CartPerformance.measureFromMarker === 'function' &&
          cartPerformanceUpdateMarker
        ) {
          CartPerformance.measureFromMarker(`${config.action}:user-action`, cartPerformanceUpdateMarker);
        }
      });
  }

  /**
   * Handles the discount update.
   * @param {DiscountUpdateEvent} event - The event.
   */
  handleDiscountUpdate = (event) => {
    this.#handleCartUpdate(event);
  };

  /**
   * Handles the cart error.
   * @param {number} line - The line.
   * @param {Object} parsedResponseText - The parsed response text.
   * @param {string} parsedResponseText.errors - The errors.
   */
  #handleCartError = (line, parsedResponseText) => {
    const quantitySelector = this.querySelector(`.cart-items__table-row[data-line="${line}"]`);
    const quantityInput = quantitySelector?.querySelector?.('input');
    if (!quantityInput) {
      console.error('Quantity input not found');
      return;
    }

    quantityInput.value = quantityInput.defaultValue;

    const cartItemError = this.querySelector(`.cart-items__table-row[data-line="${line}"] .cart-item__error-text`);
    const cartItemErrorContainer = this.querySelector(`.cart-items__table-row[data-line="${line}"] .cart-item__error`);

    if (!(cartItemError instanceof HTMLElement)) {
      console.error('Cart item error not found');
      return;
    }
    if (!(cartItemErrorContainer instanceof HTMLElement)) {
      console.error('Cart item error container not found');
      return;
    }

    cartItemError.textContent = parsedResponseText.errors;
    cartItemErrorContainer.classList.remove('hidden');
  };

  /**
   * Handles the cart update.
   *
   * @param {DiscountUpdateEvent | CustomEvent | CartAddEvent} event
   */
  #handleCartUpdate = (event) => {
    if (typeof DiscountUpdateEvent !== 'undefined' && event instanceof DiscountUpdateEvent) {
      sectionRenderer.renderSection(this.sectionId, { cache: false });
      return;
    }
    if (event.target === this) return;

    const cartItemsHtml = event.detail?.data?.sections?.[this.sectionId] || event.detail?.sections?.[this.sectionId];
    if (cartItemsHtml) {
      if (typeof morphSection === 'function') {
        morphSection(this.sectionId, cartItemsHtml);
      } else {
        const sectionEl = document.getElementById(`shopify-section-${this.sectionId}`);
        if (sectionEl) sectionEl.outerHTML = cartItemsHtml;
      }
    } else {
      sectionRenderer.renderSection(this.sectionId, { cache: false });
    }
  };

  /**
   * Disables the cart items.
   */
  #disableCartItems() {
    this.classList.add('cart-items-disabled');
  }

  /**
   * Enables the cart items.
   */
  #enableCartItems() {
    this.classList.remove('cart-items-disabled');
  }

  /**
   * Gets the section id.
   * @returns {string} The section id.
   */
  get sectionId() {
    const { sectionId } = this.dataset || {};
    if (!sectionId) throw new Error('Section id missing');
    return sectionId;
  }
}
if (!customElements.get('cart-items-component')) customElements.define('cart-items-component', CartItemsComponent);

class CartDrawerItems extends CartItemsComponent {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: 'cart-drawer-items'
      },
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__footer'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}
if (!customElements.get('cart-drawer-items')) customElements.define('cart-drawer-items', CartDrawerItems);

class QuantitySelectorComponent extends HTMLElement {
}
if (!customElements.get('quantity-selector-component')) customElements.define('quantity-selector-component', QuantitySelectorComponent);

class CartDiscountComponent extends HTMLElement {
  constructor() {
    super();
    this.requiredRefs = ['cartDiscountError', 'cartDiscountErrorDiscountCode', 'cartDiscountErrorShipping'];
    /** @type {AbortController | null} */
    this.activeFetch = null;

    this.applyDiscount = this.applyDiscount.bind(this);
    this.removeDiscount = this.removeDiscount.bind(this);

    const discountForm = this.querySelector('form.cart-discount__form');
    if (discountForm) {
      discountForm.addEventListener('submit', this.applyDiscount);
    }

    this.addEventListener('click', (event) => {
      if (event.target.closest('.cart-discount__pill')) {
        this.removeDiscount(event);
      }
    });
    this.addEventListener('keydown', (event) => {
      if (
        event.target.closest('.cart-discount__pill') &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        this.removeDiscount(event);
      }
    });
  }

  get refs() {
    return {
      cartDiscountError: this.querySelector('.cart-discount__error'),
      cartDiscountErrorDiscountCode: this.querySelector('.cart-discount__error-discount-code'),
      cartDiscountErrorShipping: this.querySelector('.cart-discount__error-shipping')
    };
  }

  createAbortController() {
    if (this.activeFetch) {
      this.activeFetch.abort();
    }
    const abortController = new AbortController();
    this.activeFetch = abortController;
    return abortController;
  }

  existingDiscounts() {
    const discountCodes = [];
    const discountPills = this.querySelectorAll('.cart-discount__pill');
    for (const pill of discountPills) {
      if (pill instanceof HTMLLIElement && typeof pill.dataset.discountCode === 'string') {
        discountCodes.push(pill.dataset.discountCode);
      }
    }
    return discountCodes;
  }

  async applyDiscount(event) {
    const { cartDiscountError, cartDiscountErrorDiscountCode, cartDiscountErrorShipping } = this.refs;

    event.preventDefault();
    event.stopPropagation();

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const discountCodeInput = form.querySelector('input[name="discount"]');
    if (!(discountCodeInput instanceof HTMLInputElement) || typeof this.dataset.sectionId !== 'string') return;

    const discountCodeValue = discountCodeInput.value.trim();
    if (!discountCodeValue) return;

    const abortController = this.createAbortController();

    try {
      const existingDiscounts = this.existingDiscounts();
      if (existingDiscounts.includes(discountCodeValue)) return;

      cartDiscountError.classList.add('hidden');
      cartDiscountErrorDiscountCode.classList.add('hidden');
      cartDiscountErrorShipping.classList.add('hidden');

      const bodyObj = {
        discount: [...existingDiscounts, discountCodeValue].join(','),
        sections: [this.dataset.sectionId],
      };

      const config = fetchConfig('json');

      const fetchOptions = {
        ...config,
        body: JSON.stringify(bodyObj),
        signal: abortController.signal,
      };

      const response = await fetch(`${routes.cart_update_url}`, fetchOptions);
      const data = await response.json();

      if (
        data.discount_codes &&
        data.discount_codes.find((discount) => {
          return discount.code === discountCodeValue && discount.applicable === false;
        })
      ) {
        discountCodeInput.value = '';
        this.handleDiscountError('discount_code');
        return;
      }

      const newHtml = data.sections[this.dataset.sectionId];
      const parsedHtml = new DOMParser().parseFromString(newHtml, 'text/html');
      const section = parsedHtml.getElementById(`shopify-section-${this.dataset.sectionId}`);
      const discountPills = section?.querySelectorAll('.cart-discount__pill') || [];
      if (section) {
        const codes = Array.from(discountPills)
          .map((element) => (element instanceof HTMLLIElement ? element.dataset.discountCode : null))
          .filter(Boolean);
        if (
          codes.length === existingDiscounts.length &&
          codes.every((code) => existingDiscounts.includes(code)) &&
          data.discount_codes &&
          data.discount_codes.find((discount) => {
            return discount.code === discountCodeValue && discount.applicable === true;
          })
        ) {
          this.handleDiscountError('shipping');
          discountCodeInput.value = '';
          return;
        }
      }

      document.dispatchEvent(new CustomEvent('DiscountUpdateEvent', { detail: { data, id: this.id } }));
      if (typeof morphSection === 'function') {
        morphSection(this.dataset.sectionId, newHtml);
      } else {
        const sectionEl = document.getElementById(`shopify-section-${this.dataset.sectionId}`);
        if (sectionEl) sectionEl.outerHTML = newHtml;
      }
    } catch (error) {
    } finally {
      this.activeFetch = null;
      if (window.cartPerformance && typeof cartPerformance.measureFromEvent === 'function') {
        cartPerformance.measureFromEvent('discount-update:user-action', event);
      }
    }
  }

  async removeDiscount(event) {
    event.preventDefault();
    event.stopPropagation();

    if (
      (event instanceof KeyboardEvent && event.key !== 'Enter') ||
      !(event instanceof MouseEvent) ||
      !(event.target instanceof HTMLElement) ||
      typeof this.dataset.sectionId !== 'string'
    ) {
      return;
    }

    const pill = event.target.closest('.cart-discount__pill');
    if (!(pill instanceof HTMLLIElement)) return;

    const discountCode = pill.dataset.discountCode;
    if (!discountCode) return;

    const existingDiscounts = this.existingDiscounts();
    const index = existingDiscounts.indexOf(discountCode);
    if (index === -1) return;

    existingDiscounts.splice(index, 1);

    const bodyObj = { 
      discount: existingDiscounts.join(','),
      sections: [this.dataset.sectionId]
    };
    
    const abortController = this.createAbortController();

    try {
      const config = fetchConfig('json');

      const fetchOptions = {
        ...config,
        body: JSON.stringify(bodyObj),
        signal: abortController.signal,
      };

      const response = await fetch(`${routes.cart_update_url}`, fetchOptions);

      const data = await response.json();

      document.dispatchEvent(new CustomEvent('DiscountUpdateEvent', { detail: { data, id: this.id } }));
      if (typeof morphSection === 'function') {
        morphSection(this.dataset.sectionId, data.sections[this.dataset.sectionId]);
      } else {
        const sectionEl = document.getElementById(`shopify-section-${this.dataset.sectionId}`);
        if (sectionEl) sectionEl.outerHTML = data.sections[this.dataset.sectionId];
      }
    } catch (error) {
    } finally {
      this.activeFetch = null;
    }
  }

  handleDiscountError(type) {
    const { cartDiscountError, cartDiscountErrorDiscountCode, cartDiscountErrorShipping } = this.refs;
    const target =
      type === 'discount_code'
        ? cartDiscountErrorDiscountCode
        : cartDiscountErrorShipping;
    cartDiscountError && cartDiscountError.classList.remove('hidden');
    target && target.classList.remove('hidden');
  }
}
if (!customElements.get('cart-discount-component')) customElements.define('cart-discount-component', CartDiscountComponent);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } }).then(() =>
              CartPerformance.measureFromEvent('note-update:user-action', event)
            );
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}

class CountryProvinceComponent extends HTMLElement {
  constructor() {
    super();

    this.provinceElement = this.querySelector('[name="address[province]"]');
    this.countryElement = this.querySelector('[name="address[country]"]');
    this.countryElement.addEventListener('change', this.handleCountryChange.bind(this));

    if (this.dataset.country && this.dataset.country !== '') {
      const idx = Array.from(this.countryElement.options).findIndex(
        (option) => option.textContent === this.dataset.country
      );
      this.countryElement.selectedIndex = Math.max(0, idx);
      this.countryElement.dispatchEvent(new Event('change'));
    } else {
      this.handleCountryChange();
    }
  }

  handleCountryChange() {
    const option = this.countryElement.options[this.countryElement.selectedIndex];
    if (!option || !option.dataset.provinces) {
      this.provinceElement.parentElement.style.display = 'none';
      this.provinceElement.innerHTML = '';
      return;
    }
    let provinces = [];
    try {
      provinces = JSON.parse(option.dataset.provinces);
    } catch (e) {
      provinces = [];
    }
    this.provinceElement.parentElement.style.display = provinces.length === 0 ? 'none' : 'block';

    if (provinces.length === 0) {
      this.provinceElement.innerHTML = '';
      return;
    }

    this.provinceElement.innerHTML = '';

    provinces.forEach((data) => {
      const selected = data[1] === this.dataset.province;
      this.provinceElement.options.add(new Option(data[1], data[0], selected, selected));
    });
  }
}
if (!customElements.get('country-province-component')) customElements.define('country-province-component', CountryProvinceComponent);

class ShippingCalculatorComponent extends HTMLFormElement {
  constructor() {
    super();

    this.submitButton = this.querySelector('[type="submit"]');
    this.resultsElement = this.querySelector('.results');

    this.submitButton.addEventListener('click', this.handleFormSubmit.bind(this));
  }

  handleFormSubmit(event) {
    event.preventDefault();

    const zip = this.querySelector('[name="address[zip]"]').value,
      country = this.querySelector('[name="address[country]"]').value,
      province = this.querySelector('[name="address[province]"]').value;

    this.submitButton.setAttribute('aria-busy', 'true');

    const body = JSON.stringify({
      shipping_address: { zip, country, province }
    });
    let sectionUrl = `${routes.cart_url}/shipping_rates.json`;

    sectionUrl = sectionUrl.replace(/\/\//g, '/');

    fetch(sectionUrl, { ...fetchConfig('javascript'), ...{ body } })
      .then((response) => response.json())
      .then((parsedState) => {
        if (parsedState.shipping_rates) {
          this.formatShippingRates(parsedState.shipping_rates);
        } else {
          this.formatError(parsedState);
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.resultsElement.hidden = false;
        this.submitButton.removeAttribute('aria-busy');
      });
  }

  formatError(errors) {
    const shippingRatesList = Object.keys(errors).map((errorKey) => {
      return `<li>${errors[errorKey]}</li>`;
    });
    this.resultsElement.innerHTML = `
      <div class="alertBox alertBox--error grid gap-xl">
        <p>${window.shippingCalculatorStrings.error}</p>
        <ul class="list-disc grid gap-xl p-0 m-0" role="list">${shippingRatesList.join('')}</ul>
      </div>
    `;
  }

  formatShippingRates(shippingRates) {
    const shippingRatesList = shippingRates.map(({ presentment_name, currency, price }) => {
      return `<li>${presentment_name}: ${currency} ${price}</li>`;
    });
    this.resultsElement.innerHTML = `
      <div class="alertBox alertBox--${shippingRates.length === 0 ? 'error' : 'warning'} grid gap-xl">
        <p>${shippingRates.length === 0 ? window.shippingCalculatorStrings.not_found : shippingRates.length === 1 ? window.shippingCalculatorStrings.one_result : window.shippingCalculatorStrings.multiple_results}</p>
        ${shippingRatesList.length === 0 ? '' : `<ul class="list-disc grid gap-xl p-0 m-0" role="list">${shippingRatesList.join('')}</ul>`}
      </div>
    `;
  }
}
if (!customElements.get('shipping-calculator-component')) customElements.define('shipping-calculator-component', ShippingCalculatorComponent, { extends: 'form' });
