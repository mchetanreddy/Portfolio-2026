/**
 * CHETAN REDDY PORTFOLIO - STRINGTUNE ENHANCED
 * Awwwards-quality animations powered by StringTune
 * with scroll-based audio and creative effects
 */

(function() {
    'use strict';

    // ==========================================
    // STRINGTUNE INITIALIZATION
    // ==========================================
    class StringTuneManager {
        constructor() {
            this.isReady = false;
            this.modules = {};
            this.init();
        }

        init() {
            // Wait for StringTune library to load
            if (typeof StringTune !== 'undefined') {
                this.initializeModules();
            } else {
                // Fallback: wait for script to load
                window.addEventListener('load', () => {
                    setTimeout(() => this.initializeModules(), 100);
                });
            }
        }

        initializeModules() {
            try {
                // Initialize StringTune core with smooth scrolling
                if (typeof StringTune !== 'undefined') {
                    this.modules.core = new StringTune({
                        smooth: true,
                        smoothMobile: false,
                        lerp: 0.08,
                        multiplier: 1,
                        firefoxMultiplier: 50,
                        touchMultiplier: 2
                    });

                    this.isReady = true;
                    console.log('%c✨ StringTune Initialized', 'color: #f59e0b; font-weight: bold;');
                }
            } catch (e) {
                console.log('StringTune modules will use fallback implementations');
                this.initFallbacks();
            }

            // Initialize custom implementations for effects
            this.initParallax();
            this.initMagnetic();
            this.initSplitText();
            this.initProgress();
            this.initGlide();
            this.initCursor();
        }

        initFallbacks() {
            // Fallback smooth scroll using CSS
            document.documentElement.style.scrollBehavior = 'smooth';
        }

        // Check if mobile device
        isMobile() {
            return window.innerWidth < 768 || 'ontouchstart' in window;
        }

        // Custom Parallax Implementation
        initParallax() {
            // Disable parallax on mobile for performance and scroll issues
            if (this.isMobile()) return;

            const parallaxElements = document.querySelectorAll('[data-string-parallax]');
            if (!parallaxElements.length) return;

            const handleParallax = () => {
                const scrollY = window.pageYOffset;

                parallaxElements.forEach(el => {
                    const speed = parseFloat(el.dataset.stringParallax) || 0.1;
                    const direction = el.dataset.stringParallaxDirection || 'vertical';
                    const rect = el.getBoundingClientRect();
                    const centerY = rect.top + rect.height / 2;
                    const viewportCenter = window.innerHeight / 2;
                    const offset = (centerY - viewportCenter) * speed;

                    if (direction === 'vertical' || direction === 'both') {
                        el.style.transform = `translateY(${offset}px)`;
                    }
                    if (direction === 'horizontal' || direction === 'both') {
                        el.style.transform = `translate(${offset * 0.5}px, ${direction === 'both' ? offset : 0}px)`;
                    }
                });
            };

            window.addEventListener('scroll', handleParallax, { passive: true });
            handleParallax();
        }

        // Magnetic Effect Implementation
        initMagnetic() {
            if (this.isMobile()) return;

            const magneticElements = document.querySelectorAll('[data-string-magnetic]');

            magneticElements.forEach(el => {
                const strength = parseFloat(el.dataset.stringMagneticStrength) || 0.2;

                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;

                    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;

                    // Set CSS variables for gradient effects
                    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
                    const percentY = ((e.clientY - rect.top) / rect.height) * 100;
                    el.style.setProperty('--mouse-x', `${percentX}%`);
                    el.style.setProperty('--mouse-y', `${percentY}%`);
                });

                el.addEventListener('mouseleave', () => {
                    el.style.transform = '';
                });
            });
        }

        // Split Text Animation
        initSplitText() {
            const splitElements = document.querySelectorAll('[data-string-split]');

            // On mobile, skip split animation for better performance and show text immediately
            if (this.isMobile()) {
                splitElements.forEach(el => {
                    el.classList.add('split-ready', 'split-animated');
                });
                return;
            }

            splitElements.forEach(el => {
                const splitType = el.dataset.stringSplit;
                const stagger = parseFloat(el.dataset.stringSplitStagger) || 0.03;
                const className = el.dataset.stringSplitClass || '';
                const text = el.textContent;

                if (!text.trim()) return;

                let html = '';

                if (splitType === 'chars') {
                    const chars = text.split('');
                    html = chars.map((char, i) => {
                        if (char === ' ') return ' ';
                        return `<span class="char ${className}" style="--char-index: ${i}; transition-delay: ${i * stagger}s">${char}</span>`;
                    }).join('');
                } else if (splitType === 'words') {
                    const words = text.split(' ');
                    html = words.map((word, i) =>
                        `<span class="word ${className}" style="--word-index: ${i}; transition-delay: ${i * stagger}s">${word}</span>`
                    ).join(' ');
                } else if (splitType === 'lines') {
                    html = `<span class="line ${className}">${text}</span>`;
                }

                el.innerHTML = html;
                el.classList.add('split-ready');
            });

            // Trigger animation when in view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('split-animated');
                    }
                });
            }, { threshold: 0.2 });

            splitElements.forEach(el => observer.observe(el));
        }

        // Progress/Reveal Animation
        initProgress() {
            const progressElements = document.querySelectorAll('[data-string-progress]');

            // On mobile, immediately show all elements for better performance
            if (this.isMobile()) {
                progressElements.forEach(el => {
                    el.classList.add('is-inview');
                    el.style.setProperty('--progress', 1);
                });
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-inview');

                        // Calculate progress for elements that need it
                        const rect = entry.target.getBoundingClientRect();
                        const progress = Math.min(1, Math.max(0,
                            (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
                        ));
                        entry.target.style.setProperty('--progress', progress);
                    }
                });
            }, {
                threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
                rootMargin: '0px 0px -10% 0px'
            });

            progressElements.forEach(el => observer.observe(el));
        }

        // Glide/Inertia Effect
        initGlide() {
            // Disable glide on mobile for performance
            if (this.isMobile()) return;

            const glideElements = document.querySelectorAll('[data-string-glide]');

            glideElements.forEach(el => {
                const speed = parseFloat(el.dataset.stringGlideSpeed) || 0.1;
                let currentY = 0;
                let targetY = 0;

                const updateGlide = () => {
                    const scrollY = window.pageYOffset;
                    const rect = el.getBoundingClientRect();

                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        targetY = (scrollY - el.offsetTop) * speed;
                        currentY += (targetY - currentY) * 0.1;

                        // Only apply if not already transformed by magnetic
                        if (!el.matches(':hover') || !el.hasAttribute('data-string-magnetic')) {
                            el.style.transform = `translateY(${currentY}px)`;
                        }
                    }

                    requestAnimationFrame(updateGlide);
                };

                updateGlide();
            });
        }

        // Custom Cursor
        initCursor() {
            if (this.isMobile()) return;

            const cursorDot = document.querySelector('[data-string-cursor-dot]');
            const cursorOutline = document.querySelector('[data-string-cursor-outline]');

            if (!cursorDot || !cursorOutline) return;

            let mouseX = 0, mouseY = 0;
            let outlineX = 0, outlineY = 0;

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;

                cursorDot.style.left = `${mouseX}px`;
                cursorDot.style.top = `${mouseY}px`;
            });

            const animateOutline = () => {
                outlineX += (mouseX - outlineX) * 0.15;
                outlineY += (mouseY - outlineY) * 0.15;

                cursorOutline.style.left = `${outlineX}px`;
                cursorOutline.style.top = `${outlineY}px`;

                requestAnimationFrame(animateOutline);
            };

            animateOutline();

            // Cursor interactions
            const interactiveElements = document.querySelectorAll('a, button, [data-string-magnetic], input, textarea, .service-card, .project-card');

            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(2)';
                    cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    cursorDot.style.background = 'var(--color-secondary)';
                    cursorOutline.style.borderColor = 'var(--color-secondary)';
                });

                el.addEventListener('mouseleave', () => {
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursorDot.style.background = 'var(--color-primary)';
                    cursorOutline.style.borderColor = 'var(--color-primary)';
                });
            });
        }
    }

    // ==========================================
    // AUDIO MANAGER - Scroll-Based Sounds
    // ==========================================
    class AudioManager {
        constructor() {
            this.audioContext = null;
            this.isMuted = true;
            this.currentSection = 'hero';
            this.oscillators = {};
            this.gainNodes = {};
            this.masterGain = null;
            this.isInitialized = false;

            this.sectionSounds = {
                hero: { frequency: 110, type: 'sine', volume: 0.1 },
                about: { frequency: 130.81, type: 'sine', volume: 0.08 },
                skills: { frequency: 164.81, type: 'triangle', volume: 0.1 },
                services: { frequency: 196, type: 'sine', volume: 0.08 },
                experience: { frequency: 220, type: 'sine', volume: 0.1 },
                projects: { frequency: 261.63, type: 'triangle', volume: 0.1 },
                contact: { frequency: 293.66, type: 'sine', volume: 0.08 }
            };

            this.init();
        }

        init() {
            const audioToggle = document.getElementById('audioToggle');
            const audioController = document.getElementById('audioController');

            if (audioToggle && audioController) {
                audioToggle.addEventListener('click', () => {
                    if (!this.isInitialized) {
                        this.initializeAudio();
                    }
                    this.toggleMute();
                    audioController.classList.toggle('muted', this.isMuted);
                });
            }

            // Initialize on first user interaction
            document.addEventListener('click', () => {
                if (!this.isInitialized) {
                    this.initializeAudio();
                }
            }, { once: true });
        }

        initializeAudio() {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.masterGain.gain.value = 0;

                // Create ambient drone
                this.createAmbientSound();
                this.isInitialized = true;
            } catch (e) {
                console.log('Web Audio API not supported');
            }
        }

        createAmbientSound() {
            if (!this.audioContext) return;

            // Base drone
            const osc1 = this.audioContext.createOscillator();
            const gain1 = this.audioContext.createGain();
            osc1.type = 'sine';
            osc1.frequency.value = 55; // A1
            gain1.gain.value = 0.05;
            osc1.connect(gain1);
            gain1.connect(this.masterGain);
            osc1.start();

            // Harmonic
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = 82.41; // E2
            gain2.gain.value = 0.03;
            osc2.connect(gain2);
            gain2.connect(this.masterGain);
            osc2.start();

            this.oscillators.base = osc1;
            this.oscillators.harmonic = osc2;
            this.gainNodes.base = gain1;
            this.gainNodes.harmonic = gain2;
        }

        changeSection(sectionId) {
            if (!this.audioContext || this.isMuted || this.currentSection === sectionId) return;

            this.currentSection = sectionId;
            const soundConfig = this.sectionSounds[sectionId];

            if (soundConfig && this.oscillators.base) {
                // Smoothly transition frequency
                const now = this.audioContext.currentTime;
                this.oscillators.base.frequency.linearRampToValueAtTime(
                    soundConfig.frequency / 2,
                    now + 0.5
                );
                this.oscillators.harmonic.frequency.linearRampToValueAtTime(
                    soundConfig.frequency * 0.75,
                    now + 0.5
                );

                // Play transition sound
                this.playTransitionSound(soundConfig.frequency);
            }
        }

        playTransitionSound(freq) {
            if (!this.audioContext || this.isMuted) return;

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0;

            osc.connect(gain);
            gain.connect(this.masterGain);

            const now = this.audioContext.currentTime;
            gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);

            osc.start(now);
            osc.stop(now + 0.6);
        }

        toggleMute() {
            this.isMuted = !this.isMuted;

            if (this.masterGain) {
                const now = this.audioContext.currentTime;
                this.masterGain.gain.linearRampToValueAtTime(
                    this.isMuted ? 0 : 0.3,
                    now + 0.3
                );
            }
        }

        playClickSound() {
            if (!this.audioContext || this.isMuted) return;

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.frequency.value = 800;
            gain.gain.value = 0.02;

            osc.connect(gain);
            gain.connect(this.masterGain);

            const now = this.audioContext.currentTime;
            osc.start(now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.stop(now + 0.05);
        }
    }

    // ==========================================
    // PRELOADER
    // ==========================================
    class Preloader {
        constructor() {
            this.preloader = document.getElementById('preloader');
            this.init();
        }

        init() {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    if (this.preloader) {
                        this.preloader.classList.add('hidden');
                        document.body.classList.remove('loading');
                    }
                    // Trigger hero animations
                    this.triggerHeroAnimations();
                }, 1500);
            });

            document.body.classList.add('loading');
        }

        triggerHeroAnimations() {
            // Trigger StringTune progress animations for hero elements
            const heroProgressElements = document.querySelectorAll('.hero [data-string-progress]');
            heroProgressElements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('is-inview');
                }, index * 150);
            });

            // Trigger split text animations
            const heroSplitElements = document.querySelectorAll('.hero [data-string-split]');
            heroSplitElements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('split-animated');
                }, index * 100 + 300);
            });
        }
    }

    // ==========================================
    // SCROLL PROGRESS BAR
    // ==========================================
    class ScrollProgress {
        constructor() {
            this.progressBar = document.getElementById('scrollProgress');
            if (!this.progressBar) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', () => this.updateProgress(), { passive: true });
        }

        updateProgress() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollTop / docHeight;

            this.progressBar.style.transform = `scaleX(${progress})`;
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

            if (!this.navbar) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', () => this.onScroll(), { passive: true });

            if (this.navToggle) {
                this.navToggle.addEventListener('click', () => this.toggleMobile());
            }

            // Close on link click
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => this.closeMobile());
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!this.navbar.contains(e.target) && this.navMenu?.classList.contains('active')) {
                    this.closeMobile();
                }
            });
        }

        onScroll() {
            this.navbar.classList.toggle('scrolled', window.scrollY > 50);
        }

        toggleMobile() {
            this.navToggle?.classList.toggle('active');
            this.navMenu?.classList.toggle('active');
            document.body.style.overflow = this.navMenu?.classList.contains('active') ? 'hidden' : '';
        }

        closeMobile() {
            this.navToggle?.classList.remove('active');
            this.navMenu?.classList.remove('active');
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
    // SECTION OBSERVER (for audio & animations)
    // ==========================================
    class SectionObserver {
        constructor(audioManager) {
            this.audioManager = audioManager;
            this.sections = document.querySelectorAll('section[id]');

            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                        const sectionId = entry.target.id;
                        this.audioManager?.changeSection(sectionId);

                        // Update active nav link
                        document.querySelectorAll('.nav-link').forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${sectionId}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, { threshold: 0.3 });

            this.sections.forEach(section => observer.observe(section));
        }
    }

    // ==========================================
    // COUNTER ANIMATION
    // ==========================================
    class CounterAnimation {
        constructor() {
            this.counters = document.querySelectorAll('.stat-number');
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            this.counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseInt(element.dataset.count, 10);
            const duration = 2000;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const current = Math.floor(easeOutQuart * target);

                element.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = target;
                }
            };

            requestAnimationFrame(animate);
        }
    }

    // ==========================================
    // TYPEWRITER EFFECT
    // ==========================================
    class Typewriter {
        constructor() {
            this.element = document.getElementById('typewriter');
            this.phrases = [
                'Building intelligent AI Agents & RAG systems',
                'Crafting scalable Full Stack applications',
                'Architecting cloud-native solutions',
                'Transforming ideas into production-ready code'
            ];
            this.phraseIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;
            this.typeSpeed = 50;
            this.deleteSpeed = 30;
            this.pauseDuration = 2000;

            if (this.element) {
                this.type();
            }
        }

        type() {
            const currentPhrase = this.phrases[this.phraseIndex];

            if (this.isDeleting) {
                this.element.textContent = currentPhrase.substring(0, this.charIndex - 1);
                this.charIndex--;
            } else {
                this.element.textContent = currentPhrase.substring(0, this.charIndex + 1);
                this.charIndex++;
            }

            let delay = this.isDeleting ? this.deleteSpeed : this.typeSpeed;

            if (!this.isDeleting && this.charIndex === currentPhrase.length) {
                delay = this.pauseDuration;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
                delay = 500;
            }

            setTimeout(() => this.type(), delay);
        }
    }

    // ==========================================
    // HERO CANVAS - Particle Network
    // ==========================================
    class HeroCanvas {
        constructor() {
            this.canvas = document.getElementById('heroCanvas');
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: null, y: null, radius: 150 };
            this.particleCount = window.innerWidth < 768 ? 30 : 80;

            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', () => this.resize());

            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });

            this.createParticles();
            this.animate();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        createParticles() {
            this.particles = [];
            for (let i = 0; i < this.particleCount; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1,
                    color: `rgba(242, 166, 31, ${Math.random() * 0.4 + 0.15})`
                });
            }
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles.forEach((particle, i) => {
                // Move particles
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Bounce off edges
                if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

                // Mouse interaction
                if (this.mouse.x && this.mouse.y) {
                    const dx = this.mouse.x - particle.x;
                    const dy = this.mouse.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.mouse.radius) {
                        const force = (this.mouse.radius - distance) / this.mouse.radius;
                        particle.x -= dx * force * 0.02;
                        particle.y -= dy * force * 0.02;
                    }
                }

                // Draw particle
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = particle.color;
                this.ctx.fill();

                // Connect nearby particles
                for (let j = i + 1; j < this.particles.length; j++) {
                    const other = this.particles[j];
                    const dx = particle.x - other.x;
                    const dy = particle.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(particle.x, particle.y);
                        this.ctx.lineTo(other.x, other.y);
                        this.ctx.strokeStyle = `rgba(242, 166, 31, ${0.12 * (1 - distance / 150)})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(() => this.animate());
        }
    }

    // ==========================================
    // NEURAL NETWORK CANVAS
    // ==========================================
    class NeuralCanvas {
        constructor() {
            this.canvas = document.getElementById('neuralCanvas');
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.nodes = [];
            this.connections = [];

            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.createNetwork();
            this.animate();
        }

        resize() {
            const section = this.canvas.parentElement;
            this.canvas.width = section.offsetWidth;
            this.canvas.height = section.offsetHeight;
            this.createNetwork();
        }

        createNetwork() {
            this.nodes = [];
            this.connections = [];

            // Create nodes in layers
            const layers = 5;
            const nodesPerLayer = 6;

            for (let l = 0; l < layers; l++) {
                for (let n = 0; n < nodesPerLayer; n++) {
                    this.nodes.push({
                        x: (l + 1) * (this.canvas.width / (layers + 1)),
                        y: (n + 1) * (this.canvas.height / (nodesPerLayer + 1)),
                        radius: 4,
                        pulse: Math.random() * Math.PI * 2
                    });
                }
            }

            // Create connections
            for (let l = 0; l < layers - 1; l++) {
                for (let n = 0; n < nodesPerLayer; n++) {
                    const currentIndex = l * nodesPerLayer + n;
                    for (let nextN = 0; nextN < nodesPerLayer; nextN++) {
                        const nextIndex = (l + 1) * nodesPerLayer + nextN;
                        if (Math.random() > 0.5) {
                            this.connections.push({
                                from: currentIndex,
                                to: nextIndex,
                                pulse: Math.random() * Math.PI * 2
                            });
                        }
                    }
                }
            }
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw connections
            this.connections.forEach(conn => {
                const from = this.nodes[conn.from];
                const to = this.nodes[conn.to];
                conn.pulse += 0.02;

                const alpha = 0.1 + 0.1 * Math.sin(conn.pulse);
                this.ctx.beginPath();
                this.ctx.moveTo(from.x, from.y);
                this.ctx.lineTo(to.x, to.y);
                this.ctx.strokeStyle = `rgba(242, 166, 31, ${alpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            });

            // Draw nodes
            this.nodes.forEach(node => {
                node.pulse += 0.03;
                const pulseSize = 1 + 0.3 * Math.sin(node.pulse);

                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius * pulseSize, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(242, 166, 31, 0.5)';
                this.ctx.fill();

                // Glow
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius * pulseSize * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(242, 166, 31, 0.08)';
                this.ctx.fill();
            });

            requestAnimationFrame(() => this.animate());
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
        }

        async handleSubmit(e) {
            e.preventDefault();

            const submitBtn = this.form.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');

            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 2000));

            submitBtn.classList.remove('loading');

            // Show success (you would integrate with actual form service)
            alert('Message sent successfully! I\'ll get back to you soon.');
            this.form.reset();
        }
    }

    // ==========================================
    // TIMELINE PROGRESS
    // ==========================================
    class TimelineProgress {
        constructor() {
            this.track = document.getElementById('trackProgress');
            this.timeline = document.querySelector('.timeline-3d');

            if (!this.track || !this.timeline) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', () => this.updateProgress(), { passive: true });
        }

        updateProgress() {
            const rect = this.timeline.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            if (rect.top < windowHeight && rect.bottom > 0) {
                const totalHeight = rect.height;
                const scrolled = windowHeight - rect.top;
                const progress = Math.min(Math.max(scrolled / totalHeight, 0), 1);

                this.track.style.height = `${progress * 100}%`;
            }
        }
    }

    // ==========================================
    // SKILL METERS ANIMATION
    // ==========================================
    class SkillMeters {
        constructor() {
            this.meters = document.querySelectorAll('.meter-item');
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, { threshold: 0.5 });

            this.meters.forEach(meter => observer.observe(meter));
        }
    }

    // ==========================================
    // INITIALIZE EVERYTHING
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        // StringTune Manager (handles all StringTune effects)
        const stringTuneManager = new StringTuneManager();

        // Core systems
        const audioManager = new AudioManager();
        new Preloader();
        new ScrollProgress();
        new Navbar();
        new SmoothScroll();

        // Observers
        new SectionObserver(audioManager);

        // Animations
        new CounterAnimation();
        new Typewriter();
        new SkillMeters();

        // Canvas effects
        new HeroCanvas();
        new NeuralCanvas();

        // Timeline
        new TimelineProgress();

        // Form
        new ContactForm();

        // Click sound
        document.addEventListener('click', (e) => {
            if (e.target.matches('a, button')) {
                audioManager.playClickSound();
            }
        });

        console.log('%c🚀 StringTune Enhanced Portfolio Loaded!', 'color: #f59e0b; font-size: 16px; font-weight: bold;');
        console.log('%c✨ Powered by StringTune effects', 'color: #00d4ff; font-size: 12px;');
        console.log('%c🎵 Click the sound icon to enable audio experience', 'color: #ff00aa; font-size: 12px;');
    });

})();
