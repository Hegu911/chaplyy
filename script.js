// ======================
// SCROLL ANIMATION (big-zone-2)
// ======================

const section = document.querySelector('.big-zone-2');

if (section) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                section.classList.add('show');
            }
        });
    }, {
        threshold: 0.2
    });

    observer.observe(section);
}


// ======================
// SLIDER
// ======================

const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const buttons = document.querySelectorAll('.slide-btn');

let currentSlide = 0;
let autoPlay;

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    currentSlide = index;
}

function nextSlide() {
    let next = currentSlide + 1;
    if (next >= slides.length) {
        next = 0;
    }
    showSlide(next);
}

function startAutoPlay() {
    autoPlay = setInterval(nextSlide, 4000);
}

function resetAutoPlay() {
    clearInterval(autoPlay);
    startAutoPlay();
}

dots.forEach(dot => {
    dot.addEventListener('click', function () {
        const index = Number(this.dataset.slide);
        showSlide(index);
        resetAutoPlay();
    });
});

if (slides.length > 0) {
    showSlide(0);
    startAutoPlay();
}

document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll('.about-cart');

    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        observer.observe(card);
    });
});


// ======================
// ROUTING SİSTEMİ (ai-design silindi)
// ======================

(function() {
    const routes = {
        '/': 'index.html',
        '/index': 'index.html',
        '/home': 'index.html',
        '/product': 'product.html',
        '/design': 'created.html',
        '/login': 'login.html',
        '/partnership': 'partnership.html',
        '/designed':'design.html'
    };

    function navigateTo(path) {
        let target = routes[path];
        if (!target) target = routes['/' + path];
        if (!target) {
            if (path === '/' || path === '/index' || path === '/home') {
                target = 'index.html';
            } else if (path === '/product') {
                target = 'product.html';
            } else if (path === '/design') {
                target = 'created.html';
            } else if (path === '/partnership') {
                target = 'partnership.html';
            }else if (path === '/designed') {
                target = 'design.html';}
             else {
                target = path;
            }
        }
        window.location.href = target;
    }

    function initRouting() {
        const links = document.querySelectorAll('[data-link]');
        links.forEach(link => {
            const newLink = link.cloneNode(true);
            if (link.parentNode) {
                link.parentNode.replaceChild(newLink, link);
            }
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const targetPath = this.getAttribute('data-link');
                if (targetPath) {
                    navigateTo(targetPath);
                }
            });
        });
    }

    function setActiveNav() {
        const currentPath = window.location.pathname;
        let currentPage = '';
        if (currentPath.includes('index.html') || currentPath === '/' || currentPath === '/index.html') {
            currentPage = '/';
        } else if (currentPath.includes('product.html')) {
            currentPage = '/product';
        } else if (currentPath.includes('created.html')) {
            currentPage = '/design';
        } else if (currentPath.includes('login.html')) {
            currentPage = '/login';
        } else if (currentPath.includes('partnership.html')) {
            currentPage = '/partnership';
        }
         else if (currentPath.includes('design.html')) {
            currentPage = '/designed';
        }

        const navItems = document.querySelectorAll('.nav-elements, .mobile-nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            const link = item.getAttribute('data-link');
            if (link === currentPage) {
                item.classList.add('active');
            }
            if (currentPage === '/' && (link === '/' || link === '/index' || link === '/home')) {
                item.classList.add('active');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initRouting();
            setActiveNav();
        });
    } else {
        initRouting();
        setActiveNav();
    }
})();
