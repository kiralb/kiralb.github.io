/* ══════════════════════════════════════════════════════════════
   Kira Bender — script.js
   Sections:
     1. Page loader  — sun rises, then sets to reveal the site
     2. Section glitter — ambient sparks drawn per-section
     3. Nav — scroll class, mobile menu, active section
     4. Scroll reveal — IntersectionObserver fade-in
     5. Accessibility — skip link, focus management
══════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────
   1.  PAGE LOADER
   The sun rises as the page loads (CSS animation fires).
   Once assets are ready we add .setting to the sun (it drops
   away), then fade-out the loader overlay.
───────────────────────────────────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById('page-loader');
  const sun    = loader && loader.querySelector('.loader-sun');
  if (!loader) return;

  // Prevent page scroll while loading
  document.body.style.overflow = 'hidden';

  function dismiss() {
    // Trigger sun-set animation
    if (sun) {
      sun.classList.add('setting');
    }
    // After sun sets, fade the whole loader out
    setTimeout(() => {
      loader.classList.add('fade-out');
      document.body.style.overflow = '';
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, 600); // matches sunSet duration
  }

  // Wait for full page load (fonts + images); minimum 1.2s so
  // the sunrise animation has time to play
  const minDelay  = 1200;
  const startTime = Date.now();

  function scheduleDissmiss() {
    const elapsed = Date.now() - startTime;
    const wait    = Math.max(0, minDelay - elapsed);
    setTimeout(dismiss, wait);
  }

  if (document.readyState === 'complete') {
    scheduleDissmiss();
  } else {
    window.addEventListener('load', scheduleDissmiss, { once: true });
  }
})();


/* ─────────────────────────────────────────────────────────────
   2.  SECTION GLITTER
   Each non-hero section gets a transparent <canvas> as the
   first child. We draw twinkling cross-shaped sparks that
   are subtle enough not to compete with content.

   Sparks are distributed randomly across the full section but
   kept sparse (low count) and mostly dim so they feel ambient
   rather than decorative noise.
───────────────────────────────────────────────────────────── */
(function initGlitter() {
  const SECTIONS = ['about', 'expertise', 'experience', 'contact'];
  const SPARK_COUNT = 55; // per section — intentionally low
  const instances   = [];

  SECTIONS.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;

    // Insert canvas as first child so CSS z-index stacking works
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.classList.add('section-glitter');
    section.insertBefore(canvas, section.firstChild);

    const ctx    = canvas.getContext('2d');
    let W, H, dpr;

    // Generate sparks with random positions and twinkle params
    const sparks = Array.from({ length: SPARK_COUNT }, () => ({
      xFrac:  Math.random(),
      yFrac:  Math.random(),
      phase:  Math.random() * Math.PI * 2,
      freq:   0.3 + Math.random() * 0.9,
      amp:    0.18 + Math.random() * 0.42,  // low amp = gentle
      size:   0.5 + Math.random() * 1.8,
    }));

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W   = section.offsetWidth;
      H   = section.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);

      sparks.forEach(s => {
        const b = Math.sin(s.phase + t * s.freq * 2.4);
        if (b < 0.08) return; // skip very dim sparks

        const px    = s.xFrac * W;
        const py    = s.yFrac * H;
        const alpha = b * s.amp;
        const sz    = s.size * (0.4 + b * 0.6);

        // Warm amber-gold cross
        const r = 255, g = Math.floor(140 + b * 80), bl = Math.floor(18 + b * 40);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgb(${r},${g},${bl})`;
        ctx.lineWidth   = sz * 0.5;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(px - sz, py);          ctx.lineTo(px + sz, py);
        ctx.moveTo(px, py - sz * 1.65);   ctx.lineTo(px, py + sz * 1.65);
        ctx.stroke();

        // Soft glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, sz * 3);
        grd.addColorStop(0, `rgba(${r},${g},${bl},${alpha * 0.45})`);
        grd.addColorStop(1, 'rgba(200,100,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, sz * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    instances.push({ resize, draw, sparks });
    resize();
  });

  // Shared RAF loop — one tick drives all section canvases
  let t       = 0;
  let animId;

  function tick() {
    t += 0.009;
    instances.forEach(inst => inst.draw(t));
    animId = requestAnimationFrame(tick);
  }

  tick();

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      tick();
    }
  });

  // Resize all canvases
  window.addEventListener('resize', () => {
    instances.forEach(inst => inst.resize());
  }, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────
   3.  NAV
───────────────────────────────────────────────────────────── */
(function initNav() {
  const nav  = document.getElementById('nav');
  const btn  = document.getElementById('menu-btn');
  const list = document.getElementById('nav-list');
  if (!nav) return;

  const links = list ? [...list.querySelectorAll('a')] : [];

  // Scroll: add .scrolled class for backdrop
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
      ticking = false;
    });
    ticking = true;
  }, { passive: true });

  // Mobile menu helpers
  const openMenu  = () => { list.classList.add('open');    btn.setAttribute('aria-expanded', 'true');  document.body.style.overflow = 'hidden'; links[0]?.focus(); };
  const closeMenu = () => { list.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';       };

  btn?.addEventListener('click', () => list.classList.contains('open') ? closeMenu() : openMenu());
  links.forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && list.classList.contains('open')) { closeMenu(); btn?.focus(); }
  });

  // Active section highlight
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        const active = a.getAttribute('href') === '#' + e.target.id;
        a.style.color = active ? 'var(--amber-pale)' : '';
        a.setAttribute('aria-current', active ? 'page' : 'false');
      });
    });
  }, { threshold: 0.45 });
  sections.forEach(s => obs.observe(s));
})();


/* ─────────────────────────────────────────────────────────────
   4.  SCROLL REVEAL
───────────────────────────────────────────────────────────── */
(function initReveal() {
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


/* ─────────────────────────────────────────────────────────────
   5.  ACCESSIBILITY
───────────────────────────────────────────────────────────── */
(function initA11y() {
  // Make sections programmatically focusable for skip-nav / anchor links
  document.querySelectorAll('section[id], main').forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  });

  // Skip link — smooth scroll then focus destination
  const skip = document.querySelector('.skip-link');
  skip?.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(skip.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => target.focus({ preventScroll: true }), 380);
    }
  });

  // Anchor clicks — focus the destination section after scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      const id     = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (target) setTimeout(() => target.focus({ preventScroll: true }), 420);
    });
  });
})();