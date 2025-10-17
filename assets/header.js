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

// if (document.readyState === "complete") {
//   console.log("complete");
//   updateHeaderHeights();
// } else {
//   console.log("load");
//   window.addEventListener("load", updateHeaderHeights);
// }