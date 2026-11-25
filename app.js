(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // 1. Anti-Copy & Link Privacy Safeguards
  // ---------------------------------------------------------------------------
  if (window.location.search && window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function isEditableTarget(target) {
    return Boolean(target && target.closest && target.closest('input, textarea'));
  }

  document.addEventListener('contextmenu', (e) => {
    if (!isEditableTarget(e.target)) e.preventDefault();
  });

  ['copy', 'cut', 'dragstart', 'selectstart'].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      if (!isEditableTarget(e.target)) e.preventDefault();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (isEditableTarget(e.target)) return;
    if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'u', 's'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Personalized State & Server-Side Session Gate
  // ---------------------------------------------------------------------------
  const heyFresherEl = document.getElementById('hey-fresher-text');
  const fresherNameEl = document.getElementById('fresher-name');
  const checkinGate = document.getElementById('checkin-gate');
  const checkinForm = document.getElementById('checkin-form');
  const checkinNameInput = document.getElementById('checkin-name');
  const checkinRollInput = document.getElementById('checkin-roll');
  const checkinHpInput = document.getElementById('checkin-website');
  const checkinErrorEl = document.getElementById('checkin-error');
  const checkinSubmitBtn = document.getElementById('checkin-submit');
  const checkinReadyBox = document.getElementById('checkin-ready');
  const readyGreetingEl = document.getElementById('ready-greeting');
  const btnLetsStart = document.getElementById('btn-lets-start');
  const checkinSubEl = document.querySelector('.checkin-sub');
  const checkinTitleEl = document.getElementById('checkin-title');

  let displayName = 'MCA Star';
  let celebrationStarted = false;
  let pendingCheckin = null;

  function applyPersonalizedName(fullName, firstName) {
    const cleanFull = String(fullName || '').trim() || 'MCA Star';
    const cleanFirst = String(firstName || cleanFull.split(' ')[0] || 'FRESHER').trim();
    displayName = cleanFull;

    if (heyFresherEl) {
      heyFresherEl.textContent = `HEY ${cleanFirst.toUpperCase()}!`;
    }
    if (fresherNameEl) {
      fresherNameEl.textContent = cleanFull;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Toast Announcement Helper
  // ---------------------------------------------------------------------------
  const toastEl = document.getElementById('celebration-toast');
  const toastTextEl = document.getElementById('celebration-toast-text');
  let toastTimer = null;

  function showCelebrationToast(message) {
    if (!toastEl || !toastTextEl) return;
    toastTextEl.textContent = message;
    toastEl.hidden = false;
    requestAnimationFrame(() => {
      toastEl.classList.add('is-visible');
    });

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
      setTimeout(() => {
        toastEl.hidden = true;
      }, 260);
    }, 3200);
  }

  // ---------------------------------------------------------------------------
  // 3. 3D Rotation & Perspective Math for Realistic Paper/Foil Flutter
  // ---------------------------------------------------------------------------
  function rotatePoint3D(p, rx, ry, rz) {
    let { x, y, z } = p;

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    y = y1;
    z = z1;

    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x2 = x * cosY + z * sinY;
    const z2 = -x * sinY + z * cosY;
    x = x2;
    z = z2;

    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);
    const x3 = x * cosZ - y * sinZ;
    const y3 = x * sinZ + y * cosZ;

    return { x: x3, y: y3, z };
  }

  function project3D(p, cx, cy, focalLength) {
    const depth = Math.max(40, focalLength + p.z);
    const scale = focalLength / depth;
    return {
      x: cx + p.x * scale,
      y: cy + p.y * scale
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Layer 1: Celebratory Floating Balloons & Soft Golden Star Sparkles
  // ---------------------------------------------------------------------------
  const bgCanvas = document.getElementById('bg-geometry-canvas');
  const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;

  let bgW = 0;
  let bgH = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothPointerX = 0;
  let smoothPointerY = 0;
  let sparkles = [];
  let balloons = [];
  let diyas = [];

  function initCelebrationBackground() {
    if (!bgCanvas || !bgCtx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    bgW = window.innerWidth;
    bgH = window.innerHeight;
    bgCanvas.width = Math.floor(bgW * dpr);
    bgCanvas.height = Math.floor(bgH * dpr);
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isMobile = bgW < 640;

    // Soft celebratory star sparkles & warm bokeh motes
    const sparkleCount = isMobile ? 20 : 34;
    sparkles = Array.from({ length: sparkleCount }, (_, i) => ({
      x: Math.random() * bgW,
      y: Math.random() * bgH,
      r: i % 3 === 0 ? Math.random() * 4.5 + 3.5 : Math.random() * 2 + 1,
      isFlare: i % 3 === 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.9 + Math.random() * 1.4,
      driftY: -(0.08 + Math.random() * 0.14),
      depth: 0.3 + Math.random() * 0.7
    }));

    // Volumetric Bezier balloons distributed across screen from the very first frame
    const balloonThemes = [
      { highlight: '#FFF2B2', mid: '#E3B026', deep: '#8C6208', rim: 'rgba(255, 240, 179, 0.55)' },
      { highlight: '#F26B82', mid: '#8F1D31', deep: '#460A15', rim: 'rgba(255, 165, 180, 0.45)' },
      { highlight: '#6D96E8', mid: '#1B3675', deep: '#07122D', rim: 'rgba(155, 190, 255, 0.42)' },
      { highlight: '#FFFFFF', mid: '#EBDCC0', deep: '#9E8C6E', rim: 'rgba(255, 250, 240, 0.55)' }
    ];
    const balloonCount = isMobile ? 5 : 8;
    balloons = Array.from({ length: balloonCount }, (_, i) => ({
      x: ((i + 0.5) / balloonCount) * bgW + (Math.random() - 0.5) * 44,
      y: bgH * 0.12 + Math.random() * (bgH * 0.82),
      rx: isMobile ? 17 + Math.random() * 6 : 21 + Math.random() * 8,
      speedY: 0.38 + Math.random() * 0.3,
      swayAmp: 12 + Math.random() * 15,
      phase: Math.random() * Math.PI * 2,
      theme: balloonThemes[i % balloonThemes.length],
      alpha: 0.44 + Math.random() * 0.18
    }));

    // Glowing traditional Diyas (only a few visible at a time)
    const diyaCount = isMobile ? 3 : 4;
    diyas = Array.from({ length: diyaCount }, (_, i) => ({
      x: ((i + 0.5) / diyaCount) * bgW + (Math.random() - 0.5) * 36,
      y: bgH * 0.52 + Math.random() * (bgH * 0.44),
      scale: isMobile ? 0.78 + Math.random() * 0.18 : 0.92 + Math.random() * 0.22,
      speedY: 0.18 + Math.random() * 0.14,
      phase: Math.random() * Math.PI * 2,
      swayAmp: 6 + Math.random() * 8
    }));
  }

  function drawGlowingDiya(ctx, d, timeSec) {
    const swayX = Math.sin(timeSec * 0.9 + d.phase) * d.swayAmp;
    const x = d.x + swayX + smoothPointerX * 8;
    const y = d.y;

    // Fade gently near top and bottom edges so only a few appear gracefully
    const normY = y / Math.max(1, bgH);
    const edgeFade = Math.min(1, Math.max(0, (normY - 0.12) * 3.5)) * Math.min(1, Math.max(0, (1.02 - normY) * 4));
    if (edgeFade <= 0.02) return;

    const flicker = 1 + Math.sin(timeSec * 8.5 + d.phase) * 0.08 + Math.cos(timeSec * 13 + d.phase) * 0.05;
    const tilt = Math.sin(timeSec * 5.2 + d.phase) * 0.08;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(d.scale, d.scale);
    ctx.globalAlpha = 0.72 * edgeFade;

    // Warm golden ambient halo
    const halo = ctx.createRadialGradient(0, -14, 2, 0, -14, 38 * flicker);
    halo.addColorStop(0, 'rgba(255, 214, 102, 0.45)');
    halo.addColorStop(0.45, 'rgba(244, 150, 30, 0.16)');
    halo.addColorStop(1, 'rgba(244, 150, 30, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, -14, 38 * flicker, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta / Gold-rimmed Diya bowl
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.quadraticCurveTo(0, 5, 18, 0);
    ctx.quadraticCurveTo(13, 14, 0, 14);
    ctx.quadraticCurveTo(-13, 14, -18, 0);
    ctx.closePath();

    const bowlGrad = ctx.createLinearGradient(-16, 0, 16, 14);
    bowlGrad.addColorStop(0, '#B84A24');
    bowlGrad.addColorStop(0.5, '#8F2918');
    bowlGrad.addColorStop(1, '#5C160E');
    ctx.fillStyle = bowlGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 217, 102, 0.65)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Golden oil surface
    ctx.beginPath();
    ctx.ellipse(0, 0.5, 14.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#D98A1A';
    ctx.fill();

    // Flickering multi-layer teardrop flame
    ctx.save();
    ctx.translate(0, -1);
    ctx.rotate(tilt);
    ctx.scale(1, flicker);

    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.bezierCurveTo(6.5, -12, 6.5, -3, 0, 0);
    ctx.bezierCurveTo(-6.5, -3, -6.5, -12, 0, -21);
    ctx.closePath();
    const flameGrad = ctx.createLinearGradient(0, -21, 0, 0);
    flameGrad.addColorStop(0, '#FFFBEB');
    flameGrad.addColorStop(0.45, '#FFD147');
    flameGrad.addColorStop(1, '#F97316');
    ctx.fillStyle = flameGrad;
    ctx.fill();

    // Inner bright core
    ctx.beginPath();
    ctx.ellipse(0, -6, 2.1, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function drawStarFlare(ctx, x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFE49E';

    // Delicate 4-point starlight flare
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.14, -size * 0.14, size, 0);
    ctx.quadraticCurveTo(size * 0.14, size * 0.14, 0, size);
    ctx.quadraticCurveTo(-size * 0.14, size * 0.14, -size, 0);
    ctx.quadraticCurveTo(-size * 0.14, -size * 0.14, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawVolumetricBalloon(ctx, b, timeSec) {
    const swayX = Math.sin(timeSec * 1.3 + b.phase) * b.swayAmp + smoothPointerX * 10;
    const tilt = Math.cos(timeSec * 1.3 + b.phase) * 0.08;
    const cx = b.x + swayX;
    const cy = b.y;
    const r = b.rx;
    const ry = r * 1.24;

    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.translate(cx, cy);
    ctx.rotate(tilt);

    // Bezier undulating string
    ctx.beginPath();
    ctx.moveTo(0, ry + 4);
    const wave1 = Math.sin(timeSec * 2.1 + b.phase) * 8;
    const wave2 = Math.cos(timeSec * 1.8 + b.phase) * 11;
    ctx.bezierCurveTo(wave1, ry + 26, -wave2, ry + 54, wave1 * 0.7, ry + 84);
    ctx.strokeStyle = 'rgba(255, 233, 156, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Teardrop Balloon Body (smooth cubic Bezier)
    ctx.beginPath();
    ctx.moveTo(0, -ry);
    ctx.bezierCurveTo(r * 1.12, -ry, r * 1.08, ry * 0.25, 0, ry);
    ctx.bezierCurveTo(-r * 1.08, ry * 0.25, -r * 1.12, -ry, 0, -ry);
    ctx.closePath();

    // Off-center 3D radial specular shading
    const grad = ctx.createRadialGradient(-r * 0.34, -ry * 0.36, r * 0.1, 0, 0, ry * 1.1);
    grad.addColorStop(0, b.theme.highlight);
    grad.addColorStop(0.38, b.theme.mid);
    grad.addColorStop(1, b.theme.deep);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = b.theme.rim;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glossy reflection highlight
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -ry * 0.36, r * 0.16, ry * 0.26, -0.42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.fill();

    // Tied knot
    ctx.beginPath();
    ctx.moveTo(-3.5, ry + 4.5);
    ctx.lineTo(3.5, ry + 4.5);
    ctx.lineTo(0, ry - 0.5);
    ctx.closePath();
    ctx.fillStyle = b.theme.mid;
    ctx.fill();

    ctx.restore();
  }

  function renderBackgroundFrame(timestamp) {
    if (!bgCtx) return;
    const timeSec = timestamp * 0.001;
    bgCtx.clearRect(0, 0, bgW, bgH);

    smoothPointerX += (pointerX - smoothPointerX) * 0.05;
    smoothPointerY += (pointerY - smoothPointerY) * 0.05;

    // 1. Twinkling golden star sparkles & warm bokeh motes
    sparkles.forEach((s) => {
      if (!prefersReducedMotion) {
        s.y += s.driftY;
        if (s.y < -16) {
          s.y = bgH + 16;
          s.x = Math.random() * bgW;
        }
      }
      const alpha = 0.14 + 0.52 * (0.5 + 0.5 * Math.sin(timeSec * s.speed + s.phase));
      const sx = s.x + smoothPointerX * s.depth * 14;
      const sy = s.y + smoothPointerY * s.depth * 10;

      if (s.isFlare) {
        drawStarFlare(bgCtx, sx, sy, s.r, alpha);
      } else {
        bgCtx.beginPath();
        bgCtx.arc(sx, sy, s.r, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 224, 130, ${alpha.toFixed(2)})`;
        bgCtx.fill();
      }
    });

    // 2. Volumetric floating balloons & glowing Diyas (only a few at a time)
    if (!prefersReducedMotion) {
      balloons.forEach((b) => {
        b.y -= b.speedY;
        if (b.y < -150) {
          b.y = bgH + 120 + Math.random() * 80;
          b.x = Math.random() * bgW;
        }
        drawVolumetricBalloon(bgCtx, b, timeSec);
      });

      diyas.forEach((d) => {
        d.y -= d.speedY;
        if (d.y < bgH * 0.08) {
          d.y = bgH + 40 + Math.random() * 70;
          d.x = Math.random() * (bgW * 0.86) + bgW * 0.07;
        }
        drawGlowingDiya(bgCtx, d, timeSec);
      });

      requestAnimationFrame(renderBackgroundFrame);
    }
  }

  if (bgCanvas && bgCtx) {
    initCelebrationBackground();
    window.addEventListener('resize', initCelebrationBackground, { passive: true });
    window.addEventListener(
      'pointermove',
      (e) => {
        pointerX = (e.clientX / Math.max(1, bgW) - 0.5) * 2;
        pointerY = (e.clientY / Math.max(1, bgH) - 0.5) * 2;
      },
      { passive: true }
    );
    requestAnimationFrame(renderBackgroundFrame);
  }

  // ---------------------------------------------------------------------------
  // 5. Layer 2: 3D Confetti Burst + Negligible Continuous Background Flutter
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const CONFETTI_PALETTE = [
    { base: [244, 196, 48], sheen: [255, 245, 198] },  // Gold foil
    { base: [143, 29, 49], sheen: [224, 92, 116] },    // Maroon silk
    { base: [255, 250, 240], sheen: [255, 255, 255] }, // Cream pearl
    { base: [42, 92, 198], sheen: [130, 174, 255] },   // Royal navy highlight
    { base: [24, 168, 114], sheen: [122, 235, 189] }   // Emerald accent
  ];

  let particles = [];
  let ambientConfetti = [];
  let animFrameId = null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let ambientEnabled = false;

  function resizeConfettiCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createConfettiPiece(originX, originY, spreadAngle, power) {
    const angle = spreadAngle + (Math.random() - 0.5) * 1.1;
    const speed = (Math.random() * 0.65 + 0.45) * power;
    const shapes = ['quad', 'ribbon'];
    const palette = CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)];

    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: Math.random() * 6 + 6,
      h: Math.random() * 4 + 4,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      vrx: (Math.random() - 0.5) * 0.16,
      vry: (Math.random() - 0.5) * 0.16,
      vrz: (Math.random() - 0.5) * 0.12,
      flutterPhase: Math.random() * Math.PI * 2,
      flutterFreq: 0.08 + Math.random() * 0.06,
      gravity: 0.22 + Math.random() * 0.08,
      palette,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      alpha: 1,
      decay: 0.0042 + Math.random() * 0.0036
    };
  }

  function createAmbientConfettiPiece(randomY = false) {
    const palette = CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)];
    return {
      x: Math.random() * canvasWidth,
      y: randomY ? Math.random() * canvasHeight : -18 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.35,
      vy: 0.45 + Math.random() * 0.5,
      w: Math.random() * 3.5 + 4.5,
      h: Math.random() * 2.5 + 3,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      vrx: (Math.random() - 0.5) * 0.06,
      vry: (Math.random() - 0.5) * 0.06,
      vrz: (Math.random() - 0.5) * 0.04,
      flutterPhase: Math.random() * Math.PI * 2,
      flutterFreq: 0.04 + Math.random() * 0.03,
      palette,
      alpha: 0.24 + Math.random() * 0.16
    };
  }

  function drawShadedQuad(p, alphaOverride) {
    const normalZ = Math.cos(p.rx) * Math.cos(p.ry);
    const sheenMix = Math.max(0, normalZ);
    const [r0, g0, b0] = p.palette.base;
    const [r1, g1, b1] = p.palette.sheen;
    const shadeFactor = normalZ < 0 ? 0.62 : 1;
    const r = Math.round((r0 + (r1 - r0) * sheenMix * 0.55) * shadeFactor);
    const g = Math.round((g0 + (g1 - g0) * sheenMix * 0.55) * shadeFactor);
    const b = Math.round((b0 + (b1 - b0) * sheenMix * 0.55) * shadeFactor);

    ctx.save();
    ctx.globalAlpha = Math.max(0, alphaOverride !== undefined ? alphaOverride : p.alpha);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    if (p.shape === 'ribbon') {
      const pts = [
        { x: -p.w * 0.85, y: -p.h * 0.25, z: 0 },
        { x: 0, y: -p.h * 0.25, z: Math.sin(p.flutterPhase) * 4 },
        { x: p.w * 0.85, y: -p.h * 0.25, z: 0 },
        { x: p.w * 0.85, y: p.h * 0.25, z: 0 },
        { x: 0, y: p.h * 0.25, z: Math.sin(p.flutterPhase) * 4 },
        { x: -p.w * 0.85, y: p.h * 0.25, z: 0 }
      ].map((pt) => project3D(rotatePoint3D(pt, p.rx, p.ry, p.rz), p.x, p.y, 260));

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      ctx.lineTo(pts[3].x, pts[3].y);
      ctx.quadraticCurveTo(pts[4].x, pts[4].y, pts[5].x, pts[5].y);
      ctx.closePath();
      ctx.fill();
    } else {
      const localPts = [
        { x: -p.w * 0.5, y: -p.h * 0.5, z: 0 },
        { x: p.w * 0.5, y: -p.h * 0.5, z: 0 },
        { x: p.w * 0.5, y: p.h * 0.5, z: 0 },
        { x: -p.w * 0.5, y: p.h * 0.5, z: 0 }
      ];
      const projected = localPts.map((pt) =>
        project3D(rotatePoint3D(pt, p.rx, p.ry, p.rz), p.x, p.y, 260)
      );

      ctx.beginPath();
      ctx.moveTo(projected[0].x, projected[0].y);
      ctx.lineTo(projected[1].x, projected[1].y);
      ctx.lineTo(projected[2].x, projected[2].y);
      ctx.lineTo(projected[3].x, projected[3].y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function renderConfetti() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Continuous slight/negligible ambient confetti drift after initial burst
    if (ambientEnabled && !prefersReducedMotion) {
      for (let i = 0; i < ambientConfetti.length; i += 1) {
        const a = ambientConfetti[i];
        a.rx += a.vrx;
        a.ry += a.vry;
        a.rz += a.vrz;
        a.flutterPhase += a.flutterFreq;
        a.x += a.vx + Math.sin(a.flutterPhase) * 0.28;
        a.y += a.vy;

        if (a.y > canvasHeight + 24) {
          ambientConfetti[i] = createAmbientConfettiPiece(false);
        }
        drawShadedQuad(a, a.alpha);
      }
    }

    // 2. Active celebration bursts
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.rx += p.vrx;
      p.ry += p.vry;
      p.rz += p.vrz;
      p.flutterPhase += p.flutterFreq;

      const normalZ = Math.cos(p.rx) * Math.cos(p.ry);
      const faceArea = 0.25 + 0.75 * Math.abs(normalZ);
      const airDrag = 1 - 0.018 * faceArea;

      p.vx = p.vx * airDrag + Math.sin(p.flutterPhase) * 0.18 * (1 - Math.abs(normalZ));
      p.vy = p.vy * airDrag + p.gravity * (1.05 - 0.25 * faceArea);

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > canvasHeight + 48) {
        particles.splice(i, 1);
        continue;
      }

      drawShadedQuad(p);
    }

    if (particles.length > 0 || (ambientEnabled && !prefersReducedMotion)) {
      animFrameId = requestAnimationFrame(renderConfetti);
    } else {
      animFrameId = null;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  function startConfettiLoop() {
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(renderConfetti);
    }
  }

  function fireConfettiBurst(count = 110) {
    if (prefersReducedMotion || !ctx) return;
    const isMobile = canvasWidth < 640;
    const total = isMobile ? Math.round(count * 0.72) : count;

    for (let i = 0; i < total; i += 1) {
      if (i % 3 === 0) {
        particles.push(createConfettiPiece(canvasWidth * 0.14, canvasHeight * 0.8, -Math.PI / 2.6, isMobile ? 14 : 18));
      } else if (i % 3 === 1) {
        particles.push(createConfettiPiece(canvasWidth * 0.86, canvasHeight * 0.8, -Math.PI * 0.62, isMobile ? 14 : 18));
      } else {
        particles.push(createConfettiPiece(canvasWidth * (0.2 + Math.random() * 0.6), -12, Math.PI / 2, isMobile ? 6 : 8));
      }
    }
    startConfettiLoop();
  }

  function enableSubtleBackgroundConfetti() {
    if (prefersReducedMotion || !ctx || ambientEnabled) return;
    const count = canvasWidth < 640 ? 9 : 14;
    ambientConfetti = Array.from({ length: count }, () => createAmbientConfettiPiece(true));
    ambientEnabled = true;
    startConfettiLoop();
  }

  function fireWelcomeShower() {
    if (celebrationStarted || prefersReducedMotion || !ctx) return;
    celebrationStarted = true;
    fireConfettiBurst(115);
    setTimeout(() => fireConfettiBurst(65), 550);
    setTimeout(enableSubtleBackgroundConfetti, 2200);
  }

  if (canvas && ctx) {
    resizeConfettiCanvas();
    window.addEventListener('resize', resizeConfettiCanvas, { passive: true });
  }

  const CACHE_KEY = 'pim_fresher_cache';

  function readLocalPass() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeLocalPass(fullName, firstName) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ name: fullName, firstName }));
    } catch {
      // Ignore storage quota errors
    }
  }

  function unlockCelebration(fullName, firstName, status) {
    applyPersonalizedName(fullName, firstName);
    writeLocalPass(fullName, firstName);
    updateShareLinks(fullName);
    if (checkinGate) checkinGate.hidden = true;
    document.body.classList.remove('awaiting-session', 'gate-open');
    fireWelcomeShower();

    if (status === 'reverified') {
      showCelebrationToast(`Welcome back, ${fullName}! Your pass was restored.`);
    } else if (status === 'checked_in') {
      showCelebrationToast(`Welcome, ${fullName}! You are checked in.`);
    } else if (status === 'device_locked') {
      showCelebrationToast(`This device is already registered to ${fullName}.`);
    }
  }

  function showGate() {
    document.body.classList.remove('awaiting-session');
    if (checkinGate) {
      checkinGate.hidden = false;
      document.body.classList.add('gate-open');
    }
    if (checkinNameInput) {
      setTimeout(() => checkinNameInput.focus(), 60);
    }
  }

  function setCheckinError(msg) {
    if (!checkinErrorEl) return;
    if (!msg) {
      checkinErrorEl.hidden = true;
      checkinErrorEl.textContent = '';
    } else {
      checkinErrorEl.textContent = msg;
      checkinErrorEl.hidden = false;
    }
  }

  async function initSessionGate() {
    if (window.location.protocol === 'file:') {
      document.body.classList.remove('awaiting-session');
      fireWelcomeShower();
      return;
    }

    // Instant 0ms render for returning students using local cache while verifying cookie in background
    const cached = readLocalPass();
    if (cached && cached.name) {
      unlockCelebration(cached.name, cached.firstName, 'cache');
    } else {
      // Show Check-In Gate immediately so first-time visitors never wait 3s on a blank screen
      showGate();
    }

    try {
      const resp = await fetch('/api/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });

      if (!resp.ok) {
        if (!cached) {
          setCheckinError('Check-in backend is not connected on this host yet. Deploy to Vercel with DATABASE_URL to enable live check-in.');
        }
        return;
      }

      const data = await resp.json();
      if (data.checkedIn && data.name) {
        unlockCelebration(data.name, data.firstName, 'session');
      } else if (cached) {
        // Cookie was cleared or removed by admin -> clear stale local cache and show gate
        try { localStorage.removeItem(CACHE_KEY); } catch {}
        showGate();
      }
    } catch {
      if (!cached) {
        setCheckinError('Unable to reach the check-in server. Please check your internet connection and refresh.');
      }
    }
  }

  if (checkinForm) {
    checkinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setCheckinError('');

      const nameVal = (checkinNameInput?.value || '').trim();
      const rollVal = (checkinRollInput?.value || '').trim().toUpperCase().replace(/[\s\-_]+/g, '');

      if (nameVal.length < 2) {
        setCheckinError('Please enter your full name.');
        checkinNameInput?.focus();
        return;
      }
      if (!/^[A-Z0-9]{2,24}$/.test(rollVal)) {
        setCheckinError('Please enter a valid alphanumeric Roll Number.');
        checkinRollInput?.focus();
        return;
      }

      if (checkinSubmitBtn) checkinSubmitBtn.disabled = true;
      try {
        const resp = await fetch('/api/checkin', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameVal,
            rollNo: rollVal,
            website: checkinHpInput?.value || ''
          })
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.ok) {
          setCheckinError(data.error || 'Could not complete check-in. Please verify your details.');
          return;
        }

        showLetsStartStep(data.name, data.firstName, data.status);
      } catch {
        setCheckinError('Network error while checking in. Please try again.');
      } finally {
        if (checkinSubmitBtn) checkinSubmitBtn.disabled = false;
      }
    });
  }

  function showLetsStartStep(fullName, firstName, status) {
    pendingCheckin = { fullName, firstName, status };
    if (checkinForm) checkinForm.hidden = true;
    if (checkinSubEl) checkinSubEl.hidden = true;
    if (checkinTitleEl) checkinTitleEl.hidden = true;
    if (readyGreetingEl) {
      readyGreetingEl.textContent = `Welcome, ${fullName}!`;
    }
    if (checkinReadyBox) {
      checkinReadyBox.hidden = false;
    }
    if (btnLetsStart) {
      setTimeout(() => btnLetsStart.focus(), 60);
    }
  }

  if (btnLetsStart) {
    btnLetsStart.addEventListener('click', () => {
      if (!pendingCheckin) return;
      unlockCelebration(pendingCheckin.fullName, pendingCheckin.firstName, pendingCheckin.status);
    });
  }

  window.addEventListener('DOMContentLoaded', initSessionGate);

  // ---------------------------------------------------------------------------
  // 6. Button Actions ("LET'S CELEBRATE", "CELEBRATE AGAIN", WhatsApp)
  // ---------------------------------------------------------------------------
  const btnCelebrate = document.getElementById('btn-celebrate');
  const btnCelebrateAgain = document.getElementById('btn-celebrate-again');
  const greetingSection = document.getElementById('greeting');
  const whatsappBtn = document.getElementById('btn-whatsapp-share');
  const instagramBtn = document.getElementById('btn-instagram-share');

  function getCleanSiteUrl() {
    return window.location.protocol === 'https:'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://pim-freshers-2026.vercel.app/';
  }

  function updateShareLinks(studentFullName) {
    if (!whatsappBtn) return;
    const siteUrl = getCleanSiteUrl();
    const intro =
      studentFullName && studentFullName !== 'MCA Star'
        ? `*${studentFullName}* is celebrating *Freshers Day 2026* at *Poornaprajna Institute of Management – Dept. of MCA*!`
        : `Celebrate *Freshers Day 2026* with *Poornaprajna Institute of Management – Dept. of MCA*!`;

    const shareText =
      `${intro}\n\n` +
      `*Date:* 28 November 2026\n` +
      `*Time:* 9:15 AM\n` +
      `*Venue:* Prajna Hall\n\n` +
      `_Learn • Lead • Excel — Together Towards a Brighter Future_\n` +
      `${siteUrl}`;
    whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  }

  async function buildStoryCardFile() {
    const w = 1080;
    const h = 1350;
    const card = document.createElement('canvas');
    card.width = w;
    card.height = h;
    const c = card.getContext('2d');

    const bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#060E24');
    bg.addColorStop(0.55, '#112452');
    bg.addColorStop(1, '#6E1423');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    c.strokeStyle = '#F4C430';
    c.lineWidth = 8;
    c.strokeRect(42, 42, w - 84, h - 84);

    // Draw official logo if loaded
    const logoEl = document.querySelector('.college-logo');
    if (logoEl && logoEl.complete && logoEl.naturalWidth > 0) {
      c.save();
      c.beginPath();
      c.arc(w / 2, 210, 96, 0, Math.PI * 2);
      c.closePath();
      c.fillStyle = '#FFFFFF';
      c.fill();
      c.clip();
      c.drawImage(logoEl, w / 2 - 96, 114, 192, 192);
      c.restore();
    }

    c.textAlign = 'center';
    c.fillStyle = '#FFE99C';
    c.font = '700 28px "Plus Jakarta Sans", sans-serif';
    c.fillText('POORNAPRAJNA INSTITUTE OF MANAGEMENT', w / 2, 370);
    c.fillText('DEPARTMENT OF MCA', w / 2, 412);

    c.fillStyle = '#F4C430';
    c.font = '800 54px "Cinzel", Georgia, serif';
    const first = displayName && displayName !== 'MCA Star' ? displayName.split(' ')[0].toUpperCase() : 'FRESHER';
    c.fillText(`HEY ${first}!`, w / 2, 540);

    c.fillStyle = '#FFFAF0';
    c.font = '800 62px "Cinzel", Georgia, serif';
    c.fillText('WELCOME TO YOUR', w / 2, 635);
    c.fillStyle = '#FFD966';
    c.fillText('NEW BEGINNING!', w / 2, 712);

    c.fillStyle = '#F5EBD4';
    c.font = '600 34px "Plus Jakarta Sans", sans-serif';
    c.fillText('Freshers Day 2026', w / 2, 830);
    c.font = '500 30px "Plus Jakarta Sans", sans-serif';
    c.fillText('28 November 2026  •  9:15 AM  •  Prajna Hall', w / 2, 888);

    c.fillStyle = '#FFD966';
    c.font = '700 32px "Plus Jakarta Sans", sans-serif';
    c.fillText('Learn • Lead • Excel', w / 2, 1060);
    c.fillStyle = 'rgba(255, 250, 240, 0.78)';
    c.font = 'italic 26px "Plus Jakarta Sans", sans-serif';
    c.fillText('Together Towards a Brighter Future...', w / 2, 1118);

    return new Promise((resolve) => {
      card.toBlob((blob) => {
        if (!blob) return resolve(null);
        resolve(new File([blob], 'poornaprajna-freshers-2026-story.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  updateShareLinks(displayName);

  if (instagramBtn) {
    instagramBtn.addEventListener('click', async () => {
      const siteUrl = getCleanSiteUrl();
      const caption = `Freshers Day 2026 — Poornaprajna Institute of Management, Dept. of MCA! Learn • Lead • Excel ${siteUrl}`;

      try {
        const storyFile = await buildStoryCardFile();
        if (storyFile && navigator.canShare && navigator.canShare({ files: [storyFile] })) {
          await navigator.share({
            files: [storyFile],
            title: 'Freshers Day 2026 | Poornaprajna MCA',
            text: caption
          });
          return;
        }
        if (navigator.share) {
          await navigator.share({
            title: 'Freshers Day 2026 | Poornaprajna MCA',
            text: caption,
            url: siteUrl
          });
          return;
        }
        if (storyFile) {
          const url = URL.createObjectURL(storyFile);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'poornaprajna-freshers-2026-story.png';
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          showCelebrationToast('Story card downloaded! Post it to your Instagram Story.');
          return;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }

      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    });
  }

  if (btnCelebrate) {
    btnCelebrate.addEventListener('click', () => {
      fireConfettiBurst(130);
      showCelebrationToast(`Welcome, ${displayName}! You are part of the Poornaprajna family!`);
      if (greetingSection) {
        setTimeout(() => {
          greetingSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }, 260);
      }
    });
  }

  if (btnCelebrateAgain) {
    btnCelebrateAgain.addEventListener('click', () => {
      fireConfettiBurst(140);
      showCelebrationToast('Meet • Mingle • Celebrate — Happy Freshers Day 2026!');
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Icon-Only Music Button (Zero Autoplay; Gentle Web Audio Chime on Tap)
  // ---------------------------------------------------------------------------
  const musicToggle = document.getElementById('music-toggle');
  let audioCtx = null;
  let musicInterval = null;
  let isMusicPlaying = false;

  const MELODY_NOTES = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 659.25];
  let noteStep = 0;

  function playChimeNote(freq) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  function stopMusic() {
    isMusicPlaying = false;
    clearInterval(musicInterval);
    musicInterval = null;
    if (musicToggle) {
      musicToggle.setAttribute('aria-pressed', 'false');
      musicToggle.setAttribute('title', 'Play celebration music');
    }
  }

  function startMusic() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showCelebrationToast('Audio chime is not supported on this browser.');
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isMusicPlaying = true;
    noteStep = 0;
    playChimeNote(MELODY_NOTES[noteStep % MELODY_NOTES.length]);
    noteStep += 1;

    musicInterval = setInterval(() => {
      if (!isMusicPlaying) return;
      playChimeNote(MELODY_NOTES[noteStep % MELODY_NOTES.length]);
      noteStep += 1;
    }, 520);

    if (musicToggle) {
      musicToggle.setAttribute('aria-pressed', 'true');
      musicToggle.setAttribute('title', 'Pause celebration music');
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      if (isMusicPlaying) {
        stopMusic();
      } else {
        startMusic();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Scroll Reveal Observer
  // ---------------------------------------------------------------------------
  const scrollRevealEls = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    scrollRevealEls.forEach((el) => observer.observe(el));
  } else {
    scrollRevealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ---------------------------------------------------------------------------
  // 9. PWA Service Worker Registration
  // ---------------------------------------------------------------------------
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Non-blocking: PWA caching is optional enhancement
      });
    });
  }
})();
