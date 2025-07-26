let heroInterval;
let isMenuOpen = false;

// Helper: Apply translations to a container using a translation object
function applyTranslations(container, translations) {
    if (!container) return;
    container.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[key];
            } else {
                el.textContent = translations[key];
            }
        }
    });
}

// Load and translate Header & Footer
function loadHeaderFooter(lang) {
    // Header
    fetch('../essentials/header.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('header').innerHTML = data;
        fetch(`../essentials/${lang}_header.json`)
          .then(res => res.json())
          .then(headerTranslations => {
            applyTranslations(document.getElementById('header'), headerTranslations);
            initializeMobileMenu(); // Initialize mobile menu FIRST
            attachHeaderListeners(); // Then attach listeners AFTER mobile menu is set up
            updateActiveNavLink(); // Set active nav link
            fixHeaderOnScroll(); // Ensure header is fixed and blur works
          });
      });
    // Footer
    fetch('../essentials/footer.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('footer').innerHTML = data;
        fetch(`../essentials/${lang}_footer.json`)
          .then(res => res.json())
          .then(footerTranslations => {
            applyTranslations(document.getElementById('footer'), footerTranslations);
          });
      });
}

// Attach language and theme switch listeners after header injection
function attachHeaderListeners() {
    // Remove previous listeners by cloning (to avoid duplicates) - DESKTOP ONLY
    document.querySelectorAll('.header-left .lang-option').forEach(option => {
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
    });
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const newThemeToggle = themeToggle.cloneNode(true);
        themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);
    }
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    if (themeToggleMobile) {
        const newThemeToggleMobile = themeToggleMobile.cloneNode(true);
        themeToggleMobile.parentNode.replaceChild(newThemeToggleMobile, themeToggleMobile);
    }

    // Language switcher for desktop
    document.querySelectorAll('.header-left .lang-option').forEach(option => {
        option.addEventListener('click', function () {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // Language switcher for mobile
    document.querySelectorAll('.mobile-extra-controls .lang-option').forEach(option => {
        option.addEventListener('click', function () {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // Update language switcher active state
    updateLanguageSwitcherState();

    // Theme switcher logic (merged from themeButton.js)
    function getThemeElements() {
        return {
            themeToggle: document.getElementById('themeToggle'),
            themeToggleMobile: document.getElementById('themeToggleMobile'),
            themeIcon: document.getElementById('themeIcon'),
            themeIconMobile: document.getElementById('themeIconMobile')
        };
    }

    function setTheme(theme) {
        console.log('Setting theme to:', theme); // Debug log
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Also add theme as a class to body for broader CSS support
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        
        const { themeIcon, themeIconMobile } = getThemeElements();
        console.log('Theme elements found:', { themeIcon: !!themeIcon, themeIconMobile: !!themeIconMobile }); // Debug log
        
        if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        if (themeIconMobile) themeIconMobile.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        console.log('Toggling theme from', currentTheme, 'to', newTheme); // Debug log
        setTheme(newTheme);
        
        // Animation
        const { themeToggle, themeToggleMobile, themeIcon, themeIconMobile } = getThemeElements();
        [themeToggle, themeToggleMobile].forEach(btn => {
            if (btn) btn.style.transform = 'scale(0.9) rotate(5deg)';
        });
        [themeIcon, themeIconMobile].forEach(icon => {
            if (icon) icon.style.transform = 'rotate(180deg) scale(1.3)';
        });
        setTimeout(() => {
            [themeToggle, themeToggleMobile].forEach(btn => {
                if (btn) btn.style.transform = 'scale(1) rotate(0deg)';
            });
            [themeIcon, themeIconMobile].forEach(icon => {
                if (icon) icon.style.transform = 'rotate(0deg) scale(1)';
            });
        }, 200);
    }

    // Now re-select and attach listeners to both
    const tToggle = document.getElementById('themeToggle');
    const tToggleMobile = document.getElementById('themeToggleMobile');
    if (tToggle) tToggle.addEventListener('click', function(e) { e.preventDefault(); toggleTheme(); });
    if (tToggleMobile) tToggleMobile.addEventListener('click', function(e) { e.preventDefault(); toggleTheme(); });

    // Set initial theme on header injection
    const initialTheme = localStorage.getItem('theme') || 'dark';
    console.log('Setting initial theme:', initialTheme); // Debug log
    setTheme(initialTheme);
}

// Update language switcher state for both desktop and mobile
function updateLanguageSwitcherState() {
    const currentLang = localStorage.getItem('lang') || 'ar';
    
    // Desktop language switcher
    document.querySelectorAll('.header-left .lang-option').forEach(opt => {
        if (opt.getAttribute('data-lang') === currentLang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
    
    // Mobile language switcher
    document.querySelectorAll('.mobile-extra-controls .lang-option').forEach(opt => {
        if (opt.getAttribute('data-lang') === currentLang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

// Set active nav link based on current page (desktop and mobile)
function updateActiveNavLink() {
    const pages = ['Home', 'About', 'Services', 'Portfolio', 'Contact'];
    
    // Remove all active classes first
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Get current page (without query/hash)
    let currentPage = window.location.pathname;
    
    // Check desktop nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });
    
    // Check mobile nav links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });
    
    // Alternative approach: check if current path matches any of the page names
    pages.forEach(page => {
        if (currentPage.includes(`/${page}/`) || currentPage.endsWith(`/${page}/index.html`)) {
            // Desktop
            const desktopLink = document.querySelector(`.nav-link[href*="/${page}/"]`);
            if (desktopLink) desktopLink.classList.add('active');
            
            // Mobile
            const mobileLink = document.querySelector(`.mobile-nav-link[href*="/${page}/"]`);
            if (mobileLink) mobileLink.classList.add('active');
        }
    });
}

// Ensure header is fixed and blur effect works on scroll
function fixHeaderOnScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    header.style.position = 'fixed';
    header.style.top = '0';
    header.style.left = '0';
    header.style.width = '100%';
    header.style.zIndex = '1000';
    // Add padding to body to prevent content jump
    const headerHeight = header.offsetHeight;
    document.body.style.paddingTop = headerHeight + 'px';
    // Blur effect
    function onScroll() {
        const rootStyles = getComputedStyle(document.documentElement);
        const headerColor = rootStyles.getPropertyValue('--header').trim();
        const headerColorScroll = rootStyles.getPropertyValue('--header-scroll').trim();
        if (window.scrollY > 50) {
            header.style.backdropFilter = 'blur(10px)';
            header.style.background = headerColorScroll;
        } else {
            header.style.background = headerColor;
            header.style.backdropFilter = 'none';
        }
    }
    window.removeEventListener('scroll', onScroll); // Remove previous if any
    window.addEventListener('scroll', onScroll);
    // Call once to set initial state
    onScroll();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeLanguageLoad();
    initializeMobileMenu();
    initializeAnimationsOnScroll();
});

// Mobile Menu Functions
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileMenuBtn || !mobileNav) return;

    // Only clone and replace the menu button and nav links, NOT the entire nav
    const newBtn = mobileMenuBtn.cloneNode(true);
    mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);
    
    // Clone only the nav links, preserve the mobile controls
    const navLinks = mobileNav.querySelectorAll('.mobile-nav-link');
    navLinks.forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });

    // Re-select after replacement
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('mobileNav');

    btn.addEventListener('click', toggleMobileMenu);
    // Close menu when clicking on nav links
    nav.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    // Remove previous outside click listeners
    if (window._mobileMenuOutsideHandler) {
        document.removeEventListener('click', window._mobileMenuOutsideHandler, true);
    }
    window._mobileMenuOutsideHandler = function(e) {
        const currentBtn = document.getElementById('mobileMenuBtn');
        const currentNav = document.getElementById('mobileNav');
        if (currentBtn && currentNav && !currentBtn.contains(e.target) && !currentNav.contains(e.target)) {
            closeMobileMenu();
        }
    };
    document.addEventListener('click', window._mobileMenuOutsideHandler, true);

    attachHeaderListeners(); 
};

function toggleMobileMenu() {
    // Get fresh references each time
    const mobileNav = document.getElementById('mobileNav');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (!mobileNav || !mobileMenuBtn) return;
    
    isMenuOpen = !isMenuOpen;
    mobileNav.classList.toggle('active');
    
    // Change hamburger icon
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
        if (isMenuOpen) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    }
}

function closeMobileMenu() {
    // Get fresh references each time
    const mobileNav = document.getElementById('mobileNav');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (!mobileNav || !mobileMenuBtn) return;
    
    isMenuOpen = false;
    mobileNav.classList.remove('active');
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
        icon.className = 'fas fa-bars';
    }
}

// Animations on scroll
function initializeAnimationsOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll(
        '.service-card, .feature-item, .stat-card, .testimonial-card'
    );
    
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#00000';
        header.style.backdropFilter = 'none';
    }
});

// Performance optimization: Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Error handling for images
function handleImageError(img) {
    img.style.display = 'none';
    console.warn(`Failed to load image: ${img.src}`);
}

// Add error handlers to all images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => handleImageError(img));
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape' && isMenuOpen) {
        closeMobileMenu();
    }

    // Arrow keys for hero navigation
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.target.closest('.hero')) {
            e.preventDefault();
            clearInterval(heroInterval);
            nextHeroImage();
            heroInterval = setInterval(nextHeroImage, 3000);
        }
    }
});

// Touch support for mobile devices
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        // Swipe detected on hero section
        if (document.elementFromPoint(touchEndX, 100).closest('.hero')) {
            clearInterval(heroInterval);
            nextHeroImage();
            heroInterval = setInterval(nextHeroImage, 3000);
        }
    }
}

// On page load, use saved language if available
function initializeLanguageLoad() {
    const lang = getCurrentLanguage();
    setLanguage(lang);
    loadHeaderFooter(lang);
}

// Language Switcher
function getCurrentLanguage() {
    let lang = localStorage.getItem('lang');
    if (!lang) {
        lang = 'ar'; // Default language
        localStorage.setItem('lang', lang);
    }
    return lang;
}

// Function to fetch and apply translations
function setLanguage(lang) {
    fetch(`${lang}.json`)
    .then(response => response.json())
    .then(translations => { 
        // Store translations globally for access
        window.translations = translations;
        
        // Update all elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translations[key];
                } else {
                    el.textContent = translations[key];
                }
            }
        });

        // Set direction and language attributes for Arabic
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);

        // Save to localStorage
        localStorage.setItem('lang', lang);

        // Update language switcher state for both desktop and mobile
        updateLanguageSwitcherState();

        // Also reload header/footer translations
        loadHeaderFooter(lang);
        
        // Pass translations to Home page for dynamic JS (hero/services)
        // This will trigger re-initialization of hero slider and services
        if (window.setHomePageTranslations) {
            window.setHomePageTranslations(translations);
        }
    })
    .catch(error => {
        console.error('Error loading translations:', error);
    });
}