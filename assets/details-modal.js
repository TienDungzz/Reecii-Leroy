class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    if (this.detailsContainer) {
      this.detailsContainer.addEventListener('keyup', (event) => event.code === 'Escape' && this.close());
    }

    if (this.summaryToggle) {
      this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));
      this.summaryToggle.setAttribute('role', 'button');
    }

    const closeButton = this.querySelector('button[type="button"]');
    if (closeButton) {
      closeButton.addEventListener('click', this.close.bind(this));
    }
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');

    if (this.detailsContainer) {
      trapFocus(
        this.detailsContainer.querySelector('[tabindex="-1"]'),
        this.detailsContainer.querySelector('input:not([type="hidden"])')
      );
    }

    if (window.LenisInstance && typeof window.LenisInstance.scrollTo === 'function') {
      window.LenisInstance.scrollTo(0, { lock: true, immediate: false, lerp: 0.07 });
    } else {
      window.scroll({ top: 0, behavior: 'smooth' });
    }

    // Stop Lenis smooth scroll
    stopLenis();
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    if (this.detailsContainer) {
      this.detailsContainer.removeAttribute('open');
    }
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('overflow-hidden');

    // Start Lenis smooth scroll
    startLenis();
  }
}
if (!customElements.get('details-modal')) customElements.define('details-modal', DetailsModal);
