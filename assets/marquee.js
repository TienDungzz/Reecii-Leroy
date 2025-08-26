const ANIMATION_OPTIONS = {
  duration: 500,
};

/**
 * A custom element that displays a marquee.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} wrapper - The wrapper element.
 * @property {HTMLElement} content - The content element.
 *
 * @extends Component<Refs>
 */
class MarqueeComponent extends HTMLElement {
  constructor() {
    super();
    this.wrapper = this.querySelector(".marquee__wrapper");
    this.content = this.querySelector(".marquee__content");
  }

  connectedCallback() {
    if (this.content.firstElementChild?.children.length === 0) return;

    this.#addRepeatedItems();
    this.#duplicateContent();
    this.#setSpeed();

    window.addEventListener("resize", this.#handleResize);
    this.addEventListener("pointerenter", this.#slowDown);
    this.addEventListener("pointerleave", this.#speedUp);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.#handleResize);
    this.removeEventListener("pointerenter", this.#slowDown);
    this.removeEventListener("pointerleave", this.#speedUp);
  }

  /**
   * @type {{ cancel: () => void, current: number } | null}
   */
  #animation = null;

  #slowDown = debounce(() => {
    if (this.#animation) return;

    const animation = this.wrapper.getAnimations()[0];

    if (!animation) return;

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, ANIMATION_OPTIONS.duration);

  #speedUp() {
    this.#slowDown.cancel();

    const animation = this.wrapper.getAnimations()[0];

    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
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

  #handleResize = debounce(() => {
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

    for (let i = 0; i < numberOfCopies; i++) {
      const clone = this.wrapper.querySelector('.marquee__repeated-items').cloneNode(true);

      this.content.appendChild(clone);
    }
  }

  #removeRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {

    for (let i = 0; i < numberOfCopies; i++) {
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
if (!customElements.get('marquee-component')) customElements.define("marquee-component", MarqueeComponent);

class MarqueeScroll extends HTMLElement {
  constructor() {
    super();

    this.speed = parseFloat(this.dataset.speed || 1.6), // 100px going to move for
    this.space = 100, // 100px

    Motion.inView(this, this.init.bind(this), { margin: '200px 0px 200px 0px' });
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
    // if (this.childElementCount === 1) {
    //   this.childElement.classList.add('animate');

    //   for (let index = 0; index < this.maximum; index++) {
    //     this.clone = this.childElement.cloneNode(true);
    //     this.clone.setAttribute('aria-hidden', true);
    //     this.appendChild(this.clone);
    //     this.clone.querySelectorAll('.media').forEach((media) => media.classList.remove('loading'));
    //   }

    //   const animationTimeFrame = (this.childElement.clientWidth / this.config.space) * this.config.moveTime;
    //   this.style.setProperty('--duration', `${animationTimeFrame}s`);
    // }

    if (this.parallax) {
      let translate = this.parallax * 100 / (1 + this.parallax);
      if (this.direction === 'right') {
        translate = translate * -1;
      }
      // if (theme.config.rtl) {
      //   translate = translate * -1;
      // }

      Motion.scroll(
        Motion.animate(this, { transform: [`translateX(${translate}%)`, `translateX(0)`] }, { ease: 'linear' }),
        { target: this, offset: ['start end', 'end start'] }
      );
    }
    else {
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
  }
}
if (!customElements.get('marquee-scroll')) customElements.define('marquee-scroll', MarqueeScroll);