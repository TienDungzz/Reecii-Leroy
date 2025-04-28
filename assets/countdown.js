document.addEventListener('DOMContentLoaded', () => {
    const cardCountDown = document.querySelectorAll('.card .card__countDown [data-countdown-id]');
    if (cardCountDown) {
        cardCountDown.forEach((countdown) => {
            const countDownDate = new Date(countdown.dataset.countdown).getTime(),
             day = window.countdown.day;
            
            const timer = setInterval(() => {
                const now = Date.now(),
                distance = countDownDate - now;
        
                if (distance < 0) {
                    clearInterval(timer);
                    countdown.remove();
                    return;
                }
        
                const d = Math.floor(distance / (1000 * 60 * 60 * 24)),
                 h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                 m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                 s = Math.floor((distance % (1000 * 60)) / 1000);
        
                countdown.innerHTML = `
                    <span class="num">${d}<span>${day}</span></span>
                    <span class="num">${h}<span class="icon">:</span></span>
                    <span class="num">${m}<span class="icon">:</span></span>
                    <span class="num">${s}</span>
                `;
                countdown.classList.add('is_show');
            }, 1000);

        })
    }
})
