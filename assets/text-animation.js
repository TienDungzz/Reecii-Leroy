/**
 * A custom element that automatically sizes text to fit its container width.
 */
class TextAnimation extends HTMLElement {
  connectedCallback() {
    // Initial calculation
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.#setIntersectionObserver();
    }
  }

  disconnectedCallback() {
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.intersectionObserver?.disconnect();
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
            this.classList.add('text-animation-visible');
            if (this.dataset.animationRepeat === 'false') {
              this.intersectionObserver.unobserve(entry.target);
            }
          } else {
            this.classList.remove('text-animation-visible');
          }
        });
      },
      { threshold: 0.3 }
    );

    this.intersectionObserver.observe(this);
  }
}

// Register once
if (!customElements.get('text-animation')) {
  customElements.define('text-animation', TextAnimation);
}