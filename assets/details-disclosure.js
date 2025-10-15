class SideDrawerOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');
    if (!button) return;

    let isFirstLoad  = true;
    button.addEventListener('click', () => {
      const drawer = document.querySelector(this.getAttribute('data-side-drawer'));

      if (isFirstLoad && this.hasAttribute('drawer-has-url')) {
        isFirstLoad = false;
        const urlStyle = drawer?.dataset.urlStyleSheet;
        if (urlStyle) buildStyleSheet(urlStyle, drawer);
      }
      if(button.closest('.header__icon--menu')) {
        if(button.classList.contains('active')) {
          button.classList.remove('active');
          if (drawer) drawer.close();
        } else {
          document.documentElement.style.setProperty('--header-height', `${document.querySelector(".header").offsetHeight}px`);
          button.classList.add('active');
          if (drawer) drawer.open(button);
        }
      } else {
        if (drawer) drawer.open(button);
      }
    });
  }
}
if (!customElements.get('side-drawer-opener')) customElements.define('side-drawer-opener', SideDrawerOpener);

class SideDrawerClose extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');
    if (!button) return;

    button.addEventListener('click', () => {
      const drawer = document.querySelector(this.getAttribute('data-side-drawer'));
      if (drawer) drawer.close();
    });
  }
}
if (!customElements.get('side-drawer-close')) customElements.define('side-drawer-close', SideDrawerClose);

class SideDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.overlay = this.querySelector('[id^="Drawer-Overlay-"]');
    this.overlay?.addEventListener('click', this.close.bind(this));
  }

  connectedCallback() {
    if (!this.dataset.moved) {
      this.dataset.moved = true;
      document.body.appendChild(this);
    }
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    setTimeout(() => this.classList.add('active'));

    this.handleTransition(true, 'drawer--opening', 'drawer--open');
    this.trapFocus();
    document.body.classList.add('overflow-hidden');

    const dir = this.getAttribute("data-drawer-direction");
    const contentElement = this.querySelector("[data-drawer-content]");

    this.classList.add("open");

    Motion.timeline([
      [
        this.overlay,
        {
          transform:
            dir === "left"
              ? ["translateX(-100%)", "translateX(0)"]
              : ["translateX(100%)", "translateX(0)"],
        },
        { duration: 0.3, easing: [0.61, 0.22, 0.23, 1] },
      ],
      [
        contentElement,
        {
          opacity: [0, 1],
          transform:
            dir === "left"
              ? ["translateX(-100%)", "translateX(0)"]
              : ["translateX(100%)", "translateX(0)"],
        },
        { duration: 0.3, easing: [0.61, 0.22, 0.23, 1], at: "-0.05" },
      ],
    ]);

    // Stop Lenis smooth scroll
    stopLenis();
  }

  async close() {
    this.classList.remove('active');
    if (this.activeElement) removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
    this.handleTransition(false, 'drawer--closing');

    const dir = this.getAttribute("data-drawer-direction");
    const detailsElement = this.overlay.closest("details");
    const contentElement = this.querySelector("[data-drawer-content]");

    this.classList.remove("open");

    if (document.querySelector('.header__icon--menu button.active')) {
      document.querySelector('.header__icon--menu button').classList.remove('active');
    }

    await Motion.timeline([
      [
        contentElement,
        {
          opacity: [1, 0],
          transform:
            dir === "left"
              ? ["translateX(0)", "translateX(-100%)"]
              : ["translateX(0)", "translateX(100%)"],
        },
        { duration: 0.3, easing: [0.61, 0.22, 0.23, 1] },
      ],
      [
        this.overlay,
        {
          transform:
            dir === "left"
              ? ["translateX(0)", "translateX(-100%)"]
              : ["translateX(0)", "translateX(100%)"],
        },
        { duration: 0.3, easing: [0.61, 0.22, 0.23, 1], at: "+0.1" },
      ],
    ]).finished;

    if (detailsElement) {
      detailsElement.removeAttribute("open");
      detailsElement.classList.remove("menu-opening");
      document.body.classList.remove('overflow-hidden-mobile')
    }

    // Start Lenis smooth scroll
    startLenis();
  }

  handleTransition(checkOpen, startClass, endClass = '') {
    const isDrawer = this.querySelector('.side-drawer:not(.popup__inner)');
    if (!isDrawer) return;

    this.addEventListener('transitionstart', () => {
      document.body.classList.add(startClass);
      checkOpen ? document.body.classList.remove('drawer--open', 'drawer--closing') : document.body.classList.remove('drawer--open', 'drawer--opening');
    }, { once: true });

    this.addEventListener('transitionend', () => {
      checkOpen ? document.body.classList.remove(startClass, 'drawer--opening', 'drawer--closing') : document.body.classList.remove('drawer--closing', 'drawer--opening', 'drawer--open');
      if (endClass) document.body.classList.add(endClass);
    }, { once: true });
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  trapFocus() {
    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.querySelector('.drawer__inner, .popup__inner, .blog-posts__sidebar');
      const focusElement = this.querySelector('.search__input, .popup__input, .drawer__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });
  }
}
if (!customElements.get('side-drawer')) customElements.define('side-drawer', SideDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('#Modal-Overlay')?.addEventListener('click', this.hide.bind(this));
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (!this.dataset.moved) {
      this.dataset.moved = true;
      this.dataset.section = this.closest('.shopify-section')?.id.replace('shopify-section-', '');
      document.body.appendChild(this);
    }
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    this.trapFocus();
    // window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }

  trapFocus() {
    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.querySelector('.drawer__inner, .popup__inner');
      const focusElement = this.querySelector('[role="dialog"], .popup__inner');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });
  }
}
if (!customElements.get('modal-dialog')) customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
if (!customElements.get('modal-opener')) customElements.define('modal-opener', ModalOpener);

class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}
if (!customElements.get('details-disclosure')) customElements.define('details-disclosure', DetailsDisclosure);

class CollapsibleDetails extends HTMLDetailsElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this._isOpen = this.hasAttribute('open');
    this.summary = this.querySelector('summary');
    this.content = this.summary.nextElementSibling;
    this.setAttribute('aria-expanded', this._isOpen ? 'true' : 'false');
    this.summary?.addEventListener('click', this._toggleOpen.bind(this));

    if (this.hasAttribute('collapsible-mobile')) {
      this.resizeHandler();
      window.addEventListener('resize', this.resizeHandler.bind(this));
      document.addEventListener('unmatchSmall', this.resizeHandler.bind(this));
    }

    if (Shopify.designMode && this.hasAttribute('check-shopify-design-mode')) {
      this.addEventListener('shopify:block:select', () => this.isOpen = true);
      this.addEventListener('shopify:block:deselect', () => this.isOpen = false);
    }
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') this.setAttribute('aria-expanded', newValue === '' ? 'true' : 'false');
  }

  get isOpen() {
    return this._isOpen;
  }

  set isOpen(value) {
    if (value !== this._isOpen) {
      this._isOpen = value;

      if (this.isConnected) {
        this._animate(value);
      } else {
        value ? this.setAttribute('open', '') : this.removeAttribute('open');
      }
    }
    this.setAttribute('aria-expanded', value ? 'true' : 'false');
  }

  _toggleOpen(event) {
    event.preventDefault();
    this.isOpen = !this.isOpen;
  }

  close() {
    this._isOpen = false;
    this._animate(false);
  }

  resizeHandler() {
    if (window.matchMedia('(max-width: 749px)').matches) {
      if (this.isOpen) {
        this._isOpen = false;
        this.removeAttribute('open');
        this.setAttribute('aria-expanded', 'false');
      }
    } else {
      this._isOpen = true;
      this.setAttribute('open', '');
      this.setAttribute('aria-expanded', 'true');
    }
  }

  async _animate(open) {
    this.style.overflow = 'hidden';
    if (open) {
      this.setAttribute('open', '');

      await Motion.timeline([
        [this, { height: [`${this.summary.clientHeight}px`, `${this.scrollHeight}px`] }, { duration: 0.45, easing: 'cubic-bezier(0.7, 0, 0.3, 1)' }],
        [this.content, { opacity: [0, 1], transform: ['translateX(-1rem)', 'translateX(0)'] }, { duration: 0.25, at: '-0.1' }]
      ]).finished;
    } else {
      await Motion.timeline([
        [this.content, { opacity: 0, transform: ['translateX(0)', 'translateX(1rem)'] }, { duration: 0.15 }],
        [this, { height: [`${this.clientHeight}px`, `${this.summary.clientHeight}px`] }, { duration: 0.35, at: '<', easing: 'cubic-bezier(0.7, 0, 0.3, 1)' }]
      ]).finished;

      this.removeAttribute('open');
    }

    this.style.height = 'auto';
    this.style.overflow = 'visible';
  }
}
if (!customElements.get('collapsible-details')) customElements.define('collapsible-details', CollapsibleDetails, { extends: 'details' });

class DropdownDetails extends HTMLDetailsElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.mqlDesktop = window.matchMedia('(min-width: 1025px)');
    this._isOpen = this.hasAttribute('open') && this.getAttribute('open') === 'true';
    this.elements = {
      button: this.querySelector('.details__summary'),
      dropdown: this.querySelector('.details__list')
    };

    if (!this) return;
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', onKeyUpEscape);
    this.setAttribute('open', 'false');
    this.elements.button?.addEventListener('click', this._toggleOpen.bind(this));

    if (this.mqlDesktop.matches && this.getAttribute('activate-event') === 'hover') {
      // const hoverEvents = ['focusin', 'pointerenter'];
      // hoverEvents.forEach(event => this.addEventListener(event, this._hoverOpen.bind(this)));
      this.addEventListener('pointerenter', () => {
        this._animate(true);
      })
      this.addEventListener('pointerleave', this.close.bind(this));
    }

    this.addEventListener('focusin', this._hoverOpen.bind(this))

    if (Shopify.designMode && this.hasAttribute('check-shopify-design-mode')) {
      this.addEventListener('shopify:block:select', () => {
        this.isOpen = true;
        // this.elements.dropdown.classList.add('active');
      });
      this.addEventListener('shopify:block:deselect', () => {
        this.isOpen = false;
        // this.elements.dropdown.classList.remove('active');
      });
    }
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') this.elements.button.setAttribute('aria-expanded', newValue === 'true');
  }

  get isOpen() {
    return this._isOpen;
  }

  set isOpen(value) {
    if (value !== this._isOpen) {
      this._isOpen = value;
      if (this.isConnected) {
        this._animate(value);
      } else {
        value ? this.setAttribute('open', 'true') : this.setAttribute('open', 'false');
      }
    }
    this.elements.button.setAttribute('aria-expanded', value ? 'true' : 'false');
  }

  onFocusOut() {
    if (!this.contains(document.activeElement)) this.close();
  }

  _toggleOpen(event) {
    if (!event.target.closest('a')) event.preventDefault();
    this.isOpen = !this.isOpen;
    // this.elements.dropdown.classList.toggle('active');
    // this.toggleAttribute('open', this.isOpen);
    this._animate(this.isOpen);
  }

  _hoverOpen(event) {
    const value = true;
    this._animate(value);
    // if (this.isConnected) {
    // } else {
    //   value ? this.setAttribute('open', 'true') : this.setAttribute('open', 'false');
    // }
    // this.elements.dropdown.classList.toggle('active', value);
    if (this.closest('header-menu')) this.closest('.header-wrapper').preventHide = value;
  }

  close() {
    this.isOpen = false;
    this._animate(this.isOpen);
    // this.elements.dropdown.classList.remove('active');
    // this.setAttribute('open', 'false');

  }

  _animate(open) {
    const translateYIn = 'translateY(-50%)';
    const translateYOut = 'translateY(-55%)';
    if (open) {
      this.setAttribute('open', 'true');

      Motion.animate(this.elements.dropdown, { opacity: [0, 1], visibility: 'visible' }, { duration: 0.3, delay: 0.2 });

      Motion.animate(this.elements.dropdown.firstElementChild, { transform: [`${translateYIn}`, 'translateY(0px)'] }, { duration: 0.5 });
    } else {
      Motion.animate(this.elements.dropdown, { opacity: 0, visibility: 'hidden' }, { duration: 0.15 });

      Motion.animate(this.elements.dropdown.firstElementChild, { transform: `${translateYOut}` }, { duration: 0.15 });
      this.setAttribute('open', 'false');
    }
  }
}
if (!customElements.get('dropdown-details')) customElements.define('dropdown-details', DropdownDetails, { extends: 'details' });


class StickyHeader extends HTMLElement {
  constructor() {
    super();

    this.stickyHeader = this;
    this.headerDrawerContainer = this.querySelector('.header__drawer-container');
    this.headerMenu = this.querySelector('.header__menu');
    this.headerRowTop = this.querySelector('.header__row--top');

    this.offscreen = false;

    /**
     * Width of window when header drawer was hidden
     * @type {number | null}
     */
    let menuDrawerHiddenWidth = null;

    /**
     * An intersection observer for monitoring sticky header position
     * @type {IntersectionObserver | null}
     */
    let intersectionObserver = null;

    /**
     * Whether the header has been scrolled offscreen, when sticky behavior is 'scroll-up'
     * @type {boolean}
     */

    /**
     * The last recorded scrollTop of the document, when sticky behavior is 'scroll-up
     * @type {number}
     */
    let lastScrollTop = 0;

    /**
     * A timeout to allow for hiding animation, when sticky behavior is 'scroll-up'
     * @type {number | null}
     */
    let timeout = null;

    /**
     * The duration to wait for hiding animation, when sticky behavior is 'scroll-up'
     * @constant {number}
     */
    const animationDelay = 150;
  }

  connectedCallback() {
    this.setHeaderHeight();
    this.addEventListener('overflowMinimum', this.handleOverflowMinimum);

    const stickyMode = this.stickyHeader.getAttribute('data-sticky-type');
    if (stickyMode) {
      this.observeStickyPosition(stickyMode === 'always');

      if (stickyMode === 'scroll-up' || stickyMode === 'always') {
        document.addEventListener('scroll', this.handleWindowScroll);
      }
    }
  }

  disconnectedCallback() {
    this.setHeaderHeight();
    this.intersectionObserver?.disconnect();
    this.removeEventListener('overflowMinimum', this.handleOverflowMinimum);
    document.removeEventListener('scroll', this.handleWindowScroll);
    document.body.style.setProperty('--header-height', '0px');
  }

  setHeaderHeight() {
    const height = this.querySelector('.header').getBoundingClientRect();
    document.body.style.setProperty('--header-height', `${height}px`);

    // Check if the menu drawer should be hidden in favor of the header menu
    if (this.menuDrawerHiddenWidth && window.innerWidth > this.menuDrawerHiddenWidth) {
      this.updateMenuVisibility(false);
    }
  }

  /**
   * Observes the header while scrolling the viewport to track when its actively sticky
   * @param {Boolean} alwaysSticky - Determines if we need to observe when the header is offscreen
   */

  observeStickyPosition(alwaysSticky = true) {
    if (this.intersectionObserver) return;

    const config = {
      threshold: alwaysSticky ? 1 : 0,
    };

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;

      const { isIntersecting } = entry;

      if (alwaysSticky) {
        this.dataset.stickyState = isIntersecting ? 'inactive' : 'active';
        changeMetaThemeColor(this.headerRowTop);
      } else {
        this.offscreen = !isIntersecting || this.dataset.stickyState === 'active';
      }
    }, config);

    this.intersectionObserver.observe(this);
  };

  /**
   * Handles the overflow minimum event from the header menu
   * @param {OverflowMinimumEvent} event
   */
  handleOverflowMinimum = (event) => {
    this.updateMenuVisibility(event.detail.minimumReached);
  };

  /**
   * Updates the visibility of the menu and drawer
   * @param {boolean} hideMenu - Whether to hide the menu and show the drawer
   */
  updateMenuVisibility(hideMenu) {
    if (hideMenu) {
      this.headerDrawerContainer.classList.remove('desktop:hidden');
      this.menuDrawerHiddenWidth = window.innerWidth;
      this.headerMenu.classList.add('hidden');
    } else {
      this.headerDrawerContainer.classList.add('desktop:hidden');
      this.menuDrawerHiddenWidth = null;
      this.headerMenu.classList.remove('hidden');
    }
  }

  handleWindowScroll() {
    const stickyMode = this.stickyHeader.getAttribute('data-sticky-type');
    if (!offscreen && stickyMode !== 'always') return;

    const scrollTop = document.scrollingElement?.scrollTop ?? 0;
    const isScrollingUp = scrollTop < this.lastScrollTop;

    console.log(
      `%c🔍 Log scrollTop:`,
      'color: #eaefef; background: #60539f; font-weight: bold; padding: 8px 16px; border-radius: 4px;',
      scrollTop
    );
    console.log(
      `%c🔍 Log isScrollingUp:`,
      'color: #eaefef; background: #60539f; font-weight: bold; padding: 8px 16px; border-radius: 4px;',
      isScrollingUp
    );

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (stickyMode === 'always') {
      const isAtTop = this.getBoundingClientRect().top >= 0;

      if (isAtTop) {
        this.dataset.scrollDirection = 'none';
      } else if (isScrollingUp) {
        this.dataset.scrollDirection = 'up';
      } else {
        this.dataset.scrollDirection = 'down';
      }

      this.lastScrollTop = scrollTop;
      return;
    }

    if (isScrollingUp) {
      this.removeAttribute('data-animating');

      if (this.getBoundingClientRect().top >= 0) {
        // reset sticky state when header is scrolled up to natural position
        offscreen = false;
        this.dataset.stickyState = 'inactive';
        this.dataset.scrollDirection = 'none';
      } else {
        // show sticky header when scrolling up
        this.dataset.stickyState = 'active';
        this.dataset.scrollDirection = 'up';
      }
    } else if (this.dataset.stickyState === 'active') {
      this.dataset.scrollDirection = 'none';
      // delay transitioning to idle hidden state for hiding animation
      this.setAttribute('data-animating', '');

      this.timeout = setTimeout(() => {
        this.dataset.stickyState = 'idle';
        this.removeAttribute('data-animating');
      }, this.animationDelay);
    } else {
      this.dataset.scrollDirection = 'none';
      this.dataset.stickyState = 'idle';
    }

    this.lastScrollTop = scrollTop;
  }
}

if (!customElements.get('sticky-header')) customElements.define('sticky-header', StickyHeader);