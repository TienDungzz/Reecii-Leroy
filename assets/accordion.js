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

  constructor() {
    super();

    this._open = this.hasAttribute('open');
    this.detailsEl = this.querySelector('details');
    this.summaryEl = this.querySelector('summary');
    this.contentEl = this.querySelector('summary + *');
    this.setAttribute('aria-expanded', this._open ? 'true' : 'false');

    this.summaryEl.addEventListener('click', this.onSummaryClick.bind(this));

    if (Shopify.designMode) {
      this.addEventListener('shopify:block:select', () => {
        if (this.designModeActive) this.open = true;
      });
      this.addEventListener('shopify:block:deselect', () => {
        if (this.designModeActive) this.open = false;
      });
    }
  }

  get designModeActive() {
    return true;
  }

  get controlledElement() {
    return this.closest('accordions-details');
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      this.detailsEl.setAttribute('aria-expanded', newValue === '' ? 'true' : 'false');
    }
  }

  get open() {
    return this._open;
  }

  set open(value) {
    if (value !== this._open) {
      this._open = value;

      if (this.isConnected) {
        this.transition(value);
      }
      else {
        value ? this.detailsEl.setAttribute('open', '') : this.detailsEl.removeAttribute('open');
      }
    }

    this.detailsEl.setAttribute('aria-expanded', value ? 'true' : 'false');
    this.dispatchEventHandler();
  }

  onSummaryClick(event) {
    event.preventDefault();
    this.open = !this.open;
  }

  close() {
    this._open = false;
    this.transition(false);
  }

  transition(value) {
    this.detailsEl.style.overflow = 'hidden';

    if (value) {
      this.detailsEl.setAttribute('open', '');

      const sequence = [
        [this.detailsEl, { height: [`${this.summaryEl.clientHeight}px`, `${this.detailsEl.scrollHeight}px`] }, { duration: 0.25, easing: 'ease' }],
        [this.contentEl, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] }, { duration: 0.15, at: '-0.1' }]
      ];
      Motion.animate(sequence);
    }
    else {
      const sequenceOut = [
        [this.contentEl, { opacity: 0 }, { duration: 0.15 }],
        [this.detailsEl, { height: [`${this.detailsEl.clientHeight}px`, `${this.summaryEl.clientHeight}px`] }, { duration: 0.25, at: '<', easing: 'ease' }]
      ];
      Motion.animate(sequenceOut);
      this.detailsEl.setAttribute('open', 'false');
      // this.detailsEl.removeAttribute('open');
    }

    this.detailsEl.style.height = 'auto';
    this.detailsEl.style.overflow = 'visible';
  }

  dispatchEventHandler() {
    (this.controlledElement ?? this).dispatchEvent(new CustomEvent('toggle', { bubbles: true, detail: { current: this } }));
  }
}
if (!customElements.get('accordion-custom')) customElements.define('accordion-custom', AccordionCustom);