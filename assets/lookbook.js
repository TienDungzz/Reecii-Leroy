var check_JS_load = true;

function loadFunction() {
    if (check_JS_load) {
        check_JS_load = false;

        handleViewLookbook();
        renderDotsNumber();
        handleLookBookAllItemsLayout();
    }
}

function eventLoad() {
    ['keydown', 'mousemove', 'touchstart'].forEach((event) => {
        document.addEventListener(event, () => {
            loadFunction();
        });
    });
}
eventLoad();

function handleViewLookbook() {
    const lookbookPopup = document.querySelector('.lookbook-section-list.style-popup');
    const lookbookOnImage = document.querySelector('.lookbook-section-list.style-on-image');
    if(lookbookPopup) lookbookViewPopup();
    if(lookbookOnImage) lookbookViewOnImage();
}

function lookbookViewPopup() {
    const lookbookPopup = `
        <div class="lookbook-popup">
            <div class="lookbook-popup-title">
                <h5 class="title w-full">All products</h5>
                <a href="#" class="close lookbook-close">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </div>
            <div class="lookbook-popup-content"></div>
            </div>
        </div>
    `;

    if (!document.querySelector('.lookbook-popup')) {
        document.body.insertAdjacentHTML('beforeend', lookbookPopup);
    }

    const bodyEl = document.body;
    const popupEl = document.querySelector('.lookbook-popup');
    const popupContentEl = popupEl.querySelector('.lookbook-popup-content');
    const popupCloseEl = popupEl.querySelector('.close');
    let popupSwiper = null;

    function destroyPopupSwiper() {
        if (popupSwiper && typeof popupSwiper.destroy === 'function') {
            try {
                popupSwiper.destroy(true, true);
            } catch (_) {}
        }
        popupSwiper = null;
    }

    function resetPopupColumnClasses() {
		popupEl.classList.forEach((cls) => {
			if (
				cls.startsWith('column-') ||
				cls.startsWith('md-column-') ||
				cls.startsWith('sm-column-')
			) {
				popupEl.classList.remove(cls);
			}
		});
	}

    function initPopupSwiper(container) {
        if (typeof window.Swiper === 'undefined') return;

        const swiperEl = container.querySelector('.swiper');
        if (!swiperEl) return;

        const slideCount = swiperEl.querySelectorAll('.swiper-slide').length;

        const desktopView = Math.min(slideCount, 4);
        const tabletView = Math.min(slideCount, Math.max(2, desktopView - 1));
        const mobileView = Math.min(slideCount, Math.max(1.3, desktopView - 2));

        resetPopupColumnClasses();

        popupEl.classList.add(
			`column-${desktopView}`,
			`md-column-${tabletView}`,
			`sm-column-${mobileView}`
		);

        popupSwiper = new window.Swiper(swiperEl, {
            slidesPerView: desktopView,
            spaceBetween: 12,
            pagination: {
                el: container.querySelector('.swiper-pagination'),
                clickable: true,
            },
            navigation: {
                nextEl: container.querySelector('.swiper-button-next'),
                prevEl: container.querySelector('.swiper-button-prev'),
            },
            breakpoints: {
                0: { slidesPerView: mobileView },
                640: { slidesPerView: tabletView },
                1024: { slidesPerView: desktopView },
            },
        });
    }

    function buildSlidesFromItem(itemEl) {
        const cards = itemEl ? itemEl.querySelectorAll('.product-card-lookbook') : [];
        const wrapper = document.createElement('div');
        wrapper.className = 'swiper-container-for-popup';
        wrapper.innerHTML = `
            <div class="swiper">
                <div class="swiper-wrapper"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        `;
        const swiperWrapper = wrapper.querySelector('.swiper-wrapper');
        cards.forEach((card) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.appendChild(card.cloneNode(true));
            swiperWrapper.appendChild(slide);
        });
        return wrapper;
    }

    function openPopupFromButton(btn) {
        const gridItem = btn.closest('li.grid__item');
        if (!gridItem) return;
        bodyEl.classList.add('openLookbookPopup');
        btn.closest('.lookBook__btnShowProducts').classList.add('is-open');
        destroyPopupSwiper();
        popupContentEl.innerHTML = '';
        const slidesContainer = buildSlidesFromItem(gridItem);
        popupContentEl.appendChild(slidesContainer);
        initPopupSwiper(slidesContainer);
    }

    // Handle lookbook popup from button
    document.addEventListener('click', function (e) {
        const clickedButton = e.target.closest('.lookBook__btnShowProducts');
        const allButtons = document.querySelectorAll('.lookBook__btnShowProducts');

        if (!clickedButton && !e.target.closest('.lookbook-popup')) {
            allButtons.forEach((btn) => {
                btn.classList.remove('is-open');
                btn.querySelector('.show_products')?.classList.remove('hidden');
                btn.querySelector('.hide_products')?.classList.add('hidden');
            });
            bodyEl.classList.remove('openLookbookPopup');
            destroyPopupSwiper();
            popupContentEl.innerHTML = '';
            resetPopupColumnClasses();
            return;
        }

        if (clickedButton) {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = clickedButton.classList.contains('is-open');
            const showText = clickedButton.querySelector('.show_products');
            const hideText = clickedButton.querySelector('.hide_products');

            resetPopupColumnClasses();

            allButtons.forEach((btn) => {
                if (btn !== clickedButton) {
                    btn.classList.remove('is-open');
                    btn.querySelector('.show_products')?.classList.remove('hidden');
                    btn.querySelector('.hide_products')?.classList.add('hidden');
                }
            });

            if (isOpen) {
                clickedButton.classList.remove('is-open');
                bodyEl.classList.remove('openLookbookPopup');
                showText.classList.remove('hidden');
                hideText.classList.add('hidden');
                destroyPopupSwiper();
                popupContentEl.innerHTML = '';
                resetPopupColumnClasses();
            } else {
                clickedButton.classList.add('is-open');
                bodyEl.classList.add('openLookbookPopup');
                showText.classList.add('hidden');
                hideText.classList.remove('hidden');
                openPopupFromButton(clickedButton);
            }
        }
    });

    // Close popup
    popupCloseEl.addEventListener('click', function (e) {
        e.preventDefault();
        const allButtons = document.querySelectorAll('.lookBook__btnShowProducts');
        bodyEl.classList.remove('openLookbookPopup');
        allButtons.forEach((btn) => {
            btn.classList.remove('is-open');
            btn.querySelector('.show_products')?.classList.remove('hidden');
            btn.querySelector('.hide_products')?.classList.add('hidden');
        });
        destroyPopupSwiper();
        popupContentEl.innerHTML = '';
        resetPopupColumnClasses();
    });
}

function lookbookViewOnImage() {
    const popupTemplate = `
        <div class="lookBook__imgPopup">
            <a href="#" class="close lookbook-close">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </a>
            <div class="lookBook__imgPopup-wrapper"></div>
        </div>
    `;

    const lookBookItems = document.querySelectorAll('.lookbook-section-list.style-on-image .lookbook-item');

    lookBookItems.forEach((item) => {
        if (!item.querySelector('.lookBook__imgPopup')) {
            item.insertAdjacentHTML('beforeend', popupTemplate);
        }

        const button = item.querySelector('.lookBook__btnShowProducts');
        const showText = button?.querySelector('.show_products');
        const hideText = button?.querySelector('.hide_products');
        const popupEl = item.querySelector('.lookBook__imgPopup');
        const wrapper = popupEl.querySelector('.lookBook__imgPopup-wrapper');
        const closeBtn = popupEl.querySelector('.close');

        function getCards() {
            return Array.from(item.querySelectorAll('.product-card-lookbook'))
                .filter((el) => !el.closest('.lookBook__imgPopup'))
                .map((el) => el.cloneNode(true));
        }

        button?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = button.classList.contains('is-open');

            if (isOpen) {
                button.classList.remove('is-open');
                showText.classList.remove('hidden');
                hideText.classList.add('hidden');
                popupEl.classList.remove('is-open');
                wrapper.innerHTML = '';
            } else {
                button.classList.add('is-open');
                showText.classList.add('hidden');
                hideText.classList.remove('hidden');
                wrapper.innerHTML = '';
                getCards().forEach((card) => wrapper.appendChild(card));
                popupEl.classList.add('is-open');
            }
        });

        closeBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            popupEl.classList.remove('is-open');
            button.classList.remove('is-open');
            showText.classList.remove('hidden');
            hideText.classList.add('hidden');
            wrapper.innerHTML = '';
        });
    });
}

function renderDotsNumber() {
    const dotNumberSections = document.querySelectorAll('.dots-style-number');

    if (!dotNumberSections) return;

    dotNumberSections.forEach(function(section){
        const dots = section.querySelectorAll('.lookbook-dot');

        for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
            const number = dot.querySelector('.lookbook-dot__icon');
            dot.classList.add('dot-number');

            if (number) {
                number.innerHTML = i + 1;
            }
        }
    });
}

function handleLookBookAllItemsLayout() {
    const lookbookAllItemsLayout = document.querySelectorAll('.lookbook-section-list.lookbook-all-items-layout');

    if (!lookbookAllItemsLayout) return;

    lookbookAllItemsLayout.forEach(function(item){
        const dots = item.querySelectorAll('lookbook-dot .lookbook-dot__content');
        const showProductsBtn = item.querySelector('.lookBook__btnShowProducts');

        if (showProductsBtn) {
            showProductsBtn.remove();
        }

        dots.forEach(function(content){
            content.classList.add('hidden');
        });

        // Click a dot -> read its product title -> scroll matching slide in the all-items swiper
        const dotElements = item.querySelectorAll('lookbook-dot');
        const allItemsSwiper = item.querySelector('.swiper');

        dotElements.forEach(function(dot){
            dot.addEventListener('click', function(e) {

                const titleEl = dot.querySelector('.product-title');
                const productName = titleEl ? (titleEl.textContent || '').trim().toLowerCase() : '';

                if (!allItemsSwiper) return;
                e.preventDefault();
                e.stopPropagation();

                const swiperInstance = allItemsSwiper.swiper;

                // Find slide index by matching product title text
                const slides = Array.from(allItemsSwiper.querySelectorAll('.swiper-slide'));
                let targetIndex = -1;
                if (productName) {
                    for (let i = 0; i < slides.length; i++) {
                        const slideTitleEl = slides[i].querySelector('.product-title');
                        const slideTitle = (slideTitleEl && slideTitleEl.textContent) ? slideTitleEl.textContent.trim().toLowerCase() : '';
                        if (slideTitle && slideTitle === productName) {
                            targetIndex = i;
                            break;
                        }
                    }
                }

                // Fallback: if no name match (or no name), slide to same index as the clicked dot
                if (targetIndex < 0) {
                    const dotIndex = Array.from(dotElements).indexOf(dot);
                    if (dotIndex >= 0 && dotIndex < slides.length) {
                        targetIndex = dotIndex;
                    }
                }

                if (targetIndex >= 0) {
                    console.log(targetIndex);

                    try {
                        swiperInstance.slideTo(targetIndex, 600);
                    } catch (_) {}
                }
            });
        });
    });
}