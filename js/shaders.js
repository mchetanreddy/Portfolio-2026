/**
 * SHADERTOY-STYLE WEBGL EFFECTS
 * Gyroid 3D structure with golden amber theme
 * Based on ShaderToy shader tXtyW8
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
            this.mouseDown = false;
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

        // Fragment Shader: Gyroid 3D Structure (Golden Amber Theme)
        getGyroidShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;
                uniform float u_mouseDown;

                #define FAR 30.0
                #define PI 3.1415

                int material = 0;

                mat2 rot(float a) {
                    float c = cos(a), s = sin(a);
                    return mat2(c, -s, s, c);
                }

                mat3 lookAt(vec3 dir) {
                    vec3 up = vec3(0., 1., 0.);
                    vec3 rt = normalize(cross(dir, up));
                    return mat3(rt, cross(rt, dir), dir);
                }

                float gyroid(vec3 p) {
                    return dot(cos(p), sin(p.zxy)) + 1.;
                }

                float map(vec3 p) {
                    float r = 1e5, d;

                    d = gyroid(p);
                    if (d < r) { r = d; material = 1; }

                    d = gyroid(p - vec3(0, 0, PI));
                    if (d < r) { r = d; material = 2; }

                    return r;
                }

                float raymarch(vec3 ro, vec3 rd) {
                    float t = 0.;
                    for (int i = 0; i < 100; i++) {
                        float d = map(ro + rd * t);
                        if (abs(d) < .001) break;
                        t += d;
                        if (t > FAR) break;
                    }
                    return t;
                }

                float getAO(vec3 p, vec3 sn) {
                    float occ = 0.;
                    for (float i = 0.; i < 4.; i++) {
                        float t = i * .08;
                        float d = map(p + sn * t);
                        occ += t - d;
                    }
                    return clamp(1. - occ, 0., 1.);
                }

                vec3 getNormal(vec3 p) {
                    vec2 e = vec2(0.5773, -0.5773) * 0.001;
                    return normalize(
                        e.xyy * map(p + e.xyy) +
                        e.yyx * map(p + e.yyx) +
                        e.yxy * map(p + e.yxy) +
                        e.xxx * map(p + e.xxx)
                    );
                }

                vec3 trace(vec3 ro, vec3 rd) {
                    vec3 C = vec3(0);
                    vec3 throughput = vec3(1);

                    for (int bounce = 0; bounce < 2; bounce++) {
                        float d = raymarch(ro, rd);
                        if (d > FAR) { break; }

                        // fog - warm dark tone
                        float fog = 1. - exp(-.008 * d * d);
                        C += throughput * fog * vec3(0.02, 0.01, 0.0);
                        throughput *= 1. - fog;

                        vec3 p = ro + rd * d;
                        vec3 sn = normalize(getNormal(p) + pow(abs(cos(p * 64.)), vec3(16)) * .1);

                        // lighting
                        vec3 lp = vec3(10., -10., -10. + ro.z);
                        vec3 ld = normalize(lp - p);
                        float diff = max(0., .5 + 2. * dot(sn, ld));
                        float diff2 = pow(length(sin(sn * 2.) * .5 + .5), 2.);
                        float diff3 = max(0., .5 + .5 * dot(sn, vec3(0., 0., 1.)));

                        float spec = max(0., dot(reflect(-ld, sn), -rd));
                        float fres = 1. - max(0., dot(-rd, sn));
                        vec3 col = vec3(0), alb = vec3(0);

                        // Golden amber lighting
                        col += vec3(.95, .75, .35) * diff;      // Warm gold light
                        col += vec3(.85, .45, .15) * diff2;     // Deep amber
                        col += vec3(.98, .85, .55) * diff3;     // Bright gold rim
                        col += vec3(.95, .80, .60) * pow(spec, 4.) * 8.;  // Golden specular

                        float freck = dot(cos(p * 23.), vec3(1));

                        // Material colors - Golden amber theme
                        if (material == 1) {
                            alb = vec3(.95, .65, .12);  // Bright amber/gold
                            alb *= max(.6, step(2.5, freck));
                        }
                        if (material == 2) {
                            alb = vec3(.15, .12, .08);  // Dark bronze/charcoal
                            alb *= max(.8, step(-2.5, freck));
                        }
                        col *= alb;

                        col *= getAO(p, sn);
                        C += throughput * col;

                        // reflection
                        rd = reflect(rd, sn);
                        ro = p + sn * .01;
                        throughput *= .9 * pow(fres, 1.);
                    }
                    return C;
                }

                void main() {
                    vec2 uv = (gl_FragCoord.xy - u_resolution.xy * .5) / u_resolution.y;
                    vec2 mo = (u_mouse - vec2(0.5)) * 2.0;

                    vec3 ro = vec3(PI / 2., 0, -u_time * .5);
                    vec3 rd = normalize(vec3(uv, -.5));

                    if (u_mouseDown > 0.5) {
                        rd.zy = rot(mo.y * PI) * rd.zy;
                        rd.xz = rot(-mo.x * PI) * rd.xz;
                    } else {
                        rd.xy = rot(sin(u_time * .2)) * rd.xy;
                        vec3 ta = vec3(cos(u_time * .4), sin(u_time * .4), 4.);
                        rd = lookAt(normalize(ta)) * rd;
                    }

                    vec3 col = trace(ro, rd);

                    // Vignette
                    col *= smoothstep(0., 1., 1.2 - length(uv * .9));
                    // Gamma correction
                    col = pow(col, vec3(0.4545));

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Fragment Shader: Simplified Gyroid (for performance on mobile/lower sections)
        getSimpleGyroidShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                #define PI 3.1415

                float gyroid(vec3 p) {
                    return dot(cos(p), sin(p.zxy));
                }

                void main() {
                    vec2 uv = (gl_FragCoord.xy - u_resolution.xy * .5) / u_resolution.y;

                    float time = u_time * 0.3;

                    // Create layered gyroid pattern
                    vec3 p = vec3(uv * 3.0, time);
                    float g1 = gyroid(p) * 0.5 + 0.5;
                    float g2 = gyroid(p * 2.0 + vec3(PI)) * 0.5 + 0.5;
                    float g3 = gyroid(p * 0.5 - vec3(PI * 0.5)) * 0.5 + 0.5;

                    // Combine layers
                    float pattern = g1 * 0.5 + g2 * 0.3 + g3 * 0.2;

                    // Golden amber colors
                    vec3 col1 = vec3(0.95, 0.65, 0.12);  // Bright amber
                    vec3 col2 = vec3(0.12, 0.10, 0.08);  // Dark
                    vec3 col3 = vec3(0.85, 0.50, 0.10);  // Deep gold

                    vec3 col = mix(col2, col1, smoothstep(0.3, 0.7, pattern));
                    col = mix(col, col3, smoothstep(0.5, 0.9, g1));

                    // Add subtle glow
                    float glow = pow(pattern, 3.0) * 0.5;
                    col += vec3(0.95, 0.75, 0.35) * glow;

                    // Vignette
                    col *= 1.0 - length(uv) * 0.4;

                    // Gamma
                    col = pow(col, vec3(0.4545));

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Fragment Shader: Golden Waves
        getWavesShader() {
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

                    float time = u_time * 0.3;

                    // Flowing waves
                    float n1 = fbm(p * 2.0 + time);
                    float n2 = fbm(p * 3.0 - time * 0.5 + vec2(5.0));
                    float n3 = fbm(p * 1.5 + vec2(n1, n2));

                    // Wave patterns
                    float wave1 = sin(p.x * 4.0 + time + n1 * 3.0) * 0.5 + 0.5;
                    float wave2 = sin(p.y * 3.0 - time * 0.7 + n2 * 3.0) * 0.5 + 0.5;

                    // Golden colors
                    vec3 col1 = vec3(0.95, 0.70, 0.20);  // Gold
                    vec3 col2 = vec3(0.85, 0.50, 0.08);  // Amber
                    vec3 col3 = vec3(0.08, 0.06, 0.04);  // Dark

                    vec3 col = mix(col3, col2, wave1 * n3);
                    col = mix(col, col1, wave2 * n1 * 0.7);

                    // Glow
                    float glow = pow(n3, 2.0) * 0.3;
                    col += col1 * glow;

                    // Vignette
                    col *= 1.0 - length(uv - 0.5) * 0.6;

                    col = pow(col, vec3(0.4545));
                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Fragment Shader: Particle Network
        getParticlesShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                #define NUM_PARTICLES 60.0

                float hash(float n) {
                    return fract(sin(n) * 43758.5453);
                }

                vec2 hash2(float n) {
                    return fract(sin(vec2(n, n + 1.0)) * vec2(43758.5453, 22578.1459));
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

                    float time = u_time * 0.4;

                    // Dark warm background
                    vec3 col = vec3(0.04, 0.03, 0.02);

                    vec2 mousePos = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

                    // Draw particles
                    for (float i = 0.0; i < NUM_PARTICLES; i++) {
                        vec2 pos = hash2(i * 17.23);
                        float size = hash(i * 31.17) * 0.012 + 0.004;
                        float speed = hash(i * 47.91) * 0.3 + 0.1;
                        float phase = hash(i * 73.13) * 6.28;

                        pos.x = fract(pos.x + time * speed * 0.15);
                        pos.y = fract(pos.y + sin(time * speed + phase) * 0.08 + time * speed * 0.03);

                        vec2 particlePos = (pos - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                        // Mouse attraction
                        vec2 toMouse = mousePos - particlePos;
                        float mouseDist = length(toMouse);
                        particlePos += toMouse * exp(-mouseDist * 4.0) * 0.25;

                        float d = length(p - particlePos);

                        // Golden particle colors
                        float brightness = hash(i * 89.37) * 0.5 + 0.5;
                        vec3 particleCol = mix(
                            vec3(0.95, 0.70, 0.15),
                            vec3(0.85, 0.50, 0.10),
                            hash(i * 113.59)
                        );

                        float glow = size / d;
                        glow = pow(glow, 1.5) * brightness * 0.12;
                        float core = smoothstep(size, size * 0.3, d);

                        col += particleCol * (glow + core * 0.4);
                    }

                    // Connection lines
                    for (float i = 0.0; i < 25.0; i++) {
                        vec2 pos1 = hash2(i * 17.23);
                        pos1.x = fract(pos1.x + time * (hash(i * 31.17) * 0.3 + 0.1) * 0.15);
                        pos1 = (pos1 - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                        for (float j = i + 1.0; j < 25.0; j++) {
                            vec2 pos2 = hash2(j * 17.23);
                            pos2.x = fract(pos2.x + time * (hash(j * 31.17) * 0.3 + 0.1) * 0.15);
                            pos2 = (pos2 - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                            float particleDist = length(pos1 - pos2);
                            if (particleDist < 0.35) {
                                vec2 pa = p - pos1;
                                vec2 ba = pos2 - pos1;
                                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                                float d = length(pa - ba * h);

                                float line = smoothstep(0.002, 0.0, d);
                                line *= (1.0 - particleDist / 0.35) * 0.25;
                                col += vec3(0.90, 0.65, 0.20) * line;
                            }
                        }
                    }

                    col *= 1.0 - pow(length(uv - 0.5) * 1.2, 2.0) * 0.4;
                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        setupShaders() {
            const shaders = {
                gyroid: this.getGyroidShader(),
                simpleGyroid: this.getSimpleGyroidShader(),
                waves: this.getWavesShader(),
                particles: this.getParticlesShader()
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
                            mouseDown: this.gl.getUniformLocation(program, 'u_mouseDown'),
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

            // Set default program - gyroid for hero
            this.setProgram('gyroid');
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

                const positionLocation = this.gl.getAttribLocation(this.currentProgram.program, 'a_position');
                this.gl.enableVertexAttribArray(positionLocation);
                this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
            }
        }

        setupEventListeners() {
            window.addEventListener('resize', () => this.resize());

            // Mouse tracking
            document.addEventListener('mousemove', (e) => {
                this.targetMouse.x = e.clientX / window.innerWidth;
                this.targetMouse.y = 1.0 - e.clientY / window.innerHeight;
            });

            document.addEventListener('mousedown', () => {
                this.mouseDown = true;
            });

            document.addEventListener('mouseup', () => {
                this.mouseDown = false;
            });

            // Touch tracking
            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    this.targetMouse.x = e.touches[0].clientX / window.innerWidth;
                    this.targetMouse.y = 1.0 - e.touches[0].clientY / window.innerHeight;
                }
            });

            document.addEventListener('touchstart', () => {
                this.mouseDown = true;
            });

            document.addEventListener('touchend', () => {
                this.mouseDown = false;
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
            const dpr = Math.min(window.devicePixelRatio, 1.5); // Limit for performance
            this.canvas.width = this.canvas.offsetWidth * dpr;
            this.canvas.height = this.canvas.offsetHeight * dpr;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        render() {
            if (!this.isRunning || !this.currentProgram) return;

            const gl = this.gl;
            const uniforms = this.currentProgram.uniforms;

            // Smooth mouse interpolation
            this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
            this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

            // Set uniforms
            gl.uniform2f(uniforms.resolution, this.canvas.width, this.canvas.height);
            gl.uniform1f(uniforms.time, (Date.now() - this.startTime) / 1000);
            gl.uniform2f(uniforms.mouse, this.mouse.x, this.mouse.y);
            if (uniforms.mouseDown) {
                gl.uniform1f(uniforms.mouseDown, this.mouseDown ? 1.0 : 0.0);
            }
            if (uniforms.scroll) {
                gl.uniform1f(uniforms.scroll, this.scrollProgress);
            }

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
            const heroShader = document.getElementById('shaderCanvas');
            if (heroShader) {
                this.managers.hero = new ShaderManager('shaderCanvas');
            }

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
            console.log('%c🎨 Gyroid Shader Initialized', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
        });
    } else {
        window.sectionShaders = new SectionShaders();
        console.log('%c🎨 Gyroid Shader Initialized', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
    }

})();
