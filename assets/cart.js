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

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItemsComponent = this.closest('cart-items-component') || this.closest('cart-drawer-items');
      const lineIndex = this.dataset.index;

      cartItemsComponent.updateQuantity(lineIndex, 0, event);
    });
  }
}
if (!customElements.get('cart-remove-button')) customElements.define('cart-remove-button', CartRemoveButton);

class CartItemsComponent extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items-component') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = document.querySelector(`#Quantity-${id}`) || document.getElementById(`Drawer-quantity-${id}`);
    if (input) {
      input.value = input.getAttribute('value');
      this.isEnterPressed = false;
    }
  }

  setValidity(event, index, message) {
    if (event.target && typeof event.target.setCustomValidity === 'function') {
      event.target.setCustomValidity(message);
      event.target.reportValidity();
      this.resetQuantityInput(index);
      event.target.select();
    }
  }

  validateQuantity(event) {
    if (!event.target.closest('quantity-input')) {
      return;
    }

    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = '';

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      if (event.target && typeof event.target.setCustomValidity === 'function') {
        event.target.setCustomValidity('');
        event.target.reportValidity();
      }
      this.updateQuantity(
        index,
        inputValue,
        event,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  dispatchChangeForShippingMessage() {
    document.querySelectorAll('[data-free-shipping-wrapper]').forEach(freeShippingWrapper => {
        const changeEvent = new Event('change', { bubbles: true })
        freeShippingWrapper.dispatchEvent(changeEvent);
    })
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items-component');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      }
    ];
  }

  updateQuantity(line, quantity, event, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });
    const eventTarget = event && event.currentTarget instanceof CartRemoveButton ? 'clear' : 'change';

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), body })
      .then((response) => response.text())
      .then((state) => {
        let parsedState;
        try {
          parsedState = JSON.parse(state);
        } catch (e) {
          this.updateLiveRegions(line, window.cartStrings.error);
          this.disableLoading(line);
          return;
        }

        CartPerformance.measure(`${eventTarget}:paint-updated-sections`, () => {
          const quantityElement =
            document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
          const items = document.querySelectorAll('.cart-item');

          if (parsedState.errors) {
            if (quantityElement) {
              quantityElement.value = quantityElement.getAttribute('value');
            }
            this.updateLiveRegions(line, parsedState.errors);
            return;
          }

          this.classList.toggle('is-empty', parsedState.item_count === 0);
          const cartDrawerWrapper = document.querySelector('cart-drawer');
          const cartSummary = document.getElementById('main-cart-summary');

          if (cartSummary) cartSummary.classList.toggle('is-empty', parsedState.item_count === 0);
          if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

          this.getSectionsToRender().forEach((section) => {
            const sectionElement = document.getElementById(section.id);
            if (!sectionElement) return;
            const elementToReplace =
              sectionElement.querySelector(section.selector) || sectionElement;
            const sectionHtml = parsedState.sections && parsedState.sections[section.section];
            if (sectionHtml && elementToReplace) {
              elementToReplace.innerHTML = this.getSectionInnerHTML(sectionHtml, section.selector);
            }
          });

          const updatedItem = parsedState.items && parsedState.items[line - 1];
          const updatedValue = updatedItem ? updatedItem.quantity : undefined;
          let message = '';
          if (
            items.length === (parsedState.items ? parsedState.items.length : 0) &&
            quantityElement &&
            updatedValue !== undefined &&
            updatedValue !== parseInt(quantityElement.value, 10)
          ) {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          } else if (
            items.length === (parsedState.items ? parsedState.items.length : 0) &&
            updatedValue === undefined
          ) {
            message = window.cartStrings.error;
          }
          this.updateLiveRegions(line, message);

          const lineItem =
            document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
          if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
            const input = lineItem.querySelector(`[name="${name}"]`);
            if (cartDrawerWrapper) {
              trapFocus(cartDrawerWrapper, input);
            } else {
              input.focus();
            }
          } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
            const emptyDrawer = cartDrawerWrapper.querySelector('.drawer__inner-empty');
            const firstLink = cartDrawerWrapper.querySelector('a');
            if (emptyDrawer && firstLink) {
              trapFocus(emptyDrawer, firstLink);
            }
          } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
            const firstName = document.querySelector('.cart-item__name');
            if (firstName) {
              trapFocus(cartDrawerWrapper, firstName);
            }
          }
        });

        CartPerformance.measureFromEvent(`${eventTarget}:user-action`, event);

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch(() => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) {
          errors.textContent = window.cartStrings.error;
        }
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) {
      const errorTextElement = lineItemError.querySelector('.cart-item__error-text');
      if (errorTextElement) {
        errorTextElement.innerHTML = message;
      }
    }

    if (this.lineItemStatusElement) {
      this.lineItemStatusElement.setAttribute('aria-hidden', true);
    }

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    if (cartStatus) {
      cartStatus.setAttribute('aria-hidden', false);

      setTimeout(() => {
        cartStatus.setAttribute('aria-hidden', true);
      }, 1000);
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) {
      mainCartItems.classList.add('cart__items--disabled');
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    if (this.lineItemStatusElement) {
      this.lineItemStatusElement.setAttribute('aria-hidden', false);
    }
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) {
      mainCartItems.classList.remove('cart__items--disabled');
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}
if (!customElements.get('cart-items-component')) customElements.define('cart-items-component', CartItemsComponent);

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

if (!customElements.get('cart-discount-component')) {
  customElements.define('cart-discount-component', CartDiscountComponent);
}

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

class CountryProvince extends HTMLElement {
  constructor() {
    super();

    this.provinceElement = this.querySelector('[name="address[province]"]');
    this.countryElement = this.querySelector('[name="address[country]"]');
    this.countryElement.addEventListener('change', this.handleCountryChange.bind(this));

    if (this.getAttribute('country') !== '') {
      this.countryElement.selectedIndex = Math.max(0, Array.from(this.countryElement.options).findIndex((option) => option.textContent === this.dataset.country));
      this.countryElement.dispatchEvent(new Event('change'));
    }
    else {
      this.handleCountryChange();
    }
  }

  handleCountryChange() {
    const option = this.countryElement.options[this.countryElement.selectedIndex], provinces = JSON.parse(option.dataset.provinces);
    this.provinceElement.parentElement.style.display = provinces.length === 0 ? 'none' : 'block';

    if (provinces.length === 0) {
      return;
    }

    this.provinceElement.innerHTML = '';

    provinces.forEach((data) => {
      const selected = data[1] === this.dataset.province;
      this.provinceElement.options.add(new Option(data[1], data[0], selected, selected));
    });
  }
}
customElements.define('country-province', CountryProvince);

class ShippingCalculator extends HTMLFormElement {
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

    const variantId = this.getProductVariantId();
    
    if (variantId) {
      this.addToCartAndCalculateShipping(variantId, { zip, country, province });
    } else {
      this.formatError({ error: 'No product variant selected' });
      this.resultsElement.style.display = 'block';
      this.submitButton.removeAttribute('aria-busy');
    }
  }

  addToCartAndCalculateShipping(variantId, shippingAddress) {
    const addToCartBody = JSON.stringify({
      items: [{ id: variantId, quantity: 1 }]
    });

    fetch(`${routes.cart_add_url}`, {
      ...fetchConfig(),
      body: addToCartBody
    })
    .then(() => {
      const body = JSON.stringify({
        shipping_address: shippingAddress
      });
      
      let sectionUrl = `${routes.cart_url}/shipping_rates.json`;
      sectionUrl = sectionUrl.replace('//', '/');

      return fetch(sectionUrl, { ...fetchConfig(), ...{ body } });
    })
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
      this.formatError({ error: 'An error occurred while calculating shipping rates.' });
    })
    .finally(() => {
      this.removeFromCart(variantId);
      this.resultsElement.style.display = 'block';
      this.submitButton.removeAttribute('aria-busy');
    });
  }

  removeFromCart(variantId) {
    const removeBody = JSON.stringify({
      updates: { [variantId]: 0 }
    });

    fetch(`${routes.cart_update_url}`, {
      ...fetchConfig(),
      body: removeBody
    }).catch((e) => {
      console.error('Error removing temporary item from cart:', e);
    });
  }

  getProductVariantId() {
    const productForm = document.querySelector('product-form-component form');
    if (productForm) {
      const variantInput = productForm.querySelector('[name="id"]');
      if (variantInput && variantInput.value) {
        return variantInput.value;
      }
    }
    
    const variantSelector = document.querySelector('variant-selects');
    if (variantSelector) {
      const currentVariant = variantSelector.currentVariant;
      if (currentVariant && currentVariant.id) {
        return currentVariant.id;
      }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const variantFromUrl = urlParams.get('variant');
    if (variantFromUrl) {
      return variantFromUrl;
    }
    
    return null;
  }

  formatError(errors) {
    const shippingRatesList = Object.keys(errors).map((errorKey) => {
      return `<li>${errors[errorKey]}</li>`;
    });
    this.resultsElement.innerHTML = `
      <div class="alert alert--error grid gap-2 text-sm leading-tight">
        <p>Error calculating shipping rates</p>
        <ul class="list-disc grid gap-2" role="list">${shippingRatesList.join('')}</ul>
      </div>
    `;
  }

  formatShippingRates(shippingRates) {
    const shippingRatesList = shippingRates.map(({ presentment_name, currency, price }) => {
      return `<li>${presentment_name}: ${currency} ${price}</li>`;
    });

    this.resultsElement.innerHTML = `
      <div class="alert alert--${shippingRates.length === 0 ? 'error' : 'success'} grid gap-2 text-sm leading-tight">
        <p>${shippingRates.length === 0 ? 'No shipping rates found' : shippingRates.length === 1 ? 'Shipping rate found' : 'Multiple shipping rates found'}</p>
        ${shippingRatesList.length === 0 ? '' : `<ul class="list-disc grid gap-2" role="list">${shippingRatesList.join('')}</ul>`}
      </div>
    `;
  }
}
customElements.define('shipping-calculator', ShippingCalculator, { extends: 'form' });
