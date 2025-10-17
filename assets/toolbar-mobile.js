class Toolbarmobile extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // this.init();
    this.setHeight();
    window.addEventListener('resize', this.setHeight.bind(this));
  }

  init() {
    const header = document.querySelector(".header[data-sticky-state='inactive]");
    header === null
      ? this.classList.add("active")
      : this.classList.remove("active");
  }

  setHeight() {
    document.body.style.setProperty('--toolbar-mobile-height', `${this.clientHeight}px`);
  }
}
customElements.define("toolbar-mobile", Toolbarmobile);
