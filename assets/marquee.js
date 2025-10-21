class MarqueeComponent extends HTMLElement {
  constructor() {
    super();
    this.wrapper = this.querySelector(".marquee__wrapper");
    this.content = this.querySelector(".marquee__content");
    this.isDesktop = window.matchMedia('(min-width: 1025px)').matches;
  }

  connectedCallback() {
    if (this.content.firstElementChild?.children.length === 0) return;

    theme.onFirstInteraction(() => {
      this.#addRepeatedItems();
      this.#duplicateContent();
      this.#setSpeed();

      if (this.isDesktop) {
        window.addEventListener("resize", this.#handleResize);
        this.addEventListener("pointerenter", this.#slowDown);
        this.addEventListener("pointerleave", this.#speedUp);
      }
    }, { timeout: 3000 });
  }

  disconnectedCallback() {
    if (this.isDesktop) {
      window.removeEventListener("resize", this.#handleResize);
      this.removeEventListener("pointerenter", this.#slowDown);
      this.removeEventListener("pointerleave", this.#speedUp);
    }
  }

  /**
   * @type {{ cancel: () => void, current: number } | null}
   */
  #animation = null;
  #duration = 500;

  #slowDown = theme.utils.debounce(() => {
    if (this.#animation) return;

    const animation = this.wrapper.getAnimations()[0];

    if (!animation) return;

    this.#animation = animateValue({
      duration: this.#duration,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, this.#duration);

  #speedUp() {
    this.#slowDown.cancel();

    const animation = this.wrapper.getAnimations()[0];

    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      duration: this.#duration,
      from,
      to: 1,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }

  get clonedContent() {
    const lastChild = this.wrapper.lastElementChild;

    return this.content !== lastChild ? lastChild : null;
  }

  #setSpeed(value = this.#calculateSpeed()) {
    this.style.setProperty("--marquee-speed", `${value}s`);
  }

  #calculateSpeed() {
    const speedFactor = Number(this.getAttribute("data-speed-factor"));
    const marqueeWidth = this.offsetWidth;
    const speed = Math.ceil(marqueeWidth / speedFactor / 2);
    return speed;
  }

  #handleResize = theme.utils.debounce(() => {
    const newNumberOfCopies = this.#calculateNumberOfCopies();
    const currentNumberOfCopies = this.content.children.length;

    if (newNumberOfCopies > currentNumberOfCopies) {
      this.#addRepeatedItems(newNumberOfCopies - currentNumberOfCopies);
    } else if (newNumberOfCopies < currentNumberOfCopies) {
      this.#removeRepeatedItems(currentNumberOfCopies - newNumberOfCopies);
    }

    this.#duplicateContent();
    this.#setSpeed();
    this.#restartAnimation();
  }, 250);

  #restartAnimation() {
    const animations = this.wrapper.getAnimations();

    requestAnimationFrame(() => {
      for (const animation of animations) {
        animation.currentTime = 0;
      }
    });
  }

  #duplicateContent() {

    this.clonedContent?.remove();

    const clone = /** @type {HTMLElement} */ (
      this.content.cloneNode(true)
    );

    clone.setAttribute("aria-hidden", "true");

    this.wrapper.appendChild(clone);
  }

  #addRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {
    if (!this.wrapper) return;

    for (let i = 0; i < numberOfCopies - 1; i++) {
      const clone = this.wrapper.querySelector('.marquee__repeated-items').cloneNode(true);

      this.content.appendChild(clone);
    }
  }

  #removeRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {

    for (let i = 0; i < numberOfCopies - 1; i++) {
      this.content.lastElementChild?.remove();
    }
  }

  #calculateNumberOfCopies() {
    const marqueeWidth = this.offsetWidth;
    const marqueeRepeatedItemWidth =
      this.content.firstElementChild instanceof HTMLElement
        ? this.content.firstElementChild.offsetWidth
        : 1;

    return marqueeRepeatedItemWidth === 0
      ? 1
      : Math.ceil(marqueeWidth / marqueeRepeatedItemWidth);
  }
}
if (!customElements.get('marquee-component')) customElements.define('marquee-component', MarqueeComponent);

class MarqueeScroll extends HTMLElement {
  constructor() {
    super();

    this.speed = parseFloat(this.dataset.speed || 1.6), // 100px going to move for
    this.space = 100, // 100px
    this.isDesktop = window.matchMedia('(min-width: 1025px)').matches;

    if (this.isDesktop) {
      Motion.inView(this, this.init.bind(this), { margin: '200px 0px 200px 0px' });
    }
  }

  connectedCallback() {
    if (this.isDesktop) {
      theme.onFirstInteraction(() => this.#toggleHoverEvents(true), { timeout: 3000 });
    }
  }

  disconnectedCallback() {
    if (this.isDesktop) {
      this.#toggleHoverEvents(false);
    }
  }

  get childElement() {
    return this.firstElementChild;
  }

  get maximum() {
    return parseInt(this.dataset.maximum || 10);
  }

  get direction() {
    return this.dataset.direction || 'left';
  }

  get parallax() {
    return this.dataset.parallax ? parseFloat(this.dataset.parallax) : false;
  }

  init() {
    if (this.parallax && this.isDesktop) {
      let translate = this.parallax * 100 / (1 + this.parallax);
      if (this.direction === 'right') {
        translate = translate * -1;
      }

      Motion.scroll(
        Motion.animate(this, { transform: [`translateX(${translate}%)`, `translateX(0px)`] }, { ease: 'linear' }),
        { target: this, offset: ['start end', 'end start'] }
      );
      return;
    }

    // pause when out of view
    const observer = new IntersectionObserver((entries, _observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.classList.remove('paused');
        }
        else {
          this.classList.add('paused');
        }
      });
    }, { rootMargin: '0px 0px 50px 0px' });
    observer.observe(this);
  }

  #toggleHoverEvents(enable) {
    const action = enable ? 'addEventListener' : 'removeEventListener';
    this[action]("pointerenter", this.#slowDown);
    this[action]("pointerleave", this.#speedUp);
  }

  // --- Hover slowdown effect ---
  #animation = null;
  #duration = 500;

  #slowDown = theme.utils.debounce(() => {
    if (this.#animation) return;

    // get the active marquee/parallax animation
    const animation = this.querySelector('.marquee__content').getAnimations()[0];

    if (!animation) return;

    this.#animation = animateValue({
      duration: this.#duration,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, this.#duration);

  #speedUp() {
    this.#slowDown.cancel();

    const animation = this.querySelector('.marquee__content').getAnimations()[0];

    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      duration: this.#duration,
      from,
      to: 1,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }
}
if (!customElements.get('marquee-scroll')) customElements.define('marquee-scroll', MarqueeScroll);

// Define the animateValue function
/**
 * Animate a numeric property smoothly.
 * @param {Object} params - The parameters for the animation.
 * @param {number} params.from - The starting value.
 * @param {number} params.to - The ending value.
 * @param {number} params.duration - The duration of the animation in milliseconds.
 * @param {function(number): void} params.onUpdate - The function to call on each update.
 * @param {function(number): number} [params.easing] - The easing function.
 * @param {function(): void} [params.onComplete] - The function to call when the animation completes.
 */
function animateValue({
  from,
  to,
  duration,
  onUpdate,
  easing = (t) => t * t * (3 - 2 * t),
  onComplete,
}) {
  const startTime = performance.now();
  let cancelled = false;
  let currentValue = from;

  /**
   * @param {number} currentTime - The current time in milliseconds.
   */
  function animate(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    currentValue = from + (to - from) * easedProgress;

    onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (typeof onComplete === "function") {
      onComplete();
    }
  }

  requestAnimationFrame(animate);

  return {
    get current() {
      return currentValue;
    },
    cancel() {
      cancelled = true;
    },
  };
}