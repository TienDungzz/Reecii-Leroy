
// Edit cart
class EditCart extends HTMLElement {
  constructor() {
    super();
    this.checkLoadEC = true;
    this.handleOpenEditCart = this.handleOpenEditCart.bind(this);
    this.handleCloseEditCart = this.handleCloseEditCart.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
  }

  connectedCallback() {
    this.init();
  }

  init() {
    document.addEventListener('click', this.handleOpenEditCart);
    document.addEventListener('click', this.handleCloseEditCart);
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('click', this.handleRemoveItem);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleOpenEditCart);
    document.removeEventListener('click', this.handleCloseEditCart);
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('click', this.handleRemoveItem);
  }

  handleOpenEditCart(event) {
    const openBtn = event.target.closest('[data-open-edit-cart]');
    if (!openBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const url = openBtn.getAttribute('data-edit-cart-url');
    const itemId = openBtn.getAttribute('data-edit-cart-id');
    const itemLine = openBtn.getAttribute('data-line');
    const itemIndex = openBtn.getAttribute('data-index');
    const quantity = openBtn.getAttribute('data-edit-cart-quantity');
    // Try to get option text if available
    let option = '';
    const previewCartItem = openBtn.closest('.previewCartItem');
    if (previewCartItem) {
      const variant = previewCartItem.querySelector('previewCartItem-variant');
      if (variant) option = variant.textContent;
    }

    const modal = document.querySelector('[data-edit-cart-popup]');
    const modalContent = modal ? modal.querySelector('.halo-popup-content') : null;

    // AJAX fetch (vanilla)
    if (url && modalContent) {
      fetch(url, { method: 'GET', credentials: 'same-origin' })
        .then(response => response.text())
        .then(data => {
          modalContent.innerHTML = data;
          const cartEdit = modalContent.querySelector('[data-template-cart-edit]');
          if (cartEdit) {
            cartEdit.setAttribute('data-cart-update-id', itemId);
            cartEdit.setAttribute('data-line', itemLine);
            cartEdit.setAttribute('data-index', itemIndex);
          }
          const productItem = modalContent.querySelector('.product-edit-item');
          if (productItem) {
            const qtyInput = productItem.querySelector('input[name="updates[]"]');
            if (qtyInput) qtyInput.value = quantity;

            const minusBtn = productItem.querySelector('.quantity__button[name="minus"]');
            if (minusBtn) minusBtn.classList.remove('disabled');
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          const modal = document.querySelector(openBtn.getAttribute('data-modal'));
          if (modal) modal.show(openBtn);
        });
    }
  }

  handleCloseEditCart(event) {
    const closeBtn = event.target.closest('[data-close-edit-cart]');
    if (!closeBtn) return;

    event.preventDefault();
    event.stopPropagation();

    document.body.classList.remove('edit-cart-show');
  }

  handleDocumentClick(event) {
    if (!document.body.classList.contains('edit-cart-show')) return;
    const isInsidePopup = event.target.closest('[data-edit-cart-popup]');
    const isOpenBtn = event.target.closest('[data-open-edit-cart]');
    if (!isInsidePopup && !isOpenBtn) {
      document.body.classList.remove('edit-cart-show');
    }
  }

  handleRemoveItem(event) {
    const removeBtn = event.target.closest('[data-edit-cart-remove]');
    if (!removeBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const currentItem = removeBtn.closest('.product-edit-item');
    if (currentItem) {
      currentItem.remove();
    }
  }
}

if (!customElements.get("edit-cart"))
  customElements.define('edit-cart', EditCart);

// Edit cart add more
class EditCartAddMore extends HTMLElement {
  constructor() {
    super();
    this.handleAddMore = this.handleAddMore.bind(this);
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.addEventListener('click', this.handleAddMore);
  }

  handleAddMore(event) {
    const addMoreBtn = event.target.closest('[data-edit-cart-add-more]');
    if (!addMoreBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const itemWrapper = document.querySelector('[data-template-cart-edit]');
    const currentItem = addMoreBtn.closest('.product-edit-item');
    if (!itemWrapper || !currentItem) return;

    let count = parseInt(itemWrapper.getAttribute('data-count'), 10) || 1;
    const cloneProduct = currentItem.cloneNode(true);
    cloneProduct.classList.remove('product-edit-itemFirst');
    const cloneProductId = (cloneProduct.getAttribute('id') || '') + count;
    cloneProduct.setAttribute('id', cloneProductId);

    // If you have a function to update attributes, call it here
    if (typeof updateClonedProductAttributes === 'function') {
      console.log(count);

      updateClonedProductAttributes(cloneProduct, count);
    }

    currentItem.parentNode.insertBefore(cloneProduct, currentItem.nextSibling);

    count = count + 1;
    itemWrapper.setAttribute('data-count', count);
  }
}

if (!customElements.get("edit-cart-add-more"))
  customElements.define('edit-cart-add-more', EditCartAddMore);

// Add all edit cart
class AddAllEditCart extends HTMLElement {
  constructor() {
    super();
    this.handleAddAll = this.handleAddAll.bind(this);
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.addEventListener('click', this.handleAddAll);
  }

  handleAddAll(event) {
    const addAllBtn = event.target.closest('[data-update-cart-edit]');
    if (!addAllBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const cartEdit = addAllBtn.closest('edit-cart-modal')?.querySelector('[data-template-cart-edit]');
    if (!cartEdit) return;

    const selectedProducts = cartEdit.querySelectorAll('.product-edit-item.isChecked');
    const productLine = cartEdit.getAttribute('data-line');
    const index = cartEdit.getAttribute('data-index');

    if (selectedProducts.length === 0) {
      alert(window.variantStrings.addToCart_message);
      return;
    }

    const spinner = addAllBtn.querySelector('.loading__spinner');
    addAllBtn.classList.add('loading');
    spinner.classList.remove('hidden');

    // Step 1: remove current product
    Shopify.removeItem(productLine, index, (cart)  => {
      // try {
      //   // Step 2: add all selected products
      //   const requests = Array.from(selectedProducts).map((item, i) => {
      //     const variantId = item.querySelector('input[name="id"]').value;
      //     const qty = parseInt(item.querySelector('input[name="updates[]"]').value) || 1;

      //     var formData = new URLSearchParams(window.location.search);

      //     formData.append('id', variantId);
      //     formData.append('quantity', qty);
      //     // 👇 properties để phân biệt clone (nếu có nhiều dòng cùng variantId)
      //     formData.append('properties[_clone]', `item-${i + 1}`);

      //     return fetch(`${window.routes.root}/cart/add.js`, {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      //       body: formData.toString(),
      //       credentials: 'same-origin',
      //     });
      //   });

      //   await Promise.all(requests);

      //   // Step 3: fetch updated cart
      //   Shopify.getCart((updatedCart) => {
      //     console.log("✅ Updated cart:", updatedCart);

      //     document.body.classList.remove('edit-cart-show');

      //     fetch(`${window.routes.root}?section_id=cart-drawer`)
      //       .then((res) => res.text())
      //       .then((htmlText) => {
      //         const html = new DOMParser().parseFromString(htmlText, 'text/html');
      //         const selectors = ['cart-drawer-items', '.cart-drawer__footer'];

      //         selectors.forEach((selector) => {
      //           const target = document.querySelector(selector);
      //           const source = html.querySelector(selector);
      //           if (target && source) target.replaceWith(source);
      //         });
      //       })
      //       .catch(console.error);
      //   });
      // } catch (error) {
      //   console.error("❌ Error replacing items:", error);
      // } finally {
      //   addAllBtn.classList.remove('is-loading');
      // }

      // Convert jQuery code to vanilla JS

      if (cart && Object.keys(cart).length > 0) {
        const productHandleQueue = [];
        const selectedProductsArray = Array.from(selectedProducts);

        selectedProductsArray.forEach((element, i) => {
          const variantId = element.querySelector('input[name="id"]').value;
          // Try both 'updates[]' and 'quantity' for compatibility
          let qtyInput = element.querySelector('input[name="updates[]"]');
          if (!qtyInput) {
            qtyInput = element.querySelector('input[name="quantity"]');
          }
          const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

          const formData = new URLSearchParams();
          formData.append('id', variantId);
          formData.append('quantity', qty);
          formData.append('properties[_clone]', `item-${i + 1}`);

          productHandleQueue.push(
            fetch(`${window.routes.root}/cart/add.js`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
              body: formData.toString(),
              credentials: 'same-origin',
            })
          );
        });

        if (productHandleQueue.length > 0) {
          Promise.all(productHandleQueue).then((results) => {
            Shopify.getCart((cart) => {
              fetch(window.routes.root + '/cart?view=ajax_side_cart', {
                method: 'GET',
                cache: 'no-store'
              })
                .then(async (response) => {
                  if (!response.ok) {
                    let errorData;
                    try {
                      errorData = await response.json();
                    } catch (e) {
                      errorData = { description: 'Unexpected error' };
                    }
                    throw errorData;
                  }
                  return response.text();
                })
                .then((data) => {

                  const html = new DOMParser().parseFromString(data, 'text/html');
                  const selectors = ['cart-drawer-items', '.cart-drawer__footer'];

                  selectors.forEach((selector) => {
                    const target = document.querySelector(selector);
                    const source = html.querySelector(selector);
                    if (target && source) target.replaceWith(source);
                  });

                })
                .catch((err) => {
                })
                .finally(() => {

                  if (cart.item_count >= 100) {
                    const bubble = document.querySelector('.cart-count-bubble [data-cart-count]');
                    if (bubble) bubble.textContent = window.cartStrings.item_99;
                  }

                  const textEl = document.querySelector('[data-cart-text]');
                  if (textEl) {
                    textEl.textContent = cart.item_count === 1
                      ? window.cartStrings.item
                      : window.cartStrings.items;
                  }

                  addAllBtn.classList.remove('is-loading');
                  spinner.classList.add('hidden');
                  this.closest('modal-dialog').hide();

                  // document.dispatchEvent(new CustomEvent('cart-update', { detail: cart }));
                  publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: cart, variantId: variantId });
                });
            });
          });
        }
      }
    });
  }
}

if (!customElements.get("add-all-edit-cart"))
  customElements.define('add-all-edit-cart', AddAllEditCart);