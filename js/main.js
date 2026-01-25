/**
 * CHETAN REDDY PORTFOLIO - IMMERSIVE EXPERIENCE
 * Advanced interactions, scroll-based audio, and creative effects
 */

(function() {
    'use strict';

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
            const heroElements = document.querySelectorAll('.hero .reveal-up, .hero .reveal-left, .hero .reveal-right');
            heroElements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('revealed');
                }, index * 100);
            });
        }
    }

    // ==========================================
    // CUSTOM CURSOR
    // ==========================================
    class CustomCursor {
        constructor() {
            this.dot = document.getElementById('cursorDot');
            this.outline = document.getElementById('cursorOutline');

            if (!this.dot || !this.outline || window.innerWidth < 768) return;

            this.cursorPos = { x: 0, y: 0 };
            this.outlinePos = { x: 0, y: 0 };
            this.init();
        }

        init() {
            document.addEventListener('mousemove', (e) => {
                this.cursorPos.x = e.clientX;
                this.cursorPos.y = e.clientY;

                this.dot.style.left = `${e.clientX}px`;
                this.dot.style.top = `${e.clientY}px`;
            });

            // Smooth outline following
            this.animateOutline();

            // Hover effects
            const interactiveElements = document.querySelectorAll('a, button, .service-card, .project-card, .skill-orb, input, textarea');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => this.outline.classList.add('hover'));
                el.addEventListener('mouseleave', () => this.outline.classList.remove('hover'));
            });
        }

        animateOutline() {
            this.outlinePos.x += (this.cursorPos.x - this.outlinePos.x) * 0.15;
            this.outlinePos.y += (this.cursorPos.y - this.outlinePos.y) * 0.15;

            this.outline.style.left = `${this.outlinePos.x}px`;
            this.outline.style.top = `${this.outlinePos.y}px`;

            requestAnimationFrame(() => this.animateOutline());
        }
    }

    // ==========================================
    // SCROLL PROGRESS
    // ==========================================
    class ScrollProgress {
        constructor() {
            this.progressBar = document.getElementById('scrollProgress');
            if (!this.progressBar) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', () => this.updateProgress());
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
            window.addEventListener('scroll', () => this.onScroll());

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
    // REVEAL ON SCROLL
    // ==========================================
    class RevealOnScroll {
        constructor(audioManager) {
            this.audioManager = audioManager;
            this.elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
            this.sections = document.querySelectorAll('section[id]');

            this.init();
        }

        init() {
            // Reveal elements
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

            // Section observer for audio
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                        const sectionId = entry.target.id;
                        this.audioManager?.changeSection(sectionId);
                    }
                });
            }, { threshold: 0.3 });

            this.sections.forEach(section => sectionObserver.observe(section));

            // Meter items
            const meterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, { threshold: 0.5 });

            document.querySelectorAll('.meter-item').forEach(item => {
                meterObserver.observe(item);
            });
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
                    color: `rgba(0, 255, 136, ${Math.random() * 0.5 + 0.2})`
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
                        this.ctx.strokeStyle = `rgba(0, 255, 136, ${0.15 * (1 - distance / 150)})`;
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
                this.ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            });

            // Draw nodes
            this.nodes.forEach(node => {
                node.pulse += 0.03;
                const pulseSize = 1 + 0.3 * Math.sin(node.pulse);

                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius * pulseSize, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
                this.ctx.fill();

                // Glow
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, node.radius * pulseSize * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
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
    // TILT EFFECT FOR CARDS
    // ==========================================
    class TiltEffect {
        constructor() {
            if (window.innerWidth < 1024) return;

            this.cards = document.querySelectorAll('[data-tilt]');
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

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        }

        onMouseLeave(e, card) {
            card.style.transform = '';
        }
    }

    // ==========================================
    // PARALLAX BACKGROUNDS
    // ==========================================
    class ParallaxBackgrounds {
        constructor() {
            this.bgImages = document.querySelectorAll('.bg-image');
            if (!this.bgImages.length) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', () => this.onScroll());
        }

        onScroll() {
            const scrolled = window.pageYOffset;

            this.bgImages.forEach(bg => {
                const section = bg.closest('.section');
                if (!section) return;

                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrolled + window.innerHeight > sectionTop && scrolled < sectionTop + sectionHeight) {
                    const progress = (scrolled - sectionTop + window.innerHeight) / (sectionHeight + window.innerHeight);
                    const yPos = (progress - 0.5) * 50;
                    bg.style.transform = `translateY(${yPos}px) scale(1.1)`;
                }
            });
        }
    }

    // ==========================================
    // MAGNETIC BUTTONS
    // ==========================================
    class MagneticButtons {
        constructor() {
            if (window.innerWidth < 768) return;

            this.buttons = document.querySelectorAll('.btn-magnetic, .btn-primary');
            this.init();
        }

        init() {
            this.buttons.forEach(btn => {
                btn.addEventListener('mousemove', (e) => this.onMouseMove(e, btn));
                btn.addEventListener('mouseleave', (e) => this.onMouseLeave(e, btn));
            });
        }

        onMouseMove(e, btn) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        }

        onMouseLeave(e, btn) {
            btn.style.transform = '';
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
            window.addEventListener('scroll', () => this.updateProgress());
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
    // ACTIVE NAV LINK
    // ==========================================
    class ActiveNavLink {
        constructor() {
            this.sections = document.querySelectorAll('section[id]');
            this.navLinks = document.querySelectorAll('.nav-link');

            if (!this.sections.length) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', () => this.onScroll());
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
    // FLOATING SHAPES PARALLAX
    // ==========================================
    class FloatingShapesParallax {
        constructor() {
            this.shapes = document.querySelectorAll('.floating-shape, .floating-orb');
            if (!this.shapes.length) return;

            this.init();
        }

        init() {
            document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        }

        onMouseMove(e) {
            const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

            this.shapes.forEach((shape, index) => {
                const speed = 10 + (index * 5);
                const x = mouseX * speed;
                const y = mouseY * speed;
                shape.style.transform = `translate(${x}px, ${y}px)`;
            });
        }
    }

    // ==========================================
    // INITIALIZE EVERYTHING
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        // Core systems
        const audioManager = new AudioManager();
        new Preloader();
        new CustomCursor();
        new ScrollProgress();
        new Navbar();
        new SmoothScroll();

        // Animations
        new RevealOnScroll(audioManager);
        new CounterAnimation();
        new Typewriter();

        // Canvas effects
        new HeroCanvas();
        new NeuralCanvas();

        // Interactions
        new TiltEffect();
        new ParallaxBackgrounds();
        new MagneticButtons();
        new TimelineProgress();
        new ActiveNavLink();
        new FloatingShapesParallax();

        // Form
        new ContactForm();

        // Click sound
        document.addEventListener('click', (e) => {
            if (e.target.matches('a, button')) {
                audioManager.playClickSound();
            }
        });

        console.log('%c🚀 Immersive Portfolio Loaded!', 'color: #00ff88; font-size: 16px; font-weight: bold;');
        console.log('%c🎵 Click the sound icon to enable audio experience', 'color: #00d4ff; font-size: 12px;');
    });

})();
