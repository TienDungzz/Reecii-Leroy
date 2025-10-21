/**
 * A custom element that automatically sizes text to fit its container width.
 */
class JumboText extends HTMLElement {
  #debounceTimer = null;
  #cachedFontSize = null;
  #cachedContainerWidth = null;
  #cachedTextContent = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.#resizeObserver = new ResizeNotifier(this.#handleResize);
    
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.#setIntersectionObserver();
    } else {
      this.#checkInitialVisibility();
    }
  }

  disconnectedCallback() {
    // Clear debounce timer
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }
    
    this.#resizeObserver.disconnect();
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.intersectionObserver?.disconnect();
    }
  }

  #checkInitialVisibility() {
    const rect = this.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isVisible) {
      requestAnimationFrame(() => {
        this.#calculateOptimalFontSize();
      });
    } else {
      this.#setIntersectionObserver();
    }
  }

  /**
   * Sets the intersection observer to calculate the optimal font size when the text is in view
   */
  #setIntersectionObserver() {
    // The threshold could be different based on the repetition of the animation.
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.add('jumbo-text-visible');
            // Chạy calculation khi element vào viewport
            requestAnimationFrame(() => {
              this.#calculateOptimalFontSize();
            });
            if (this.dataset.animationRepeat === 'false') {
              this.intersectionObserver.unobserve(entry.target);
            }
          } else {
            this.classList.remove('jumbo-text-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    this.intersectionObserver.observe(this);
  }

  /**
   * Calculates the optimal font size to make the text fit the container width
   */
  #calculateOptimalFontSize = () => {
    // Check for empty text
    if (!this.textContent?.trim()) {
      return;
    }

    const currentText = this.textContent.trim();
    const currentWidth = this.offsetWidth;

    // Check cache - nếu text và width không đổi, sử dụng cached result
    if (this.#cachedFontSize && 
        this.#cachedTextContent === currentText && 
        this.#cachedContainerWidth === currentWidth) {
      this.style.fontSize = `${this.#cachedFontSize}px`;
      this.classList.add('ready');
      return;
    }

    // Hide text during calculation
    this.classList.remove('ready');

    if (currentWidth <= 0) return;

    // Tối ưu hóa: Sử dụng will-change để tối ưu rendering
    this.style.willChange = 'font-size';

    // Disconnect the resize observer
    this.#resizeObserver.disconnect();

    // Start with a minimal font size
    this.style.fontSize = '1px';

    // Find the optimal font size
    const fontSize = findOptimalFontSize(this, currentWidth);

    // Cache the result
    this.#cachedFontSize = fontSize;
    this.#cachedContainerWidth = currentWidth;
    this.#cachedTextContent = currentText;

    // Apply the final size
    this.style.fontSize = `${fontSize}px`;

    // Reconnect the resize observer
    this.#resizeObserver.observe(this);

    // Show the text
    this.classList.add('ready');

    // Tối ưu hóa: Remove will-change sau khi hoàn thành
    requestAnimationFrame(() => {
      this.style.willChange = 'auto';
    });
  };

  #handleResize = () => {
    // Debounce để tránh quá nhiều lần gọi calculation
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }

    this.#debounceTimer = setTimeout(() => {
      if (this.#isElementVisible()) {
        this.#calculateOptimalFontSize();

        const rect = this.getBoundingClientRect();
        const bottom = rect.bottom + window.scrollY;
        const distanceFromBottom = document.documentElement.offsetHeight - bottom;
        this.dataset.capText = (distanceFromBottom <= 100).toString();
      }
    }, 16); // ~60fps
  };

  #isElementVisible() {
    const rect = this.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  #resizeObserver = new ResizeNotifier(this.#handleResize);
}

class ResizeNotifier extends ResizeObserver {
  #initialized = false;
  #lastSize = { width: 0, height: 0 };

  /**
   * @param {ResizeObserverCallback} callback
   */
  constructor(callback) {
    super((entries) => {
      if (!this.#initialized) {
        this.#initialized = true;
        // Lưu kích thước ban đầu
        const entry = entries[0];
        if (entry) {
          this.#lastSize = {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          };
        }
        return;
      }

      // Chỉ gọi callback nếu kích thước thực sự thay đổi
      const entry = entries[0];
      if (entry) {
        const currentSize = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        };

        if (currentSize.width !== this.#lastSize.width || currentSize.height !== this.#lastSize.height) {
          this.#lastSize = currentSize;
          callback(entries, this);
        }
      }
    });
  }

  disconnect() {
    this.#initialized = false;
    this.#lastSize = { width: 0, height: 0 };
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
  // Tối ưu hóa: Sử dụng transform thay vì fontSize để tránh reflow
  const originalFontSize = element.style.fontSize;
  element.style.fontSize = `${size}px`;
  const overflows = element.scrollWidth > containerWidth;
  element.style.fontSize = originalFontSize;
  return overflows;
}

/**
 * Find optimal font size using binary search
 * @param {HTMLElement} element - The text element
 * @param {number} containerWidth - Available width
 * @returns {number} - The optimal font size
 */
function findOptimalFontSize(element, containerWidth) {
  // Tối ưu hóa: Sử dụng heuristic tốt hơn cho initial guess
  const textLength = element.textContent?.length || 0;
  const avgCharWidth = containerWidth / Math.max(1, textLength);
  
  // Binary search parameters với bounds thông minh hơn
  let minSize = Math.max(1, avgCharWidth * 0.3);
  let maxSize = Math.min(500, avgCharWidth * 3);
  const precision = 0.1; // Tăng precision để kết quả chính xác hơn

  // Initial guess dựa trên heuristic cải tiến
  let fontSize = Math.min(maxSize, avgCharWidth * 1.2);

  // Kiểm tra bounds và điều chỉnh nếu cần
  if (checkTextOverflow(element, containerWidth, fontSize)) {
    maxSize = fontSize;
    fontSize = (minSize + maxSize) / 2;
  } else {
    minSize = fontSize;
  }

  // Binary search implementation với early exit
  let iterations = 0;
  const MAX_ITERATIONS = 20; // Giảm iterations vì đã có heuristic tốt

  while (maxSize - minSize > precision && iterations < MAX_ITERATIONS) {
    fontSize = (minSize + maxSize) / 2;

    if (checkTextOverflow(element, containerWidth, fontSize)) {
      maxSize = fontSize;
    } else {
      minSize = fontSize;
    }

    iterations++;
  }

  // Trả về kết quả với safety margin nhỏ hơn để tối ưu space
  return Math.max(1, minSize * 0.995);
}
if (!customElements.get('jumbo-text')) customElements.define('jumbo-text', JumboText);