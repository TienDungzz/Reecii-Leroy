class TabsComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
    this.observeExternalHeader();
    this.initTabsHeader()
  }

  init() {
    this.tabs = this.querySelectorAll(".tabs-component-panel-trigger");
    this.tabContents = this.querySelectorAll(".tabs-component-content");

    this.initRender();
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", this.handleTabClick.bind(this));
    });
  }

  handleTabClick(event) {
    event.preventDefault();

    let target = event.target.closest(".tabs-component-panel-trigger");
    if (!target) return;

    let tabId = target.getAttribute("href");
    if (!tabId) return;

    if (target.classList.contains("--active")) return;

    this.tabs.forEach((tab) => tab.classList.remove("--active"));
    target.classList.add("--active");

    this.tabContents.forEach((content) => {
      content.classList.remove("--active");

      if (content.id == tabId.substring(1)) {
        const template = content.querySelector("template.tabs-component-template");
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
        const template = activeContent.querySelector("template.tabs-component-template");
        if (template && !activeContent.hasAttribute("data-rendered")) {
          const templateContent = template.content.cloneNode(true);
          activeContent.appendChild(templateContent);
          activeContent.setAttribute("data-rendered", "true");
        }
      }
    }
    this.hasInitialized = true;
  }

  observeExternalHeader() {
    const allHeaders = document.querySelectorAll("tabs-header");
    if (!allHeaders.length) return;

    allHeaders.forEach((header) => {
      const targetSelector = header.getAttribute("data-tabs-target");
      const targetTabs =
        (targetSelector && document.querySelector(targetSelector)) || this;

      if (targetTabs === this) {
        const headerButtons = header.querySelectorAll(".tabs-component-panel-trigger");
        headerButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const href = btn.getAttribute("href");
            if (!href) return;

            headerButtons.forEach((b) => b.classList.remove("--active"));
            btn.classList.add("--active");

            const internalTab = this.querySelector(
              `.tabs-component-panel-trigger[href="${href}"]`
            );
            if (internalTab) {
              internalTab.click();
            }
          });
        });
      }
    });
  }

  initTabsHeader() {
    const sectionHeaders = document.querySelectorAll('.section-global__header');

    sectionHeaders.forEach((header) => {
      const template = header.querySelector('template');
      if (!template) return;

      const tabsHeader = template.content.querySelector('tabs-header');
      if (!tabsHeader) return;

      const block = header.querySelector('.section-header--block');
      if (!block) return;

      if (!block.querySelector('tabs-header')) {
        const clone = tabsHeader.cloneNode(true);
        block.appendChild(clone);

        this.bindTabsEvents(clone);
      }
    });
  }

  bindTabsEvents(tabsHeader) {
    const buttons = tabsHeader.querySelectorAll('.tabs-component-panel-trigger');
    const tabContents = document.querySelectorAll('.tabs-component-content');

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const href = btn.getAttribute('href');
        if (!href) return;
        const targetId = href.replace('#', '');

        buttons.forEach((b) => b.classList.remove('--active', 'is-active'));
        btn.classList.add('--active', 'is-active');

        tabContents.forEach((content) => {
          const isMatch = content.id === targetId;
          content.classList.toggle('--active', isMatch);
          content.classList.toggle('is-active', isMatch);

          if (isMatch && !content.hasAttribute('data-rendered')) {
            const template = content.querySelector('template.tabs-component-template');
            if (template) {
              const templateContent = template.content.cloneNode(true);
              content.appendChild(templateContent);
              content.setAttribute('data-rendered', 'true');
            }
          }
        });

        const internalTabs = document.querySelectorAll(
          `.tabs-component-panel-trigger[href="${href}"]`
        );
        internalTabs.forEach((tab) => {
          tab.classList.remove('--active');
          if (tab.getAttribute('href') === href) tab.classList.add('--active');
        });
      });
    });
  }
}
if (!customElements.get("tabs-component"))
  customElements.define("tabs-component", TabsComponent);

class HeaderMobileTabs extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.tabs = this.querySelectorAll("[data-tab-heading]");
    this.tabContents = this.querySelectorAll("[data-tab-for]");

    this.tabs.forEach((tab) => {
      tab.addEventListener("click", this.handleTabClick.bind(this));
    });

    this.tabContents[0].classList.add("active");
  }

  handleTabClick(event) {
    event.preventDefault();

    let target = event.target.closest("a"),
      tabTarget = target.getAttribute("data-tab-heading-target");

    if (target.classList.contains("active")) return;

    this.tabs.forEach((tab) => tab.classList.remove("active"));

    target.classList.add("active");

    this.tabContents.forEach((content) => {
      content.style.display = "none";

      if (content.getAttribute("data-tab-for") == tabTarget) {
        content.style.display = "block";
      }
    });
  }
}
if (!customElements.get("header-mobile-tabs"))
  customElements.define("header-mobile-tabs", HeaderMobileTabs);
