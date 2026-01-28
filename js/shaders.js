/**
 * SHADERTOY-STYLE WEBGL EFFECTS
 * Beautiful animated shader backgrounds
 */

(function() {
    'use strict';

    // ==========================================
    // SHADER MANAGER
    // ==========================================
    class ShaderManager {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;

            this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            if (!this.gl) {
                console.warn('WebGL not supported, falling back to CSS animations');
                return;
            }

            this.programs = {};
            this.currentProgram = null;
            this.startTime = Date.now();
            this.mouse = { x: 0.5, y: 0.5 };
            this.targetMouse = { x: 0.5, y: 0.5 };
            this.isRunning = false;
            this.scrollProgress = 0;

            this.init();
        }

        init() {
            this.resize();
            this.setupShaders();
            this.setupEventListeners();
            this.start();
        }

        // Vertex shader - simple fullscreen quad
        getVertexShader() {
            return `
                attribute vec2 a_position;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }
            `;
        }

        // Fragment Shader: Golden Aurora Effect
        getAuroraShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;
                uniform float u_scroll;

                #define PI 3.14159265359

                // Simplex noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                       -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                           + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                           dot(x12.zw,x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    for (int i = 0; i < 6; i++) {
                        value += amplitude * snoise(p * frequency);
                        frequency *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    vec2 p = uv * 2.0 - 1.0;
                    p.x *= u_resolution.x / u_resolution.y;

                    float time = u_time * 0.3;

                    // Mouse influence
                    vec2 mouseInfluence = (u_mouse - 0.5) * 0.3;
                    p += mouseInfluence * (1.0 - length(p) * 0.5);

                    // Create flowing aurora waves
                    float n1 = fbm(p * 1.5 + time * 0.5);
                    float n2 = fbm(p * 2.0 - time * 0.3 + vec2(5.2, 1.3));
                    float n3 = fbm(p * 0.8 + time * 0.2 + vec2(n1, n2) * 0.5);

                    // Wave patterns
                    float wave1 = sin(p.x * 3.0 + time + n1 * 2.0) * 0.5 + 0.5;
                    float wave2 = sin(p.y * 2.5 - time * 0.7 + n2 * 2.0) * 0.5 + 0.5;
                    float wave3 = sin((p.x + p.y) * 2.0 + time * 0.5 + n3 * 3.0) * 0.5 + 0.5;

                    // Golden amber color palette
                    vec3 color1 = vec3(0.95, 0.65, 0.15);  // Bright gold
                    vec3 color2 = vec3(0.85, 0.45, 0.02);  // Deep amber
                    vec3 color3 = vec3(0.92, 0.58, 0.25);  // Warm orange-gold
                    vec3 color4 = vec3(0.12, 0.16, 0.23);  // Dark slate blue

                    // Mix colors based on noise and waves
                    vec3 col = mix(color4, color1, wave1 * n3 * 0.8);
                    col = mix(col, color2, wave2 * n1 * 0.6);
                    col = mix(col, color3, wave3 * n2 * 0.4);

                    // Add glow effect
                    float glow = pow(n3 * 0.5 + 0.5, 3.0) * 0.4;
                    col += color1 * glow;

                    // Vignette
                    float vignette = 1.0 - length(uv - 0.5) * 0.8;
                    vignette = smoothstep(0.0, 1.0, vignette);
                    col *= vignette;

                    // Add subtle sparkles
                    float sparkle = pow(snoise(p * 20.0 + time * 2.0) * 0.5 + 0.5, 12.0);
                    col += vec3(1.0, 0.9, 0.7) * sparkle * 0.3;

                    // Overall brightness adjustment
                    col = pow(col, vec3(0.95));

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Fragment Shader: Flowing Light Rays
        getLightRaysShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                #define PI 3.14159265359

                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }

                float fbm(vec2 p) {
                    float v = 0.0;
                    float a = 0.5;
                    vec2 shift = vec2(100.0);
                    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
                    for (int i = 0; i < 5; i++) {
                        v += a * noise(p);
                        p = rot * p * 2.0 + shift;
                        a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

                    float time = u_time * 0.2;

                    // Ray origin (follows mouse slightly)
                    vec2 rayOrigin = mix(vec2(0.0, 0.5), u_mouse, 0.3);
                    rayOrigin = rayOrigin * 2.0 - 1.0;
                    rayOrigin.x *= u_resolution.x / u_resolution.y;

                    // Direction from ray origin
                    vec2 dir = p - rayOrigin * 0.5;
                    float angle = atan(dir.y, dir.x);
                    float dist = length(dir);

                    // Create light rays
                    float rays = 0.0;
                    for (int i = 0; i < 12; i++) {
                        float offset = float(i) * PI / 6.0;
                        float ray = sin(angle * 8.0 + offset + time * 2.0);
                        ray = pow(max(ray, 0.0), 3.0);
                        ray *= exp(-dist * 1.5);
                        ray *= fbm(vec2(angle * 2.0 + time, dist * 3.0)) * 0.5 + 0.5;
                        rays += ray * 0.15;
                    }

                    // Color gradient
                    vec3 color1 = vec3(0.95, 0.65, 0.1);   // Gold
                    vec3 color2 = vec3(0.92, 0.45, 0.05);  // Orange
                    vec3 color3 = vec3(0.08, 0.1, 0.15);   // Dark

                    vec3 col = mix(color3, color1, rays);
                    col = mix(col, color2, rays * sin(time + dist * 3.0) * 0.5 + 0.5);

                    // Central glow
                    float centerGlow = exp(-length(p - rayOrigin * 0.3) * 2.0);
                    col += color1 * centerGlow * 0.4;

                    // Add noise texture
                    float n = fbm(p * 5.0 + time);
                    col += vec3(0.95, 0.75, 0.5) * n * 0.05;

                    // Vignette
                    col *= 1.0 - length(uv - 0.5) * 0.6;

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Fragment Shader: Fluid Gold Simulation
        getFluidShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;
                uniform float u_scroll;

                #define PI 3.14159265359

                // Rotation matrix
                mat2 rot(float a) {
                    float c = cos(a), s = sin(a);
                    return mat2(c, -s, s, c);
                }

                // Hash function
                float hash21(vec2 p) {
                    p = fract(p * vec2(234.34, 435.345));
                    p += dot(p, p + 34.23);
                    return fract(p.x * p.y);
                }

                // Smooth noise
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);

                    float a = hash21(i);
                    float b = hash21(i + vec2(1, 0));
                    float c = hash21(i + vec2(0, 1));
                    float d = hash21(i + vec2(1, 1));

                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }

                // Fluid-like domain warping
                float warp(vec2 p, float time) {
                    float t = time * 0.3;

                    vec2 q = vec2(
                        noise(p + vec2(0.0, 0.0) + t),
                        noise(p + vec2(5.2, 1.3) - t * 0.5)
                    );

                    vec2 r = vec2(
                        noise(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.7),
                        noise(p + 4.0 * q + vec2(8.3, 2.8) - t * 0.4)
                    );

                    return noise(p + 4.0 * r);
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

                    float time = u_time;

                    // Mouse influence creates ripples
                    vec2 mousePos = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
                    float mouseDist = length(p - mousePos);
                    float mouseInfluence = exp(-mouseDist * 3.0) * 0.3;

                    // Warp the space
                    p *= rot(time * 0.05 + mouseInfluence);
                    p += mousePos * 0.2;

                    // Multi-layer fluid effect
                    float f1 = warp(p * 2.0, time);
                    float f2 = warp(p * 3.0 + vec2(10.0), time * 1.2);
                    float f3 = warp(p * 1.5 - vec2(5.0), time * 0.8);

                    // Combine layers
                    float f = f1 * 0.5 + f2 * 0.3 + f3 * 0.2;
                    f = pow(f, 1.2);

                    // Golden color palette
                    vec3 col1 = vec3(0.98, 0.85, 0.55);  // Light gold
                    vec3 col2 = vec3(0.85, 0.55, 0.08);  // Deep amber
                    vec3 col3 = vec3(0.95, 0.70, 0.20);  // Warm gold
                    vec3 col4 = vec3(0.06, 0.08, 0.12);  // Very dark

                    // Create color based on fluid pattern
                    vec3 col = mix(col4, col2, smoothstep(0.2, 0.5, f));
                    col = mix(col, col3, smoothstep(0.4, 0.7, f));
                    col = mix(col, col1, smoothstep(0.6, 0.9, f));

                    // Add highlights
                    float highlight = pow(f, 4.0);
                    col += col1 * highlight * 0.5;

                    // Mouse glow
                    col += col3 * mouseInfluence * 2.0;

                    // Subtle vignette
                    col *= 1.0 - pow(length(uv - 0.5) * 1.2, 2.0) * 0.4;

                    // Tone mapping
                    col = col / (col + vec3(1.0));
                    col = pow(col, vec3(0.9));

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Fragment Shader: Particle Field
        getParticleFieldShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                #define PI 3.14159265359
                #define NUM_PARTICLES 80.0

                float hash(float n) {
                    return fract(sin(n) * 43758.5453);
                }

                vec2 hash2(float n) {
                    return fract(sin(vec2(n, n + 1.0)) * vec2(43758.5453, 22578.1459));
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

                    float time = u_time * 0.5;

                    // Background gradient
                    vec3 bg1 = vec3(0.04, 0.05, 0.08);
                    vec3 bg2 = vec3(0.08, 0.06, 0.04);
                    vec3 col = mix(bg1, bg2, uv.y);

                    // Mouse position
                    vec2 mousePos = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

                    // Draw particles
                    for (float i = 0.0; i < NUM_PARTICLES; i++) {
                        vec2 pos = hash2(i * 17.23);
                        float size = hash(i * 31.17) * 0.015 + 0.003;
                        float speed = hash(i * 47.91) * 0.3 + 0.1;
                        float phase = hash(i * 73.13) * PI * 2.0;

                        // Particle movement
                        pos.x = fract(pos.x + time * speed * 0.2);
                        pos.y = fract(pos.y + sin(time * speed + phase) * 0.1 + time * speed * 0.05);

                        // Convert to centered coordinates
                        vec2 particlePos = (pos - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                        // Mouse attraction
                        vec2 toMouse = mousePos - particlePos;
                        float mouseDist = length(toMouse);
                        particlePos += toMouse * exp(-mouseDist * 3.0) * 0.3;

                        // Distance from current pixel
                        float d = length(p - particlePos);

                        // Particle color (golden tones)
                        float brightness = hash(i * 89.37) * 0.5 + 0.5;
                        vec3 particleCol = mix(
                            vec3(0.95, 0.65, 0.15),
                            vec3(0.92, 0.50, 0.10),
                            hash(i * 113.59)
                        );

                        // Glow effect
                        float glow = size / d;
                        glow = pow(glow, 1.5) * brightness;
                        glow *= 0.15;

                        // Core
                        float core = smoothstep(size, size * 0.3, d);

                        col += particleCol * (glow + core * 0.5);
                    }

                    // Connection lines between nearby particles
                    float lines = 0.0;
                    for (float i = 0.0; i < 30.0; i++) {
                        vec2 pos1 = hash2(i * 17.23);
                        pos1.x = fract(pos1.x + time * (hash(i * 31.17) * 0.3 + 0.1) * 0.2);
                        pos1 = (pos1 - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                        for (float j = i + 1.0; j < 30.0; j++) {
                            vec2 pos2 = hash2(j * 17.23);
                            pos2.x = fract(pos2.x + time * (hash(j * 31.17) * 0.3 + 0.1) * 0.2);
                            pos2 = (pos2 - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                            float particleDist = length(pos1 - pos2);
                            if (particleDist < 0.4) {
                                // Line segment distance
                                vec2 pa = p - pos1;
                                vec2 ba = pos2 - pos1;
                                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                                float d = length(pa - ba * h);

                                float line = smoothstep(0.003, 0.0, d);
                                line *= (1.0 - particleDist / 0.4) * 0.3;
                                lines += line;
                            }
                        }
                    }
                    col += vec3(0.9, 0.6, 0.2) * lines;

                    // Vignette
                    col *= 1.0 - pow(length(uv - 0.5) * 1.3, 2.0) * 0.5;

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        setupShaders() {
            const shaders = {
                aurora: this.getAuroraShader(),
                lightRays: this.getLightRaysShader(),
                fluid: this.getFluidShader(),
                particles: this.getParticleFieldShader()
            };

            for (const [name, fragmentSource] of Object.entries(shaders)) {
                const program = this.createProgram(this.getVertexShader(), fragmentSource);
                if (program) {
                    this.programs[name] = {
                        program: program,
                        uniforms: {
                            resolution: this.gl.getUniformLocation(program, 'u_resolution'),
                            time: this.gl.getUniformLocation(program, 'u_time'),
                            mouse: this.gl.getUniformLocation(program, 'u_mouse'),
                            scroll: this.gl.getUniformLocation(program, 'u_scroll')
                        }
                    };
                }
            }

            // Setup vertex buffer
            const buffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
                -1, -1, 1, -1, -1, 1,
                -1, 1, 1, -1, 1, 1
            ]), this.gl.STATIC_DRAW);

            // Set default program
            this.setProgram('aurora');
        }

        createProgram(vertexSource, fragmentSource) {
            const gl = this.gl;

            const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
            const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

            if (!vertexShader || !fragmentShader) return null;

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(program));
                return null;
            }

            return program;
        }

        compileShader(type, source) {
            const gl = this.gl;
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }

        setProgram(name) {
            if (this.programs[name]) {
                this.currentProgram = this.programs[name];
                this.gl.useProgram(this.currentProgram.program);

                // Setup attribute
                const positionLocation = this.gl.getAttribLocation(this.currentProgram.program, 'a_position');
                this.gl.enableVertexAttribArray(positionLocation);
                this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
            }
        }

        setupEventListeners() {
            // Resize handler
            window.addEventListener('resize', () => this.resize());

            // Mouse tracking
            document.addEventListener('mousemove', (e) => {
                this.targetMouse.x = e.clientX / window.innerWidth;
                this.targetMouse.y = 1.0 - e.clientY / window.innerHeight;
            });

            // Touch tracking
            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    this.targetMouse.x = e.touches[0].clientX / window.innerWidth;
                    this.targetMouse.y = 1.0 - e.touches[0].clientY / window.innerHeight;
                }
            });

            // Scroll tracking
            window.addEventListener('scroll', () => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                this.scrollProgress = window.pageYOffset / scrollHeight;
            });

            // Visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stop();
                } else {
                    this.start();
                }
            });
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio, 2);
            this.canvas.width = this.canvas.offsetWidth * dpr;
            this.canvas.height = this.canvas.offsetHeight * dpr;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        render() {
            if (!this.isRunning || !this.currentProgram) return;

            const gl = this.gl;
            const uniforms = this.currentProgram.uniforms;

            // Smooth mouse interpolation
            this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
            this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

            // Set uniforms
            gl.uniform2f(uniforms.resolution, this.canvas.width, this.canvas.height);
            gl.uniform1f(uniforms.time, (Date.now() - this.startTime) / 1000);
            gl.uniform2f(uniforms.mouse, this.mouse.x, this.mouse.y);
            gl.uniform1f(uniforms.scroll, this.scrollProgress);

            // Draw
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            requestAnimationFrame(() => this.render());
        }

        start() {
            this.isRunning = true;
            this.render();
        }

        stop() {
            this.isRunning = false;
        }

        // Switch shader effect
        switchEffect(name) {
            if (this.programs[name]) {
                this.setProgram(name);
            }
        }
    }

    // ==========================================
    // SECTION-SPECIFIC SHADER BACKGROUNDS
    // ==========================================
    class SectionShaders {
        constructor() {
            this.managers = {};
            this.init();
        }

        init() {
            // Initialize shader for hero section
            const heroShader = document.getElementById('shaderCanvas');
            if (heroShader) {
                this.managers.hero = new ShaderManager('shaderCanvas');
            }

            // Setup section transitions
            this.setupSectionObserver();
        }

        setupSectionObserver() {
            const sections = document.querySelectorAll('section[data-shader]');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const shader = entry.target.dataset.shader;
                        if (this.managers.hero && shader) {
                            this.managers.hero.switchEffect(shader);
                        }
                    }
                });
            }, { threshold: [0.5] });

            sections.forEach(section => observer.observe(section));
        }
    }

    // ==========================================
    // INITIALIZE ON DOM READY
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.sectionShaders = new SectionShaders();
            console.log('%c🎨 ShaderToy Effects Initialized', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
        });
    } else {
        window.sectionShaders = new SectionShaders();
        console.log('%c🎨 ShaderToy Effects Initialized', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
    }

})();
