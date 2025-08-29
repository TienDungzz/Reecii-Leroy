var check_JS_load = true;

function loadFunction() {
    if (check_JS_load) {
        check_JS_load = false;

        handleViewLookbook();
        renderDotsNumber();
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
    if(lookbookPopup) {
        lookbookViewPopup();
    }

    if(lookbookOnImage) {
        lookbookViewOnImage();
    }
}

function lookbookViewPopup() {
    const lookbookPopup = `
        <div class="lookbook-popup">
            <div class="lookbook-popup-wrapper">
                <div class="lookbook-popup-title">
                    <h5 class="title w-full">Room Ideas</h5>
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

    function initPopupSwiper(container) {
        if (typeof window.Swiper === 'undefined') return;
        const swiperEl = container.querySelector('.swiper');
        if (!swiperEl) return;
        popupSwiper = new window.Swiper(swiperEl, {
            slidesPerView: 4,
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
                0: { slidesPerView: 2 },
                640: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
            },
        });
    }

    function buildSlidesFromItem(itemEl) {
        const cards = itemEl
            ? itemEl.querySelectorAll('.product-card-lookbook')
            : [];
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

    // Delegate click from dynamically rendered buttons inside lookbook dots
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.lookBook__btnShowProducts a');
        const hideProducts = e.target.closest(
            '.lookBook__btnShowProducts .hide_products'
        );

        if (btn) {
            e.preventDefault();
            e.stopPropagation();

            openPopupFromButton(btn);
        }

        if (hideProducts) {
            e.preventDefault();
            e.stopPropagation();

            closePopupFromButton();
        }
    });

    // Close popup
    popupCloseEl.addEventListener('click', function (e) {
        e.preventDefault();
        bodyEl.classList.remove('openLookbookPopup');
        closePopupFromButton();
    });

    function closePopupFromButton() {
        bodyEl.classList.remove('openLookbookPopup');
        document
            .querySelectorAll('.lookBook__btnShowProducts')
            .forEach((btnWrapper) => {
                btnWrapper.classList.remove('is-open');
            });
        destroyPopupSwiper();
        popupContentEl.innerHTML = '';
    }
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

    function getAllCardsFromItem(itemEl) {
        var all = Array.from(itemEl.querySelectorAll('.product-card-lookbook'));
        var sourceOnly = all.filter(function(el){
            return !el.closest('.lookBook__imgPopup');
        });
        return sourceOnly.map(function(card){
            return card.cloneNode(true);
        });
    }

    function openImagePopup(itemEl, cards) {
        const popupEl = itemEl.querySelector('.lookBook__imgPopup');
        if (!popupEl) return;
        const wrapper = popupEl.querySelector('.lookBook__imgPopup-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';
        (cards || []).forEach(function(card){
            wrapper.appendChild(card);
        });
        if (cards && cards.length === 1) {
            popupEl.classList.add('show-one-product');
        } else {
            popupEl.classList.remove('show-one-product');
        }
        popupEl.classList.add('is-open');
    }

    function closeImagePopup(itemEl) {
        const popupEl = itemEl.querySelector('.lookBook__imgPopup');
        if (!popupEl) return;
        const wrapper = popupEl.querySelector('.lookBook__imgPopup-wrapper');
        if (wrapper) wrapper.innerHTML = '';
        popupEl.classList.remove('is-open');
        popupEl.classList.remove('show-one-product');
    }

    lookBookItems.forEach(function(item){
        if (!item.querySelector('.lookBook__imgPopup')) {
            item.insertAdjacentHTML('beforeend', popupTemplate);
        }

        const showBtn = item.querySelector('.lookBook__btnShowProducts .show_products');
        const hideBtn = item.querySelector('.lookBook__btnShowProducts .hide_products');
        const closeBtn = item.querySelector('.lookBook__imgPopup .close');

        if (showBtn) {
            showBtn.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                const cards = getAllCardsFromItem(item);
                openImagePopup(item, cards);
            });
        }

        if (hideBtn) {
            hideBtn.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                closeImagePopup(item);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                closeImagePopup(item);
            });
        }

        const dots = item.querySelectorAll('lookbook-dot');
        dots.forEach(function(dot){
            dot.addEventListener('click', function(e){
                e.preventDefault();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                e.stopPropagation();
                const productCard = dot.querySelector('.product-card-lookbook');
                if (!productCard) return;
                const clone = productCard.cloneNode(true);
                openImagePopup(item, [clone]);
            }, true);
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
            console.log("dot:", dot);

            if (number) {
                number.innerHTML = i + 1;
            }
        }
    });
}