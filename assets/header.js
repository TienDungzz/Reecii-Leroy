class HeaderComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.resizeObserver.observe(this);
    this.stickyMode = this.getAttribute("data-sticky-type");
    this.offscreen = false;

    this.menuDrawerHiddenWidth = null;
    this.intersectionObserver = null;
    this.lastScrollTop = 0;

    this.timeout = null;
    this.animationDelay = 150;
    // this.setHeaderHeight();

    if (this.stickyMode) {
      this.observeStickyPosition(this.stickyMode === "always");

      if (this.stickyMode === "scroll-up" || this.stickyMode === "always") {
        document.addEventListener("scroll", this.handleWindowScroll.bind(this));
      }
    }
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener("scroll", this.handleWindowScroll.bind(this));
    document.body.style.setProperty("--header-height", "0px");
  }

  // setHeaderHeight() {
  //   const { height } = this.getBoundingClientRect();
  //   document.body.style.setProperty('--header-height', `${height}px`);

  // }

  resizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) return;
    cancelAnimationFrame(this._resizeRaf);
    this._resizeRaf = requestAnimationFrame(() => {
      const { height } = entry.target.getBoundingClientRect();
      document.body.style.setProperty("--header-height", `${height}px`);
    });
  });

  observeStickyPosition(alwaysSticky = true) {
    if (this.intersectionObserver) return;

    const config = {
      threshold: alwaysSticky ? 1 : 0,
    };

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;

      const { isIntersecting } = entry;

      if (alwaysSticky) {
        this.dataset.stickyState = isIntersecting ? "inactive" : "active";
      } else {
        this.offscreen =
          !isIntersecting || this.dataset.stickyState === "active";
      }
    }, config);

    this.intersectionObserver.observe(this);
  }

  handleWindowScroll() {
    if (!this.offscreen && this.stickyMode !== "always") return;

    const scrollTop = document.scrollingElement?.scrollTop ?? 0;
    const isScrollingUp = scrollTop < this.lastScrollTop;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.stickyMode === "always") {
      const isAtTop = this.getBoundingClientRect().top >= 0;

      if (isAtTop) {
        this.dataset.scrollDirection = "none";
      } else if (isScrollingUp) {
        this.dataset.scrollDirection = "up";
      } else {
        this.dataset.scrollDirection = "down";
      }

      this.lastScrollTop = scrollTop;
      return;
    }

    if (isScrollingUp) {
      this.removeAttribute("data-animating");

      if (this.getBoundingClientRect().top >= 0) {
        // reset sticky state when header is scrolled up to natural position
        this.offscreen = false;
        this.dataset.stickyState = "inactive";
        this.dataset.scrollDirection = "none";
      } else {
        // show sticky header when scrolling up
        this.dataset.stickyState = "active";
        this.dataset.scrollDirection = "up";
      }
    } else if (this.dataset.stickyState === "active") {
      this.dataset.scrollDirection = "none";
      // delay transitioning to idle hidden state for hiding animation
      this.setAttribute("data-animating", "");

      this.timeout = setTimeout(() => {
        this.dataset.stickyState = "idle";
        this.removeAttribute("data-animating");
      }, this.animationDelay);
    } else {
      this.dataset.scrollDirection = "none";
      this.dataset.stickyState = "idle";
    }

    this.lastScrollTop = scrollTop;
  }
}

if (!customElements.get("header-component"))
  customElements.define("header-component", HeaderComponent);

function calculateHeaderGroupHeight(
  header = document.querySelector('#header-component'),
  headerGroup = document.querySelector('#header-group')
) {
  if (!headerGroup) return 0;

  let totalHeight = 0;
  const children = headerGroup.children;

  for (let i = 0; i < children.length; i++) {
    const element = children[i];
    if (element === header || !(element instanceof HTMLElement)) continue;
    totalHeight += element.offsetHeight;
  }

  // If the header is transparent and has a sibling section, add the height of the header to the total height
  if (header instanceof HTMLElement && header.hasAttribute('transparent') && header.parentElement?.nextElementSibling) {
    return totalHeight + header.offsetHeight;
  }

  return totalHeight;
}

// function setHeaderGroupHeight() {
//   const header = document.querySelector("#header-component");
//   const headerGroup = document.querySelector("#header-group");

//   // Update header group height on resize of any child
//   if (headerGroup) {
//     console.log("headerGroup", headerGroup);
//     const resizeObserver = new ResizeObserver(() =>
//       calculateHeaderGroupHeight(header, headerGroup)
//     );

//     // Observe all children of the header group
//     const children = headerGroup.children;
//     for (let i = 0; i < children.length; i++) {
//       const element = children[i];
//       if (element === header || !(element instanceof HTMLElement)) continue;
//       resizeObserver.observe(element);
//       console.log("observe", element);
//     }

//     // Also observe the header group itself for child changes
//     const mutationObserver = new MutationObserver((mutations) => {
//       console.log("mutationObserver", mutations);
//       for (const mutation of mutations) {
//         if (mutation.type === "childList") {
//           // Re-observe all children when the list changes
//           const children = headerGroup.children;
//           for (let i = 0; i < children.length; i++) {
//             const element = children[i];
//             if (element === header || !(element instanceof HTMLElement))
//               continue;
//             resizeObserver.observe(element);
//           }
//         }
//       }
//     });

//     mutationObserver.observe(headerGroup, { childList: true });
//     console.log("observe", headerGroup);
//   }
// }

function updateHeaderHeights() {
  const header = document.querySelector('header-component');

  // Early exit if no header - nothing to do
  if (!(header instanceof HTMLElement)) return;

  // Calculate initial height(s
  // const headerHeight = header.offsetHeight;
  const headerGroupHeight = calculateHeaderGroupHeight(header);

  // document.body.style.setProperty('--header-height', `${headerHeight}px`);
  document.body.style.setProperty('--header-group-height', `${headerGroupHeight}px`);
}

if (document.readyState === "complete") {
  console.log("complete");
  updateHeaderHeights();
} else {
  console.log("load");
  window.addEventListener("load", updateHeaderHeights);
}

function menuTab() {
  const menuTabs = document.querySelector('[data-menu-tab]');
  if (!menuTabs) return;

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-menu-tab] a');
    if (!target) return;

    const activePage = target.dataset.loadPage;
    setCookie('page-url', activePage, 1);
  });

  const canonical = document.querySelector('[canonical-url]')?.getAttribute('canonical-url');
  let handlePageUrl = getCookie('page-url');
  let menuTabItem, logoTabItem, menuItem;

  if (window.location.pathname.includes('/pages/') && window.page_active && window.page_active !== handlePageUrl) {
    setCookie('page-url', window.page_active, 1);
    handlePageUrl = window.page_active;
  }
  if (handlePageUrl) {
    menuTabItem = document.querySelector(`[data-handle-page='${handlePageUrl}']`);
    logoTabItem = document
      .querySelector('.header__heading-link')
      .setAttribute('data-logo-page', `${handlePageUrl}`);
    menuItem = document
      .querySelector(`[data-handle-page='${handlePageUrl}']~.header__inline-menu`)
      ?.setAttribute('data-menu-page', `${handlePageUrl}`);

  } else {
    menuTabItem = document.querySelector('[data-handle-page].link--multi-site--active');
    logoTabItem = document.querySelector('[data-logo-page].first');
    menuItem = document.querySelector('[data-menu-page].link--multi-site--active');
  }

  const menuTab = menuTabItem?.closest('[data-menu-tab]');
  if (menuTab) {
    menuTab.querySelectorAll('[data-handle-page]').forEach((el) => el.classList.remove('link--multi-site--active'));
    logoTabItem?.parentElement
      ?.querySelectorAll('[data-logo-page]')
      .forEach((el) => el.classList.remove('link--multi-site--active'));
    menuItem?.parentElement?.querySelectorAll('[data-menu-page]').forEach((el) => el.classList.remove('link--multi-site--active'));
  }

  if (handlePageUrl) {
    logoTabItem?.classList.add('link--multi-site--active');
    menuTabItem?.classList.add('link--multi-site--active');
    menuItem?.classList.add('link--multi-site--active');
  } else {
    document.querySelector('[data-handle-page]:nth-child(1)')?.classList.add('link--multi-site--active');
    document.querySelector('[data-logo-page]:nth-child(1)')?.classList.add('link--multi-site--active');
    document.querySelector('[data-menu-page]:nth-child(1)')?.classList.add('link--multi-site--active');
  }
}

function appendTabMenuToMainMenu() {
  const handle = getCookie('page-url') || window.page_active;
  const mainMenu = document.querySelector('[data-main-menu]');
  const tabMenu = document.querySelector(`[data-menu-page='${handle}']`);

  if (!mainMenu) {
    // Cannot find main menu element, nothing to do
    return;
  }

  if (!handle || handle === 'undefined') {
    const inlineMenu = mainMenu.querySelector('.list-menu--inline');
    if (inlineMenu) {
      inlineMenu.classList.remove('hidden');
    }
    return;
  }

  if (tabMenu) {
    const template = tabMenu.querySelector('template');
    if (template) {
      const templateContent = template.content.cloneNode(true);
      mainMenu.innerHTML = '';
      mainMenu.appendChild(templateContent);
    }
  }
}

// class MenuDrawer extends HTMLElement {
//   constructor() {
//     super();

//     this.mainDetailsToggle = this.querySelector("details");

//     this.addEventListener("keyup", this.onKeyUp.bind(this));
//     this.addEventListener("focusout", this.onFocusOut.bind(this));
//     this.bindEvents();
//   }

//   bindEvents() {
//     this.querySelectorAll("summary").forEach((summary) =>
//       summary.addEventListener("click", this.onSummaryClick.bind(this))
//     );
//     this.querySelectorAll(
//       "button:not(.localization-selector):not(.selector__close-button):not(.country-filter__reset-button)"
//     ).forEach((button) =>
//       button.addEventListener("click", this.onCloseButtonClick.bind(this))
//     );
//   }

//   onKeyUp(event) {
//     if (event.code.toUpperCase() !== "ESCAPE") return;

//     const openDetailsElement = event.target.closest("details[open]");
//     if (!openDetailsElement) return;

//     openDetailsElement === this.mainDetailsToggle
//       ? this.closeMenuDrawer(
//           event,
//           this.mainDetailsToggle.querySelector("summary")
//         )
//       : this.closeSubmenu(openDetailsElement);
//   }

//   onSummaryClick(event) {
//     const summaryElement = event.currentTarget;
//     const detailsElement = summaryElement.parentNode;
//     const parentMenuElement = detailsElement.closest(".has-submenu");
//     const isOpen = detailsElement.hasAttribute("open");
//     const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

//     function addTrapFocus() {
//       trapFocus(
//         summaryElement.nextElementSibling,
//         detailsElement.querySelector("button")
//       );
//       summaryElement.nextElementSibling.removeEventListener(
//         "transitionend",
//         addTrapFocus
//       );
//     }

//     if (detailsElement === this.mainDetailsToggle) {
//       if (isOpen) event.preventDefault();
//       isOpen
//         ? this.closeMenuDrawer(event, summaryElement)
//         : this.openMenuDrawer(summaryElement);

//       if (window.matchMedia("(max-width: 990px)")) {
//         // document.documentElement.style.setProperty(
//         //   "--viewport-height",
//         //   `${window.innerHeight}px`
//         // );
//       }
//     } else {
//       setTimeout(() => {
//         detailsElement.classList.add("menu-opening");
//         summaryElement.setAttribute("aria-expanded", true);
//         parentMenuElement && parentMenuElement.classList.add("submenu-open");
//         !reducedMotion || reducedMotion.matches
//           ? addTrapFocus()
//           : summaryElement.nextElementSibling.addEventListener(
//               "transitionend",
//               addTrapFocus
//             );
//       }, 100);
//     }
//   }

//   openMenuDrawer(summaryElement) {
//     setTimeout(() => {
//       this.mainDetailsToggle.classList.add("menu-opening");
//     });
//     summaryElement.setAttribute("aria-expanded", true);
//     trapFocus(this.mainDetailsToggle, summaryElement);
//     document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
//   }

//   closeMenuDrawer(event, elementToFocus = false) {
//     if (event === undefined) return;

//     this.mainDetailsToggle.classList.remove("menu-opening");
//     this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
//       details.removeAttribute("open");
//       details.classList.remove("menu-opening");
//       details.removeAttribute('style');
//     });
//     this.mainDetailsToggle
//       .querySelectorAll(".submenu-open")
//       .forEach((submenu) => {
//         submenu.classList.remove("submenu-open");
//       });
//     document.body.classList.remove(
//       `overflow-hidden-${this.dataset.breakpoint}`
//     );
//     removeTrapFocus(elementToFocus);
//     this.closeAnimation(this.mainDetailsToggle);
//     console.log(this.mainDetailsToggle);

//     if (event instanceof KeyboardEvent)
//       elementToFocus?.setAttribute("aria-expanded", false);
//   }

//   onFocusOut() {
//     setTimeout(() => {
//       if (
//         this.mainDetailsToggle.hasAttribute("open") &&
//         !this.mainDetailsToggle.contains(document.activeElement)
//       )
//         this.closeMenuDrawer();
//     });
//   }

//   onCloseButtonClick(event) {
//     const detailsElement = event.currentTarget.closest("details");
//     if (detailsElement) this.closeSubmenu(detailsElement);
//   }

//   closeSubmenu(detailsElement) {
//     const parentMenuElement = detailsElement.closest(".submenu-open");
//     parentMenuElement && parentMenuElement.classList.remove("submenu-open");
//     detailsElement.classList.remove("menu-opening");
//     detailsElement
//       .querySelector("summary")
//       .setAttribute("aria-expanded", false);
//     removeTrapFocus(detailsElement.querySelector("summary"));
//     this.closeAnimation(detailsElement);
//   }

//   closeAnimation(detailsElement) {
//     let animationStart;

//     const handleAnimation = (time) => {
//       if (animationStart === undefined) {
//         animationStart = time;
//       }

//       const elapsedTime = time - animationStart;

//       if (elapsedTime < 400) {
//         window.requestAnimationFrame(handleAnimation);
//       } else {
//         detailsElement.removeAttribute("open");
//         if (detailsElement.closest("details[open]")) {
//           trapFocus(
//             detailsElement.closest("details[open]"),
//             detailsElement.querySelector("summary")
//           );
//         }
//       }
//     };

//     window.requestAnimationFrame(handleAnimation);
//   }
// }
// if (!customElements.get("menu-drawer"))
//   customElements.define("menu-drawer", MenuDrawer);

// class HeaderDrawer extends MenuDrawer {
//   constructor() {
//     super();
//   }

//   openMenuDrawer(summaryElement) {
//     this.header = this.header || document.querySelector(".section-header-main");
//     this.borderOffset =
//       this.borderOffset ||
//       this.closest(".drawer--menu").classList.contains(
//         "header-wrapper--border-bottom"
//       )
//         ? 1
//         : 0;
//     // document.documentElement.style.setProperty(
//     //   "--header-bottom-position",
//     //   `${parseInt(
//     //     this.header.getBoundingClientRect().bottom - this.borderOffset
//     //   )}px`
//     // );
//     this.header.classList.add("menu-open");

//     setTimeout(() => {
//       this.mainDetailsToggle.classList.add("menu-opening");
//     });

//     summaryElement.setAttribute("aria-expanded", true);
//     // window.addEventListener("resize", this.onResize);
//     trapFocus(this.mainDetailsToggle, summaryElement);
//     document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
//   }

//   closeMenuDrawer(event, elementToFocus) {
//     if (!elementToFocus) return;
//     super.closeMenuDrawer(event, elementToFocus);
//     this.header.classList.remove("menu-open");
//     window.removeEventListener("resize", theme.utils.rafThrottle(this.onResize));
//   }

//   onResize = () => {
//     // this.header &&
//     //   document.documentElement.style.setProperty(
//     //     "--header-bottom-position",
//     //     `${parseInt(
//     //       this.header.getBoundingClientRect().bottom - this.borderOffset
//     //     )}px`
//     //   );
//     // document.documentElement.style.setProperty(
//     //   "--viewport-height",
//     //   `${window.innerHeight}px`
//     // );
//   };
// }
// if (!customElements.get("header-drawer"))
//   customElements.define("header-drawer", HeaderDrawer);