class AccordionCustom extends HTMLElement {
  constructor() {
    super();
    this.details = this.querySelector("details");
    this._open = this.details.hasAttribute("open");

    this.summaryElement = this.querySelector("summary");
    this.contentElement = this.querySelector("summary + *");
    this.details.setAttribute("aria-expanded", this._open ? "true" : "false");

    this.summaryElement.addEventListener(
      "click",
      this.onSummaryClick.bind(this)
    );

    if (Shopify.designMode) {
      this.addEventListener("shopify:block:select", () => {
        if (this.designModeActive) this.open = true;
      });
      this.addEventListener("shopify:block:deselect", () => {
        if (this.designModeActive) this.open = false;
      });
    }
  }

  get designModeActive() {
    return true;
  }

  get controlledElement() {
    return this.closest("accordions-details");
  }

  static get observedAttributes() {
    return ["open"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "open") {
      this.setAttribute("aria-expanded", newValue === "" ? "true" : "false");
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
      } else {
        value
          ? this.details.setAttribute("open", "")
          : this.details.removeAttribute("open");
      }
    }

    this.details.setAttribute("aria-expanded", value ? "true" : "false");
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

  async transition(value) {
    // this.details.style.overflow = "hidden";

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
              `${this.details.scrollHeight}px`,
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

    // this.details.style.height = "auto";
    // this.details.style.overflow = "visible";
  }

  dispatchEventHandler() {
    (this.controlledElement ?? this).dispatchEvent(
      new CustomEvent("toggle", { bubbles: true, detail: { current: this } })
    );
  }
}
customElements.define("accordion-custom", AccordionCustom);
