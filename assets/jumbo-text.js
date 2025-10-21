/**
 * A custom element that automatically sizes text to fit its container width.
 * Only activates on user interaction and when element is in viewport.
 */
class JumboText extends HTMLElement {
  static #userHasInteracted = false;
  static #interactionEvents = ['click', 'scroll', 'touchstart', 'touchend', 'keydown', 'mousemove'];
  static #initialized = false;

  #isInitialized = false;

  constructor() {
    super();
    this.#setupInteractionListener();
  }

  connectedCallback() {
    // Only proceed if user has interacted and element is in viewport
    if (!JumboText.#userHasInteracted) {
      this.#setupIntersectionObserver();
      return;
    }

    this.initialize();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  /**
   * Setup global interaction listener (only once)
   */
  #setupInteractionListener() {
    if (JumboText.#initialized) return;
    JumboText.#initialized = true;

    const handleInteraction = () => {
      JumboText.#userHasInteracted = true;
      // Initialize all jumbo-text elements that are in viewport
      document.querySelectorAll('jumbo-text').forEach(element => {
        if (element.isInViewport()) {
          element.initialize();
        }
      });
      // Remove listeners after first interaction
      JumboText.#interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction, { passive: true });
      });
    };

    JumboText.#interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });
  }

  /**
   * Setup intersection observer for lazy loading
   */
  #setupIntersectionObserver() {
    if (this.intersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.initialize();
            this.intersectionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    this.intersectionObserver.observe(this);
  }

  /**
   * Check if element is in viewport
   */
  isInViewport() {
    const rect = this.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Initialize the jumbo text functionality
   */
  initialize() {
    if (this.#isInitialized) return;
    this.#isInitialized = true;

    // Initial calculation
    requestAnimationFrame(this.#handleResize);
    
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.#setTextEffectObserver();
    }
  }

  /**
   * Cleanup resources
   */
  #cleanup() {
    this.#resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.textEffectObserver?.disconnect();
  }

  /**
   * Sets the intersection observer for text effects (animations)
   */
  #setTextEffectObserver() {
    if (this.textEffectObserver) return;

    this.textEffectObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.add('jumbo-text-visible');
            if (this.dataset.animationRepeat === 'false') {
              this.textEffectObserver.unobserve(entry.target);
            }
          } else {
            this.classList.remove('jumbo-text-visible');
          }
        });
      },
      { threshold: 0.3 }
    );

    this.textEffectObserver.observe(this);
  }

  /**
   * Calculates the optimal font size to make the text fit the container width
   */
  #calculateOptimalFontSize = () => {
    // Check for empty text
    if (!this.textContent?.trim()) {
      return;
    }

    // Only calculate if element is in viewport and user has interacted
    if (!JumboText.#userHasInteracted || !this.isInViewport()) {
      return;
    }

    // Hide text during calculation
    this.classList.remove('ready');

    if (this.offsetWidth <= 0) return;

    // Disconnect the resize observer
    this.#resizeObserver?.disconnect();

    // Start with a minimal font size
    this.style.fontSize = '1px';

    // Find the optimal font size
    const fontSize = findOptimalFontSize(this, this.offsetWidth);

    // Apply the final size
    this.style.fontSize = `${fontSize}px`;

    // Reconnect the resize observer
    this.#resizeObserver?.observe(this);

    // Show the text
    this.classList.add('ready');
  };

  #handleResize = () => {
    // Only handle resize if user has interacted and element is in viewport
    if (!JumboText.#userHasInteracted || !this.isInViewport()) {
      return;
    }

    this.#calculateOptimalFontSize();

    // Calculate distance from bottom of page, when the jumb text is close to the bottom of the page then force it
    // to use `cap text` instead of `cap alphabetic` to not cause any extra padding below the bottom of the page.
    const rect = this.getBoundingClientRect();
    const bottom = rect.bottom + window.scrollY;
    const distanceFromBottom = document.documentElement.offsetHeight - bottom;
    this.dataset.capText = (distanceFromBottom <= 100).toString();
  };

  #resizeObserver = new ResizeNotifier(this.#handleResize);
}

/**
 * A custom ResizeObserver that only calls the callback when the element is resized.
 * By default the ResizeObserver callback is called when the element is first observed.
 * Enhanced with throttling for better performance.
 */
class ResizeNotifier extends ResizeObserver {
  #initialized = false;
  #throttleTimeout = null;
  #callback = null;

  /**
   * @param {ResizeObserverCallback} callback
   */
  constructor(callback) {
    super((entries) => {
      if (!this.#initialized) {
        this.#initialized = true;
        return;
      }
      
      // Throttle resize events for better performance
      if (this.#throttleTimeout) {
        clearTimeout(this.#throttleTimeout);
      }
      
      this.#throttleTimeout = setTimeout(() => {
        callback(entries, this);
      }, 16); // ~60fps
    });
    
    this.#callback = callback;
  }

  disconnect() {
    this.#initialized = false;
    if (this.#throttleTimeout) {
      clearTimeout(this.#throttleTimeout);
      this.#throttleTimeout = null;
    }
    super.disconnect();
  }
}

/**
 * Checks if text with the given font size overflows the container
 * @param {HTMLElement} element - The element to check
 * @param {number} containerWidth - The width of the container
 * @param {number} size - Font size to check
 * @returns {boolean} - True if text overflows
 */
function checkTextOverflow(element, containerWidth, size) {
  element.style.fontSize = `${size}px`;
  return element.scrollWidth > containerWidth;
}

/**
 * Find optimal font size using binary search with performance optimizations
 * @param {HTMLElement} element - The text element
 * @param {number} containerWidth - Available width
 * @returns {number} - The optimal font size
 */
function findOptimalFontSize(element, containerWidth) {
  // Early return for very small containers
  if (containerWidth < 50) return 8;
  
  // Binary search parameters
  let minSize = 1;
  let maxSize = Math.min(500, containerWidth * 0.8); // Limit max size based on container
  const precision = 0.5;

  // Initial guess based on container width and text length
  const textLength = element.textContent?.length || 0;
  let fontSize = Math.min(maxSize, Math.sqrt(containerWidth) * (15 / Math.sqrt(Math.max(1, textLength))));

  // Adjust initial bounds based on first check
  if (checkTextOverflow(element, containerWidth, fontSize)) {
    maxSize = fontSize;
  } else {
    minSize = fontSize;
  }

  // Binary search implementation with reduced iterations for performance
  let iterations = 0;
  const MAX_ITERATIONS = 20; // Reduced from 30

  while (maxSize - minSize > precision && iterations < MAX_ITERATIONS) {
    fontSize = (minSize + maxSize) / 2;

    if (checkTextOverflow(element, containerWidth, fontSize)) {
      maxSize = fontSize;
    } else {
      minSize = fontSize;
    }

    iterations++;
  }

  // Add a small safety margin
  return Math.max(8, minSize * 0.99); // Ensure minimum readable size
}
if (!customElements.get('jumbo-text')) customElements.define('jumbo-text', JumboText);