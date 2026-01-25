/**
 * CHETAN REDDY PORTFOLIO - MAIN JAVASCRIPT
 * Handles animations, parallax, smooth scrolling, and interactions
 */

(function() {
    'use strict';

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    const debounce = (func, wait = 10) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const throttle = (func, limit = 100) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // ==========================================
    // CURSOR FOLLOWER
    // ==========================================

    class CursorFollower {
        constructor() {
            this.cursor = document.querySelector('.cursor-follower');
            if (!this.cursor) return;

            this.pos = { x: 0, y: 0 };
            this.mouse = { x: 0, y: 0 };
            this.speed = 0.15;

            this.init();
        }

        init() {
            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                this.cursor.classList.add('active');
            });

            document.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('active');
            });

            // Add hover effect for interactive elements
            const interactiveElements = document.querySelectorAll('a, button, .skill-tag, .service-card, .project-card');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
            });

            this.render();
        }

        render() {
            this.pos.x += (this.mouse.x - this.pos.x) * this.speed;
            this.pos.y += (this.mouse.y - this.pos.y) * this.speed;

            this.cursor.style.left = `${this.pos.x}px`;
            this.cursor.style.top = `${this.pos.y}px`;

            requestAnimationFrame(() => this.render());
        }
    }

    // ==========================================
    // NAVBAR
    // ==========================================

    class Navbar {
        constructor() {
            this.navbar = document.getElementById('navbar');
            this.navToggle = document.getElementById('navToggle');
            this.navMenu = document.getElementById('navMenu');
            this.navLinks = document.querySelectorAll('.nav-link');

            if (!this.navbar) return;

            this.init();
        }

        init() {
            // Scroll effect
            window.addEventListener('scroll', throttle(() => this.onScroll(), 50));

            // Mobile toggle
            if (this.navToggle) {
                this.navToggle.addEventListener('click', () => this.toggleMobileMenu());
            }

            // Close mobile menu on link click
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMobileMenu());
            });

            // Close mobile menu on outside click
            document.addEventListener('click', (e) => {
                if (!this.navbar.contains(e.target) && this.navMenu.classList.contains('active')) {
                    this.closeMobileMenu();
                }
            });
        }

        onScroll() {
            if (window.scrollY > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        }

        toggleMobileMenu() {
            this.navToggle.classList.toggle('active');
            this.navMenu.classList.toggle('active');
            document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : '';
        }

        closeMobileMenu() {
            this.navToggle.classList.remove('active');
            this.navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ==========================================
    // SMOOTH SCROLL
    // ==========================================

    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;

                    const target = document.querySelector(targetId);
                    if (target) {
                        const headerOffset = 80;
                        const elementPosition = target.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    }

    // ==========================================
    // REVEAL ON SCROLL
    // ==========================================

    class RevealOnScroll {
        constructor() {
            this.elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
            if (!this.elements.length) return;

            this.init();
        }

        init() {
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -100px 0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            this.elements.forEach(el => observer.observe(el));
        }
    }

    // ==========================================
    // PARALLAX EFFECTS
    // ==========================================

    class ParallaxEffect {
        constructor() {
            this.heroLayers = document.querySelectorAll('.hero-bg-layer');
            this.parallaxBgs = document.querySelectorAll('.parallax-bg');

            if (!this.heroLayers.length && !this.parallaxBgs.length) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', throttle(() => this.onScroll(), 16));
            window.addEventListener('mousemove', throttle((e) => this.onMouseMove(e), 50));
        }

        onScroll() {
            const scrolled = window.pageYOffset;

            // Hero parallax layers
            this.heroLayers.forEach((layer, index) => {
                const speed = 0.2 + (index * 0.1);
                const yPos = scrolled * speed;
                layer.style.transform = `translateY(${yPos}px)`;
            });

            // Section parallax backgrounds
            this.parallaxBgs.forEach(bg => {
                const section = bg.parentElement;
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrolled + window.innerHeight > sectionTop && scrolled < sectionTop + sectionHeight) {
                    const progress = (scrolled - sectionTop + window.innerHeight) / (sectionHeight + window.innerHeight);
                    const yPos = (progress - 0.5) * 100;
                    bg.style.transform = `translateY(${yPos}px)`;
                }
            });
        }

        onMouseMove(e) {
            if (window.innerWidth < 768) return;

            const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

            this.heroLayers.forEach((layer, index) => {
                const speed = 10 + (index * 5);
                const x = mouseX * speed;
                const y = mouseY * speed;
                layer.style.transform = `translate(${x}px, ${y}px)`;
            });
        }
    }

    // ==========================================
    // PARTICLE SYSTEM
    // ==========================================

    class ParticleSystem {
        constructor() {
            this.container = document.getElementById('particles');
            if (!this.container) return;

            this.particleCount = window.innerWidth < 768 ? 20 : 50;
            this.init();
        }

        init() {
            for (let i = 0; i < this.particleCount; i++) {
                this.createParticle();
            }
        }

        createParticle() {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            // Random properties
            const size = Math.random() * 4 + 2;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 20;
            const duration = Math.random() * 20 + 20;
            const opacity = Math.random() * 0.4 + 0.1;

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}%;
                top: ${y}%;
                animation-delay: -${delay}s;
                animation-duration: ${duration}s;
                opacity: ${opacity};
            `;

            this.container.appendChild(particle);
        }
    }

    // ==========================================
    // COUNTER ANIMATION
    // ==========================================

    class CounterAnimation {
        constructor() {
            this.counters = document.querySelectorAll('.stat-number');
            if (!this.counters.length) return;

            this.init();
        }

        init() {
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            this.counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseInt(element.dataset.count, 10);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 16);
        }
    }

    // ==========================================
    // TYPED TEXT EFFECT
    // ==========================================

    class TypedText {
        constructor(element, words, options = {}) {
            this.element = element;
            this.words = words;
            this.options = {
                typeSpeed: 100,
                deleteSpeed: 50,
                delayBetweenWords: 2000,
                ...options
            };
            this.wordIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;

            if (this.element) {
                this.type();
            }
        }

        type() {
            const currentWord = this.words[this.wordIndex];

            if (this.isDeleting) {
                this.element.textContent = currentWord.substring(0, this.charIndex - 1);
                this.charIndex--;
            } else {
                this.element.textContent = currentWord.substring(0, this.charIndex + 1);
                this.charIndex++;
            }

            let typeSpeed = this.isDeleting ? this.options.deleteSpeed : this.options.typeSpeed;

            if (!this.isDeleting && this.charIndex === currentWord.length) {
                typeSpeed = this.options.delayBetweenWords;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.wordIndex = (this.wordIndex + 1) % this.words.length;
                typeSpeed = 500;
            }

            setTimeout(() => this.type(), typeSpeed);
        }
    }

    // ==========================================
    // CONTACT FORM
    // ==========================================

    class ContactForm {
        constructor() {
            this.form = document.getElementById('contactForm');
            if (!this.form) return;

            this.init();
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Add floating label effect
            const inputs = this.form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', () => this.onInputFocus(input));
                input.addEventListener('blur', () => this.onInputBlur(input));
            });
        }

        onInputFocus(input) {
            input.parentElement.classList.add('focused');
        }

        onInputBlur(input) {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        }

        async handleSubmit(e) {
            e.preventDefault();

            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.innerHTML = `
                <span>Sending...</span>
                <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70"/>
                </svg>
            `;
            submitBtn.disabled = true;

            // Simulate form submission (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success state
            submitBtn.innerHTML = `
                <span>Message Sent!</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;

            // Reset form
            setTimeout(() => {
                this.form.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
        }
    }

    // ==========================================
    // MAGNETIC BUTTONS
    // ==========================================

    class MagneticButtons {
        constructor() {
            this.buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
            if (!this.buttons.length || window.innerWidth < 768) return;

            this.init();
        }

        init() {
            this.buttons.forEach(button => {
                button.addEventListener('mousemove', (e) => this.onMouseMove(e, button));
                button.addEventListener('mouseleave', (e) => this.onMouseLeave(e, button));
            });
        }

        onMouseMove(e, button) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        }

        onMouseLeave(e, button) {
            button.style.transform = '';
        }
    }

    // ==========================================
    // SKILL TAGS ANIMATION
    // ==========================================

    class SkillTagsAnimation {
        constructor() {
            this.tags = document.querySelectorAll('.skill-tag');
            if (!this.tags.length) return;

            this.init();
        }

        init() {
            this.tags.forEach((tag, index) => {
                tag.style.transitionDelay = `${index * 0.05}s`;
            });
        }
    }

    // ==========================================
    // SERVICE CARD TILT
    // ==========================================

    class ServiceCardTilt {
        constructor() {
            this.cards = document.querySelectorAll('.service-card, .project-card:not(.large)');
            if (!this.cards.length || window.innerWidth < 1024) return;

            this.init();
        }

        init() {
            this.cards.forEach(card => {
                card.addEventListener('mousemove', (e) => this.onMouseMove(e, card));
                card.addEventListener('mouseleave', (e) => this.onMouseLeave(e, card));
            });
        }

        onMouseMove(e, card) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        }

        onMouseLeave(e, card) {
            card.style.transform = '';
        }
    }

    // ==========================================
    // ACTIVE NAV LINK
    // ==========================================

    class ActiveNavLink {
        constructor() {
            this.sections = document.querySelectorAll('section[id]');
            this.navLinks = document.querySelectorAll('.nav-link');

            if (!this.sections.length || !this.navLinks.length) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', throttle(() => this.onScroll(), 100));
        }

        onScroll() {
            const scrollY = window.pageYOffset;

            this.sections.forEach(section => {
                const sectionHeight = section.offsetHeight;
                const sectionTop = section.offsetTop - 150;
                const sectionId = section.getAttribute('id');

                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    this.navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }
    }

    // ==========================================
    // PRELOADER
    // ==========================================

    class Preloader {
        constructor() {
            this.init();
        }

        init() {
            // Add loaded class to body when page is ready
            window.addEventListener('load', () => {
                document.body.classList.add('loaded');

                // Trigger initial animations
                setTimeout(() => {
                    document.querySelectorAll('.hero .reveal-up, .hero .reveal-left, .hero .reveal-right').forEach(el => {
                        el.classList.add('revealed');
                    });
                }, 100);
            });
        }
    }

    // ==========================================
    // INITIALIZE ALL MODULES
    // ==========================================

    document.addEventListener('DOMContentLoaded', () => {
        // Core functionality
        new Preloader();
        new Navbar();
        new SmoothScroll();
        new RevealOnScroll();

        // Visual effects
        new CursorFollower();
        new ParallaxEffect();
        new ParticleSystem();
        new CounterAnimation();

        // Interactive elements
        new MagneticButtons();
        new SkillTagsAnimation();
        new ServiceCardTilt();
        new ActiveNavLink();

        // Form
        new ContactForm();

        console.log('%c🚀 Portfolio loaded successfully!', 'color: #3dff17; font-size: 14px; font-weight: bold;');
    });

})();
