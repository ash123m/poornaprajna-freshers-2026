(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // 1. Personalized Greeting (?name=... optional query parameter)
  // ---------------------------------------------------------------------------
  const fresherNameEl = document.getElementById('fresher-name');
  const params = new URLSearchParams(window.location.search);
  const rawName = (params.get('name') || '').trim().slice(0, 32);
  const displayName = rawName || 'MCA Star';

  if (fresherNameEl && rawName) {
    fresherNameEl.textContent = rawName;
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

    // Volumetric Bezier balloons with realistic 3D specular shading & catenary strings
    const balloonThemes = [
      { highlight: '#FFF2B2', mid: '#E3B026', deep: '#8C6208', rim: 'rgba(255, 240, 179, 0.55)' },
      { highlight: '#F26B82', mid: '#8F1D31', deep: '#460A15', rim: 'rgba(255, 165, 180, 0.45)' },
      { highlight: '#6D96E8', mid: '#1B3675', deep: '#07122D', rim: 'rgba(155, 190, 255, 0.42)' },
      { highlight: '#FFFFFF', mid: '#EBDCC0', deep: '#9E8C6E', rim: 'rgba(255, 250, 240, 0.55)' }
    ];
    const balloonCount = isMobile ? 5 : 8;
    balloons = Array.from({ length: balloonCount }, (_, i) => ({
      x: ((i + 0.5) / balloonCount) * bgW + (Math.random() - 0.5) * 44,
      y: bgH + 90 + Math.random() * bgH * 0.85,
      rx: isMobile ? 17 + Math.random() * 6 : 21 + Math.random() * 8,
      speedY: 0.4 + Math.random() * 0.34,
      swayAmp: 12 + Math.random() * 15,
      phase: Math.random() * Math.PI * 2,
      theme: balloonThemes[i % balloonThemes.length],
      alpha: 0.44 + Math.random() * 0.18
    }));
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

    // 2. Volumetric floating balloons
    if (!prefersReducedMotion) {
      balloons.forEach((b) => {
        b.y -= b.speedY;
        if (b.y < -150) {
          b.y = bgH + 120 + Math.random() * 80;
          b.x = Math.random() * bgW;
        }
        drawVolumetricBalloon(bgCtx, b, timeSec);
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
    if (prefersReducedMotion || !ctx) return;
    fireConfettiBurst(115);
    setTimeout(() => fireConfettiBurst(65), 550);
    setTimeout(enableSubtleBackgroundConfetti, 2200);
  }

  if (canvas && ctx) {
    resizeConfettiCanvas();
    window.addEventListener('resize', resizeConfettiCanvas, { passive: true });
    window.addEventListener('load', fireWelcomeShower);
  }

  // ---------------------------------------------------------------------------
  // 6. Button Actions ("LET'S CELEBRATE", "CELEBRATE AGAIN", WhatsApp)
  // ---------------------------------------------------------------------------
  const btnCelebrate = document.getElementById('btn-celebrate');
  const btnCelebrateAgain = document.getElementById('btn-celebrate-again');
  const greetingSection = document.getElementById('greeting');
  const whatsappBtn = document.getElementById('btn-whatsapp-share');

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

  if (whatsappBtn) {
    const LIVE_URL = 'https://ash123m.github.io/poornaprajna-freshers-2026/';
    const isHttps = window.location.protocol === 'https:';
    const pageUrl = `\n${isHttps ? window.location.href : LIVE_URL}`;
    const shareText =
      `Hey Fresher! Welcome to Poornaprajna Institute of Management – Department of MCA Freshers Day 2026!\n` +
      `Date: 28-11-2026 | Time: 9:15 AM | Venue: Prajna Hall\n` +
      `Learn • Lead • Excel — Together Towards a Brighter Future!${pageUrl}`;
    whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
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
