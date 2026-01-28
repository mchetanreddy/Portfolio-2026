/**
 * SHADERTOY-STYLE WEBGL EFFECTS
 * Fractal Art shader by Kishimisu with golden amber theme
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

        getVertexShader() {
            return `
                attribute vec2 a_position;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }
            `;
        }

        // Fragment Shader: Abstract Geometric Tunnel (Golden Amber Theme)
        getTunnelShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                float map(vec3 p) {
                    vec3 n = vec3(0.0, 1.0, 0.0);
                    float k1 = 1.9;
                    float k2 = (sin(p.x * k1) + sin(p.z * k1)) * 0.8;
                    float k3 = (sin(p.y * k1) + sin(p.z * k1)) * 0.8;
                    float w1 = 4.0 - dot(abs(p), normalize(n)) + k2;
                    float w2 = 4.0 - dot(abs(p), normalize(n.yzx)) + k3;
                    float s1 = length(mod(p.xy + vec2(sin((p.z + p.x) * 2.0) * 0.3, cos((p.z + p.x) * 1.0) * 0.5), 2.0) - 1.0) - 0.2;
                    float s2 = length(mod(0.5 + p.yz + vec2(sin((p.z + p.x) * 2.0) * 0.3, cos((p.z + p.x) * 1.0) * 0.3), 2.0) - 1.0) - 0.2;
                    return min(w1, min(w2, min(s1, s2)));
                }

                vec2 rot(vec2 p, float a) {
                    return vec2(
                        p.x * cos(a) - p.y * sin(a),
                        p.x * sin(a) + p.y * cos(a));
                }

                void main() {
                    float time = u_time;
                    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
                    uv.x *= u_resolution.x / u_resolution.y;

                    vec3 dir = normalize(vec3(uv, 1.0));
                    dir.xz = rot(dir.xz, time * 0.23);
                    dir = dir.yzx;
                    dir.xz = rot(dir.xz, time * 0.2);
                    dir = dir.yzx;

                    vec3 pos = vec3(0.0, 0.0, time);
                    vec3 col = vec3(0.0);
                    float t = 0.0;
                    float tt = 0.0;

                    for(int i = 0; i < 80; i++) {
                        tt = map(pos + dir * t);
                        if(tt < 0.001) break;
                        t += tt * 0.45;
                    }

                    vec3 ip = pos + dir * t;
                    col = vec3(t * 0.1);
                    col = sqrt(col);

                    // Golden amber color theme
                    vec3 baseCol = vec3(0.95, 0.6, 0.15);  // Amber
                    vec3 accentCol = vec3(0.85, 0.4, 0.1); // Deep orange

                    vec4 finalCol = vec4(0.05 * t + abs(dir) * col + max(0.0, map(ip - 0.1) - tt), 1.0);

                    // Apply amber tint
                    finalCol.rgb = mix(finalCol.rgb, baseCol * finalCol.rgb, 0.6);
                    finalCol.rgb += accentCol * (1.0 / (t * t + 1.0)) * 0.3;

                    // Alpha based on distance
                    finalCol.a = clamp(1.0 / (t * t * t * t * 0.01 + 0.1), 0.0, 1.0);

                    // Tone mapping
                    finalCol.rgb = pow(finalCol.rgb, vec3(0.85));

                    gl_FragColor = vec4(finalCol.rgb, 1.0);
                }
            `;
        }

        // Simplified Tunnel for other sections
        getSimpleTunnelShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                float map(vec3 p) {
                    float k1 = 1.5;
                    float k2 = (sin(p.x * k1) + sin(p.z * k1)) * 0.6;
                    float w1 = 3.0 - length(p.xy) + k2;
                    float s1 = length(mod(p.xy, 2.0) - 1.0) - 0.3;
                    return min(w1, s1);
                }

                vec2 rot(vec2 p, float a) {
                    float c = cos(a), s = sin(a);
                    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
                }

                void main() {
                    float time = u_time * 0.5;
                    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
                    uv.x *= u_resolution.x / u_resolution.y;

                    vec3 dir = normalize(vec3(uv, 1.0));
                    dir.xz = rot(dir.xz, time * 0.15);

                    vec3 pos = vec3(0.0, 0.0, time * 2.0);
                    float t = 0.0;

                    for(int i = 0; i < 50; i++) {
                        float d = map(pos + dir * t);
                        if(d < 0.01) break;
                        t += d * 0.5;
                    }

                    vec3 col = vec3(t * 0.08);
                    col = sqrt(col);

                    // Amber tint
                    col *= vec3(0.95, 0.65, 0.2);
                    col += vec3(0.85, 0.45, 0.1) * (1.0 / (t + 1.0)) * 0.2;

                    // Vignette
                    vec2 vuv = gl_FragCoord.xy / u_resolution.xy;
                    col *= pow(16.0 * vuv.x * vuv.y * (1.0 - vuv.x) * (1.0 - vuv.y), 0.15);

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Electric Noise shader (previous favorite)
        getElectricShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                #define time u_time * 0.15
                #define tau 6.2831853

                mat2 makem2(float theta) {
                    float c = cos(theta);
                    float s = sin(theta);
                    return mat2(c, -s, s, c);
                }

                float hash(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
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
                    float z = 2.0;
                    float rz = 0.0;
                    for (float i = 1.0; i < 6.0; i++) {
                        rz += abs((noise(p) - 0.5) * 2.0) / z;
                        z = z * 2.0;
                        p = p * 2.0;
                    }
                    return rz;
                }

                float dualfbm(vec2 p) {
                    vec2 p2 = p * 0.7;
                    vec2 basis = vec2(fbm(p2 - time * 1.6), fbm(p2 + time * 1.7));
                    basis = (basis - 0.5) * 0.2;
                    p += basis;
                    return fbm(p * makem2(time * 0.2));
                }

                float circ(vec2 p) {
                    float r = length(p);
                    r = log(sqrt(r));
                    return abs(mod(r * 4.0, tau) - 3.14159) * 3.0 + 0.2;
                }

                void main() {
                    vec2 p = gl_FragCoord.xy / u_resolution.xy - 0.5;
                    p.x *= u_resolution.x / u_resolution.y;
                    p *= 4.0;

                    float rz = dualfbm(p);
                    p /= exp(mod(time * 10.0, 3.14159));
                    rz *= pow(abs((0.1 - circ(p))), 0.9);

                    vec3 col = vec3(0.4, 0.2, 0.05) / rz;
                    col = pow(abs(col), vec3(0.99));

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Golden Waves shader
        getWavesShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

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

                    float n1 = fbm(p * 2.0 + time);
                    float n2 = fbm(p * 3.0 - time * 0.5 + vec2(5.0));
                    float n3 = fbm(p * 1.5 + vec2(n1, n2));

                    float wave1 = sin(p.x * 4.0 + time + n1 * 3.0) * 0.5 + 0.5;
                    float wave2 = sin(p.y * 3.0 - time * 0.7 + n2 * 3.0) * 0.5 + 0.5;

                    vec3 col1 = vec3(0.95, 0.70, 0.20);
                    vec3 col2 = vec3(0.85, 0.50, 0.08);
                    vec3 col3 = vec3(0.05, 0.04, 0.02);

                    vec3 col = mix(col3, col2, wave1 * n3);
                    col = mix(col, col1, wave2 * n1 * 0.7);

                    float glow = pow(n3, 2.0) * 0.3;
                    col += col1 * glow;

                    col *= 1.0 - length(uv - 0.5) * 0.6;
                    col = pow(col, vec3(0.4545));

                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Particle Network shader
        getParticlesShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                #define NUM_PARTICLES 50.0

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

                    vec3 col = vec3(0.03, 0.025, 0.015);

                    vec2 mousePos = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

                    for (float i = 0.0; i < NUM_PARTICLES; i++) {
                        vec2 pos = hash2(i * 17.23);
                        float size = hash(i * 31.17) * 0.01 + 0.004;
                        float speed = hash(i * 47.91) * 0.3 + 0.1;
                        float phase = hash(i * 73.13) * 6.28;

                        pos.x = fract(pos.x + time * speed * 0.12);
                        pos.y = fract(pos.y + sin(time * speed + phase) * 0.06 + time * speed * 0.02);

                        vec2 particlePos = (pos - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                        vec2 toMouse = mousePos - particlePos;
                        float mouseDist = length(toMouse);
                        particlePos += toMouse * exp(-mouseDist * 4.0) * 0.2;

                        float d = length(p - particlePos);

                        float brightness = hash(i * 89.37) * 0.5 + 0.5;
                        vec3 particleCol = mix(
                            vec3(0.95, 0.70, 0.15),
                            vec3(0.85, 0.50, 0.10),
                            hash(i * 113.59)
                        );

                        float glow = size / d;
                        glow = pow(glow, 1.5) * brightness * 0.1;
                        float core = smoothstep(size, size * 0.3, d);

                        col += particleCol * (glow + core * 0.35);
                    }

                    for (float i = 0.0; i < 20.0; i++) {
                        vec2 pos1 = hash2(i * 17.23);
                        pos1.x = fract(pos1.x + time * (hash(i * 31.17) * 0.3 + 0.1) * 0.12);
                        pos1 = (pos1 - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                        for (float j = i + 1.0; j < 20.0; j++) {
                            vec2 pos2 = hash2(j * 17.23);
                            pos2.x = fract(pos2.x + time * (hash(j * 31.17) * 0.3 + 0.1) * 0.12);
                            pos2 = (pos2 - 0.5) * vec2(u_resolution.x / u_resolution.y * 2.0, 2.0);

                            float particleDist = length(pos1 - pos2);
                            if (particleDist < 0.3) {
                                vec2 pa = p - pos1;
                                vec2 ba = pos2 - pos1;
                                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                                float d = length(pa - ba * h);

                                float line = smoothstep(0.002, 0.0, d);
                                line *= (1.0 - particleDist / 0.3) * 0.2;
                                col += vec3(0.90, 0.65, 0.20) * line;
                            }
                        }
                    }

                    col *= 1.0 - pow(length(uv - 0.5) * 1.2, 2.0) * 0.35;
                    gl_FragColor = vec4(col, 1.0);
                }
            `;
        }

        // Mandelbrot shader
        getMandelbrotShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                void main() {
                    vec2 fragCoord = gl_FragCoord.xy;
                    vec3 col = vec3(0);

                    vec2 p = (fragCoord - u_resolution.xy * 0.5) / u_resolution.y;

                    float ttm = cos(sin(u_time / 8.0)) * 6.2831;
                    float c = cos(ttm), s = sin(ttm);
                    p = mat2(c, s, -s, c) * p;
                    p -= vec2(cos(u_time / 2.0) / 2.0, sin(u_time / 3.0) / 5.0);

                    float zm = 200.0 + sin(u_time / 7.0) * 50.0;
                    vec2 cc = vec2(-0.57735 + 0.004, 0.57735) + p / zm;

                    vec2 z = vec2(0), dz = vec2(0);
                    int ik = 80;

                    for (int k = 0; k < 80; k++) {
                        dz = mat2(z, -z.y, z.x) * dz * 2.0 + vec2(1, 0);
                        z = mat2(z, -z.y, z.x) * z + cc;
                        if (dot(z, z) > 200.0) {
                            ik = k;
                            break;
                        }
                    }

                    float ln = step(0.0, length(z) / 15.5 - 1.0);
                    float d = sqrt(1.0 / max(length(dz), 0.0001)) * log(dot(z, z));
                    d = clamp(d * 50.0, 0.0, 1.0);

                    float dir = mod(float(ik), 2.0) < 0.5 ? -1.0 : 1.0;
                    float sh = float(80 - ik) / 80.0;
                    vec2 tuv = z / 320.0;

                    float tm = -ttm * sh * sh * 16.0;
                    float ct = cos(tm), st = sin(tm);
                    tuv = mat2(ct, st, -st, ct) * tuv;
                    tuv = abs(mod(tuv, 1.0 / 8.0) - 1.0 / 16.0);

                    float invDz = 1.0 / max(length(dz), 0.001);
                    float pat = smoothstep(0.0, invDz, length(tuv) - 1.0 / 32.0);
                    pat = min(pat, smoothstep(0.0, invDz, abs(max(tuv.x, tuv.y) - 1.0 / 16.0) - 0.04 / 16.0));

                    vec3 lCol = pow(min(vec3(1.5, 1.1, 0.4) * min(d * 0.85, 0.96), 1.0), vec3(1, 2, 8)) * 1.15;

                    if (dir < 0.0) {
                        lCol = lCol * min(pat, ln);
                    } else {
                        lCol = (sqrt(lCol) * 0.5 + 0.7) * max(1.0 - pat, 1.0 - ln);
                    }

                    float fringe = 1.0 - step(0.0, -(length(z) * 0.05 * float(ik) / 80.0 - 1.0));
                    lCol = mix(lCol, vec3(0), fringe * 0.95);
                    lCol = mix(vec3(0.01, 0.008, 0.005), lCol, sh * d);

                    col = min(lCol, 1.0);

                    vec2 uv = fragCoord / u_resolution.xy;
                    col *= pow(16.0 * (1.0 - uv.x) * (1.0 - uv.y) * uv.x * uv.y, 1.0 / 8.0) * 1.15;

                    gl_FragColor = vec4(sqrt(max(col, 0.0)), 1.0);
                }
            `;
        }

        // Fragment Shader: Fractal Art by Kishimisu (Golden Amber Theme)
        getFractalShader() {
            return `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;

                // Golden amber palette based on IQ's palette technique
                vec3 palette(float t) {
                    vec3 a = vec3(0.5, 0.4, 0.2);
                    vec3 b = vec3(0.5, 0.3, 0.2);
                    vec3 c = vec3(1.0, 0.7, 0.4);
                    vec3 d = vec3(0.1, 0.2, 0.3);
                    return a + b * cos(6.28318 * (c * t + d));
                }

                void main() {
                    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
                    vec2 uv0 = uv;
                    vec3 finalColor = vec3(0.0);

                    for (float i = 0.0; i < 4.0; i++) {
                        uv = fract(uv * 1.5) - 0.5;

                        float d = length(uv) * exp(-length(uv0));

                        vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.4);

                        d = sin(d * 8.0 + u_time) / 8.0;
                        d = abs(d);

                        d = pow(0.01 / d, 1.2);

                        finalColor += col * d;
                    }

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `;
        }

        setupShaders() {
            const shaders = {
                fractal: this.getFractalShader(),
                tunnel: this.getTunnelShader(),
                simpleTunnel: this.getSimpleTunnelShader(),
                electric: this.getElectricShader(),
                waves: this.getWavesShader(),
                particles: this.getParticlesShader(),
                mandelbrot: this.getMandelbrotShader()
            };

            for (const [name, fragmentSource] of Object.entries(shaders)) {
                const program = this.createProgram(this.getVertexShader(), fragmentSource);
                if (program) {
                    this.programs[name] = {
                        program: program,
                        uniforms: {
                            resolution: this.gl.getUniformLocation(program, 'u_resolution'),
                            time: this.gl.getUniformLocation(program, 'u_time'),
                            mouse: this.gl.getUniformLocation(program, 'u_mouse')
                        }
                    };
                }
            }

            const buffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
                -1, -1, 1, -1, -1, 1,
                -1, 1, 1, -1, 1, 1
            ]), this.gl.STATIC_DRAW);

            // Default to fractal shader
            this.setProgram('fractal');
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

            document.addEventListener('mousemove', (e) => {
                this.targetMouse.x = e.clientX / window.innerWidth;
                this.targetMouse.y = 1.0 - e.clientY / window.innerHeight;
            });

            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    this.targetMouse.x = e.touches[0].clientX / window.innerWidth;
                    this.targetMouse.y = 1.0 - e.touches[0].clientY / window.innerHeight;
                }
            });

            window.addEventListener('scroll', () => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                this.scrollProgress = window.pageYOffset / scrollHeight;
            });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stop();
                } else {
                    this.start();
                }
            });
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio, 1.5);
            this.canvas.width = this.canvas.offsetWidth * dpr;
            this.canvas.height = this.canvas.offsetHeight * dpr;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        render() {
            if (!this.isRunning || !this.currentProgram) return;

            const gl = this.gl;
            const uniforms = this.currentProgram.uniforms;

            this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
            this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

            gl.uniform2f(uniforms.resolution, this.canvas.width, this.canvas.height);
            gl.uniform1f(uniforms.time, (Date.now() - this.startTime) / 1000);
            gl.uniform2f(uniforms.mouse, this.mouse.x, this.mouse.y);

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
            console.log('%c🚀 Fractal Art Shader Initialized', 'color: #f2a61f; font-size: 14px; font-weight: bold;');
        });
    } else {
        window.sectionShaders = new SectionShaders();
        console.log('%c🚀 Fractal Art Shader Initialized', 'color: #f2a61f; font-size: 14px; font-weight: bold;');
    }

})();
