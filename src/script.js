/* ═══════════════════════════════════════════════════════
   Kira Bender — "Golden Hour at Sea"  script.js
   1. Page loader
   2. Sunset canvas (animated clouds + waves + glitter)
   3. Nav (scroll, mobile, active-section highlight)
   4. Scroll reveal
   5. Accessibility (skip link, focus management, ARIA)
════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────
   1. PAGE LOADER
───────────────────────────────────── */
(function () {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  function dismiss() {
    loader.classList.add('fade-out');
    loader.addEventListener('transitionend', () => {
      loader.remove();
      document.body.style.overflow = '';
    }, { once: true });
  }

  // Prevent scroll while loading
  document.body.style.overflow = 'hidden';

  if (document.readyState === 'complete') {
    setTimeout(dismiss, 1800);
  } else {
    window.addEventListener('load', () => setTimeout(dismiss, 1800), { once: true });
  }
})();


/* ─────────────────────────────────────
   2. SUNSET CANVAS
   Full animated scene:
   · Vivid gradient sky (deep navy → amber horizon)
   · Partially-set sun with multi-layer halo
   · Clouds: drift horizontally, gentle vertical sway
   · Ocean: gradient fill + multiple animated wave lines
   · Sun reflection: wobbly column
   · Glitter sparks: twinkling cross-shaped lights
───────────────────────────────────── */
(function () {
  const canvas = document.getElementById('sunset-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, dpr, t = 0;
  let animId;

  /* ── Clouds ── */
  function makeCloud() {
    return {
      x:      Math.random() * 1.7 - 0.3,
      y:      0.04 + Math.random() * 0.30,
      wF:     0.10 + Math.random() * 0.18,   // width fraction
      hF:     0.038 + Math.random() * 0.052,  // height fraction
      speed:  0.000011 + Math.random() * 0.000010,
      alpha:  0.24 + Math.random() * 0.36,
      puffs:  4 + Math.floor(Math.random() * 5),
      warm:   Math.random() > 0.38,
      phase:  Math.random() * Math.PI * 2,
    };
  }
  const clouds = Array.from({ length: 11 }, makeCloud);

  /* ── Glitter sparks ── */
  const SPARK_N = 110;
  const sparks  = Array.from({ length: SPARK_N }, () => ({
    xF:    0,
    yF:    0.51 + Math.random() * 0.32,
    ph:    Math.random() * Math.PI * 2,
    freq:  0.45 + Math.random() * 1.1,
    amp:   0.38 + Math.random() * 0.74,
    sz:    0.7  + Math.random() * 2.5,
    spd:   (Math.random() - 0.5) * 0.28,  // lateral spread around centre
  }));

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W   = canvas.offsetWidth;
    H   = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    // Sun is centred horizontally
    sparks.forEach(s => { s.xF = 0.50 + s.spd; });
  }

  /* ── Sky ── */
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.51);
    g.addColorStop(0,    '#070d1a');
    g.addColorStop(0.18, '#0a1c44');
    g.addColorStop(0.46, '#102e74');
    g.addColorStop(0.68, '#7e340e');
    g.addColorStop(0.83, '#d85e1c');
    g.addColorStop(0.92, '#f27a1a');
    g.addColorStop(1,    '#f8a818');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.51 + 2);
  }

  /* ── Sun ── */
  function drawSun() {
    const sx = W * 0.50;
    const sy = H * 0.43;
    const sr = H * 0.065;

    // Wide atmospheric halo
    let h = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 7.5);
    h.addColorStop(0,    'rgba(255,220,80,.28)');
    h.addColorStop(0.20, 'rgba(255,160,50,.14)');
    h.addColorStop(0.55, 'rgba(255,110,30,.06)');
    h.addColorStop(1,    'rgba(255,80,10,0)');
    ctx.fillStyle = h;
    ctx.beginPath(); ctx.arc(sx, sy, sr * 7.5, 0, Math.PI * 2); ctx.fill();

    // Inner warm glow ring
    h = ctx.createRadialGradient(sx, sy, sr, sx, sy, sr * 3.2);
    h.addColorStop(0, 'rgba(255,240,130,.2)');
    h.addColorStop(1, 'rgba(255,130,40,0)');
    ctx.fillStyle = h;
    ctx.beginPath(); ctx.arc(sx, sy, sr * 3.2, 0, Math.PI * 2); ctx.fill();

    // Sun disc
    const d = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    d.addColorStop(0,    '#fffee0');
    d.addColorStop(0.22, '#ffe870');
    d.addColorStop(0.62, '#ffb838');
    d.addColorStop(1,    '#e87820');
    ctx.fillStyle = d;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();

    // Clip below horizon so sun appears to be setting
    ctx.clearRect(0, H * 0.497, W, H);
  }

  /* ── Horizon glow band ── */
  function drawHorizonGlow() {
    const g = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.60);
    g.addColorStop(0,    'rgba(255,175,55,0)');
    g.addColorStop(0.32, 'rgba(255,145,38,.24)');
    g.addColorStop(0.55, 'rgba(255,105,22,.2)');
    g.addColorStop(1,    'rgba(200,60,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.42, W, H * 0.18);
  }

  /* ── Single cloud ── */
  function drawCloud(c) {
    const cx   = c.x * W;
    const sway = Math.sin(c.phase + t * 0.38) * H * 0.007;
    const cy   = c.y * H + sway;
    const cw   = c.wF * W;
    const ch   = c.hF * H;

    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.filter = 'blur(3px)';

    const g = ctx.createLinearGradient(cx, cy - ch, cx, cy + ch);
    if (c.warm) {
      g.addColorStop(0,   'rgba(255,232,162,.97)');
      g.addColorStop(0.5, 'rgba(242,180,118,.8)');
      g.addColorStop(1,   'rgba(160,90,100,.4)');
    } else {
      g.addColorStop(0,   'rgba(212,198,255,.84)');
      g.addColorStop(0.5, 'rgba(166,148,196,.62)');
      g.addColorStop(1,   'rgba(90,70,135,.3)');
    }
    ctx.fillStyle = g;

    for (let p = 0; p < c.puffs; p++) {
      const frac = c.puffs > 1 ? p / (c.puffs - 1) : 0.5;
      const px   = cx + (frac - 0.5) * cw;
      const py   = cy + Math.sin(p * 1.3) * ch * 0.42;
      const pr   = ch * (0.52 + Math.sin(p * 0.85) * 0.24);
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.6, pr, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.restore();
  }

  /* ── Ocean fill + animated wave lines ── */
  function drawOcean() {
    const oy = H * 0.497;

    // Ocean gradient fill
    const g = ctx.createLinearGradient(0, oy, 0, H);
    g.addColorStop(0,    '#cc6010');
    g.addColorStop(0.06, '#7c3c08');
    g.addColorStop(0.18, '#1e3a7c');
    g.addColorStop(0.40, '#0c2268');
    g.addColorStop(0.70, '#081845');
    g.addColorStop(1,    '#040a1e');
    ctx.fillStyle = g;
    ctx.fillRect(0, oy, W, H - oy);

    /* Wave lines
       Each entry: [yFraction, baseAlpha, strokeColor, timeFreq, amp1, amp2, phaseOff, lineWidth]
       The top few are warm (lit by sunset), lower ones cool blue.
    */
    const WAVES = [
      [0.502, .20, '#ec9240', 0.95, 3.4, 1.9, 0.0, 1.1],
      [0.516, .16, '#e48030', 0.82, 3.0, 1.7, 0.9, 0.9],
      [0.530, .13, '#ca6a1c', 0.70, 2.6, 1.5, 1.8, 0.8],
      [0.545, .10, '#1e3e7c', 0.60, 2.9, 1.7, 2.4, 0.8],
      [0.561, .09, '#1e4486', 0.52, 3.2, 1.9, 3.1, 0.7],
      [0.579, .08, '#224290', 0.45, 2.8, 1.7, 0.7, 0.7],
      [0.598, .07, '#264a98', 0.39, 2.4, 1.5, 1.5, 0.6],
      [0.618, .06, '#2850a0', 0.34, 2.0, 1.3, 2.2, 0.6],
      [0.640, .05, '#2c58a8', 0.29, 1.6, 1.1, 2.9, 0.5],
      [0.665, .04, '#3060b0', 0.25, 1.3, 1.0, 1.3, 0.5],
      [0.692, .03, '#3468b8', 0.21, 1.0, 0.8, 0.5, 0.4],
      [0.724, .02, '#3870c0', 0.18, 0.7, 0.6, 1.9, 0.4],
    ];

    WAVES.forEach(([yF, alpha, color, freq, a1, a2, ph, lw]) => {
      const wy = H * yF;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth   = lw;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = wy
          + Math.sin(x * 0.014 + t * freq       + ph          ) * a1
          + Math.sin(x * 0.024 + t * freq * 0.6 + ph * 1.3    ) * a2
          + Math.cos(x * 0.008 + t * freq * 0.4 + ph * 0.75   ) * (a1 * 0.38);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  /* ── Sun reflection column ── */
  function drawReflection() {
    const sx   = W * 0.50;
    const colW = W * 0.062;
    const rg   = ctx.createLinearGradient(sx, H * 0.497, sx, H * 0.87);
    rg.addColorStop(0,    'rgba(255,215,72,.65)');
    rg.addColorStop(0.16, 'rgba(255,168,52,.33)');
    rg.addColorStop(0.42, 'rgba(210,112,30,.16)');
    rg.addColorStop(1,    'rgba(100,55,10,0)');
    ctx.fillStyle = rg;

    ctx.beginPath();
    let first = true;
    for (let y = H * 0.497; y < H * 0.87; y += 3) {
      const prog = (y - H * 0.497) / (H * 0.373);
      const wob  = Math.sin(y * 0.082 + t * 1.45) * colW * prog * 0.58;
      const hw   = colW * (1 + prog * 0.92);
      if (first) { ctx.moveTo(sx - hw + wob, y); first = false; }
      else ctx.lineTo(sx - hw + wob, y);
    }
    for (let y = H * 0.87; y >= H * 0.497; y -= 3) {
      const prog = (y - H * 0.497) / (H * 0.373);
      const wob  = Math.sin(y * 0.082 + t * 1.45) * colW * prog * 0.58;
      const hw   = colW * (1 + prog * 0.92);
      ctx.lineTo(sx + hw + wob, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ── Glitter sparks ── */
  function drawGlitter() {
    sparks.forEach(s => {
      const b = Math.sin(s.ph + t * s.freq * 2.8);
      if (b < 0.06) return;

      const px = s.xF * W;
      const py = s.yF * H + Math.sin(s.ph * 2.6 + t * 0.95) * H * 0.038;
      if (py < H * 0.497 || py > H * 0.87) return;

      const alpha = b * s.amp * 0.9;
      const sz    = s.sz * (0.44 + b * 0.6);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(255,${Math.floor(158 + b * 82)},${Math.floor(48 + b * 62)})`;
      ctx.lineWidth = sz * 0.54;
      ctx.lineCap   = 'round';
      ctx.beginPath();
      ctx.moveTo(px - sz, py); ctx.lineTo(px + sz, py);
      ctx.moveTo(px, py - sz * 1.65); ctx.lineTo(px, py + sz * 1.65);
      ctx.stroke();

      const rg = ctx.createRadialGradient(px, py, 0, px, py, sz * 3.2);
      rg.addColorStop(0, `rgba(255,228,100,${alpha * 0.55})`);
      rg.addColorStop(1, 'rgba(255,170,40,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(px, py, sz * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }

  /* ── Render loop ── */
  function frame() {
    t += 0.009;
    ctx.clearRect(0, 0, W, H);

    drawSky();
    drawSun();

    clouds.forEach(c => {
      c.x     += c.speed;
      c.phase += 0.0018;
      if (c.x > 1.42) c.x = -0.42;
      drawCloud(c);
    });

    drawHorizonGlow();
    drawOcean();
    drawReflection();
    drawGlitter();

    animId = requestAnimationFrame(frame);
  }

  function handleResize() { resize(); }
  window.addEventListener('resize', handleResize, { passive: true });
  resize();
  frame();

  // Pause when tab is hidden to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animId); }
    else { t += 0; frame(); }
  });
})();


/* ─────────────────────────────────────
   3. NAV
───────────────────────────────────── */
(function () {
  const nav     = document.getElementById('nav');
  const btn     = document.getElementById('menu-btn');
  const list    = document.getElementById('nav-list');
  const links   = list ? list.querySelectorAll('a') : [];

  // Scroll class
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
      ticking = false;
    });
    ticking = true;
  }, { passive: true });

  // Mobile menu open/close
  function openMenu()  {
    list.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Move focus to first link
    if (links.length) links[0].focus();
  }
  function closeMenu() {
    list.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (btn) {
    btn.addEventListener('click', () => {
      list.classList.contains('open') ? closeMenu() : openMenu();
    });
  }

  links.forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && list.classList.contains('open')) {
      closeMenu();
      btn.focus();
    }
  });

  // Active section highlight via IntersectionObserver
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        const active = a.getAttribute('href') === '#' + e.target.id;
        a.style.color = active ? 'var(--amber-light)' : '';
        a.setAttribute('aria-current', active ? 'page' : 'false');
      });
    });
  }, { threshold: 0.45 });
  sections.forEach(s => obs.observe(s));
})();


/* ─────────────────────────────────────
   4. SCROLL REVEAL
───────────────────────────────────── */
(function () {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      entry.target.style.transitionDelay = `${(i % 5) * 0.08}s`;
      entry.target.classList.add('in-view');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();


/* ─────────────────────────────────────
   5. ACCESSIBILITY
───────────────────────────────────── */
(function () {
  // Make sections programmatically focusable (for skip-nav & anchor focusing)
  document.querySelectorAll('section[id], main').forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  });

  // Skip link: smooth-scroll + focus destination
  const skip = document.querySelector('.skip-link');
  if (skip) {
    skip.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(skip.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => target.focus({ preventScroll: true }), 380);
      }
    });
  }

  // Anchor clicks from hero/nav → focus destination section after scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      const id = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (target) {
        setTimeout(() => target.focus({ preventScroll: true }), 420);
      }
    });
  });
})();