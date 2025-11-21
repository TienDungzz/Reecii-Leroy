if (typeof MultilayerImage === 'undefined') {
    class MultilayerImage extends HTMLElement {
        constructor() {
            super();

            const container = this.querySelector('.multilayer-image-carousel');
            if (!container) return;

            const items = container.querySelectorAll(':scope > .group-block');
            if (!items.length) return;

            const gap = parseFloat(container.getAttribute('data-gap')) || 0;
            const widthActivePercent = parseFloat(container.getAttribute('data-width-active')) || 60;

            // Detect mobile
            const isMobile = window.innerWidth <= 768;

            /** ---------------------------------------------
             *  DEFAULT: APPLY WIDTHS
             * --------------------------------------------- */
            this.applyWidths = (items) => {
                // Nếu mobile → reset toàn bộ width và return
                if (isMobile) {
                    items.forEach(el => {
                        el.style.setProperty('--size-style-width', '100%');
                        el.style.setProperty('--size-style-width-tablet', '100%');
                    });
                    container.style.removeProperty('--item-height'); 
                    return;
                }

                const count = items.length;
                const containerWidth = container.getBoundingClientRect().width;

                const totalGap = gap * (count - 1);
                const usableWidth = containerWidth - totalGap;

                const originPx = usableWidth / count;
                const activePx = usableWidth * (widthActivePercent / 100);

                const scaleActive = ((activePx / originPx) * 100) + 100;

                items.forEach(el => {
                    if (el.classList.contains('group-active')) {
                        el.style.setProperty('--size-style-width', scaleActive + '%');
                        el.style.setProperty('--size-style-width-tablet', scaleActive + '%');
                    } else {
                        el.style.setProperty('--size-style-width', '100%');
                        el.style.setProperty('--size-style-width-tablet', '100%');
                    }
                });
            };

            const firstItem = items[0];

            /** ---------------------------------------------
             *  OBSERVER — BỎ HẲN TRÊN MOBILE
             * --------------------------------------------- */
            let observer = null;

            if (!isMobile) {
                observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('group-active');
                            this.applyWidths(items);

                            setTimeout(() => {
                                const firstHeight = firstItem.getBoundingClientRect().height;
                                container.style.setProperty('--item-height', firstHeight + 'px');
                            }, 1000);

                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '-100px 0px'
                });

                observer.observe(firstItem);
            } else {
                // MOBILE → reset widths ngay khi load
                this.applyWidths(items);
            }

            /** ---------------------------------------------
             *  HOVER LOGIC — LOẠI BỎ TRÊN MOBILE
             * --------------------------------------------- */
            if (!isMobile) {
                items.forEach(item => {
                    item.addEventListener('mouseenter', () => {
                        if (!item.classList.contains('group-active')) {
                            container.querySelector('.group-block.group-active')?.classList.remove('group-active');
                            item.classList.add('group-active');
                            this.applyWidths(items);
                        }
                    });
                });
            }
        }
    }

    customElements.define('multilayer-image', MultilayerImage);
}
