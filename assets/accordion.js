class AccordionCustom extends HTMLElement {
  /** @type {HTMLDetailsElement} */
  get details() {
    const details = this.querySelector('details');

    if (!(details instanceof HTMLDetailsElement)) throw new Error('Details element not found');

    return details;
  }

  /** @type {HTMLElement} */
  get summary() {
    const summary = this.details.querySelector('summary');

    if (!(summary instanceof HTMLElement)) throw new Error('Summary element not found');

    return summary;
  }

  /** @type {HTMLElement} */
  get contentElement() {
    const content = this.details.querySelector('.details-content');

    if (!(content instanceof HTMLElement)) throw new Error('Content element not found');

    return content;
  }

  /** @type {HTMLElement} */
  get summaryElement() {
    return this.summary;
  }

  get #disableOnMobile() {
    return this.dataset.disableOnMobile === 'true';
  }

  get #disableOnDesktop() {
    return this.dataset.disableOnDesktop === 'true';
  }

  get #closeWithEscape() {
    return this.dataset.closeWithEscape === 'true';
  }

  async transition(value) {
    if (value) {
      this.details.setAttribute("open", "");

      await Motion.timeline([
        [
          this.details,
          {
            height: this.contentElement.classList.contains(
              "floating-panel-component"
            )
              ? `${this.summaryElement.clientHeight}px`
              : [
              `${this.summaryElement.clientHeight}px`,
              `${this.summaryElement.clientHeight + this.contentElement.scrollHeight}px`,
            ],
          },
          { duration: 0.25, easing: "ease" },
        ],
        [
          this.contentElement,
          {
            opacity: [0, 1],
            height: [ 0, `${this.contentElement.scrollHeight}px`],
            transform: ["translateY(10px)", "translateY(0)"],
          },
          { duration: 0.15, at: "-0.1" },
        ],
      ]).finished;
    } else {
      await Motion.timeline([
        [this.contentElement, { opacity: 0 }, { duration: 0.15 }],
        [
          this.details,
          {
            height: [
              `${this.details.clientHeight}px`,
              `${this.summaryElement.clientHeight}px`,
            ],
          },
          { duration: 0.25, at: "<", easing: "ease" },
        ],
      ]).finished;

      this.details.removeAttribute("open");
    }
  }

  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;

    this.#setDefaultOpenState();

    this.addEventListener('keydown', this.#handleKeyDown, { signal });
    this.summary.addEventListener('click', this.handleClick, { signal });
    window.matchMedia('(min-width: 750px)').addEventListener('change', this.#handleMediaQueryChange, { signal });
  }

  /**
   * Handles the disconnect event.
   */
  disconnectedCallback() {
    // Disconnect all the event listeners
    this.#controller.abort();
  }

  /**
   * Handles the click event.
   * @param {Event} event - The event.
   */
  handleClick = async (event) => {
    const isMobile = window.matchMedia('(max-width: 749px)').matches;
    const isDesktop = !isMobile;

    // Stop default behaviour from the browser
    if ((isMobile && this.#disableOnMobile) || (isDesktop && this.#disableOnDesktop)) {
      event.preventDefault();
      return;
    }

    // Prevent default behavior to handle transition manually
    event.preventDefault();

    // Toggle the accordion with transition
    const isOpen = this.details.hasAttribute('open');
    await this.transition(!isOpen);
  };

  /**
   * Handles the media query change event.
   */
  #handleMediaQueryChange = () => {
    this.#setDefaultOpenState();
  };

  /**
   * Sets the default open state of the accordion based on the `open-by-default-on-mobile` and `open-by-default-on-desktop` attributes.
   */
  #setDefaultOpenState() {
    const isMobile = window.matchMedia('(max-width: 749px)').matches;

    this.details.open =
      (isMobile && this.hasAttribute('open-by-default-on-mobile')) ||
      (!isMobile && this.hasAttribute('open-by-default-on-desktop'));
  }

  /**
   * Handles keydown events for the accordion
   *
   * @param {KeyboardEvent} event - The keyboard event.
   */
  #handleKeyDown = async (event) => {
    // Close the accordion when used as a menu
    if (event.key === 'Escape' && this.#closeWithEscape) {
      event.preventDefault();

      await this.transition(false);
      this.summary.focus();
    }
  }
}
if (!customElements.get('accordion-custom')) customElements.define('accordion-custom', AccordionCustom);