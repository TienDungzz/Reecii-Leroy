// Tabs Component khinh
class TabsComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.tabs = this.querySelectorAll(".tabs-component-panel-trigger"); // target class
    this.tabContents = this.querySelectorAll(".tabs-component-content"); // content class

    this.initRender();
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", this.handleTabClick.bind(this));
    });

    // Motion.inView(this, this.initMaskBackground.bind(this));

    this.initSplitting();
  }

  handleTabClick(event) {
    event.preventDefault();

    let target = event.target,
      tabId = target.getAttribute("href");

    if (target.classList.contains("--active")) return;

    this.tabs.forEach((tab) => {
      tab.classList.remove("--active");
    });

    target.classList.add("--active");

    this.tabContents.forEach((content) => {
      content.classList.remove("--active");

      if (content.id == tabId.substring(1)) {
        const template = content.querySelector("template");
        if (template && !content.hasAttribute("data-rendered")) {
          const templateContent = template.content.cloneNode(true);
          content.appendChild(templateContent);
          content.setAttribute("data-rendered", "true");
        }
        content.classList.add("--active");
      }
    });
  }

  initRender() {
    const activeTab = this.querySelector(
      ".tabs-component-panel-trigger.--active"
    );
    if (activeTab) {
      const activeTabId = activeTab.getAttribute("href");
      const activeContent = document.querySelector(activeTabId);

      if (activeContent) {
        const template = activeContent.querySelector("template");
        if (template && !activeContent.hasAttribute("data-rendered")) {
          const templateContent = template.content.cloneNode(true);
          activeContent.appendChild(templateContent);
          activeContent.setAttribute("data-rendered", "true");
        }
      }
    }
    this.hasInitialized = true;
  }

  initMaskBackground() {
    const maskBackground = this.querySelector(".mask-background");

    if (maskBackground) {
      const tabs = this.querySelectorAll(".tabs-component-panel-trigger");
      const activeTab = this.querySelector(
        ".tabs-component-panel-trigger.--active"
      );

      const rectParent = this.getBoundingClientRect();
      const rectTabActive = activeTab.getBoundingClientRect();

      let left = rectTabActive.left - rectParent.left - 1;

      const top = rectTabActive.top - rectParent.top;
      const width = rectTabActive.width + 1;
      const height = rectTabActive.height;

      Motion.animate(
        maskBackground,
        {
          transform: `translate(${left}px, ${top}px)`,
          width: `${width}px`,
          height: `${height}px`,
        },
        { ease: [0.39, 0.24, 0.3, 1] }
      );

      maskBackground.innerHTML = activeTab.innerHTML;
    }
  }
}
customElements.define("tabs-component", TabsComponent);
