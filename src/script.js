/* ═══════════════════════════════════════════════════════
   SUNSET CANVAS — animated sky, drifting clouds,
   ocean water with rolling waves + sun-glitter
════════════════════════════════════════════════════════ */
(function initSunsetCanvas() {
  const canvas = document.getElementById('sunset-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, dpr, t = 0;

  /* ── Cloud definitions ── */
  const clouds = Array.from({ length: 8 }, () => ({
    x:     Math.random() * 1.5 - 0.2,   // fraction of width, can start off-screen
    y:     0.05 + Math.random() * 0.30,  // upper 35% of canvas
    wFrac: 0.10 + Math.random() * 0.18,  // width as fraction of canvas
    hFrac: 0.04 + Math.random() * 0.06,
    speed: 0.000014 + Math.random() * 0.00001,
    alpha: 0.22 + Math.random() * 0.32,
    puffs: Math.floor(4 + Math.random() * 4),
    warm:  Math.random() > 0.4,          // warm (lit by sun) vs cooler high cloud
  }));

  /* ── Glitter sparks on the water surface ── */
  const SPARK_COUNT = 90;
  const sparks = Array.from({ length: SPARK_COUNT }, () => ({
    xFrac:   0,   // set in resize
    yFrac:   0,
    phase:   Math.random() * Math.PI * 2,
    freq:    0.5  + Math.random() * 1.1,
    amp:     0.45 + Math.random() * 0.75,
    size:    0.9  + Math.random() * 2.2,
    spread:  (Math.random() - 0.5) * 0.24,  // lateral spread around sun column
  }));

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // Sun sits at ~62% x, horizon at ~50% y
    sparks.forEach(s => {
      s.xFrac = 0.62 + s.spread;
      // y is in water zone: 51%–82%
      s.yFrac = 0.51 + Math.random() * 0.31;
    });
  }

  /* ──────────── Draw helpers ──────────── */

  function drawSky() {
    const hy = H * 0.50; // horizon y
    const grad = ctx.createLinearGradient(0, 0, 0, hy);
    grad.addColorStop(0,    '#09152a');  // deep night at zenith
    grad.addColorStop(0.30, '#0c2248');  // midnight blue
    grad.addColorStop(0.58, '#183a70');  // twilight blue
    grad.addColorStop(0.76, '#7c3a1a');  // burnt orange band
    grad.addColorStop(0.89, '#c85c28');  // deep coral
    grad.addColorStop(1,    '#e88838');  // warm amber at horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, hy + 2);
  }

  function drawSun() {
    const sx = W * 0.62;
    const sy = H * 0.44;
    const sr = H * 0.058;

    // Wide atmospheric halo
    const halo = ctx.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 6);
    halo.addColorStop(0,    'rgba(255,210,80,.24)');
    halo.addColorStop(0.25, 'rgba(255,145,55,.12)');
    halo.addColorStop(0.6,  'rgba(255,100,30,.05)');
    halo.addColorStop(1,    'rgba(255,80,20,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 6, 0, Math.PI * 2);
    ctx.fill();

    // Sun disc
    const disc = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    disc.addColorStop(0,   '#fffce0');
    disc.addColorStop(0.25,'#ffe898');
    disc.addColorStop(0.65,'#ffb040');
    disc.addColorStop(1,   '#e87228');
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();

    // Clip bottom half of sun below horizon so it looks like it's setting
    ctx.clearRect(0, H * 0.495, W, H);
  }

  function drawCloud(c) {
    const cx = c.x * W;
    const cy = c.y * H;
    const cw = c.wFrac * W;
    const ch = c.hFrac * H;

    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.filter = 'blur(2.5px)';

    const grad = ctx.createLinearGradient(cx, cy - ch, cx, cy + ch * 0.9);
    if (c.warm) {
      grad.addColorStop(0, 'rgba(255,220,160,.95)');
      grad.addColorStop(0.5,'rgba(230,175,130,.75)');
      grad.addColorStop(1, 'rgba(160,100,120,.38)');
    } else {
      grad.addColorStop(0, 'rgba(230,210,255,.8)');
      grad.addColorStop(0.5,'rgba(180,155,190,.6)');
      grad.addColorStop(1, 'rgba(100,80,130,.3)');
    }
    ctx.fillStyle = grad;

    for (let p = 0; p < c.puffs; p++) {
      const frac = c.puffs > 1 ? p / (c.puffs - 1) : 0.5;
      const px = cx + (frac - 0.5) * cw;
      const py = cy + Math.sin(p * 1.3) * ch * 0.4;
      const pr = ch * (0.5 + Math.sin(p * 0.85) * 0.25);
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.55, pr, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.restore();
  }

  function drawHorizonGlow() {
    const gy = H * 0.44;
    const glow = ctx.createLinearGradient(0, gy, 0, H * 0.56);
    glow.addColorStop(0,    'rgba(255,170,60,0)');
    glow.addColorStop(0.38, 'rgba(255,130,40,.2)');
    glow.addColorStop(0.62, 'rgba(255,100,28,.15)');
    glow.addColorStop(1,    'rgba(200,70,15,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, gy, W, H * 0.12);
  }

  function drawOcean() {
    const wy = H * 0.495;
    const wg = ctx.createLinearGradient(0, wy, 0, H);
    wg.addColorStop(0,    '#cc6418');
    wg.addColorStop(0.07, '#7a3c14');
    wg.addColorStop(0.20, '#2a3068');
    wg.addColorStop(0.48, '#0d1e48');
    wg.addColorStop(1,    '#060e20');
    ctx.fillStyle = wg;
    ctx.fillRect(0, wy, W, H - wy);

    // Rolling wave lines across the surface
    const WAVE_LINES = 16;
    for (let i = 0; i < WAVE_LINES; i++) {
      const wy2 = H * (0.515 + i * 0.031);
      const alpha = Math.max(0, 0.20 - i * 0.011);
      const isWarm = i < 4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = isWarm ? '#e09050' : '#2a5888';
      ctx.lineWidth = 0.7 + (i < 3 ? 0.3 : 0);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y =
          wy2 +
          Math.sin(x * 0.013 + t * 0.85 + i * 0.55) * 2.8 +
          Math.sin(x * 0.022 + t * 0.52 + i * 1.30) * 1.6 +
          Math.cos(x * 0.007 + t * 0.30 + i * 0.80) * 1.0;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSunReflection() {
    // Vertical shimmer column on the water
    const sx = W * 0.62;
    const colW = W * 0.052;
    const rg = ctx.createLinearGradient(sx, H * 0.495, sx, H * 0.84);
    rg.addColorStop(0,    'rgba(255,205,75,.58)');
    rg.addColorStop(0.18, 'rgba(255,160,55,.30)');
    rg.addColorStop(0.45, 'rgba(200,105,35,.14)');
    rg.addColorStop(1,    'rgba(100,55,15,0)');
    ctx.fillStyle = rg;

    ctx.beginPath();
    ctx.moveTo(sx - colW, H * 0.495);
    for (let y = H * 0.495; y < H * 0.84; y += 3) {
      const prog   = (y - H * 0.495) / (H * 0.345);
      const wobble = Math.sin(y * 0.075 + t * 1.3) * colW * prog * 0.55;
      const halfW  = colW * (1 + prog * 0.85);
      ctx.lineTo(sx - halfW + wobble, y);
    }
    for (let y = H * 0.84; y >= H * 0.495; y -= 3) {
      const prog   = (y - H * 0.495) / (H * 0.345);
      const wobble = Math.sin(y * 0.075 + t * 1.3) * colW * prog * 0.55;
      const halfW  = colW * (1 + prog * 0.85);
      ctx.lineTo(sx + halfW + wobble, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawGlitter() {
    sparks.forEach(spark => {
      const brightness = Math.sin(spark.phase + t * spark.freq * 2.6);
      if (brightness < 0.05) return;

      const px = spark.xFrac * W;
      const py = spark.yFrac * H + Math.sin(spark.phase * 2.7 + t * 0.9) * H * 0.035;
      if (py < H * 0.495 || py > H * 0.84) return;

      const alpha = brightness * spark.amp * 0.88;
      const sz    = spark.size * (0.5 + brightness * 0.55);
      const r     = Math.floor(200 + brightness * 55);
      const g     = Math.floor(145 + brightness * 70);
      const b     = Math.floor(50  + brightness * 50);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = sz * 0.52;
      ctx.lineCap = 'round';
      // Cross glint
      ctx.beginPath();
      ctx.moveTo(px - sz, py); ctx.lineTo(px + sz, py);
      ctx.moveTo(px, py - sz * 1.5); ctx.lineTo(px, py + sz * 1.5);
      ctx.stroke();
      // Soft radial glow
      const grd = ctx.createRadialGradient(px, py, 0, px, py, sz * 2.8);
      grd.addColorStop(0, `rgba(255,220,100,${alpha * 0.55})`);
      grd.addColorStop(1, 'rgba(255,165,40,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(px, py, sz * 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }

  /* ──────────── Main loop ──────────── */
  function frame() {
    t += 0.008;
    ctx.clearRect(0, 0, W, H);

    drawSky();
    drawSun();

    // Clouds drift left → right, wrap around
    clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > 1.35) c.x = -0.35;
      drawCloud(c);
    });

    drawHorizonGlow();
    drawOcean();
    drawSunReflection();
    drawGlitter();

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  frame();
})();


/* ═══════════════════════════════════════════════════════
   PAGE INTERACTIONS
════════════════════════════════════════════════════════ */

/* Nav scroll styling */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* Mobile menu */
const menuBtn  = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');
menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  })
);

/* Scroll reveal */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = (i % 4) * 0.1 + 's';
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* Active nav highlight */
const navAnchors = document.querySelectorAll('.nav-links a');
const activeObs  = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAnchors.forEach(a => a.style.color = '');
      const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (a) a.style.color = 'var(--amber-light)';
    }
  });
}, { threshold: 0.45 });
document.querySelectorAll('section[id]').forEach(s => activeObs.observe(s));