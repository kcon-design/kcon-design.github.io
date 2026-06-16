import { useEffect, useRef, useReducer, useState } from 'react';

/* ============================================================
   Constellation - drifting white dots + faint links, spanning
   the whole page, gently reacting to the cursor. Sits behind
   the fluid and content.
   ============================================================ */
function Constellation() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, DPR, raf, particles = [], dust = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let shootingStar = null;
    let timeToNextShoot = 5000 + Math.random() * 4000;
    let lastTime = Date.now();

    function spawnShootingStar() {
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? Math.random() * W * 0.35 : W * 0.65 + Math.random() * W * 0.35;
      const startY = window.scrollY + Math.random() * window.innerHeight * 0.45;
      const dir = fromLeft ? 1 : -1;
      const speed = 8 + Math.random() * 5;
      shootingStar = {
        x: startX, y: startY,
        vx: dir * speed * 0.92, vy: speed * 0.5,
        len: 80 + Math.random() * 70,
        life: 0, maxLife: 55 + Math.random() * 25
      };
    }

    function size(reseed = false) {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (reseed || particles.length === 0 || dust.length === 0) seed();
    }
    function seed() {
      // bigger drifting constellation points
      let count = Math.floor((W * H) / 15000);
      if (count > 240) count = 240;
      if (count < 60) count = 60;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.4 + 0.5, tw: Math.random() * 6.28, sp: 0.5 + Math.random()
        });
      }
      // dense field of tiny faint stars (space dust)
      let dustCount = Math.floor((W * H) / 1800);
      if (dustCount > 2600) dustCount = 2600;
      dust = [];
      for (let i = 0; i < dustCount; i++) {
        dust.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 0.8 + 0.2,
          base: 0.1 + Math.random() * 0.4,
          tw: Math.random() * 6.28, sp: 0.4 + Math.random() * 1.2
        });
      }
    }
    function onMove(e) {
      mouse.x = e.clientX + window.scrollX;
      mouse.y = e.clientY + window.scrollY;
      mouse.active = true;
    }
    function onLeave() { mouse.active = false; mouse.x = -9999; mouse.y = -9999; }

    let t = 0;
    function frame() {
      t += 0.01;
      // shooting star timing
      const now = Date.now();
      const dtMs = now - lastTime;
      lastTime = now;
      if (!shootingStar) {
        timeToNextShoot -= dtMs;
        if (timeToNextShoot <= 0) { spawnShootingStar(); timeToNextShoot = 6000 + Math.random() * 4000; }
      }
      ctx.clearRect(0, 0, W, H);
      // space dust - dense field of tiny twinkling stars
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        const a = d.base + Math.sin(t * d.sp + d.tw) * 0.18;
        ctx.fillStyle = 'rgba(255,255,255,' + Math.max(0.04, a) + ')';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      }
      // shooting star - faint streak with a fading tail
      if (shootingStar) {
        const s = shootingStar;
        s.x += s.vx; s.y += s.vy; s.life++;
        const fade = s.life < 10 ? s.life / 10 : (s.life > s.maxLife - 14 ? Math.max(0, (s.maxLife - s.life) / 14) : 1);
        const tailX = s.x - s.vx / Math.hypot(s.vx, s.vy) * s.len;
        const tailY = s.y - s.vy / Math.hypot(s.vx, s.vy) * s.len;
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, 'rgba(255,255,255,' + (0.55 * fade) + ')');
        grad.addColorStop(0.4, 'rgba(200,210,255,' + (0.18 * fade) + ')');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tailX, tailY); ctx.stroke();
        // little bright head
        ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * fade) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.3, 0, Math.PI * 2); ctx.fill();
        if (s.life >= s.maxLife || s.x < -120 || s.x > W + 120 || s.y > H + 120) shootingStar = null;
      }
      const LINK = 120, LINK2 = LINK * LINK, MR = 160, MR2 = MR * MR;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < MR2 && d2 > 0.01) { const d = Math.sqrt(d2), f = (MR - d) / MR; p.x += (dx / d) * f * 1.2; p.y += (dy / d) * f * 1.2; }
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            const a = (1 - d2 / LINK2) * 0.22;
            ctx.strokeStyle = 'rgba(220,222,255,' + a + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      if (mouse.active) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i], dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < MR2) {
            const a = (1 - d2 / MR2) * 0.4;
            ctx.strokeStyle = 'rgba(255,255,255,' + a + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const a = 0.4 + Math.sin(t * p.sp * 2 + p.tw) * 0.3;
        ctx.fillStyle = 'rgba(255,255,255,' + Math.max(0.12, a) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    size(true); frame();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    let rt;
    function onResize() { clearTimeout(rt); rt = setTimeout(() => size(false), 150); }
    window.addEventListener('resize', onResize);
    const ro = setInterval(() => {
      const h = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      if (Math.abs(h - H) > 40) size(false);
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
      clearInterval(ro);
    };
  }, []);
  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }} />
  );
}

/* ============================================================
   SplashCursor - the real ReactBits WebGL fluid simulation
   (https://reactbits.dev/animations/splash-cursor)
   Used unmodified except the canvas wrapper is absolutely
   positioned to sit behind the page content.
   ============================================================ */
function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0.5, g: 0, b: 0 },
  TRANSPARENT = true,
  RAINBOW_MODE = true,
  COLOR = '#A855F7'
}) {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let isActive = true;

    function pointerPrototype() {
      this.id = -1;
      this.texcoordX = 0;
      this.texcoordY = 0;
      this.prevTexcoordX = 0;
      this.prevTexcoordY = 0;
      this.deltaX = 0;
      this.deltaY = 0;
      this.down = false;
      this.moved = false;
      this.color = [0, 0, 0];
    }

    let config = {
      SIM_RESOLUTION, DYE_RESOLUTION, CAPTURE_RESOLUTION,
      DENSITY_DISSIPATION, VELOCITY_DISSIPATION, PRESSURE,
      PRESSURE_ITERATIONS, CURL, SPLAT_RADIUS, SPLAT_FORCE,
      SHADING, COLOR_UPDATE_SPEED, PAUSED: false, BACK_COLOR,
      TRANSPARENT, RAINBOW_MODE, COLOR
    };

    let pointers = [new pointerPrototype()];

    const { gl, ext } = getWebGLContext(canvas);
    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    function getWebGLContext(canvas) {
      const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let gl = canvas.getContext('webgl2', params);
      const isWebGL2 = !!gl;
      if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
      let halfFloat, supportLinearFiltering;
      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      }
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat && halfFloat.HALF_FLOAT_OES;
      let formatRGBA, formatRG, formatR;
      if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
      } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      }
      return { gl, ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering } };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
          case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          default: return null;
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      return status === gl.FRAMEBUFFER_COMPLETE;
    }

    class Material {
      constructor(vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = [];
      }
      setKeywords(keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);
        let program = this.programs[hash];
        if (program == null) {
          let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
          program = createProgram(this.vertexShader, fragmentShader);
          this.programs[hash] = program;
        }
        if (program === this.activeProgram) return;
        this.uniforms = getUniforms(program);
        this.activeProgram = program;
      }
      bind() { gl.useProgram(this.activeProgram); }
    }

    class Program {
      constructor(vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
      }
      bind() { gl.useProgram(this.program); }
    }

    function createProgram(vertexShader, fragmentShader) {
      let program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.trace(gl.getProgramInfoLog(program));
      return program;
    }

    function getUniforms(program) {
      let uniforms = [];
      let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
      }
      return uniforms;
    }

    function compileShader(type, source, keywords) {
      source = addKeywords(source, keywords);
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.trace(gl.getShaderInfoLog(shader));
      return shader;
    }

    function addKeywords(source, keywords) {
      if (!keywords) return source;
      let keywordsString = '';
      keywords.forEach((keyword) => { keywordsString += '#define ' + keyword + '\n'; });
      return keywordsString + source;
    }

    const baseVertexShader = compileShader(
      gl.VERTEX_SHADER,
      `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `
    );

    const copyShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        void main () { gl_FragColor = texture2D(uTexture, vUv); }
      `
    );

    const clearShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;
        void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
      `
    );

    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform sampler2D uDithering;
      uniform vec2 ditherScale;
      uniform vec2 texelSize;
      vec3 linearToGamma (vec3 color) {
          color = max(color, vec3(0));
          return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
      }
      void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          #ifdef SHADING
              vec3 lc = texture2D(uTexture, vL).rgb;
              vec3 rc = texture2D(uTexture, vR).rgb;
              vec3 tc = texture2D(uTexture, vT).rgb;
              vec3 bc = texture2D(uTexture, vB).rgb;
              float dx = length(rc) - length(lc);
              float dy = length(tc) - length(bc);
              vec3 n = normalize(vec3(dx, dy, length(texelSize)));
              vec3 l = vec3(0.0, 0.0, 1.0);
              float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
              c *= diffuse;
          #endif
          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
      }
    `;

    const splatShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
      `
    );

    const advectionShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;
            vec2 iuv = floor(st);
            vec2 fuv = fract(st);
            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
        void main () {
            #ifdef MANUAL_FILTERING
                vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
                vec4 result = bilerp(uSource, coord, dyeTexelSize);
            #else
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                vec4 result = texture2D(uSource, coord);
            #endif
            float decay = 1.0 + dissipation * dt;
            gl_FragColor = result / decay;
        }
      `,
      ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
    );

    const divergenceShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;
            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }
            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
      `
    );

    const curlShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
      `
    );

    const vorticityShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity += force * dt;
            velocity = min(max(velocity, -1000.0), 1000.0);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `
    );

    const pressureShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
      `
    );

    const gradientSubtractShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `
    );

    const blit = (() => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      return (target, clear = false) => {
        if (target == null) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        if (clear) {
          gl.clearColor(0.0, 0.0, 0.0, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    let dye, velocity, divergence, curl, pressure;

    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const displayMaterial = new Material(baseVertexShader, displayShaderSource);

    function initFramebuffers() {
      let simRes = getResolution(config.SIM_RESOLUTION);
      let dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA;
      const rg = ext.formatRG;
      const r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);
      if (!dye) dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      else dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      if (!velocity) velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      else velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      let texelSizeX = 1.0 / w;
      let texelSizeY = 1.0 / h;
      return {
        texture, fbo, width: w, height: h, texelSizeX, texelSizeY,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        }
      };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; },
        set read(value) { fbo1 = value; },
        get write() { return fbo2; },
        set write(value) { fbo2 = value; },
        swap() { let temp = fbo1; fbo1 = fbo2; fbo2 = temp; }
      };
    }

    function resizeFBO(target, w, h, internalFormat, format, type, param) {
      let newFBO = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
      blit(newFBO);
      return newFBO;
    }

    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1.0 / w;
      target.texelSizeY = 1.0 / h;
      return target;
    }

    function updateKeywords() {
      let displayKeywords = [];
      if (config.SHADING) displayKeywords.push('SHADING');
      displayMaterial.setKeywords(displayKeywords);
    }

    updateKeywords();
    initFramebuffers();
    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;

    function updateFrame() {
      if (!isActive) return;
      const dt = calcDeltaTime();
      if (resizeCanvas()) initFramebuffers();
      updateColors(dt);
      applyInputs();
      step(dt);
      render(null);
      animationFrameId.current = requestAnimationFrame(updateFrame);
    }

    function calcDeltaTime() {
      let now = Date.now();
      let dt = (now - lastUpdateTime) / 1000;
      dt = Math.min(dt, 0.016666);
      lastUpdateTime = now;
      return dt;
    }

    function resizeCanvas() {
      let width = scaleByPixelRatio(canvas.clientWidth);
      let height = scaleByPixelRatio(canvas.clientHeight);
      const heightDelta = Math.abs(canvas.height - height);
      const widthChanged = canvas.width !== width;
      const heightChanged = canvas.height !== height;
      if (widthChanged || heightChanged) {
        if (!widthChanged && heightDelta < 96 && window.innerWidth <= 760) return false;
        canvas.width = width;
        canvas.height = height;
        return true;
      }
      return false;
    }

    function updateColors(dt) {
      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
        pointers.forEach((p) => { p.color = generateColor(); });
      }
    }

    function applyInputs() {
      pointers.forEach((p) => {
        if (p.moved) {
          p.moved = false;
          splatPointer(p);
        }
      });
    }

    function step(dt) {
      gl.disable(gl.BLEND);
      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradienSubtractProgram.bind();
      gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      let velocityId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render(target) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      drawDisplay(target);
    }

    function drawDisplay(target) {
      let width = target == null ? gl.drawingBufferWidth : target.width;
      let height = target == null ? gl.drawingBufferHeight : target.height;
      displayMaterial.bind();
      if (config.SHADING) gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
      gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      blit(target);
    }

    function splatPointer(pointer) {
      let dx = pointer.deltaX * config.SPLAT_FORCE;
      let dy = pointer.deltaY * config.SPLAT_FORCE;
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    function clickSplat(pointer) {
      const color = generateColor();
      color.r *= 10.0;
      color.g *= 10.0;
      color.b *= 10.0;
      let dx = 10 * (Math.random() - 0.5);
      let dy = 30 * (Math.random() - 0.5);
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
    }

    function splat(x, y, dx, dy, color) {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
      blit(velocity.write);
      velocity.swap();
      gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function correctRadius(radius) {
      let aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) radius *= aspectRatio;
      return radius;
    }

    function updatePointerDownData(pointer, id, posX, posY) {
      pointer.id = id;
      pointer.down = true;
      pointer.moved = false;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1.0 - posY / canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.color = generateColor();
    }

    function updatePointerMoveData(pointer, posX, posY, color) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1.0 - posY / canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.color = color;
    }

    function updatePointerUpData(pointer) { pointer.down = false; }

    function correctDeltaX(delta) {
      let aspectRatio = canvas.width / canvas.height;
      if (aspectRatio < 1) delta *= aspectRatio;
      return delta;
    }

    function correctDeltaY(delta) {
      let aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) delta /= aspectRatio;
      return delta;
    }

    function hexToRGB(hex) {
      let val = hex.replace('#', '');
      if (val.length === 3) val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
      const r = parseInt(val.slice(0, 2), 16) / 255;
      const g = parseInt(val.slice(2, 4), 16) / 255;
      const b = parseInt(val.slice(4, 6), 16) / 255;
      return { r: r * 0.15, g: g * 0.15, b: b * 0.15 };
    }

    function generateColor() {
      if (!config.RAINBOW_MODE) return hexToRGB(config.COLOR);
      let c = HSVtoRGB(Math.random(), 0.72, 0.86);
      c.r *= 0.12;
      c.g *= 0.12;
      c.b *= 0.12;
      return c;
    }

    function HSVtoRGB(h, s, v) {
      let r, g, b, i, f, p, q, t;
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: break;
      }
      return { r, g, b };
    }

    function wrap(value, min, max) {
      const range = max - min;
      if (range === 0) return min;
      return ((value - min) % range) + min;
    }

    function getResolution(resolution) {
      let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
      else return { width: min, height: max };
    }

    function scaleByPixelRatio(input) {
      const pixelRatio = window.devicePixelRatio || 1;
      return Math.floor(input * pixelRatio);
    }

    function hashCode(s) {
      if (s.length === 0) return 0;
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    function handleMouseDown(e) {
      let pointer = pointers[0];
      let posX = scaleByPixelRatio(e.clientX);
      let posY = scaleByPixelRatio(e.clientY);
      updatePointerDownData(pointer, -1, posX, posY);
      clickSplat(pointer);
    }

    let firstMouseMoveHandled = false;
    function handleMouseMove(e) {
      let pointer = pointers[0];
      let posX = scaleByPixelRatio(e.clientX);
      let posY = scaleByPixelRatio(e.clientY);
      if (!firstMouseMoveHandled) {
        let color = generateColor();
        updatePointerMoveData(pointer, posX, posY, color);
        firstMouseMoveHandled = true;
      } else {
        updatePointerMoveData(pointer, posX, posY, pointer.color);
      }
    }

    function handleTouchStart(e) {
      const touches = e.targetTouches;
      let pointer = pointers[0];
      for (let i = 0; i < touches.length; i++) {
        let posX = scaleByPixelRatio(touches[i].clientX);
        let posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerDownData(pointer, touches[i].identifier, posX, posY);
      }
    }

    function handleTouchMove(e) {
      const touches = e.targetTouches;
      let pointer = pointers[0];
      for (let i = 0; i < touches.length; i++) {
        let posX = scaleByPixelRatio(touches[i].clientX);
        let posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerMoveData(pointer, posX, posY, pointer.color);
      }
    }

    function handleTouchEnd(e) {
      const touches = e.changedTouches;
      let pointer = pointers[0];
      for (let i = 0; i < touches.length; i++) updatePointerUpData(pointer);
    }

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, false);
    window.addEventListener('touchend', handleTouchEnd);

    updateFrame();

    return () => {
      isActive = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 5, pointerEvents: 'none', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} id="fluid" style={{ width: '100vw', height: '100vh', display: 'block' }} />
    </div>
  );
}

/* ============================================================
   Typewriter - cycles words with a type/delete effect, keeping
   the rainbow gradient on the animated word.
   ============================================================ */
function TypeWords({ words, className }) {
  const ref = useRef({ i: 0, sub: 0, deleting: false });
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    let timeout;
    function tick() {
      const s = ref.current;
      const full = words[s.i % words.length];
      if (!s.deleting) {
        s.sub++;
        force();
        if (s.sub >= full.length) { s.deleting = true; timeout = setTimeout(tick, 1600); return; }
        timeout = setTimeout(tick, 85);
      } else {
        s.sub--;
        force();
        if (s.sub <= 0) { s.deleting = false; s.i++; timeout = setTimeout(tick, 350); return; }
        timeout = setTimeout(tick, 40);
      }
    }
    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const s = ref.current;
  const current = words[s.i % words.length].slice(0, s.sub);
  return (
    <span>
      <span className={className}>{current}</span>
      <span style={{ display: 'inline-block', width: 3, height: '0.85em', background: '#7CF0C0', marginLeft: 3, transform: 'translateY(0.1em)', animation: 'kc-caret 1s steps(1) infinite' }} />
    </span>
  );
}

/* ============================================================
   Portfolio content - sits above the fluid canvas
   ============================================================ */
const work = [
  { wide: true,  icon: '🏋️', tag: '✦ AI_ASSISTED · CASE_STUDY · MOBILE', chips: ['⚡ AI-assisted', 'case study', 'mobile'], title: 'LA Fitness App Redesign', desc: 'Full UX overhaul of the LA Fitness mobile app, focused on improving class booking and member retention flows.', read: '6 min read', cta: 'read it', grad: 'linear-gradient(150deg,#5B4BC4,#8B7BF5)' },
  { wide: false, icon: '🛒', tag: '✦ AI_ASSISTED · PRODUCT', chips: ['⚡ AI-assisted', 'product'], title: '3D Printing Shop: 900 Sales', desc: 'Built and designed a storefront from 0 → 900 sales in its first year.', read: '5 min read', cta: 'read it', grad: 'linear-gradient(150deg,#0F7A5A,#34D399)' },
  { wide: false, icon: '🎮', tag: 'UI_DESIGN · MOCKUP', chips: ['⚡ vibe-coded', 'ui design'], title: 'H3 Menu Remake', desc: 'A remake of the timeless menu seen in THE game of all time. Built entirely with Codex.', read: '6 min read', cta: 'play it', grad: 'linear-gradient(150deg,#1C1830,#3A3060)' },
  { wide: true,  icon: '🌿', tag: 'MOBILE · FIGMA', chips: ['mobile', 'figma'], title: 'doTERRA Essential Oils App Redesign', desc: 'Redesigned the doTERRA mobile experience to improve product discovery and streamline the purchase journey.', read: '5 min read', cta: 'read it', grad: 'linear-gradient(150deg,#A03A78,#F079C4)' }
];

const workOrder = [
  '3D Printing Shop: 900 Sales',
  'H3 Menu Remake',
  'doTERRA Essential Oils App Redesign',
  'LA Fitness App Redesign'
];

const featuredWork = new Set([
  '3D Printing Shop: 900 Sales',
  'LA Fitness App Redesign'
]);

const orderedWork = workOrder
  .map((title) => work.find((item) => item.title === title))
  .filter(Boolean)
  .map((item) => ({ ...item, wide: featuredWork.has(item.title) }));

const printingAssets = {
  shopBadge: './assets/printing-castle/etsy-storefront.png',
  shopPage: './assets/printing-castle/etsy-shop.png',
  shadowSign: './assets/printing-castle/product-01.jpg',
  haloOrnament: './assets/printing-castle/product-02.jpg',
  tigerOrnament: './assets/printing-castle/product-03.jpg',
  haloLight: './assets/printing-castle/product-04.jpg'
};

const laAssets = {
  reviews: './assets/la-fitness/app-reviews.png',
  hifiBanner: './assets/la-fitness/hifi-banner.png',
  hifiOne: './assets/la-fitness/hifi-slide-1.png',
  hifiTwo: './assets/la-fitness/hifi-slide-2.png',
  oldOne: './assets/la-fitness/old-app-slide-1.png',
  oldTwo: './assets/la-fitness/old-app-slide-2.png',
  wireBanner: './assets/la-fitness/wireframes-banner.png',
  wireOne: './assets/la-fitness/wireframes-slide-1.png',
  wireTwo: './assets/la-fitness/wireframes-slide-2.png'
};


const doterraAssets = {
  overview: './assets/doterra/doterra-overview.png',
  rationales: './assets/doterra/doterra-rationales.png',
  results: './assets/doterra/doterra-results.png',
  heroScreens: './assets/doterra/doterra-hero-screens.png',
  iphoneFrame: './assets/doterra/iphone-frame.png',
  feedPdf: './assets/doterra/old-feed-usage-guide.pdf',
  oilsPdf: './assets/doterra/old-oils-recipes-charts.pdf'
};

const doterraOldScreens = [
  './assets/doterra/old-app/old-splash.png',
  './assets/doterra/old-app/old-onboarding.png',
  './assets/doterra/old-app/old-login.png',
  './assets/doterra/old-app/old-signup.png',
  './assets/doterra/old-app/old-oils.png',
  './assets/doterra/old-app/old-abdominal-rub.png',
  './assets/doterra/old-app/old-aromatouch.png'
];

const doterraRedesignScreens = [
  './assets/doterra/redesign/redesign-01.png',
  './assets/doterra/redesign/redesign-02.png',
  './assets/doterra/redesign/redesign-03.png',
  './assets/doterra/redesign/redesign-04.png',
  './assets/doterra/redesign/redesign-05.png',
  './assets/doterra/redesign/redesign-07.png',
  './assets/doterra/redesign/redesign-06.png'
];
function CaseImage({ src, alt, style }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', display: 'block', borderRadius: 18, boxShadow: '0 24px 70px rgba(0,0,0,.45)', ...style }}
    />
  );
}

function CaseHeroImage({ src, alt }) {
  return (
    <div style={{ marginBottom: 54, aspectRatio: '2778 / 1000', overflow: 'hidden', borderRadius: 24, background: 'radial-gradient(circle at 18% 18%, rgba(124,240,192,.28), transparent 34%), linear-gradient(135deg,#102A55,#1B4D89 48%,#07101F)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 30px 90px rgba(0,0,0,.48)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={src} alt={alt} style={{ width: '100%', height: 'auto', display: 'block', transform: 'translateY(-1.8%)' }} />
    </div>
  );
}

function CaseSlideshow({ label, slides, mono, aspectRatio = '2 / 1', style }) {
  const [index, setIndex] = useState(0);
  const go = (dir) => setIndex((index + dir + slides.length) % slides.length);

  return (
    <section style={{ marginBottom: 54, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#FFC847' }}>{label}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#6A6A78', letterSpacing: '.08em' }}>{index + 1} / {slides.length}</div>
      </div>
      <div style={{ position: 'relative', padding: '0 58px' }}>
        <div style={{ overflow: 'hidden', borderRadius: 18, aspectRatio }}>
          <div style={{ display: 'flex', height: '100%', transform: `translateX(-${index * 100}%)`, transition: 'transform 520ms cubic-bezier(.22,.8,.24,1)' }}>
            {slides.map((slide) => (
              <div key={slide.src} style={{ flex: '0 0 100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: slide.src === slides[index].src ? 1 : 0, transition: 'opacity 260ms ease', pointerEvents: slide.src === slides[index].src ? 'auto' : 'none' }}>
                <CaseImage src={slide.src} alt={slide.alt} style={{ width: '100%', height: '100%', objectFit: 'contain', boxShadow: 'none' }} />
              </div>
            ))}
          </div>
        </div>
        {slides.length > 1 && (
          <>
            <button aria-label="Previous slide" onClick={() => go(-1)} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, border: 0, background: 'transparent', color: '#9A9AA5', fontSize: 48, lineHeight: 1, cursor: 'pointer' }}>‹</button>
            <button aria-label="Next slide" onClick={() => go(1)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, border: 0, background: 'transparent', color: '#9A9AA5', fontSize: 48, lineHeight: 1, cursor: 'pointer' }}>›</button>
          </>
        )}
      </div>
    </section>
  );
}

function PrintingCastleCaseStudy({ mono, display }) {
  const muted = '#A8A8B2';
  const green = '#7CF0C0';
  const panel = { background: 'rgba(13,13,18,.72)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, backdropFilter: 'blur(10px)' };
  const label = { fontFamily: mono, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: green };
  const Photo = ({ src, alt, style }) => (
    <img src={src} alt={alt} style={{ width: '100%', display: 'block', borderRadius: 18, objectFit: 'cover', boxShadow: '0 24px 70px rgba(0,0,0,.45)', ...style }} />
  );
  const stats = [
    ['917+', 'Etsy sales'],
    ['4.9', 'shop rating'],
    ['$1.5K', 'first month'],
    ['$22.5K', 'peak month'],
    ['200+', 'reviews wave']
  ];
  const timeline = [
    ['01', 'The bet', 'Ordered my first Bambu P1S AMS Combo with no 3D printing or modeling experience.'],
    ['02', 'The first proof', 'Launched a storefront with commercially licensed models and aimed for $100 a week. Month one closed around $1,500.'],
    ['03', 'Original products', 'Started creating my own models with MakerWorld, Bambu Studio, and AI guidance. The REPO robot became the first big signal.'],
    ['04', 'The breakout', 'Built LED lightsticks after spotting a pop-culture moment early and moving faster than the market.'],
    ['05', 'The company', 'Evolved the shop into Printing Castle LLC and expanded into signs, ornaments, room decor, and custom fan creations.']
  ];
  const placeholders = ['printer time-lapse GIF', 'packing orders station', 'lightstick power-on demo'];

  return (
    <main style={{ padding: '22px 32px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: mono, marginBottom: 54 }}>
        <a href="/" style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.02em', color: '#EDEDF2' }}>~/kevinconnolly</a>
        <nav className="kc-nav" style={{ display: 'flex', gap: 22 }}>
          {[
            ['work', '/#work'],
            ['about', '/#about']
          ].map(([t, href], i) => (
            <a key={i} href={href} style={{ fontSize: 12, color: '#9A9AA5', letterSpacing: '.04em' }}>{t}</a>
          ))}
        </nav>
      </div>

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 34, alignItems: 'end', marginBottom: 38 }}>
        <div>
          <div style={label}>featured case study</div>
          <h1 className="kc-case-title" style={{ fontFamily: display, fontSize: 72, lineHeight: 1.02, letterSpacing: '-.01em', margin: '14px 0 18px', color: '#FBFBFE' }}>
            From first printer to 900+ sales.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#C8C8D0', maxWidth: 660, margin: 0 }}>
            A product and entrepreneurship case study about launching Printing Castle, using AI to learn fast, and turning one 3D printer into a shop with real demand, real customers, and real operational pressure.
          </p>
        </div>
        <div style={{ ...panel, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Role', 'Founder, maker, product designer, operator'],
              ['Tools', 'Bambu P1S, Bambu Studio, MakerWorld, ChatGPT'],
              ['Focus', 'Market timing, rapid prototyping, customer experience'],
              ['Outcome', '900+ sales, 4.9 rating, Printing Castle LLC']
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ ...label, fontSize: 10, color: '#8B7BF5', marginBottom: 6 }}>{k}</div>
                <div style={{ color: '#EDEDF2', fontSize: 14, lineHeight: 1.45 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 54, overflow: 'hidden', borderRadius: 24, background: 'radial-gradient(circle at 18% 20%, rgba(124,240,192,.26), transparent 32%), radial-gradient(circle at 82% 16%, rgba(139,123,245,.34), transparent 38%), linear-gradient(135deg,#061A17,#152B28 46%,#0D1020)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 30px 90px rgba(0,0,0,.48)' }}>
        <div className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '.85fr 1.15fr', gap: 24, alignItems: 'center', padding: 26 }}>
          <div style={{ ...panel, padding: 20, background: 'rgba(4,4,7,.58)' }}>
            <img src={printingAssets.shopBadge} alt="HowlsPrintingCastle Etsy shop summary showing rating, sales, and time on Etsy" style={{ width: '100%', display: 'block', borderRadius: 14, background: '#fff' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 }}>
              {stats.slice(0, 4).map(([n, t]) => (
                <div key={t} style={{ border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,.04)' }}>
                  <div style={{ fontFamily: display, fontSize: 28, color: '#FBFBFE', lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: muted, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 6 }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
          <Photo src={printingAssets.shopPage} alt="Printing Castle Etsy storefront with featured 3D printed products" style={{ height: 430, borderRadius: 18, objectPosition: 'top center' }} />
        </div>
      </section>

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '.72fr 1.28fr', gap: 34, marginBottom: 54, alignItems: 'start' }}>
        <div>
          <div style={label}>the bet</div>
          <h2 style={{ fontFamily: display, fontSize: 42, lineHeight: 1.04, margin: '12px 0 0' }}>I wanted to see it through so badly I could not be stopped.</h2>
        </div>
        <div style={{ color: muted, fontSize: 16, lineHeight: 1.75 }}>
          <p style={{ marginTop: 0 }}>For many years, I've been interested in launching my own small business. Last year I took the plunge and ordered my very first 3D printer, the Bambu P1S AMS Combo. I remember consulting friends and family about the purchase and my idea for the Etsy store, and nearly all of them were against it.</p>
          <p>I actually couldn't even afford to buy it at the time, but with options available like Klarna, I was able to create an opportunity. My payment plan gave me a narrow window, so when the printer arrived, I got to work right away.</p>
          <p style={{ color: '#EDEDF2', fontFamily: display, fontSize: 28, lineHeight: 1.18, marginBottom: 0 }}>I had no prior experience with 3D printing or 3D modeling, but with a will there is a way. And man, did I find a way.</p>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, marginBottom: 54 }}>
        {timeline.map(([num, title, body]) => (
          <div key={num} className="kc-case-grid" style={{ ...panel, display: 'grid', gridTemplateColumns: '90px 1fr', gap: 18, padding: 20, alignItems: 'center' }}>
            <div style={{ fontFamily: display, fontSize: 48, color: num === '04' ? '#7CF0C0' : 'rgba(255,255,255,.28)', lineHeight: 1 }}>{num}</div>
            <div>
              <h3 style={{ fontFamily: display, fontSize: 26, lineHeight: 1.08, margin: '0 0 8px' }}>{title}</h3>
              <p style={{ color: muted, margin: 0, lineHeight: 1.6 }}>{body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 54 }}>
        <Photo src={printingAssets.shadowSign} alt="3D printed illuminated Shadow Team sign" style={{ height: 420 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <Photo src={printingAssets.haloLight} alt="3D printed illuminated Halo sign" style={{ height: 201 }} />
          <Photo src={printingAssets.haloOrnament} alt="3D printed Halo ornament on a Christmas tree" style={{ height: 201 }} />
          <Photo src={printingAssets.tigerOrnament} alt="3D printed character ornament on a Christmas tree" style={{ height: 201, gridColumn: '1 / -1' }} />
        </div>
      </section>

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '.95fr 1.05fr', gap: 28, marginBottom: 54, alignItems: 'center' }}>
        <div>
          <div style={label}>the rocket moment</div>
          <h2 style={{ fontFamily: display, fontSize: 46, lineHeight: 1.03, margin: '12px 0 16px' }}>Month four felt like a rocket was strapped to the shop.</h2>
          <p style={{ color: muted, lineHeight: 1.7, margin: 0 }}>After KPOP Demon Hunters launched, I saw the same thing fans saw: the lightsticks had the kind of emotional pull that people wanted to hold in real life. Other sellers were making prop versions. I wanted to make one that actually lit up.</p>
        </div>
        <div style={{ ...panel, padding: 24 }}>
          {[
            ['Spotted the demand', 'The movie hit, fan interest spiked, and I moved quickly while the moment was still fresh.'],
            ['Learned the electronics', 'I used ChatGPT to guide the LED wiring and troubleshoot how to make the 3D printed object work as a real product.'],
            ['Launched first', 'About two weeks after the premiere, I became the first seller I could find with an LED light-up version of the lightsticks.'],
            ['Scaled under pressure', 'The shop jumped to about $8,000, then $22,500 the next month. Honestly, I felt like I was flying by the seat of my pants.']
          ].map(([title, body]) => (
            <div key={title} style={{ borderBottom: title === 'Scaled under pressure' ? 0 : '1px solid rgba(255,255,255,.08)', padding: '0 0 16px', marginBottom: 16 }}>
              <h3 style={{ fontFamily: display, fontSize: 24, margin: '0 0 8px', lineHeight: 1.1 }}>{title}</h3>
              <p style={{ color: muted, lineHeight: 1.6, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 54 }}>
        <div style={label}>future media placeholders</div>
        <h2 style={{ fontFamily: display, fontSize: 40, lineHeight: 1.05, margin: '12px 0 18px' }}>The production story deserves motion.</h2>
        <div className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {placeholders.map((item) => (
            <div key={item} style={{ minHeight: 210, borderRadius: 18, border: '1px dashed rgba(124,240,192,.36)', background: 'linear-gradient(135deg,rgba(124,240,192,.08),rgba(139,123,245,.08))', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 18 }}>
              <div>
                <div style={{ fontFamily: display, fontSize: 24, color: '#EDEDF2', marginBottom: 8 }}>{item}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: muted, letterSpacing: '.12em', textTransform: 'uppercase' }}>drop future image or GIF here</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="kc-case-grid" style={{ ...panel, padding: 28, display: 'grid', gridTemplateColumns: '.78fr 1.22fr', gap: 26, alignItems: 'start', marginBottom: 30 }}>
        <div>
          <div style={label}>what it proved</div>
          <h2 style={{ fontFamily: display, fontSize: 42, lineHeight: 1.04, margin: '12px 0 0' }}>This was product design with consequences.</h2>
        </div>
        <div style={{ color: muted, lineHeight: 1.75 }}>
          <p style={{ marginTop: 0 }}>Many customers were parents shopping for children who were fans of the movie. I raced against the clock every day for months to hit deadlines, events, parties, birthdays, and holidays.</p>
          <p>Because I prototyped and launched so quickly to be first on the market, there were minor flaws in the first version. When customers brought issues to me, I immediately got to work and began shipping the improved final version. I also offered returns or replacements to customers who reached out about V1 issues.</p>
          <p style={{ marginBottom: 0 }}>To say it was life changing is an understatement. It all started with taking a chance on that first printer, and it grew into Printing Castle LLC, a shop I am excited to keep building in 2026 and beyond.</p>
        </div>
      </section>

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          ['Bias to action', 'Moved from idea to storefront before overthinking killed momentum.'],
          ['AI leverage', 'Used ChatGPT as a practical tutor for unfamiliar technical problems.'],
          ['Customer ownership', 'Handled V1 issues with replacements, returns, and improvements.'],
          ['Business range', 'Designed, produced, sold, packed, shipped, and supported the product end to end.']
        ].map(([title, body]) => (
          <div key={title} style={{ ...panel, padding: 18 }}>
            <h3 style={{ fontFamily: display, fontSize: 22, lineHeight: 1.08, margin: '0 0 10px' }}>{title}</h3>
            <p style={{ color: muted, lineHeight: 1.55, fontSize: 14, margin: 0 }}>{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
function LAFitnessCaseStudy({ mono, display }) {
  const muted = '#A8A8B2';
  const panel = { background: 'rgba(13,13,18,.72)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, backdropFilter: 'blur(10px)' };
  const label = { fontFamily: mono, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#FFC847' };

  return (
    <main style={{ padding: '22px 32px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: mono, marginBottom: 54 }}>
        <a href="/" style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.02em', color: '#EDEDF2' }}>~/kevinconnolly</a>
        <nav className="kc-nav" style={{ display: 'flex', gap: 22 }}>
          {[
            ['work', '/#work'],
            ['about', '/#about']
          ].map(([t, href], i) => (
            <a key={i} href={href} style={{ fontSize: 12, color: '#9A9AA5', letterSpacing: '.04em' }}>{t}</a>
          ))}
        </nav>
      </div>

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 34, alignItems: 'end', marginBottom: 34 }}>
        <div>
          <div style={label}>case study</div>
          <h1 className="kc-case-title" style={{ fontFamily: display, fontSize: 72, lineHeight: 1.02, letterSpacing: '-.01em', margin: '14px 0 18px', color: '#FBFBFE' }}>
            LA Fitness App Redesign
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#C8C8D0', maxWidth: 610, margin: 0 }}>
            A mobile app redesign focused on modernizing an outdated member experience, improving core navigation, and making high-frequency tasks like check-in, class discovery, and club lookup feel faster and easier.
          </p>
        </div>
        <div style={{ ...panel, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Role', 'UX research, wireframes, UI design'],
              ['Focus', 'Mobile app redesign'],
              ['Tools', 'Adobe XD, usability audit'],
              ['Outcome', 'Cleaner flows and high-fidelity prototype']
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ ...label, fontSize: 10, color: '#7CF0C0', marginBottom: 6 }}>{k}</div>
                <div style={{ color: '#EDEDF2', fontSize: 14, lineHeight: 1.45 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CaseHeroImage src={laAssets.hifiBanner} alt="LA Fitness redesigned mobile app screens arranged on a blue background" />

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '.8fr 1.2fr', gap: 28, marginBottom: 54, position: 'relative' }}>
        <div>
          <div style={label}>the challenge</div>
          <h2 style={{ fontFamily: display, fontSize: 34, lineHeight: 1.08, margin: '12px 0 0' }}>Members were paying for a modern fitness experience, but the app felt stuck in the past.</h2>
        </div>
        <CaseImage src={laAssets.reviews} alt="LA Fitness app rating and user reviews criticizing the old app" />
        <div style={{ gridColumn: '1 / -1' }}>
          <p style={{ color: muted, lineHeight: 1.7, margin: 0 }}>
            Fitness is an important part of my life. I enjoy exercising as much as I do learning design. So when I first noticed how dated and clunky the LA Fitness mobile app was, a lightbulb lit in my head with a voice telling me: <span style={{ display: 'inline-block', marginLeft: 8, fontFamily: "'Caveat', cursive", fontSize: 36, lineHeight: .9, color: '#FFC847', transform: 'rotate(-2deg)' }}>REDESIGN THIS!</span>
          </p>
          <p style={{ color: muted, lineHeight: 1.7, margin: '18px 0 0' }}>
            I immediately checked Apple's App Store to see if other users shared my feelings. The answer was a resounding yes.{' '}
            With over <b style={{ color: '#EDEDF2', fontWeight: 600 }}>2.5k ratings and an overall 2.2 out of 5 stars</b>, I read many reviews that were heavily disappointed in the overall layout, design and navigation of the app. Seeing the potential improvements that could be made, I decided to challenge myself and redesign the app!
          </p>
        </div>
      </section>

      <section style={{ marginBottom: 30 }}>
        <div style={label}>app analysis</div>
        <h2 style={{ fontFamily: display, fontSize: 40, lineHeight: 1.05, margin: '12px 0 14px' }}>Understanding what was getting in the way.</h2>
        <p style={{ color: muted, lineHeight: 1.7, margin: 0 }}>
          I conducted an in-depth analysis of the current application to identify areas for improvement and opportunities to enhance the overall user experience. The examination included the app's features, interfaces, navigation patterns, and usability issues.
        </p>
      </section>

      <CaseSlideshow
        label="old app audit"
        mono={mono}
        aspectRatio="2634 / 1329"
        slides={[
          { src: laAssets.oldOne, alt: 'Screens from the original LA Fitness app including home, membership card, find club, and club details' },
          { src: laAssets.oldTwo, alt: 'More original LA Fitness app screens including menu, account, check-in history, and class schedule' }
        ]}
      />

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 54 }}>
        {[
          ['Navigation complexity', 'Essential features were difficult to locate quickly.'],
          ['Limited exercise variety', 'Workout and exercise discovery felt underdeveloped.'],
          ['Booking friction', 'Class booking and scheduling lacked a seamless flow.'],
          ['Motivation gaps', 'The app offered few cues to keep members consistent.'],
          ['Trainer support', 'Client management and tracking felt limited for trainers.']
        ].map(([title, body]) => (
          <div key={title} style={{ ...panel, padding: 16 }}>
            <h3 style={{ fontFamily: display, fontSize: 20, lineHeight: 1.08, margin: '0 0 8px' }}>{title}</h3>
            <p style={{ color: muted, lineHeight: 1.5, fontSize: 13, margin: 0 }}>{body}</p>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 30 }}>
        <div style={label}>research</div>
        <h2 style={{ fontFamily: display, fontSize: 40, lineHeight: 1.05, margin: '12px 0 14px' }}>Designing for trainers, members, and clients.</h2>
        <p style={{ color: muted, lineHeight: 1.7, margin: 0 }}>
          To better understand the needs and pain points of LA Fitness app users, I framed the redesign around three primary user groups: fitness trainers, gym members, and clients following personalized workout plans.
        </p>
      </section>

      <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 54 }}>
        {[
          ['Alex, Fitness Trainer', 'Needs to create plans, track client progress, and schedule sessions without cumbersome client management.'],
          ['Sarah, Gym Member', 'Wants to maintain fitness, track progress, and access class schedules without clunky navigation.'],
          ['Emily, Client', 'Needs motivation, clear guidance, and personalized workout support from her trainer.']
        ].map(([title, body]) => (
          <div key={title} style={{ ...panel, padding: 22 }}>
            <div style={{ ...label, color: '#8B7BF5', marginBottom: 10 }}>persona</div>
            <h3 style={{ fontFamily: display, fontSize: 24, lineHeight: 1.12, margin: '0 0 10px' }}>{title}</h3>
            <p style={{ color: muted, lineHeight: 1.6, fontSize: 14, margin: 0 }}>{body}</p>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 30 }}>
        <div style={{ position: 'relative' }}>
          <div style={label}>wireframes</div>
          <h2 style={{ fontFamily: display, fontSize: 40, lineHeight: 1.05, margin: '12px 0 14px' }}>Structure first, visual polish second.</h2>
          <p style={{ color: muted, lineHeight: 1.7, margin: 0 }}>
            I created low-fidelity wireframes in Adobe XD to lay the foundation for the redesigned LA Fitness app. These wireframes helped me quickly visualize and simplify key interactions and navigation flows, while gathering feedback from colleagues and potential users to guide later design decisions.
          </p>
        </div>
      </section>

      <CaseSlideshow
        label="wireframe screens"
        mono={mono}
        style={{ marginTop: 44 }}
        aspectRatio="2625 / 1377"
        slides={[
          { src: laAssets.wireOne, alt: 'Wireframes for LA Fitness home, membership card, find club, and club details' },
          { src: laAssets.wireTwo, alt: 'Wireframes for LA Fitness menu, check-in history, and class schedule' }
        ]}
      />

      <section style={{ marginBottom: 30, position: 'relative' }}>
        <div style={label}>redesign</div>
        <h2 style={{ fontFamily: display, fontSize: 40, lineHeight: 1.05, margin: '12px 0 14px' }}>From low-fi structure to a polished mobile experience.</h2>
        <p style={{ color: muted, lineHeight: 1.7, margin: 0 }}>
          In this phase, I transformed user insights and wireframes into a high-fidelity prototype. My goal was to create a visually appealing and user-friendly design that felt more modern while addressing the pain points uncovered during research and analysis. I refined screens from the home page to check-in, using usability feedback to improve clarity, engagement, and the overall fitness journey.
        </p>
      </section>

      <CaseSlideshow
        label="high fidelity redesign"
        mono={mono}
        style={{ marginTop: 44 }}
        aspectRatio="2625 / 1266"
        slides={[
          { src: laAssets.hifiOne, alt: 'High fidelity LA Fitness app redesign screens for home, membership card, find club, and club details' },
          { src: laAssets.hifiTwo, alt: 'High fidelity LA Fitness app redesign screens for menu, check-in history, and class schedule' }
        ]}
      />

      <section className="kc-case-grid" style={{ ...panel, padding: 28, display: 'grid', gridTemplateColumns: '.8fr 1.2fr', gap: 26, alignItems: 'center' }}>
        <div>
          <div style={label}>takeaway</div>
          <h2 style={{ fontFamily: display, fontSize: 38, lineHeight: 1.06, margin: '12px 0 0' }}>The redesign turns a utility app into a member hub.</h2>
        </div>
        <p style={{ color: '#C8C8D0', lineHeight: 1.7, margin: 0 }}>
          The final direction gives LA Fitness a cleaner mobile foundation: faster access to membership details, clearer club and class discovery, and a calmer visual system that feels closer to a modern health and fitness product.
        </p>
      </section>

      <p style={{ fontFamily: mono, fontSize: 11, color: '#6A6A78', lineHeight: 1.7, margin: '26px 0 0', textAlign: 'center' }}>
        This personal project is in no way affiliated with LA Fitness. LA Fitness and the LA Fitness logo are a registered copyright of LA Fitness Inc.
      </p>
    </main>
  );
}


function DoterraPhoneCompare({ mono, display, oldScreens, redesignScreens }) {
  const [index, setIndex] = useState(0);
  const total = Math.max(oldScreens.length, redesignScreens.length);
  const go = (dir) => setIndex((index + dir + total) % total);
  const oldSrc = oldScreens[index % oldScreens.length];
  const redesignSrc = redesignScreens[index % redesignScreens.length];
  const phoneWrap = {
    width: 'min(330px, 37vw)',
    aspectRatio: '407 / 749',
    position: 'relative',
    filter: 'drop-shadow(0 28px 46px rgba(0,0,0,.45))'
  };
  const screenWrap = {
    position: 'absolute',
    left: '13.7%',
    top: '9.15%',
    width: '72.8%',
    height: '81.7%',
    borderRadius: '6.8% / 3.6%',
    overflow: 'hidden',
    background: '#fff',
    zIndex: 1
  };
  const labelStyle = {
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: '#EDEDF2',
    textAlign: 'center',
    marginBottom: 16
  };

  const Phone = ({ label, src }) => (
    <div style={{ display: 'grid', justifyItems: 'center' }}>
      <div style={labelStyle}>{label}</div>
      <div style={phoneWrap}>
        <div style={screenWrap}>
          <img key={src} src={src} alt={`${label} screen ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'kc-phone-fade 180ms ease both' }} />
        </div>
        <img src={doterraAssets.iphoneFrame} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </div>
  );

  return (
    <section style={{ padding: '54px 0', margin: '0 auto', maxWidth: 1240 }}>
      <div style={{ margin: '0 auto 42px', maxWidth: 860, textAlign: 'center' }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#B66AD8', marginBottom: 12 }}>screen comparison</div>
        <h2 style={{ fontFamily: display, fontSize: 40, lineHeight: 1.05, margin: '0 0 14px', color: '#FBFBFE' }}>A direct look at the old app beside the redesign.</h2>
        <p style={{ color: '#A8A8B2', lineHeight: 1.7, margin: 0 }}>Tap through matching moments from the original experience and the refreshed direction to see how the visual system, hierarchy, and core interactions changed screen by screen.</p>
      </div>
      <div className="kc-doterra-comparison" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 30, alignItems: 'center' }}>
        <Phone label="Old App" src={oldSrc} />
        <div className="kc-doterra-controls" style={{ display: 'grid', justifyItems: 'center', gap: 18, alignSelf: 'center' }}>
          <button aria-label="Previous comparison screen" onClick={() => go(-1)} style={{ width: 48, height: 48, borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#EDEDF2', fontSize: 30, lineHeight: 1, cursor: 'pointer' }}>‹</button>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.14em', color: '#9A9AA5', writingMode: 'vertical-rl', textTransform: 'uppercase' }}>tap to compare</div>
          <button aria-label="Next comparison screen" onClick={() => go(1)} style={{ width: 48, height: 48, borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(182,106,216,.18)', color: '#FFFFFF', fontSize: 30, lineHeight: 1, cursor: 'pointer' }}>›</button>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#777784', letterSpacing: '.1em' }}>{index + 1} / {total}</div>
        </div>
        <Phone label="Redesign" src={redesignSrc} />
      </div>
      <style>{`
        @keyframes kc-phone-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 760px) {
          .kc-doterra-comparison { grid-template-columns: 1fr !important; }
          .kc-doterra-controls { grid-row: 2; display: flex !important; justify-content: center; align-items: center; }
          .kc-doterra-controls div:nth-child(2) { writing-mode: horizontal-tb !important; }
        }
      `}</style>
    </section>
  );
}

function DoterraCaseStudy({ mono, display }) {
  const muted = '#A8A8B2';
  const purple = '#B66AD8';
  const panel = { background: 'rgba(13,13,18,.72)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, backdropFilter: 'blur(10px)' };
  const label = { fontFamily: mono, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: purple };
  const panelImage = {
    borderRadius: 0,
    boxShadow: 'none',
    margin: 0
  };

  return (
    <main style={{ padding: '22px 32px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: mono, marginBottom: 54 }}>
        <a href="/" style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.02em', color: '#EDEDF2' }}>~/kevinconnolly</a>
        <nav className="kc-nav" style={{ display: 'flex', gap: 22 }}>
          {[
            ['work', '/#work'],
            ['about', '/#about']
          ].map(([t, href], i) => (
            <a key={i} href={href} style={{ fontSize: 12, color: '#9A9AA5', letterSpacing: '.04em' }}>{t}</a>
          ))}
        </nav>
      </div>

      <section style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gap: 0 }}>
        <section className="kc-case-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 34, alignItems: 'end', marginBottom: 34 }}>
          <div>
            <div style={label}>case study</div>
            <h1 className="kc-case-title" style={{ fontFamily: display, fontSize: 72, lineHeight: 1.02, letterSpacing: '-.01em', margin: '14px 0 18px', color: '#FBFBFE' }}>
              doTERRA Essential Oils App Redesign
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: '#C8C8D0', maxWidth: 660, margin: 0 }}>
              A high-fidelity mobile redesign for an essential oils app, focused on creating a fresher, more engaging experience while keeping the product useful for a broad age range.
            </p>
          </div>
          <div style={{ ...panel, padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Role', 'UI design, visual direction, UX rationale'],
                ['Focus', 'Essential oils guide app'],
                ['Tools', 'Figma, app audit, high-fidelity design'],
                ['Outcome', 'Modernized app concept and launch assets']
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ ...label, fontSize: 10, color: '#7CF0C0', marginBottom: 6 }}>{k}</div>
                  <div style={{ color: '#EDEDF2', fontSize: 14, lineHeight: 1.45 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ aspectRatio: '2496 / 1209', overflow: 'hidden', borderRadius: 24, background: 'radial-gradient(circle at 18% 24%, rgba(226,88,190,.18), transparent 34%), radial-gradient(circle at 20% 22%, rgba(118,74,255,.30), transparent 36%), radial-gradient(circle at 82% 28%, rgba(137,83,255,.42), transparent 42%), linear-gradient(135deg,#160B2E,#5B2489 52%,#0D061C)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 30px 90px rgba(0,0,0,.48)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={doterraAssets.heroScreens} alt="doTERRA redesign screens arranged across a purple-pink brand background" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        <DoterraPhoneCompare
          mono={mono}
          display={display}
          oldScreens={doterraOldScreens}
          redesignScreens={doterraRedesignScreens}
        />

        <CaseImage
          src={doterraAssets.rationales}
          alt="doTERRA design rationale section showing app screen annotations, color palette, and interaction decisions"
          style={{ ...panelImage, marginBottom: 54 }}
        />

        <CaseImage
          src={doterraAssets.results}
          alt="doTERRA results section showing App Store listing and reviews"
          style={panelImage}
        />
      </section>
    </main>
  );
}
export default function KconPortfolio() {
  const mono = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace";
  const sans = "'Geist', system-ui, sans-serif";
  const display = "'Clash Display', 'Geist', sans-serif";
  const getRoute = () => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash === '#printing-castle' || path === '/printing-castle') return '#printing-castle';
    if (hash === '#la-fitness' || path === '/la-fitness') return '#la-fitness';
    if (hash === '#doterra' || path === '/doterra') return '#doterra';
    if (hash === '#work' || hash === '#about' || hash === '#contact') return '/';
    return '/';
  };
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onRouteChange = () => {
      const nextRoute = getRoute();
      setRoute(nextRoute);
      if (nextRoute === '#printing-castle' || nextRoute === '#la-fitness' || nextRoute === '#doterra') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    onRouteChange();
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);
    return () => {
      window.removeEventListener('hashchange', onRouteChange);
      window.removeEventListener('popstate', onRouteChange);
    };
  }, []);

  useEffect(() => {
    if (route !== '/') return;
    const id = window.location.hash.replace('#', '');
    if (!id || id === 'la-fitness') return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, [route]);

  return (
    <div style={{ position: 'relative', background: '#040407', color: '#EDEDF2', fontFamily: sans, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap');
        @keyframes cpp { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .kc-card:hover { transform: translateY(-5px); border-color:#3A3550 !important; box-shadow:0 18px 40px rgba(0,0,0,0.5); }
        .kc-card { transition: all .22s; }
        .kc-link-i { transition: transform .2s; display:inline-block; }
        .kc-card:hover .kc-link-i { transform: translateX(4px); }
        .kc-btn { transition: all .2s; }
        .kc-btn-p:hover { transform: translateY(-2px); box-shadow:0 10px 30px rgba(255,255,255,.2); }
        .kc-btn-g:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.45) !important; }
        .kc-grad { background: linear-gradient(100deg,#8B7BF5,#7CF0C0,#F079C4); -webkit-background-clip:text; background-clip:text; color:transparent; }
        @keyframes kc-caret { 0%,50%{opacity:1;} 50.01%,100%{opacity:0;} }
        html { scroll-behavior: smooth; background: #040407; }
        html, body, #root { margin: 0; min-height: 100%; background: #040407; }
        body { overflow-x: hidden; }
        a { text-decoration: none; }
        .kc-grain {
          position: fixed; inset: 0; z-index: 60; pointer-events: none;
          width: 100%; height: 100%; opacity: 0.14;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }
        @keyframes kc-neb1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(6%,4%) scale(1.12);} }
        @keyframes kc-neb2 { 0%,100%{transform:translate(0,0) scale(1.05);} 50%{transform:translate(-7%,-3%) scale(1);} }
        @keyframes kc-neb3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(4%,-6%) scale(1.1);} }
        .kc-neb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 1; filter: blur(70px); }
        @media (max-width: 760px) {
          .kc-case-grid { grid-template-columns: 1fr !important; }
          .kc-case-title { font-size: 46px !important; }
          .kc-work-grid { grid-template-columns: 1fr !important; }
          .kc-work-card { grid-column: auto !important; display: block !important; }
          .kc-work-card > div:first-child { min-height: 180px !important; height: 180px !important; }
          .kc-work-card > div:first-child + div > div:nth-child(2) { font-size: 23px !important; }
          .kc-hero-section { padding: 94px 22px 86px !important; }
          .kc-hero-title { font-size: 44px !important; line-height: 1.08 !important; letter-spacing: 0 !important; max-width: 100% !important; }
          .kc-about-grid { grid-template-columns: 1fr !important; padding: 52px 22px !important; gap: 30px !important; }
          .kc-about-title { width: 100% !important; font-size: 33px !important; line-height: 1.08 !important; }
          .kc-about-typewrap { display: inline; }
          .kc-nav { gap: 14px !important; }
        }
      `}</style>

      {/* Faint nebula wash - soft drifting color clouds in deep space */}
      <div className="kc-neb" aria-hidden="true" style={{ top: '-8%', left: '-6%', width: '46vw', height: '46vw', background: 'radial-gradient(circle, rgba(108,79,240,0.22), transparent 68%)', animation: 'kc-neb1 26s ease-in-out infinite' }} />
      <div className="kc-neb" aria-hidden="true" style={{ top: '34%', right: '-12%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(52,211,153,0.13), transparent 68%)', animation: 'kc-neb2 32s ease-in-out infinite' }} />
      <div className="kc-neb" aria-hidden="true" style={{ bottom: '-10%', left: '20%', width: '44vw', height: '44vw', background: 'radial-gradient(circle, rgba(240,121,196,0.12), transparent 68%)', animation: 'kc-neb3 30s ease-in-out infinite' }} />

      {/* Drifting constellation across the whole page (zIndex 2, behind fluid) */}
      <Constellation />

      {/* The real ReactBits fluid splash cursor, with your exact props */}
      <SplashCursor
        DENSITY_DISSIPATION={4.05}
        VELOCITY_DISSIPATION={2.35}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.155}
        SPLAT_FORCE={4500}
        COLOR_UPDATE_SPEED={8}
        SHADING
        RAINBOW_MODE
        COLOR="#A855F7"
      />

      {/* Film grain overlay on top of everything */}
      <div className="kc-grain" aria-hidden="true" />

      {/* Content sits above the fluid (zIndex 5) */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>
        {route === '#printing-castle' || route === '/printing-castle' ? (
          <PrintingCastleCaseStudy mono={mono} display={display} />
        ) : route === '#la-fitness' || route === '/la-fitness' ? (
          <LAFitnessCaseStudy mono={mono} display={display} />
        ) : route === '#doterra' || route === '/doterra' ? (
          <DoterraCaseStudy mono={mono} display={display} />
        ) : (
        <>
        {/* nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 32px', fontFamily: mono }}>
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.02em' }}>~/kevinconnolly</span>
          <nav className="kc-nav" style={{ display: 'flex', gap: 22 }}>
            {[
              ['work', '#work'],
              ['about', '#about']
            ].map(([t, href], i) => (
              <a key={i} href={href} style={{ fontSize: 12, color: '#9A9AA5', letterSpacing: '.04em' }}>{t}</a>
            ))}
          </nav>
        </div>

        {/* hero */}
        <section className="kc-hero-section" style={{ textAlign: 'center', padding: '120px 36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 11, color: '#7CF0C0', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 26 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7CF0C0', boxShadow: '0 0 10px #7CF0C0', animation: 'cpp 1.7s infinite' }} />
            open to work
          </div>
          <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase', color: '#C9C2E8', marginBottom: 22 }}>❯ whoami</div>
          <h1 className="kc-hero-title" style={{ fontFamily: display, fontWeight: 600, fontSize: 76, lineHeight: 1.08, letterSpacing: '-.01em', margin: '0 0 22px', color: '#FBFBFE', textShadow: '0 2px 60px rgba(0,0,0,.7)' }}>
            Part designer<br /><span className="kc-grad">part AI whisperer</span><br />all craft.
          </h1>
          <p style={{ fontSize: 16, color: '#C2C2CE', maxWidth: 440, margin: '0 auto 16px', lineHeight: 1.6 }}>
            I use AI as a creative material — <b style={{ color: '#FBFBFE', fontWeight: 500 }}>not a crutch.</b>
          </p>
          <div style={{ fontFamily: mono, fontSize: 13, color: '#A2A2AE', letterSpacing: '.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 34 }}>
            UX + Product <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#4A4A55' }} /> 6+ years
          </div>
          <div style={{ display: 'flex', gap: 13, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#contact" className="kc-btn kc-btn-p" style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, padding: '13px 28px', borderRadius: 50, background: '#FBFBFE', color: '#040407', letterSpacing: '.02em' }}>get in touch →</a>
            <a href="./Kevin_Connolly_Resume.pdf" target="_blank" rel="noreferrer" className="kc-btn kc-btn-g" style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, padding: '13px 28px', borderRadius: 50, background: 'rgba(255,255,255,.05)', color: '#EDEDF2', border: '1px solid rgba(255,255,255,.16)', letterSpacing: '.02em', backdropFilter: 'blur(8px)' }}>▶ resume.pdf</a>
          </div>
        </section>

        {/* work */}
        <section id="work" style={{ padding: '60px 36px' }}>
          <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '.2em', color: '#8B7BF5', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 22, height: 1, background: '#8B7BF5' }} />SELECTED_WORK
          </div>
          <div className="kc-work-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {orderedWork.map((p, i) => (
              <a key={i} href={p.title === '3D Printing Shop: 900 Sales' ? '#printing-castle' : p.title === 'LA Fitness App Redesign' ? '#la-fitness' : p.title === 'doTERRA Essential Oils App Redesign' ? '#doterra' : p.title === 'H3 Menu Remake' ? 'https://www.kcon.design/h3-menu-remake/' : '#'} target={p.title === 'H3 Menu Remake' ? '_blank' : undefined} rel={p.title === 'H3 Menu Remake' ? 'noreferrer' : undefined} className="kc-card kc-work-card" style={{ gridColumn: p.wide ? 'span 2' : 'auto', display: p.wide ? 'grid' : 'block', gridTemplateColumns: p.wide ? '1fr 1.05fr' : undefined, background: 'rgba(13,13,18,0.72)', backdropFilter: 'blur(8px)', border: '1px solid #1E1E26', borderRadius: 16, color: '#EDEDF2', overflow: 'hidden' }}>
                <div style={{ minHeight: p.wide ? 230 : 180, height: p.wide ? '100%' : 180, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 54, background: p.grad, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
                  <span style={{ position: 'absolute', top: 13, left: 13, fontFamily: mono, fontSize: 10, fontWeight: 500, background: 'rgba(4,4,7,.7)', color: '#E8E8F0', padding: '4px 10px', borderRadius: 50, border: '1px solid rgba(255,255,255,.12)', letterSpacing: '.04em' }}>{p.tag}</span>
                  <span style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.3))' }}>{p.icon}</span>
                </div>
                <div style={{ padding: '22px 24px 24px' }}>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                    {p.chips.map((c, j) => (
                      <span key={j} style={{ fontFamily: mono, fontSize: 10, fontWeight: 500, padding: '4px 10px', borderRadius: 50, background: c.includes('⚡') ? 'rgba(139,123,245,.16)' : '#1C1C24', color: c.includes('⚡') ? '#A595F7' : '#9A9AA5', letterSpacing: '.04em' }}>{c}</span>
                    ))}
                  </div>
                  <div style={{ fontFamily: display, fontWeight: 600, fontSize: p.wide ? 27 : 23, letterSpacing: '-.01em', marginBottom: 9, lineHeight: 1.08 }}>{p.title}</div>
                  <div style={{ fontSize: 14, color: '#9A9AA5', lineHeight: 1.6, marginBottom: 16 }}>{p.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #1E1E26', paddingTop: 14 }}>
                    <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 500, color: '#8B7BF5', display: 'flex', alignItems: 'center', gap: 6 }}>{p.cta} <span className="kc-link-i">→</span></span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* about */}
        <section id="about" className="kc-about-grid" style={{ padding: '60px 36px', display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ aspectRatio: '4/5', borderRadius: 18, position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src="./assets/kira.jpg" alt="Kevin and his dog Kira at BarkSuds" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#8F8F9C', letterSpacing: '.04em', textAlign: 'center', marginTop: 12 }}>my most important client 🐾</div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '.2em', color: '#8B7BF5', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 22, height: 1, background: '#8B7BF5' }} />ABOUT_ME
            </div>
            <h2 className="kc-about-title" style={{ fontFamily: display, fontWeight: 600, fontSize: 38, letterSpacing: '-.01em', lineHeight: 1.08, margin: '0 0 18px' }}>
              Currently crushin' it<br />as a <span className="kc-about-typewrap"><TypeWords className="kc-grad" words={['product designer.', 'full-time dog dad.', 'UX design wizard.', 'vibe coder.', 'UCF grad.']} /></span>
            </h2>
            <p style={{ fontSize: 15, color: '#A8A8B2', lineHeight: 1.7, marginBottom: 14 }}>
              I've shipped work for health, fitness, and local business clients — and I'm returning to the field with <b style={{ color: '#EDEDF2', fontWeight: 500 }}>a sharper focus on AI-era design practices.</b>
            </p>
            <p style={{ fontSize: 15, color: '#A8A8B2', lineHeight: 1.7, marginBottom: 14 }}>
              Beyond design, I channel my dedication into bodybuilding and creating fitness content for social media. I also run a 3D printing shop and am constantly bringing customer ideas to life. When I finally have some free time, I dive into the gaming world, enjoying games like Halo, Peak, and Sea of Thieves 🎮
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
              {['bodybuilding', 'fitness content', 'gaming', 'dog dad'].map((t, i) => (
                <span key={i} style={{ fontFamily: mono, fontSize: 12, background: '#1C1C24', color: '#C8C8D0', padding: '7px 13px', borderRadius: 50, border: '1px solid #2A2A32' }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section id="contact" style={{ padding: '80px 36px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: display, fontWeight: 600, fontSize: 48, letterSpacing: '-.025em', lineHeight: 1, margin: '0 0 18px' }}>
            Let's connect and bring<br />your ideas to <span className="kc-grad">life.</span>
          </h2>
          <p style={{ fontFamily: mono, fontSize: 13, color: '#7A7A88', marginBottom: 30, letterSpacing: '.04em' }}>open to ux + product roles — full-time, contract & freelance</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:kevin@kcon.design" className="kc-btn kc-btn-p" style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, padding: '13px 28px', borderRadius: 50, background: '#FBFBFE', color: '#040407' }}>kevin@kcon.design</a>
            <a href="https://www.linkedin.com/in/kcon/" target="_blank" rel="noreferrer" className="kc-btn kc-btn-g" style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, padding: '13px 28px', borderRadius: 50, background: 'rgba(255,255,255,.05)', color: '#EDEDF2', border: '1px solid rgba(255,255,255,.16)' }}>LinkedIn ↗</a>
          </div>
        </section>

        {/* footer */}
        <footer style={{ padding: '24px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: mono, fontSize: 12, color: '#6A6A78', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <span>© 2026 KEVIN CONNOLLY — built with intention</span>
          <div>
            {[
              { label: 'linkedin', href: 'https://www.linkedin.com/in/kcon/' },
              { label: 'github', href: 'https://github.com/kcon-design' },
            ].map((link, i) => (
              <a key={i} href={link.href} target="_blank" rel="noreferrer" style={{ color: '#9A9AA5', marginLeft: 18 }}>{link.label}</a>
            ))}
          </div>
        </footer>
        </>
        )}
        </div>
      </div>
    </div>
  );
}




