// Detect events when page has loaded
window.addEventListener('beforeunload', () => {
  document.body.classList.add('u-p-loaded');
});

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('p-loaded');

  document.dispatchEvent(new CustomEvent('page:loaded'));
});

window.addEventListener('pageshow', (event) => {
  // Removes unload class when the page was cached by the browser
  if (event.persisted) {
    document.body.classList.remove('u-p-loaded');
  }
});

// Get Lenis and init
function initLenis() {
  if (window.LenisInstance || !window.Lenis) return;
  window.LenisInstance = new window.Lenis({
    lerp: 0.07
    // Add more options here
  });
  function raf(time) {
    window.LenisInstance.raf(time);
    window.LenisInstance._rafId = requestAnimationFrame(raf);
  }
  window.LenisInstance._rafId = requestAnimationFrame(raf);
}

// Stop Lenis
function stopLenis() {
  if (window.LenisInstance && window.LenisInstance._rafId) {
    cancelAnimationFrame(window.LenisInstance._rafId);
    window.LenisInstance._rafId = null;
  }
}

// Start Lenis
function startLenis() {
  if (window.LenisInstance && !window.LenisInstance._rafId) {
    function raf(time) {
      window.LenisInstance.raf(time);
      window.LenisInstance._rafId = requestAnimationFrame(raf);
    }
    window.LenisInstance._rafId = requestAnimationFrame(raf);
  }
}

// Auto init Lenis after document load
document.addEventListener('DOMContentLoaded', () => {
  if (window.Lenis && window.innerWidth > 750) {
    initLenis();
  }
});

// How to use:
// Call stopLenis() when you need to stop the smooth scroll effect of Lenis, for example when opening drawer:
//   stopLenis();
// To activate again after closing drawer, call startLenis():
//   startLenis();


function getScrollbarWidth() {
  const width = window.innerWidth - document.documentElement.clientWidth;

  if (width > 17) return;
  document.documentElement.style.setProperty("--scrollbar-width", `${width}px`);
}

getScrollbarWidth();

// Calc height of header
function headerHeight() {
  const mainMenu = document.querySelector("[data-main-menu]");
  if (!mainMenu) return;

  const header = mainMenu.closest(".header__row");
  if (!header) return;

  const listMenuDesktop = document.querySelector(".list-menu-desktop");
  if (!listMenuDesktop) return;

  if (document.querySelector("[data-main-menu] .header__inline-menu")) {
    const headerHeight = header.offsetHeight - 1 + "px";
    var listMenuWrapper = document.querySelectorAll(".list-menu--wrapper");
    var sectionHeader = listMenuDesktop.offsetHeight;
    var listMenu = listMenuDesktop;

    if (sectionHeader > 52) {
      listMenuWrapper.forEach((summary) => {
        summary.style.setProperty("--top-position", "auto");
      });
      listMenu.style.setProperty("--list-menu-height", "4rem");
    } else {
      listMenuWrapper.forEach((summary) => {
        summary.style.setProperty("--top-position", headerHeight);
      });
      listMenu.style.setProperty("--list-menu-height", headerHeight);
    }

    const stickyHeader = header.closest('sticky-header');

    if (stickyHeader) {
      header.addEventListener("mouseenter", function () {
        const newHeight = header.offsetHeight - 1 + "px";

        if (listMenuWrapper && listMenuWrapper.length) {
          listMenuWrapper.forEach((summary) => {
            summary.style.setProperty("--top-position", newHeight);
          });
        }
      });

      header.addEventListener("mouseleave", function () {
        const newHeight = header.offsetHeight - 1 + "px";
        if (sectionHeader > 52) {
          listMenuWrapper.forEach((summary) => {
            summary.style.setProperty("--top-position", "auto");
          });
        } else {
          listMenuWrapper.forEach((summary) => {
            summary.style.setProperty("--top-position", newHeight);
          });
        }
      });
    }
  }
}

// Preloading Screen Annimate
function logoReveal() {
  const preloadScreen = document.querySelector(".preload-screen");
  if (preloadScreen)
    setTimeout(() => {
      preloadScreen.classList.add("off--ready");
    }, 10);
}

function pageReveal() {
  const body = document.body;
  const preloadScreen = document.querySelector(".preload-screen");

  if (preloadScreen) {
    setTimeout(() => {
      preloadScreen.classList.add("off");
      body.classList.add("off");
    }, 600);

    setTimeout(() => {
      preloadScreen.classList.add("loaded");
      body.classList.add("loaded");
      body.classList.remove("preloading-o-h");
      getScrollbarWidth();
    }, 1200);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  logoReveal();
  pageReveal();
  headerHeight();
});

window.addEventListener("resize", () => {
  headerHeight();
});

window.addEventListener("scroll", () => {
  setTimeout(() => {
    headerHeight();
  }, 200);
});

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

class SectionId {
  static #separator = "__";

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section id (e.g. 'template--22224696705326')
  static parseId(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[0];
  }

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section name (e.g. 'main')
  static parseSectionName(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[1];
  }

  // for a section id (e.g. 'template--22224696705326') and a section name (e.g. 'recommended-products'), return a qualified section id (e.g. 'template--22224696705326__recommended-products')
  static getIdForSection(sectionId, sectionName) {
    return `${sectionId}${SectionId.#separator}${sectionName}`;
  }
}

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(
    oldNode,
    newContent,
    preProcessCallbacks = [],
    postProcessCallbacks = []
  ) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement("div");
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll("[id], [form]").forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form &&
        element.setAttribute(
          "form",
          `${element.form.getAttribute("id")}-${uniqueKey}`
        );
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = "none";

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll("script").forEach((oldScriptTag) => {
      const newScriptTag = document.createElement("script");
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("role", "button");
  summary.setAttribute(
    "aria-expanded",
    summary.parentNode.hasAttribute("open")
  );

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
  });

  if (summary.closest("header-drawer, menu-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  console.log(`%c🔍 Log elementToFocus:`, "color: #eaefef; background: #60539f; font-weight: bold; padding: 8px 16px; border-radius: 4px;", elementToFocus);

  console.log("clkick");

  elementToFocus?.focus();

  if (
    elementToFocus?.tagName === "INPUT" &&
    ["search", "text", "email", "url"].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => {
    video.pause();
    // Update deferred media poster icon when video is paused
    const deferredMedia = video.closest('deferred-media');
    if (deferredMedia) {
      deferredMedia.isPlaying = false;
      deferredMedia.updatePlayPauseHint(false);
    }
  });
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

// Format money Function
Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split("."),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
      cents = parts[1] ? decimal + parts[1] : "";

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === "plus") {
      if (
        parseInt(this.input.dataset.min) > parseInt(this.input.step) &&
        this.input.value == 0
      ) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);

    if (
      this.input.dataset.min === previousValue &&
      event.target.name === "minus"
    ) {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle(
        "disabled",
        parseInt(value) <= parseInt(this.input.min)
      );
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }
}
if (!customElements.get("quantity-input"))
  customElements.define("quantity-input", QuantityInput);

/**
 * Debounce a function.
 * @param {Function} fn The function to debounce.
 * @param {number} wait The time to wait in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(fn, wait) {
  /** @type {number | undefined} */
  let timeout;

  /** @param {...any} args */
  function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  }

  // Add the .cancel method:
  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return /** @type {T & { cancel(): void }} */ (debounced);
}

/**
 * Throttle a function.
 * @param {Function} fn The function to throttle.
 * @param {number} delay The time to wait in milliseconds.
 * @returns {Function} The throttled function.
 */
function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
function prefersReducedMotion() {
  return reducedMotion.matches;
}

function fetchConfig(type = "json", config = {}) {
  /** @type {Headers} */
  const headers = {
    "Content-Type": "application/json",
    Accept: `application/${type}`,
    ...config.headers,
  };

  if (type === "javascript") {
    headers["X-Requested-With"] = "XMLHttpRequest";
    delete headers["Content-Type"];
  }

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class PreloadScreen extends HTMLElement {
  constructor() {
    super();

    document.addEventListener("page:loaded", () => {
      setTimeout(() => {
        this.setAttribute("loaded", true);
      }, 350);
    });
  }
}
if (!customElements.get("preload-screen"))
  customElements.define("preload-screen", PreloadScreen);

// Cookie
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + '; path=/' + expires;
}

function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
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

window.addEventListener("DOMContentLoaded", () => {
  menuTab();
  appendTabMenuToMainMenu();
});

class HeaderMenu extends HTMLElement {
  constructor() {
    super();
    this.header = document.querySelector(".header-wrapper");
  }

  onToggle() {
    if (!this.header) return;

    if (
      document.documentElement.style.getPropertyValue(
        "--header-bottom-position-desktop"
      ) !== ""
    )
      return;
    document.documentElement.style.setProperty(
      "--header-bottom-position-desktop",
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}
if (!customElements.get("header-menu"))
  customElements.define("header-menu", HeaderMenu);

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll(
      "button:not(.localization-selector):not(.selector__close-button):not(.country-filter__reset-button)"
    ).forEach((button) =>
      button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
          event,
          this.mainDetailsToggle.querySelector("summary")
        )
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest(".has-submenu");
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );
      summaryElement.nextElementSibling.removeEventListener(
        "transitionend",
        addTrapFocus
      );
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);

      if (window.matchMedia("(max-width: 990px)")) {
        document.documentElement.style.setProperty(
          "--viewport-height",
          `${window.innerHeight}px`
        );
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        parentMenuElement && parentMenuElement.classList.add("submenu-open");
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener(
              "transitionend",
              addTrapFocus
            );
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove("menu-opening");
    this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
      details.removeAttribute("open");
      details.classList.remove("menu-opening");
      details.removeAttribute('style');
    });
    this.mainDetailsToggle
      .querySelectorAll(".submenu-open")
      .forEach((submenu) => {
        submenu.classList.remove("submenu-open");
      });
    document.body.classList.remove(
      `overflow-hidden-${this.dataset.breakpoint}`
    );
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent)
      elementToFocus?.setAttribute("aria-expanded", false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    if (detailsElement) this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest(".submenu-open");
    parentMenuElement && parentMenuElement.classList.remove("submenu-open");
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus(detailsElement.querySelector("summary"));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}
if (!customElements.get("menu-drawer"))
  customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector(".section-header-main");
    this.borderOffset =
      this.borderOffset ||
      this.closest(".drawer--menu").classList.contains(
        "header-wrapper--border-bottom"
      )
        ? 1
        : 0;
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${parseInt(
        this.header.getBoundingClientRect().bottom - this.borderOffset
      )}px`
    );
    this.header.classList.add("menu-open");

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    window.addEventListener("resize", this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove("menu-open");
    window.removeEventListener("resize", this.onResize);
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        "--header-bottom-position",
        `${parseInt(
          this.header.getBoundingClientRect().bottom - this.borderOffset
        )}px`
      );
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${window.innerHeight}px`
    );
  };
}
if (!customElements.get("header-drawer"))
  customElements.define("header-drawer", HeaderDrawer);

function buildStyleSheet(name, $this) {
  if (name == "") return;
  const loadStyleSheet = document.createElement("link");
  loadStyleSheet.rel = "stylesheet";
  loadStyleSheet.type = "text/css";
  loadStyleSheet.href = name;
  $this.parentNode.insertBefore(loadStyleSheet, $this);
}

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  connectedCallback() {
    this.toggleMediaButton = this.querySelector('button[data-click-handler="toggleMediaButton"]');
    this.isPlaying = false;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.setupEventListeners();

    // Check if ThemeEvents and DialogCloseEvent are defined before using them
    if (typeof ThemeEvents !== 'undefined' && ThemeEvents.mediaStartedPlaying) {
      document.addEventListener(ThemeEvents.mediaStartedPlaying, this.pauseMedia.bind(this), { signal });
    }
    if (typeof DialogCloseEvent !== 'undefined' && DialogCloseEvent.eventName) {
      window.addEventListener(DialogCloseEvent.eventName, this.pauseMedia.bind(this), { signal });
    }

    // Handle autoplay videos
    if (this.hasAttribute('autoplay')) {
      this.isPlaying = true;

      if (this.toggleMediaButton) {
        this.toggleMediaButton.classList.remove('hidden');
        const playIcon = this.toggleMediaButton.querySelector('.icon-play');
        if (playIcon) playIcon.classList.toggle('hidden', this.isPlaying);
        const pauseIcon = this.toggleMediaButton.querySelector('.icon-pause');
        if (pauseIcon) pauseIcon.classList.toggle('hidden', !this.isPlaying);

        this.toggleMediaButton.addEventListener('click', (e) => {
          if (playIcon) playIcon.classList.toggle('hidden', this.isPlaying);
          if (pauseIcon) pauseIcon.classList.toggle('hidden', !this.isPlaying);
        });
      }
    }
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  setupEventListeners() {
    if (this.toggleMediaButton) {
      this.toggleMediaButton.addEventListener('click', () => {
        this.toggleMedia();
      });
    }
  }

  updatePlayPauseHint(isPlaying) {
    if (this.toggleMediaButton instanceof HTMLElement) {
      this.toggleMediaButton.classList.remove('hidden');
      const playIcon = this.toggleMediaButton.querySelector('.icon-play');
      if (playIcon) playIcon.classList.toggle('hidden', isPlaying);
      const pauseIcon = this.toggleMediaButton.querySelector('.icon-pause');
      if (pauseIcon) pauseIcon.classList.toggle('hidden', !isPlaying);
    }
  }

  showDeferredMedia = () => {
    this.loadContent(true);
    this.isPlaying = true;
    this.updatePlayPauseHint(this.isPlaying);
  };

  loadContent(focus = true) {
    if (this.getAttribute('data-media-loaded')) return;

    // Dispatch event if MediaStartedPlayingEvent is defined
    if (typeof MediaStartedPlayingEvent !== 'undefined') {
      this.dispatchEvent(new MediaStartedPlayingEvent(this));
    }

    const content = this.querySelector('template')?.content.firstElementChild?.cloneNode(true);

    if (!content) return;

    this.setAttribute('data-media-loaded', true);
    this.appendChild(content);

    if (focus && content instanceof HTMLElement) {
      content.focus();
    }

    this.toggleMediaButton?.classList.add('deferred-media__playing');

    if (content instanceof HTMLVideoElement) {
      // Set up video event listeners
      content.addEventListener('play', () => {
        this.isPlaying = true;
        this.updatePlayPauseHint(this.isPlaying);
      });

      content.addEventListener('pause', () => {
        this.isPlaying = false;
        this.updatePlayPauseHint(this.isPlaying);
      });

      if (content.getAttribute('autoplay')) {
        // force autoplay for safari
        content.play().catch(e => console.log('Autoplay failed:', e));
      }
    }
  }

  // Hover toggle play/pause state of the media


  /**
   * Toggle play/pause state of the media
   */
  toggleMedia() {
    if (this.isPlaying) {
      this.pauseMedia();
    } else {
      this.playMedia();
    }
  }

  playMedia() {
    /** @type {HTMLIFrameElement | null} */
    const iframe = this.querySelector('iframe[data-video-type]');
    if (iframe) {
      iframe.contentWindow?.postMessage(
        iframe.dataset.videoType === 'youtube'
          ? '{"event":"command","func":"playVideo","args":""}'
          : '{"method":"play"}',
        '*'
      );
      this.isPlaying = true;
      this.updatePlayPauseHint(this.isPlaying);
    } else {
      const video = this.querySelector('video');
      if (video) {
        video.play().then(() => {
          this.isPlaying = true;
          this.updatePlayPauseHint(this.isPlaying);
        }).catch(e => {
          console.log('Video play failed:', e);
        });
      }
    }
  }

  /**
   * Pauses the media
   */
  pauseMedia() {
    /** @type {HTMLIFrameElement | null} */
    const iframe = this.querySelector('iframe[data-video-type]');

    if (iframe) {
      iframe.contentWindow?.postMessage(
        iframe.dataset.videoType === 'youtube'
          ? '{"event":"command","func":"pauseVideo","args":""}'
          : '{"method":"pause"}',
        '*'
      );
      this.isPlaying = false;
    } else {
      const video = this.querySelector('video');
      if (video) {
        video.pause();
        this.isPlaying = false;
      }
    }

    // If we've already revealed the deferred media, we should toggle the play/pause hint
    if (this.getAttribute('data-media-loaded')) {
      this.updatePlayPauseHint(this.isPlaying);
    }
  }
}
if (!customElements.get("deferred-media"))
  customElements.define("deferred-media", DeferredMedia);

class CardMedia extends HTMLElement {
  constructor() {
    super();
    this.deferredMedia = null;
    this.isHovered = false;
  }

  connectedCallback() {
    this.deferredMedia = this.querySelector('deferred-media');

    if (this.deferredMedia) {
      if (typeof this.deferredMedia.loadContent === "function") {
        this.deferredMedia.loadContent();
      }
      if (typeof this.deferredMedia.pauseMedia === "function") {
        this.deferredMedia.pauseMedia();
      }

      this.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
      this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
  }

  handleMouseEnter() {
    if (this.deferredMedia && !this.isHovered) {
      this.isHovered = true;
      this.deferredMedia.playMedia();
    }
  }

  handleMouseLeave() {
    if (this.deferredMedia && this.isHovered) {
      this.isHovered = false;
      this.deferredMedia.pauseMedia();
    }
  }

  disconnectedCallback() {
    this.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}
if (!customElements.get("card-media"))
  customElements.define("card-media", CardMedia);

class SwiperComponent extends HTMLElement {
  constructor() {
    super();
    this.isMobileOnly = this.hasAttribute("data-swiper-mobile");
    this.swiperEl = null;
    this.initSwiper = null;
    this.options = null;
    this.breakpoint = null;
    this.breakpointChecker = null;
    this.arrowOnHeader = this.closest(
      ".arrow-on-header:has(.swiper-btns-on-header)"
    );
  }

  connectedCallback() {
    // Check if Swiper library is available
    if (typeof Swiper === "undefined") {
      console.error(
        "Swiper library not loaded. Please ensure vendor.js is loaded before this component."
      );
      return;
    }

    // Ensure DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeSwiper();
      });
      return;
    }

    this.initializeSwiper();
  }

  disconnectedCallback() {
    // Cleanup event listeners and swiper instance
    if (this.breakpoint && this.breakpointChecker) {
      this.breakpoint.removeEventListener("change", this.breakpointChecker);
    }
    if (this.initSwiper) {
      this.initSwiper.destroy(true, true);
      this.initSwiper = null;
    }
    // Remove initialization flag
    if (this.swiperEl) {
      this.swiperEl._swiperInitialized = false;
    }
  }

  initializeSwiper() {
    // Small delay to ensure proper initialization
    setTimeout(() => {
      this.swiperEl = this.querySelector(".swiper");

      if (!this.swiperEl) {
        console.error("❌ No .swiper element found in SwiperComponent");
        return;
      }

      if (this.swiperEl._swiperInitialized) {
        console.log("🔍 Swiper already initialized, skipping...");
        return;
      }

      this.swiperEl._swiperInitialized = true;

      // Debug: Check if swiper elements exist
      const nextButton = this.swiperEl.querySelector(".swiper-button-next");
      const prevButton = this.swiperEl.querySelector(".swiper-button-prev");
      const pagination = this.swiperEl.querySelector(".swiper-pagination");
      const arrowOnHeaderNextButton = this.arrowOnHeader
        ? this.arrowOnHeader.querySelector(".swiper-btns-on-header .swiper-button-next")
        : nextButton;
      const arrowOnHeaderPrevButton = this.arrowOnHeader
        ? this.arrowOnHeader.querySelector(".swiper-btns-on-header .swiper-button-prev")
        : prevButton;

      const getOption = (name, defaultValue = undefined) => {
        const attr = this.getAttribute(`data-${name}`);
        if (attr === null) return defaultValue;

        try {
          return JSON.parse(attr);
        } catch {
          if (attr === "true") return true;
          if (attr === "false") return false;
          if (!isNaN(attr)) return Number(attr);
          return attr;
        }
      };

      const baseSpaceBetween = getOption("space-between", 20);
      const baseBreakpoints = getOption("breakpoints", null);

      // Calculate default space between slides if not breakpoint provided
      const defaultSpacebetween = !baseBreakpoints
        ? baseSpaceBetween * 0.5
        : baseSpaceBetween; // Mobile

      const spaceBetweenTablet = !baseBreakpoints
        ? baseSpaceBetween * 0.75
        : baseSpaceBetween;

      const defaultBreakpoints = !baseBreakpoints
        ? {
            750: { spaceBetween: spaceBetweenTablet }, // Tablet
            990: { spaceBetween: baseSpaceBetween }, // Desktop
          }
        : baseBreakpoints;

      // Options
      this.options = {
        direction: getOption("direction", "horizontal"),
        mousewheel: getOption("mousewheel", false),
        watchSlidesProgress: getOption("watch-slides-progress", false),
        loop: getOption("loop", false),
        speed: getOption("speed", 500),
        parallax: getOption("parallax", false),
        effect: getOption("effect", false),
        spaceBetween: defaultSpacebetween,
        autoplay: {
          enabled: getOption("slide-autoplay", false),
          pauseOnMouseEnter: true,
          disableOnInteraction: false,
        },
        slidesPerView: getOption("slides-per-view", 1),
        centeredSlides: getOption("centered-slides", false),
        autoHeight: getOption("auto-height", false),
        navigation: {
          nextEl: arrowOnHeaderNextButton,
          prevEl: arrowOnHeaderPrevButton,
        },
        pagination: {
          el: pagination,
          clickable: true,
          type: getOption("pagination-type", "bullets"),
          dynamicBullets: getOption("dynamic-bullets", false),
        },
        breakpoints: defaultBreakpoints,
        thumbs: {
          swiper: null,
        },
      };

      this.initSwiperMobile();
    }, 100); // Added a small delay
  }

  initSwiperMobile() {
    const nextButton = this.swiperEl.querySelector(".swiper-button-next");
    const prevButton = this.swiperEl.querySelector(".swiper-button-prev");
    const arrowOnHeaderNextButton = this.arrowOnHeader
      ? this.arrowOnHeader.querySelector(".swiper-btns-on-header .swiper-button-next")
      : nextButton;
    const arrowOnHeaderPrevButton = this.arrowOnHeader
      ? this.arrowOnHeader.querySelector(".swiper-btns-on-header .swiper-button-prev")
      : prevButton;

    this.breakpoint = window.matchMedia("(min-width:750px)");

    const enableSwiper = () => {
      if (!this.swiperEl || !this.options) {
        console.error("❌ Cannot enable swiper: missing swiperEl or options");
        return;
      }

      if (this.initSwiper) {
        console.log("🔍 Destroying existing swiper instance");
        this.initSwiper.destroy(true, true);
        this.initSwiper = null;
      }

      try {
        // Check for thumbnail swiper - works on both mobile and desktop
        const thumbnailSwiper = this.querySelector('.swiper-controls__thumbnails-container .swiper');
        let thumbsSwiper = null;

        if (thumbnailSwiper && !thumbnailSwiper._swiperInitialized) {
          thumbnailSwiper._swiperInitialized = true;

          // Get thumbnail direction from data attribute
          const thumbnailDirection = this.getAttribute('data-thumbnail-direction') || 'horizontal';
          const isVerticalThumbnails = thumbnailDirection === 'vertical';

          // Get thumbnail position to determine slidesPerView
          const thumbnailPosition = this.querySelector('.swiper-controls__thumbnails-container')?.getAttribute('data-thumbnail-position') || 'bottom';
          const slidesPerView = (thumbnailPosition === 'left' || thumbnailPosition === 'right') ? 'auto' : 4;

          thumbsSwiper = new Swiper(thumbnailSwiper, {
            direction: isVerticalThumbnails ? 'vertical' : 'horizontal',
            spaceBetween: 16,
            slidesPerView: slidesPerView,
            freeMode: false,
            watchSlidesProgress: true,
            allowTouchMove: true,
            grabCursor: true,
            slideToClickedSlide: true,
            loop: false,
            breakpoints: {
              768: { slidesPerView: slidesPerView },
              1024: { slidesPerView: slidesPerView },
              1400: { slidesPerView: slidesPerView }
            },
            pagination: {
              el: '.swiper-controls__thumbnails-container .swiper-pagination',
              type: 'bullets',
              clickable: true,
            },
          });
        }

        // Ensure proper swiper options for both desktop and mobile
        const swiperOptions = {
          ...this.options,
          // Enable touch/swipe functionality
          allowTouchMove: true,
          // Enable navigation buttons
          navigation: {
            nextEl: arrowOnHeaderNextButton,
            prevEl: arrowOnHeaderPrevButton,
            disabledClass: "swiper-button-disabled",
            hiddenClass: "swiper-button-hidden",
          },
          // Enable pagination
          pagination: {
            el: this.swiperEl.querySelector(".swiper-pagination"),
            clickable: true,
            type: this.options.pagination?.type || "bullets",
            dynamicBullets: this.options.pagination?.dynamicBullets || false,
          },
          // Enable keyboard navigation
          keyboard: {
            enabled: true,
            onlyInViewport: true,
          },
          // Enable mousewheel
          mousewheel: {
            forceToAxis: true,
          },
          // Enable grab cursor
          grabCursor: true,
          // Enable resistance
          resistance: true,
          resistanceRatio: 0.85,
          // Connect thumbnail swiper if exists
          thumbs: thumbsSwiper ? {
            swiper: thumbsSwiper,
          } : undefined,
        };

        this.initSwiper = new Swiper(this.swiperEl, swiperOptions);

        // Handle thumbnail clicks - works on both mobile and desktop
        if (thumbnailSwiper && thumbsSwiper) {
          const thumbnailButtons = thumbnailSwiper.querySelectorAll('.swiper-controls__thumbnail');
          thumbnailButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
              e.preventDefault();
              this.initSwiper.slideTo(index);
            });
          });

          // Update active thumbnail on slide change
          this.initSwiper.on('slideChange', () => {
            thumbnailButtons.forEach((button, index) => {
              if (index === this.initSwiper.activeIndex) {
                button.setAttribute('aria-selected', 'true');
                button.classList.add('active');
              } else {
                button.removeAttribute('aria-selected');
                button.classList.remove('active');
              }
            });

            const realIndex = this.initSwiper.realIndex;
            let thumbsPerView = thumbsSwiper.params.slidesPerView;

            if (thumbsPerView == 'auto') {
              thumbsPerView = thumbsSwiper.slides.filter(slide =>
                slide.classList.contains('swiper-slide-visible')
              ).length;
            }

            const firstVisible = thumbsSwiper.activeIndex;
            const lastVisible = firstVisible + thumbsPerView - 1;

            if (realIndex >= lastVisible - 1) {
              thumbsSwiper.slideTo(realIndex - 2);
            }

            if (realIndex <= firstVisible + 1 && firstVisible > 0) {
              thumbsSwiper.slideTo(realIndex - 2 < 0 ? 0 : realIndex - 2);
            }
          });

          // Set initial active state
          if (thumbnailButtons.length > 0) {
            thumbnailButtons[0].setAttribute('aria-selected', 'true');
            thumbnailButtons[0].classList.add('active');
          }
        }

        // Force update to ensure proper rendering
        setTimeout(() => {
          if (this.initSwiper) {
            this.initSwiper.update();
            if (thumbsSwiper) {
              thumbsSwiper.update();
            }
          }
        }, 200);
      } catch (error) {
        console.error("❌ Error initializing Swiper:", error);
        // Try to reinitialize after a delay
        setTimeout(() => {
          console.log("🔄 Attempting to reinitialize Swiper...");
          enableSwiper();
        }, 500);
      }
    };

    this.breakpointChecker = () => {
      if (this.isMobileOnly) {
        // For mobile-only swipers, only enable on mobile
        if (this.breakpoint.matches) {
          // Desktop - destroy swiper
          if (this.initSwiper) {
            this.initSwiper.destroy(true, true);
            this.initSwiper = null;
          }
        } else {
          // Mobile - enable swiper
          if (!this.initSwiper) {
            enableSwiper();
          }
        }
      } else {
        // For regular swipers, always enable (works on both mobile and desktop)
        if (!this.initSwiper) {
          enableSwiper();
        }
      }
    };

    // Add event listener for breakpoint changes
    this.breakpoint.addEventListener("change", this.breakpointChecker);

    // Initial check
    this.breakpointChecker();
  }

  // Method to force reinitialize swiper (useful for debugging)
  forceReinitialize() {
    if (this.initSwiper) {
      this.initSwiper.destroy(true, true);
      this.initSwiper = null;
    }
    this.initSwiperMobile();
  }
}
if (!customElements.get("swiper-component"))
  customElements.define("swiper-component", SwiperComponent);

class ProductRecommendations extends HTMLElement {
  observer = undefined;

  constructor() {
    super();
  }

  connectedCallback() {
    this.initializeRecommendations(this.dataset.productId);
  }

  initializeRecommendations(productId) {
    this.observer?.unobserve(this);
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.loadRecommendations(productId);
      },
      { rootMargin: "0px 0px 400px 0px" }
    );
    this.observer.observe(this);
  }

  loadRecommendations(productId) {
    fetch(
      `${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`
    )
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement("div");
        html.innerHTML = text;
        const recommendations = html.querySelector("product-recommendations");

        if (recommendations?.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        }

        if (this.classList.contains("complementary-products")) {
          this.remove();
        }

        if (html.querySelector(".grid__item")) {
          this.classList.add("product-recommendations--loaded");
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
if (!customElements.get("product-recommendations"))
  customElements.define("product-recommendations", ProductRecommendations);

window.theme = window.theme || {};
// Init section function when it's visible, then disable observer
theme.initSectionVisible = function (options) {
  const threshold = options.threshold ? options.threshold : 0;

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (typeof options.callback === "function") {
            options.callback();
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { rootMargin: `0px 0px ${threshold}px 0px` }
  );

  observer.observe(options.element);
};

class AccountIcon extends HTMLElement {
  constructor() {
    super();

    this.icon = this.querySelector(".icon");
  }

  connectedCallback() {
    document.addEventListener(
      "storefront:signincompleted",
      this.handleStorefrontSignInCompleted.bind(this)
    );
  }

  handleStorefrontSignInCompleted(event) {
    if (event?.detail?.avatar) {
      this.icon?.replaceWith(event.detail.avatar.cloneNode());
    }
  }
}
if (!customElements.get("account-icon"))
  customElements.define("account-icon", AccountIcon);

class BulkAdd extends HTMLElement {
  constructor() {
    super();
    this.queue = [];
    this.requestStarted = false;
    this.ids = [];
  }

  startQueue(id, quantity) {
    this.queue.push({ id, quantity });
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, 250);
  }

  sendRequest(queue) {
    this.requestStarted = true;
    const items = {};
    queue.forEach((queueItem) => {
      items[parseInt(queueItem.id)] = queueItem.quantity;
    });
    this.queue = this.queue.filter(
      (queueElement) => !queue.includes(queueElement)
    );
    const quickBulkElement =
      this.closest("quick-order-list") || this.closest("quick-add-bulk");
    quickBulkElement.updateMultipleQty(items);
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute("value");
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    if (inputValue < event.target.dataset.min) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.min_error.replace(
          "[min]",
          event.target.dataset.min
        )
      );
    } else if (inputValue > parseInt(event.target.max)) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.max_error.replace(
          "[max]",
          event.target.max
        )
      );
    } else if (inputValue % parseInt(event.target.step) != 0) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.step_error.replace(
          "[step]",
          event.target.step
        )
      );
    } else {
      event.target.setCustomValidity("");
      event.target.reportValidity();
      this.startQueue(index, inputValue);
    }
  }

  getSectionsUrl() {
    if (window.pageNumber) {
      return `${window.location.pathname}?page=${window.pageNumber}`;
    } else {
      return `${window.location.pathname}`;
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }
}
if (!customElements.get("bulk-add"))
  customElements.define("bulk-add", BulkAdd);

class CartPerformance {
  static #metric_prefix = "cart-performance"

  static createStartingMarker(benchmarkName) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    return performance.mark(`${metricName}:start`);
  }

  static measureFromEvent(benchmarkName, event) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    const startMarker = performance.mark(`${metricName}:start`, {
      startTime: event.timeStamp
    });

    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(
      metricName,
      `${metricName}:start`,
      `${metricName}:end`
    );
  }

  static measureFromMarker(benchmarkName, startMarker) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(
      metricName,
      startMarker.name,
      `${metricName}:end`
    );
  }

  static measure(benchmarkName, callback) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    const startMarker = performance.mark(`${metricName}:start`);

    callback();

    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(
      metricName,
      `${metricName}:start`,
      `${metricName}:end`
    );
  }
}

// *** Function
class GridView extends HTMLElement {
  constructor() {
    super();
    this.productGrid = document.querySelector(
      ".product-grid-container .product-grid"
    );
    this.mediaView = this.querySelector(".desktop-grid-view");
    this.onClickModeButton();
  }

  connectedCallback() {
    this.init();
    this.autoChangeLayout();
  }

  init() {
    this.mediaView?.querySelectorAll(".button--grid-view").forEach((button) => {
      if (button.classList.contains("active")) {
        const gridView = button.dataset.grid;
        const cards = this.productGrid.querySelectorAll(
          ".product-grid__item"
        );
        this.transitionGrid(gridView, cards);
      }
    });
  }

  onClickModeButton(event) {
    this.mediaView?.querySelectorAll(".button--grid-view").forEach((modeButton) => {
      modeButton.addEventListener("click",
        this.onClickModeButtonHandler.bind(this)
      );
    });
  }

  onClickModeButtonHandler(event) {
    event.preventDefault();

    var buttonElement = event.currentTarget,
      viewMode = this.mediaView.querySelector(".button--grid-view.active"),
      column = parseInt(buttonElement.dataset.grid);

    if (!buttonElement.classList.contains("active")) {
      viewMode?.classList.remove("active");
      buttonElement.classList.add("active");

      this.mediaViewMobile?.querySelectorAll(".button--grid-view").forEach((element) => {
        var currentColumn = parseInt(element.dataset.grid);

        if (currentColumn == column) {
          element.classList.add("active");
        } else {
          element.classList.remove("active");
        }
      });

      this.initViewModeLayout(column);
    }
  }

  autoChangeLayout() {
    const getColByWidth = (col, width, isVertical) => {
      if (isVertical) {
        if (width < 750 && [3, 4, 5].includes(col)) return 2;
        if (width <= 1100 && width >= 750 && [3, 4, 5].includes(col)) return 2;
        if (width < 1300 && width > 1100 && [4, 5].includes(col)) return 3;
        if (width < 1700 && width >= 1300 && col == 5) return 4;
      } else {
        if (width < 750 && [3, 4, 5].includes(col)) return 2;
        if (width < 990 && width >= 750 && [3, 4, 5].includes(col)) return 3;
        if (width < 1600 && width >= 990 && col == 5) return 4;
      }
      return col;
    };

    const updateViewMode = () => {
      let viewMode = this.mediaView?.querySelector(".button--grid-view.active");
      let col = parseInt(viewMode?.dataset.grid);

      const width = window.innerWidth;
      const isVertical = document.querySelector(".facets-vertical");
      const newCol = getColByWidth(col, width, isVertical);

      if (col !== newCol) {
        viewMode?.classList.remove("active");

        this.mediaView?.querySelector(`.grid-view--item.grid-view-${newCol} .button--grid-view`)?.classList.add("active");

        col = newCol;
      }
      this.initViewModeLayout(col);
    };

    window.addEventListener("resize", updateViewMode);

    if (!this.mediaView) return;
    updateViewMode();
  }

  transitionGrid(gridView, cards) {
    if (document.startViewTransition) {
      cards.forEach((card) => {
        card.style.setProperty(
          "view-transition-name",
          `product-card-${card.dataset.productId}`
        );
      });

      document
        .startViewTransition(() => {
          this.productGrid.setAttribute("data-view", gridView);
        })
        .finished.finally(() => {
          cards.forEach((card) => {
            card.style.removeProperty("view-transition-name");
          });
        });
    } else {
      this.productGrid.setAttribute("data-view", gridView);
    }
  }

  changeLayoutGrid(event) {
    const gridView = event.currentTarget.dataset.grid;
    const parent = event.currentTarget.closest(".grid-view--list");

    const cards = this.productGrid.querySelectorAll(".product-grid__item");

    parent.querySelectorAll(".button--grid-view").forEach((button) => {
      button.classList.add("cursor-pointer");
      button.classList.remove("active");
    });

    event.currentTarget.classList.remove("cursor-pointer");
    event.currentTarget.classList.add("active");

    this.transitionGrid(gridView, cards);
  }

  initViewModeLayout(column) {
    const cards = this.productGrid.querySelectorAll(".product-grid__item");

    if (!this.productGrid) return;
    this.transitionGrid(column, cards);

    // switch (column) {
    //   case 1:
    //     break;

    //   default:
    //     switch (column) {
    //       case 2:
    //         // productListing.setAttribute('data-view', 2);
    //         this.transitionGrid(column, cards);

    //         break;
    //       case 3:
    //         // productListing.setAttribute('data-view', 3);
    //         this.transitionGrid(column, cards);

    //         break;
    //       case 4:
    //         // productListing.setAttribute('data-view', 4);
    //         this.transitionGrid(column, cards);

    //         break;
    //       case 5:
    //         // productListing.setAttribute('data-view', 5);
    //         this.transitionGrid(column, cards);

    //         break;
    //     }
    // }
  }
}
if (!customElements.get("grid-view"))
  customElements.define("grid-view", GridView);

class RecentlyViewedProducts extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    theme.initSectionVisible({
      element: this,
      callback: this.load.bind(this),
      threshold: 400,
    });
  }

  load() {
    fetch(this.getUrl())
      .then((response) => response.text())
      .then((text) => {
        const recentlyViewed = new DOMParser()
          .parseFromString(text, "text/html")
          .querySelector("recently-viewed-products");
        if (recentlyViewed) this.innerHTML = recentlyViewed.innerHTML;

        // Callback loadContent if it exists
        const cardMedias = this.querySelectorAll("card-media");
        cardMedias.forEach((cardMedia) => {
          this.deferredMedia = cardMedia.querySelector('deferred-media');

          if (this.deferredMedia && typeof this.deferredMedia.loadContent === "function") {
            this.deferredMedia.loadContent();
          }
          if (this.deferredMedia && typeof this.deferredMedia.pauseMedia === "function") {
            this.deferredMedia.pauseMedia();
          }
        });

        // Callback initMoreSwatchButtons if it exists
        if (typeof initMoreSwatchButtons === 'function') {
          const container = document.getElementById('recently-viewed-products');
          initMoreSwatchButtons(container || document);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }

  getUrl() {
    const listItems = JSON.parse(
      localStorage.getItem("_halo_recently_viewed") || "[]"
    );
    if (
      this.dataset.productId &&
      listItems.includes(parseInt(this.dataset.productId))
    )
      listItems.splice(listItems.indexOf(parseInt(this.dataset.productId)), 1);
    return (
      this.dataset.url +
      listItems
        .map((id) => "id:" + id)
        .slice(0, parseInt(this.dataset.limit))
        .join("%20OR%20")
    );
  }
}
if (!customElements.get("recently-viewed-products"))
  customElements.define("recently-viewed-products", RecentlyViewedProducts);

const moreButton = document.querySelectorAll(
  ".card__swatch .item-swatch-more .number-showmore"
);

// Initialize 'show more swatches' buttons; safe to call multiple times
function initMoreSwatchButtons(root = document) {
  const buttons = root.querySelectorAll(
    ".card__swatch .item-swatch-more .number-showmore"
  );

  buttons.forEach((button) => {
    if (button.dataset.moreSwatchBound === "true") return;
    button.dataset.moreSwatchBound = "true";

  button.addEventListener("click", function (event) {
    const swatch = event.target.closest(".swatch-list");
      (span = button.querySelector("span")), (groupSwatch = swatch.querySelector(".group-swatch"));

    if (groupSwatch.style.display == "flex") {
      groupSwatch.style.display = "none";
      if (span) span.textContent = "+";
    } else {
      groupSwatch.style.display = "flex";
      if (span) span.textContent = "-";
    }
  });
});
}

// First-time bind on initial page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initMoreSwatchButtons());
} else {
  initMoreSwatchButtons();
}

class Wishlist extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.wishlistButton = this.querySelector("[data-wishlist]");
    if (this.wishlistButton) {
      this.wishlistButton.addEventListener(
        "click",
        this.onWishlistButtonClick.bind(this)
      );
    }
  }

  onWishlistButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget;
    const isInGrid = target.classList.contains("is-in-grid");

    if (!isInGrid) {
      document
        .querySelectorAll("[data-wishlist-items-display]")
        .forEach((el) => {
          el.classList.remove("is-loaded");
        });
    }

    const id = target.dataset.productId;
    const handle = target.dataset.wishlistHandle;

    let wishlistList = JSON.parse(localStorage.getItem("wishlistItem")) || [];
    let index = wishlistList.indexOf(handle);

    const wishlistContainer = document.querySelector(
      "[data-wishlist-container]"
    );
    const wishlistLayout = wishlistContainer?.getAttribute(
      "data-wishlist-layout"
    );

    if (!target.classList.contains("wishlist-added")) {
      target.classList.add("wishlist-added");
      const textElement = target.querySelector(".text");
      if (textElement) textElement.textContent = window.wishlist.added;

      if (wishlistContainer) {
        const addEvent = new CustomEvent("addwishlistitem", {
          detail: { handle },
          bubbles: true,
        });
        document.dispatchEvent(addEvent);
      }

      if (!wishlistList.includes(handle)) {
        wishlistList.push(handle);
        localStorage.setItem("wishlistItem", JSON.stringify(wishlistList));

        const updateWishlistMailEvent = new CustomEvent("updatewishlistmail", {
          bubbles: true,
        });
        document.dispatchEvent(updateWishlistMailEvent);
      }
    } else {
      target.classList.remove("wishlist-added");
      const textElement = target.querySelector(".text");
      if (textElement) textElement.textContent = window.wishlist.add;

      if (wishlistContainer) {
        const addedElement = document.querySelector(
          `[data-wishlist-added="wishlist-${id}"]`
        );
        if (addedElement) addedElement.remove();

        const icon = document.querySelector(
          `[data-wishlist][data-product-id="${id}"]`
        );
        const productCard = icon?.closest(".product");
        if (productCard) productCard.remove();
      }

      if (index > -1) {
        wishlistList.splice(index, 1);
        localStorage.setItem("wishlistItem", JSON.stringify(wishlistList));
      }

      const updatePaginationEvent = new CustomEvent("updatepagination", {
        bubbles: true,
      });
      document.dispatchEvent(updatePaginationEvent);

      if (wishlistContainer) {
        wishlistList = JSON.parse(localStorage.getItem("wishlistItem")) || [];

        if (wishlistList.length > 0) {
          const updateWishlistMailEvent = new Event("updatewishlistmail", {
            bubbles: true,
          });
          document.dispatchEvent(updateWishlistMailEvent);
        } else {
          wishlistContainer.classList.add("is-empty");
          wishlistContainer.innerHTML = `
            <div class="wishlist-content-empty center">
              <span class="wishlist-content-text">${window.wishlist.empty}</span>
              <div class="wishlist-content-actions">
                <a class="button button-2 button-continue" href="${window.routes.collection_all}">
                  ${window.wishlist.continue_shopping}
                </a>
              </div>
            </div>
          `;

          const wishlistFooter = document.querySelector(
            "[data-wishlist-footer]"
          );
          if (wishlistFooter) wishlistFooter.style.display = "none";
        }
      }
    }

    const wishlistCount = document.querySelector("[data-wishlist-count]");
    if (wishlistCount) wishlistCount.textContent = wishlistList.length;

    // if (typeof halo !== "undefined" && typeof halo.setProductForWishlist === "function") {
    //   halo.setProductForWishlist(handle);
    // }
  }
}
if (!customElements.get("wish-list"))
  customElements.define("wish-list", Wishlist);

class CountDown extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.d = new Date(this.dataset.countdown).getTime();
    this.t = this.dataset.type;
    this.e = this.dataset.hide;
    this.createObserver();
  }

  init(time, type, hide) {
    var countdown = setInterval(() => {
      let now = new Date().getTime();

      if (isNaN(time)) {
        time = new Date(this.dataset.countdown.replace(/-/g, "/")).getTime();

        if (isNaN(time)) {
          clearInterval(countdown);
          this.parentElement.classList.add("hidden");
          return;
        }
      }

      let distance = time - now;

      if (distance < 0) {
        clearInterval(countdown);
        if (hide == "true") {
          this.parentElement.classList.add("hidden");
        } else {
          let content = `<span class="countdown-item inline-block v-a-top center"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.days}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.hours}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.mins}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.secs}</span></span></span>`;

          this.querySelector(".countdown").innerHTML = content;
          this.querySelector(".countdown-expired").classList.remove("hidden");
        }
      } else {
        let day = Math.floor(distance / (1000 * 60 * 60 * 24)),
          hour = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minute = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          second = Math.floor((distance % (1000 * 60)) / 1000),
          content;

        if (type == "sale-banner") {
          content = `<span class="countdown-item inline-block v-a-top center"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${day}<span class="block body-sm">${window.countdown.days}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${hour}<span class="block body-sm">${window.countdown.hours}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${minute}<span class="block body-sm">${window.countdown.mins}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${second}<span class="block body-sm">${window.countdown.secs}</span></span></span>`;

          this.querySelector(".countdown").innerHTML = content;
          this.parentElement.classList.remove("hidden");
        }
      }
    }, 1000);
  }

  createObserver() {
    let observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          this.init(this.d, this.t, this.e);
          observer.unobserve(this);
        });
      },
      { rootMargin: "0px 0px -200px 0px" }
    );

    observer.observe(this);
  }
}
if (!customElements.get("count-down"))
  customElements.define("count-down", CountDown);

class ColorSwatch extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.swatchList = this.querySelector(".swatch-list");
    this.variantSelectsSwatchList = this.querySelector("variant-selects .swatch-list");
    this.swatchList?.addEventListener(
      "click",
      this.handleSwatchClick.bind(this)
    );
  }

  handleSwatchClickActive(event) {
    const target = event.target;
    if (target.closest(".swatch-item")) {
      this.querySelectorAll(".swatch-item").forEach(item => {
        if (item !== target.closest(".swatch-item")) {
          item.classList.remove("active");
        }
      });
      target.closest(".swatch-item").classList.add("active");
    }
  }

  handleSwatchClick(event) {
    let target = event.target,
      title = target.getAttribute("data-title")?.trim(),
      product = target.closest(".card-wrapper");
      if (!product) return;

    let template = product.querySelector("template"),
      fragment = template.content.cloneNode(true),
      divFragment = fragment.querySelector("[data-json-product]"),
      jsonData = divFragment.getAttribute("data-json-product"),
      productJson = JSON.parse(jsonData),
      productTitle = product.querySelector(".card__heading > a"),
      variantId = Number(target.dataset.variantId),
      productHref = product.querySelector("a").getAttribute("href"),
      newImage = target.dataset.variantImg,
      mediaList = [];

    if (target.closest(".swatch-item")) {
      this.handleSwatchClickActive(event);
      // CHANGE TITLE
      if (productTitle.classList.contains("card-title-change")) {
        productTitle
          .querySelector(".text")
          .setAttribute("data-change-title", " - " + title);
      } else {
        productTitle.classList.add("card-title-change");
        productTitle
          .querySelector(".text")
          .setAttribute("data-change-title", " - " + title);
      }

      // CHANGE PRICE
      const selectedVariant = productJson.variants.find(
        (variant) => variant.id === variantId
      );

      if (selectedVariant.compare_at_price > selectedVariant.price) {
        product.querySelector(".price").classList.add("price--on-sale");

        product.querySelector(".price__sale .price-item--regular").innerHTML =
          Shopify.formatMoney(
            selectedVariant.compare_at_price,
            window.money_format
          );

        product.querySelector(".price__sale .price-item--sale").innerHTML =
          Shopify.formatMoney(selectedVariant.price, window.money_format);

        const labelSale = `(-${Math.round(
          ((selectedVariant.compare_at_price - selectedVariant.price) * 100) /
            selectedVariant.compare_at_price
        )}%)`;

        const salePercent = product.querySelector(
          ".price__sale .price-item--percent span"
        );
        if (salePercent) salePercent.innerHTML = labelSale;
      } else {
        product.querySelector(".price__regular .price-item").innerHTML =
          Shopify.formatMoney(selectedVariant.price, window.money_format);

        if (selectedVariant.compare_at_price == null) {
          product.querySelector(".price").classList.remove("price--on-sale");
          product.querySelector(".price__sale .price-item--regular").innerHTML =
            "";
        }
      }

      // CHANGE HREF
      product
        .querySelector(".card__heading > a")
        .setAttribute(
          "href",
          productHref.split("?variant=")[0] + "?variant=" + variantId
        );

      // CHANGE IMAGE
      if (productJson.media != undefined) {
        const mediaList = productJson.media.filter((index, element) => {
          return element.alt === title;
        });
      }

      if (mediaList.length > 0) {
        if (mediaList.length > 1) {
          const length = 2;
        } else {
          const length = mediaList.length;
        }

        for (let i = 0; i < length; i++) {
          product
            .querySelector(".card__media img:eq(" + i + ")")
            .setAttribute("srcset", mediaList[i].src);
        }
      } else {
        if (newImage) {
          product
            .querySelector(".card__media img:nth-child(1)")
            .setAttribute("srcset", newImage);
        }
      }
    }

  }
}
if (!customElements.get("color-swatch"))
  customElements.define("color-swatch", ColorSwatch);

class ShowMoreGrid extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.refType = this.getAttribute("ref");
    this.button = this.querySelector("button");
    if (!this.button || !this.refType) return;

    if (this.refType === "collection-grid") {
      this.itemsPerClick = this.getAttribute("data-max-items");
      this.currentIndex = 0;
    }

    this.button.addEventListener("click", this.handleButtonClick.bind(this));
  }

  handleButtonClick(event) {
    event.preventDefault();

    if (this.refType === "collection-grid") {
      this.handleCollectionGrid();
    } else if (this.refType === "product-grid") {
      this.handleProductGrid();
    }
  }

  handleCollectionGrid() {
    const sectionContent = this.closest(".collection-list-page");
    if (!sectionContent) return;

    const template = sectionContent.querySelector(
      "template[data-collection-card-template-showmore]"
    );
    if (!template) return;

    const allHiddenItems = Array.from(
      template.content.querySelectorAll(".resource-list__item")
    );
    const collectionList = sectionContent.querySelector(".resource-list");
    if (!collectionList || !allHiddenItems.length) return;

    const nextItems = allHiddenItems.slice(
      this.currentIndex,
      this.currentIndex + this.itemsPerClick
    );

    nextItems.forEach((item) => {
      const clone = item.cloneNode(true);
      collectionList.appendChild(clone);
    });

    this.currentIndex += this.itemsPerClick;

    if (this.currentIndex >= allHiddenItems.length) {
      this.remove();
    }
  }

  handleProductGrid() {
    const sectionContent = this.closest(".section-global__content");
    if (!sectionContent) return;

    const template = sectionContent.querySelector(
      "template[data-product-grid-template-showmore]"
    );
    if (!template) return;

    const productGrid = sectionContent.querySelector(
      ".collection--grid-layout .grid-layout"
    );
    if (!productGrid) return;

    const templateContent = template.content.cloneNode(true);
    productGrid.appendChild(templateContent);

    this.remove();
  }
}
if (!customElements.get("show-more-grid")) {
  customElements.define("show-more-grid", ShowMoreGrid);
}

class ParallaxImg extends HTMLElement {
  constructor() {
    super();
    this.img = null;
    this.disableParallaxMobile =
      this.getAttribute("data-disable-parallax-mobile") === "true";
    this.isMobile = window.innerWidth < 750;
  }

  connectedCallback() {
    if (this.getAttribute("data-parallax") !== "true") return;

    this.img = this.querySelector(".image-parallax--target");
    if (!this.img) return;

    if (this.disableParallaxMobile && this.isMobile) return;

    if (this.img.complete) {
      this.setupParallax();
    } else {
      this.img.addEventListener("load", () => this.setupParallax(), {
        once: true,
      });
    }
  }

  setupParallax() {
    const speed = parseFloat(this.dataset.speed) || 0.5;
    const screenSpeed = window.innerWidth < 750 ? speed * 0.5 : speed;
    const minExtra = parseInt(this.dataset.minExtra) || 100;

    const viewportHeight = window.innerHeight;
    const blockHeight = this.offsetHeight;

    let imgHeight = this.img.getBoundingClientRect().height;

    if (imgHeight - blockHeight < minExtra) {
      imgHeight = this.img.getBoundingClientRect().height + minExtra;
    }

    const maxMove = (imgHeight - blockHeight) * (viewportHeight / blockHeight);
    const startY = -maxMove * screenSpeed;
    const endY = maxMove * screenSpeed;

    Motion.scroll(
      Motion.animate(
        this.img,
        { y: [startY, endY] },
        {
          ease: [0.25, 0.1, 0.25, 1],
          duration: 0.3,
        }
      ),
      { target: this, offset: ["start end", "end start"] }
    );
  }
}
if (!customElements.get("parallax-image"))
  customElements.define("parallax-image", ParallaxImg);

class ParallaxElement extends HTMLElement {
  constructor() {
    super();
    this.target = null;
    this.type = this.getAttribute("is") || "content";
    this.disableParallaxMobile =
      this.getAttribute("data-disable-parallax-mobile") === "true";
    this.isMobile = window.innerWidth < 750;
  }

  connectedCallback() {
    if (this.getAttribute("data-parallax") !== "true") return;

    this.target =
      this.querySelector(".parallax--target") || this.firstElementChild;
    if (!this.target) return;

    if (this.disableParallaxMobile && this.isMobile) return;

    if (this.type === "image") {
      if (this.target.complete) {
        this.setupImage();
      } else {
        this.target.addEventListener("load", () => this.setupImage(), {
          once: true,
        });
      }
    } else {
      this.section = this.closest(".shopify-section") || this;
      this.setupContent();
    }
  }

  setupImage() {
    const speed = parseFloat(this.dataset.speed) || 0.5;
    const screenSpeed = window.innerWidth < 750 ? speed * 0.5 : speed;
    const minExtra = parseInt(this.dataset.minExtra) || 100;

    const viewportHeight = window.innerHeight;
    const blockHeight = this.offsetHeight;

    let imgHeight = this.target.getBoundingClientRect().height;
    if (imgHeight - blockHeight < minExtra) {
      imgHeight += minExtra;
    }

    const maxMove = (imgHeight - blockHeight) * (viewportHeight / blockHeight);
    const startY = -maxMove * screenSpeed;
    const endY = maxMove * screenSpeed;

    Motion.scroll(
      Motion.animate(
        this.target,
        { y: [startY, endY] },
        {
          ease: [0.25, 0.1, 0.25, 1],
          duration: 0.3,
        }
      ),
      { target: this, offset: ["start end", "end start"] }
    );
  }

  setupContent() {
    const speed = parseFloat(this.dataset.speed) || 0.5;
    const screenSpeed = window.innerWidth < 750 ? speed * 0.5 : speed;

    const horizontalRange = (this.dataset.horizontalPosition || "0% 0%").split(
      " "
    );
    const verticalRange = (this.dataset.verticalPosition || "0% 0%").split(" ");

    const startX = horizontalRange[0] || "0%";
    const startY = verticalRange[0] || "0%";

    const parseVal = (val) => {
      if (typeof val === "string" && val.includes("%")) return parseFloat(val);
      return parseFloat(val) || 0;
    };

    const midX = parseVal(startX);
    const midY = parseVal(startY);

    const reverseX = (midX * -1) / 3;
    const reverseY = (midY * -1) / 3;

    if (midX === 0 && midY === 0) {
      const startY = -30 * screenSpeed;
      const endY = 30 * screenSpeed;

      Motion.scroll(
        Motion.animate(
          this.target,
          { y: [`${startY}%`, `${endY}%`] },
          {
            ease: [0.25, 0.1, 0.25, 1],
            duration: 0.3,
          }
        ),
        { target: this.section, offset: ["start end", "end start"] }
      );
      return;
    }

    Motion.scroll(
      Motion.animate(
        this.target,
        {
          x: ["0%", `${midX}%`, `${reverseX}%`],
          y: ["0%", `${midY}%`, `${reverseY}%`],
        },
        {
          ease: [0.25, 0.1, 0.25, 1],
          duration: 0.3,
        }
      ),
      {
        target: this.section,
        offset: ["start end", "center center", "end start"],
      }
    );
  }
}
customElements.define("parallax-element", ParallaxElement);

/**
 * A custom element that formats rte content for easier styling
 */
class RTEFormatter extends HTMLElement {
  connectedCallback() {
    this.querySelectorAll("table").forEach(this.#formatTable);
  }

  /**
   * Formats a table for easier styling
   * @param {HTMLTableElement} table
   */
  #formatTable(table) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("rte-table-wrapper");
    const parent = table.parentNode;
    if (parent) {
      parent.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  }
}
if (!customElements.get("rte-formatter"))
  customElements.define("rte-formatter", RTEFormatter);

class StrokeText extends HTMLElement {
  constructor() {
    super();
    this._animation = null;
  }

  connectedCallback() {
    this.style.backgroundSize = "0% 100%";
    this.style.backgroundRepeat = "no-repeat";
    this.style.transition = "none";

    this.addEventListener("mouseenter", (e) => {
      this.updatePosition(e);
      this.play(true);
    });

    this.addEventListener("mouseleave", (e) => {
      this.updatePosition(e);
      this.play(false);
    });

    this.addEventListener("mousemove", (e) => this.updatePosition(e));
  }

  play(toFull) {
    if (this._animation) this._animation.cancel();

    this._animation = Motion.animate(
      this,
      { backgroundSize: toFull ? "100% 100%" : "0% 100%" },
      { duration: 0.4, easing: [0.61, 0.22, 0.23, 1] }
    );
  }

  updatePosition(e) {
    const rect = this.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    this.style.backgroundPosition = `${xPercent}% 50%`;
  }
}
if (!customElements.get("stroke-text"))
  customElements.define("stroke-text", StrokeText);

// Infinite Scrolling Function
class InfiniteScrolling extends HTMLElement {
  constructor() {
    super();
    this.isLoading = false;
    this.currentPage = 1;
    this.hasNextPage = true;
    this.productGrid = null;
    this.init();
  }

  init() {
    this.productGrid = document.querySelector('#ResultsList .product-grid');
    if (!this.productGrid) return;

    this.currentPage = parseInt(this.productGrid.dataset.currentPage) || 1;
    this.hasNextPage = parseInt(this.productGrid.dataset.totalPages) > this.currentPage;

    this.bindEvents();
  }

  bindEvents() {
    const infiniteButton = document.querySelector('[data-infinite-scrolling]');
    if (infiniteButton) {

      this.setupIntersectionObserver(infiniteButton);
    }

    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  setupIntersectionObserver(target) {
    const options = {
      root: null,
      rootMargin: '-100px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading && this.hasNextPage) {
          this.loadNextPage();
        }
      });
    }, options);

    observer.observe(target);
  }

  handleScroll() {
    const infiniteButton = this.querySelector('[data-infinite-scrolling]');
    if (!infiniteButton || this.isLoading || !this.hasNextPage) return;

    const rect = infiniteButton.getBoundingClientRect();
    const height = rect.height + 100;
    const isVisible = rect.top <= window.innerHeight - height;

    if (isVisible) {
      this.loadNextPage();
    }
  }

  async loadNextPage() {
    if (this.isLoading || !this.hasNextPage) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      const nextPage = this.currentPage + 1;
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('page', nextPage);

      // Fetch next page
      const response = await fetch(currentUrl.toString());
      const html = await response.text();

      // Parse HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract products from next page
      const newProducts = doc.querySelectorAll('.product-grid__item');

      if (newProducts.length > 0 && this.productGrid) {
        // Append new products
        newProducts.forEach(product => {
          const clonedProduct = product.cloneNode(true);
          // Update data attributes for new products
          clonedProduct.dataset.page = nextPage;
          this.productGrid.appendChild(clonedProduct);
        });

        this.currentPage = nextPage;

        // Check if there are more pages
        const pagination = doc.querySelector('.pagination');
        if (pagination) {
          const nextButton = pagination.querySelector('.pagination__item--next');
          this.hasNextPage = !!nextButton;
        } else {
          this.hasNextPage = false;
        }

        // Update product grid data attributes
        this.productGrid.dataset.currentPage = this.currentPage;

        // Update pagination progress
        this.updatePaginationProgress();

        // Update URL without page reload
        if (this.hasNextPage) {
          window.history.replaceState({}, '', currentUrl.toString());
        } else {
          // Hide infinite scrolling button if no more pages
          const infiniteButton = this.querySelector('[data-infinite-scrolling]');
          if (infiniteButton) {
            infiniteButton.style.display = 'none';
          }
        }

        // Trigger any necessary reinitializations
        this.reinitializeComponents();

        // Dispatch custom event
        this.dispatchProductsLoadedEvent();
      } else {
        this.hasNextPage = false;
      }

    } catch (error) {
      console.error('Error loading next page:', error);
      this.hasNextPage = false;
    } finally {
      this.hideLoadingState();
      this.isLoading = false;
    }
  }

  showLoadingState() {
    const infiniteButton = this.querySelector('[data-infinite-scrolling]');
    const spinner = infiniteButton.querySelector('.loading__spinner');
    if (infiniteButton) {
      infiniteButton.classList.add('loading');
      spinner.classList.remove('hidden');
      infiniteButton.disabled = true;
    }

    // Add loading state to product grid
    if (this.productGrid) {
      this.productGrid.classList.add('loading');
    }
  }

  hideLoadingState() {
    const infiniteButton = this.querySelector('[data-infinite-scrolling]');
    const spinner = infiniteButton.querySelector('.loading__spinner');
    const text = infiniteButton.querySelector('.text');
    if (infiniteButton) {
      if (!this.hasNextPage) {
        text.innerHTML = window.button_load_more.no_more;
      } else {
        text.innerHTML = window.button_load_more.default;
      }
      infiniteButton.classList.remove('loading');
      spinner.classList.add('hidden');
      infiniteButton.disabled = false;
    }

    // Remove loading state from product grid

    if (this.productGrid) {
      this.productGrid.classList.remove('loading');
    }
  }

  reinitializeComponents() {
    // Reinitialize any components that need to be updated
    // For example, lazy loading images, animations, etc.

    // Reinitialize lazy loading if exists
    if (window.lazyLoad) {
      window.lazyLoad.update();
    }

    // Reinitialize animations if exists
    if (window.animateOnScroll) {
      window.animateOnScroll.init();
    }

    // Reinitialize product cards if needed
    this.reinitializeProductCards();

    // Rebind 'show more swatches' buttons for newly added products
    if (typeof initMoreSwatchButtons === 'function') {
      initMoreSwatchButtons(this.productGrid || document);
    }
  }

  reinitializeProductCards() {
    // Reinitialize product cards for new products
    const newProducts = this.productGrid.querySelectorAll(`[data-page="${this.currentPage}"]`);

    newProducts.forEach(product => {
      // Reinitialize any product card specific functionality
      const quickAddButtons = product.querySelectorAll('[data-quick-add]');
      quickAddButtons.forEach(button => {
        // Reinitialize quick add functionality if needed
        if (window.QuickAdd) {
          window.QuickAdd.initButton(button);
        }
      });
    });
  }

  dispatchProductsLoadedEvent() {
    // Trigger custom event for other components
    const event = new CustomEvent('productsLoaded', {
      detail: {
        page: this.currentPage,
        totalPages: parseInt(this.productGrid.dataset.totalPages),
        hasNextPage: this.hasNextPage
      }
    });
    document.dispatchEvent(event);
  }

  updatePaginationProgress() {
    // Update pagination progress elements
    const totalStartElement = this.querySelector('[data-total-start]');
    const totalEndElement = this.querySelector('[data-total-end]');
    const progressBar = this.querySelector('.pagination-total-item');

    if (totalStartElement && totalEndElement && progressBar) {
      const currentPage = this.currentPage;
      const pageSize = parseInt(this.productGrid.dataset.pageSize) || 24; // Default page size
      const totalItems = parseInt(this.productGrid.dataset.totalItems) || 0;

      // Calculate new values
      const newStart = (currentPage - 1) * pageSize + 1;
      const newEnd = Math.min(currentPage * pageSize, totalItems);

      // Update display
      // totalStartElement.textContent = newStart;
      totalEndElement.textContent = newEnd;

      // Update progress bar
      const progressPercentage = (newEnd / totalItems) * 100;
      progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;

      // Update progress text if exists
      const progressText = this.querySelector('.pagination-total-progress');
      if (progressText) {
        progressText.setAttribute('aria-valuenow', newEnd);
        progressText.setAttribute('aria-valuemax', totalItems);
      }

      progressBar.style.transition = 'width 0.5s ease-in-out';

      // Update progress text with animation
      this.animateProgressUpdate(totalStartElement, totalEndElement, newStart, newEnd);
    }
  }

  animateProgressUpdate(startElement, endElement, newStart, newEnd) {
    if (startElement && endElement) {
      startElement.classList.add('updating');
      endElement.classList.add('updating');

      setTimeout(() => {
        startElement.classList.remove('updating');
        endElement.classList.remove('updating');
      }, 500);
    }
  }

  // Function to get current progress information
  getProgressInfo() {
    const currentPage = this.currentPage;
    const pageSize = parseInt(this.productGrid.dataset.pageSize) || 24;
    const totalItems = parseInt(this.productGrid.dataset.totalItems) || 0;

    return {
      currentPage,
      pageSize,
      totalItems,
      currentStart: (currentPage - 1) * pageSize + 1,
      currentEnd: Math.min(currentPage * pageSize, totalItems),
      progressPercentage: Math.min((Math.min(currentPage * pageSize, totalItems) / totalItems) * 100, 100),
      hasNextPage: this.hasNextPage
    };
  }

}
customElements.define('infinite-scrolling', InfiniteScrolling);

document.addEventListener(
  'toggle',
  (event) => {
    if (event.target instanceof HTMLDialogElement || event.target instanceof HTMLDetailsElement) {
      if (event.target.hasAttribute('scroll-lock')) {
        const { open } = event.target;

        if (open) {
          document.documentElement.setAttribute('scroll-lock', '');
        } else {
          document.documentElement.removeAttribute('scroll-lock');
        }
      }
    }
  },
  { capture: true }
);

// Update cloned product attributes
function updateClonedProductAttributes(product, count) {
  const form = product.querySelector('.shopify-product-form');
  if (!form) return;
  const formId = form.getAttribute('id') || '';
  const newFormId = formId + count;
  form.setAttribute('id', newFormId);

  const radios = product.querySelectorAll('input[type="radio"]');
  radios.forEach(formInput => {

    let formLabel = null;
    if (formInput.id) {
      formLabel = form.querySelector(`label[for="${formInput.id}"]`);
    }
    if (!formLabel && formInput.nextElementSibling && formInput.nextElementSibling.tagName === 'LABEL') {
      formLabel = formInput.nextElementSibling;
    }

    const id = formInput.getAttribute('id') || '';
    const newId = id + count;
    const formInputName = formInput.getAttribute('name') || '';

    if (formLabel) {
      formLabel.setAttribute('for', newId);
    }

    formInput.setAttribute('id', newId);
    formInput.setAttribute('name', formInputName + count);
  });
}

Shopify.removeItem = function(variant_id, index, callback) {
  getCartUpdate(index, 0, callback)
}

Shopify.getCart = function(callback) {
  fetch('/cart.js', { method: 'GET', credentials: 'same-origin' })
  .then(response => response.text())
  .then(data => {
    const cart = JSON.parse(data);
    if ((typeof callback) === 'function') {
        callback(cart);
    } else {
        Shopify.onCartUpdate(cart);
    }
});
}

function getCartUpdate(line, quantity, callback) {
  const body = JSON.stringify({
      line,
      quantity,
      sections_url: window.location.pathname,
  });

  fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
  .then((response) => {
      return response.text();
  })
  .then((state) => {
      const parsedState = JSON.parse(state);

      if (parsedState.errors) {
        showWarning('Error : ' + parsedState.errors, warningTime);
        return;
      }

      if ((typeof callback) === 'function') {
        callback(parsedState);
      } else {
        Shopify.onCartUpdate(parsedState);
      }
  })
  .catch((e) => {
      console.error(e);
  })
}

function updateSidebarCart(cart) {
  // Check if cart is not empty (replace $.isEmptyObject)
  if (cart && Object.keys(cart).length > 0) {
    var cartDropdown = document.querySelector('#halo-cart-sidebar .halo-sidebar-wrapper .previewCart-wrapper');
    var cartLoading = '<div class="loading-overlay loading-overlay--custom">\
            <div class="loading-overlay__spinner">\
                <svg aria-hidden="true" focusable="false" role="presentation" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">\
                    <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>\
                </svg>\
            </div>\
        </div>';
    var loadingClass = 'is-loading';

    if (cartDropdown) {
      cartDropdown.classList.add(loadingClass);
      // Prepend loading overlay
      cartDropdown.insertAdjacentHTML('afterbegin', cartLoading);
    }

    // Fetch the sidebar cart HTML
    fetch(window.routes.root + '/cart?view=ajax_side_cart', { cache: "no-store" })
      .then(function(response) {
        if (!response.ok) throw response;
        return response.text();
      })
      .then(function(data) {
        // Replace cartDropdown HTML with response
        if (cartDropdown) {
          cartDropdown.classList.remove(loadingClass);
          cartDropdown.innerHTML = data;
        }
      })
      .catch(function(error) {
        console.error(error);
      })
      .finally(function() {
        // Update cart count and text
        var body = document.body;
        var cartCountEls = body.querySelectorAll('[data-cart-count]');
        cartCountEls.forEach(function(el) {
          el.textContent = cart.item_count;
        });

        if (cart.item_count >= 100) {
          var bubbleCountEls = body.querySelectorAll('.cart-count-bubble [data-cart-count]');
          bubbleCountEls.forEach(function(el) {
            el.textContent = window.cartStrings.item_99;
          });
        }

        var cartTextEls = body.querySelectorAll('[data-cart-text]');
        cartTextEls.forEach(function(el) {
          if (cart.item_count == 1) {
            el.textContent = window.cartStrings.item;
          } else {
            el.textContent = window.cartStrings.items;
          }
        });

        document.dispatchEvent(new CustomEvent('cart-update', { detail: cart }));

        if (document.body.classList.contains('cursor-fixed__show')) {
          if (window.sharedFunctionsAnimation) {
            if (typeof window.sharedFunctionsAnimation.onEnterButton === 'function') {
              window.sharedFunctionsAnimation.onEnterButton();
            }
            if (typeof window.sharedFunctionsAnimation.onLeaveButton === 'function') {
              window.sharedFunctionsAnimation.onLeaveButton();
            }
          }
        }
      });
  }
}

Shopify.onCartUpdate = function(cart) {
}

class FilterFAQs extends HTMLElement {
  constructor() {
    super();
    this.faqsPopup = document.getElementById('halo-faqs-popup');
    this.filterToggle = this.querySelector('[data-faqs-filter]');
    this.filterDropdown = this.querySelector('.faqs-filterDropdown-menu');
    this.filterDropdownArrow = this.filterToggle?.querySelector('[data-dropdown-arrow]');
    this.hasInitializedDropdown = false;

    this.init();
  }

  init() {
    this.initDropdownItems();

    if (this.filterToggle) {
      this.filterToggle.addEventListener('click', this.onClickFilterHandler.bind(this));
    }

    if (this.filterDropdown.querySelector('.text')) {
      this.filterDropdown.querySelectorAll('.text').forEach((filterButton) => {
        filterButton.addEventListener('click', this.onClickFilterButtonHandler.bind(this));
      });
    }

    if (this.querySelector('.faqs')) {
      this.querySelectorAll('.card-header').forEach((headerButton) => {
        headerButton.addEventListener('click', this.onClickHeaderButtonHandler.bind(this));
      });
    }

    if (!document.body.classList.contains('template-index')) {
      document.body.addEventListener('click', this.onBodyClickEvent.bind(this));
    }
  }

  initDropdownItems() {
    if (this.hasInitializedDropdown) return;

    const existingKeys = [...this.filterDropdown.querySelectorAll("li[data-value]")]
      .map(li => li.getAttribute("data-value"));

    const handles = [...this.querySelectorAll("[data-title-handle]")]
      .map(el => el.getAttribute("data-title-handle"))
      .filter(Boolean);

    if (JSON.stringify(existingKeys) === JSON.stringify(handles)) {
      this.hasInitializedDropdown = true;
      return;
    }

    handles.forEach(handle => {
      if (!existingKeys.includes(handle)) {
        const li = document.createElement("li");
        li.setAttribute("data-value", handle);
        li.setAttribute("tabindex", "-1");
        li.innerHTML = `<span class="text">${handle.replace(/-/g, " ")}</span>`;
        this.filterDropdown.appendChild(li);
      }
    });

    this.hasInitializedDropdown = true;
  }

  onClickFilterHandler() {
    this.filterDropdown.classList.toggle('is-show');
    this.filterDropdownArrow?.classList.toggle('active');
  }

  onClickFilterButtonHandler(event) {
    const btn = event.target.closest('li');
    if (!btn || btn.classList.contains('active')) return;

    const filterValue = btn.getAttribute('data-value');
    const filterText = event.target.innerText;

    this.filterToggle.querySelector('.text').innerText = filterText;

    this.filterDropdown.querySelectorAll('li').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');

    if (filterValue) {
      this.querySelectorAll('.filter-faqs-item').forEach((el) => {
        const id = el.getAttribute('data-title-handle');
        if (id === filterValue) {
          el.classList.remove('hidden');
          el.classList.add('active');
        } else {
          el.classList.remove('active');
          el.classList.add('hidden');
        }
      });
    } else {
      this.querySelectorAll('.filter-faqs-item').forEach((el) => {
        el.classList.remove('hidden', 'active');
      });
    }

    this.filterDropdown.classList.remove('is-show');
    this.filterDropdownArrow?.classList.remove('active');
  }

  onClickHeaderButtonHandler(event) {
    const btn = event.currentTarget;
    const content = btn.nextElementSibling;

    btn.classList.toggle('collapsed');
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }

  onBodyClickEvent(event) {
    if (event.target.closest('[data-faqs-filter]')) return;
    if (this.filterDropdown.classList.contains('is-show')) {
      this.filterDropdown.classList.remove('is-show');
      this.filterDropdownArrow?.classList.remove('active');
    }
  }
}
if (!customElements.get("filter-faqs"))
  customElements.define('filter-faqs', FilterFAQs);

class TextLoaderComponent extends HTMLElement {
  spinner() {
    this.querySelector('.loading__spinner').classList.remove('hidden');
  }

  shimmer() {
    this.setAttribute('shimmer', '');
  }
}
if (!customElements.get('text-loader-component'))
  customElements.define('text-loader-component', TextLoaderComponent);

function resetSpinner(container = document.body) {
  const spinners = container.querySelectorAll('text-loader-component');
  spinners.forEach((item) => {
    const spinner = item.querySelector('.loading__spinner');
    if (spinner) {
      spinner.classList.add('hidden');
    }
  });
}

function resetShimmer(container = document.body) {
  const shimmers = container.querySelectorAll('text-loader-component');
  shimmers.forEach((item) => {
    if (item) {
      item.removeAttribute('shimmer');
    }
  });
}

(function() {
  if (typeof Fancybox === 'undefined') {
    console.error('Fancybox library not loaded');
    return;
  }

  if (!window._fancyboxInitialized) {
    window._fancyboxInitialized = true;

    setTimeout(() => {
      const fancyboxElements = document.querySelectorAll('[data-fancybox]');

      Fancybox.bind('[data-fancybox]', {
        // Gallery options
        loop: true,
        buttons: [
          "zoom",
          "slideShow",
          "fullScreen",
          "thumbs",
          "close"
        ],
        // Animation settings
        animated: true,
        showClass: "fancybox-zoomIn",
        hideClass: "fancybox-zoomOut",
        // Thumbnails
        thumbs: {
          autoStart: false,
          axis: "x"
        },
        // Image options
        Image: {
          zoom: true,
          click: "close",
          wheel: "slide"
        },
        // Video options
        Video: {
          autoplay: false
        },
        // Error handling
        on: {
          done: (fancybox, slide) => {
            console.log('Fancybox opened:', slide.src);
          },
          error: (fancybox, slide) => {
            console.error('Fancybox error:', slide.src, slide.error);
          }
        }
      });
    }, 100);
  }
})();

class SlideshowAnimated extends HTMLElement {
  constructor() {
    super();

    this.image = this.querySelector('[data-image-trans]')
    this.speed = parseFloat(this.dataset.speed) || 0.5;
  }

  connectedCallback() {
    this.initAnimate()
  }

  initAnimate() {
    let n = this.image.offsetHeight - this.offsetHeight;
    let yUp = Math.round(n * this.speed)
    let yDown = Math.round(n * this.speed) * -1
    Motion.scroll(
      Motion.animate(
        this.image,
        { y: [yDown, yUp] },
        { easing: 'linear' },
      ),
      { target: this, offset: ["center start", "end start"] }
    );
  }
}
if (!customElements.get('slideshow-animated'))
  customElements.define('slideshow-animated', SlideshowAnimated);
