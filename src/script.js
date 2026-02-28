/* ══════════════════════════════════════════════════════════════
   Kira Bender — script.js
   1. Loader      — sun rises, overlay fades away on load
   2. Parallax    — translateY on .hero-photo (absolute inside hero)
   3. Section setup — inject .section-fade then .section-glitter
                      in the correct stacking order
   4. Glitter     — ambient canvas sparks per content section
   5. Nav         — scroll backdrop, mobile menu, active section
   6. Reveal      — IntersectionObserver scroll fade-in
   7. A11y        — skip link, anchor focus management
══════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────
   1. LOADER
   Sun rises via CSS @keyframes (no JS needed for the animation).
   We wait for window.load + a minimum delay so the rise plays
   fully, then fade the overlay out.
───────────────────────────────────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  document.body.style.overflow = 'hidden';

  // sunRise is 1.4s + 0.5s tagline fadeIn — wait at least 2s total
  const MIN_MS   = 2000;
  const start    = Date.now();

  function dismiss() {
    loader.classList.add('hidden');
    document.body.style.overflow = '';
    // Remove from DOM after transition completes (.8s)
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }

  function onLoad() {
    const elapsed = Date.now() - start;
    setTimeout(dismiss, Math.max(0, MIN_MS - elapsed));
  }

  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad, { once: true });
  }
})();


/* ─────────────────────────────────────────────────────────────
   2. PARALLAX
   .hero-photo is position:absolute inside #hero (overflow:hidden).
   It starts 15% above and below the hero bounds so translateY
   has travel room without revealing a gap.
   We push it upward at 35% of scroll speed — the content scrolls
   away faster than the photo, creating genuine depth.
───────────────────────────────────────────────────────────── */
(function initParallax() {
  const photo = document.querySelector('.hero-photo');
  const hero  = document.getElementById('hero');
  if (!photo || !hero) return;

  // Don't run on touch devices — the scroll model is different
  // and the effect looks wrong on iOS in particular.
  if (!window.matchMedia('(hover: hover)').matches) return;

  const RATE = 0.35; // photo moves at 35% of scroll speed
  let rafPending = false;

  function update() {
    const scrollY = window.scrollY;
    const heroH   = hero.offsetHeight;

    // Only translate while hero is visible
    if (scrollY < heroH) {
      photo.style.transform = `translateY(${scrollY * RATE}px)`;
    }
    rafPending = false;
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update(); // initialise on page load
})();


/* ─────────────────────────────────────────────────────────────
   3. SECTION SETUP
   For each content section we inject two decorative elements
   in a specific order:
     1st child → .section-fade   (CSS gradient, z-index 0)
     2nd child → .section-glitter (canvas, z-index 0, drawn above)
   .section-body (z-index 1) sits above both.

   Inserting fade FIRST then canvas means canvas ends up between
   them in DOM order — but both are z-index 0, so they're in
   DOM order. The fade is visual only (a div), the canvas is
   drawn on top of it. That's fine: the fade dissolves the
   section edge; the canvas adds sparkle over the content area.
───────────────────────────────────────────────────────────── */
(function initSections() {
  const SECTIONS    = ['about', 'expertise', 'experience', 'contact'];
  const SPARK_COUNT = 55;
  const instances   = [];
  let t = 0, animId;

  SECTIONS.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;

    // ── Section fade div ──────────────────────────────────
    // Inserted as first child so it sits at the very top of
    // the section, behind .section-body content.
    const fade = document.createElement('div');
    fade.className = 'section-fade';
    fade.setAttribute('aria-hidden', 'true');
    section.insertBefore(fade, section.firstChild);

    // ── Glitter canvas ────────────────────────────────────
    // Inserted after the fade div (second child overall).
    const canvas = document.createElement('canvas');
    canvas.className = 'section-glitter';
    canvas.setAttribute('aria-hidden', 'true');
    // Insert after the fade div
    fade.insertAdjacentElement('afterend', canvas);

    const ctx = canvas.getContext('2d');
    let W, H, dpr;

    // Randomised sparks spread across the full section area
    const sparks = Array.from({ length: SPARK_COUNT }, () => ({
      xFrac: Math.random(),
      yFrac: Math.random(),
      phase: Math.random() * Math.PI * 2,
      freq:  0.3 + Math.random() * 0.9,
      amp:   0.18 + Math.random() * 0.42, // low amplitude = gentle
      size:  0.5  + Math.random() * 1.8,
    }));

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W   = section.offsetWidth;
      H   = section.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time) {
      ctx.clearRect(0, 0, W, H);
      sparks.forEach(s => {
        const b = Math.sin(s.phase + time * s.freq * 2.4);
        if (b < 0.08) return; // skip very dim sparks

        const px = s.xFrac * W;
        const py = s.yFrac * H;
        const a  = b * s.amp;
        const sz = s.size * (0.4 + b * 0.6);
        const r  = 255;
        const g  = Math.floor(140 + b * 80);
        const bl = Math.floor(18  + b * 40);

        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = `rgb(${r},${g},${bl})`;
        ctx.lineWidth   = sz * 0.5;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(px - sz, py);        ctx.lineTo(px + sz, py);       // horizontal
        ctx.moveTo(px, py - sz * 1.65); ctx.lineTo(px, py + sz * 1.65);// vertical
        ctx.stroke();

        // Soft glow halo
        const grd = ctx.createRadialGradient(px, py, 0, px, py, sz * 3);
        grd.addColorStop(0, `rgba(${r},${g},${bl},${a * 0.45})`);
        grd.addColorStop(1, 'rgba(200,100,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, sz * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    instances.push({ resize, draw });
    resize();
  });

  // Single shared animation loop drives all section canvases
  function tick() {
    t += 0.009;
    instances.forEach(inst => inst.draw(t));
    animId = requestAnimationFrame(tick);
  }
  tick();

  // Pause while tab is hidden to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else tick();
  });

  window.addEventListener('resize', () => {
    instances.forEach(inst => inst.resize());
  }, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────
   5. NAV — scroll backdrop, mobile menu, active section
───────────────────────────────────────────────────────────── */
(function initNav() {
  const nav  = document.getElementById('nav');
  const btn  = document.getElementById('menu-btn');
  const list = document.getElementById('nav-list');
  if (!nav) return;

  const links = list ? [...list.querySelectorAll('a')] : [];

  // Scroll: add .scrolled once past the hero fold
  let rafPending = false;
  window.addEventListener('scroll', () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
      rafPending = false;
    });
  }, { passive: true });

  // Mobile menu
  const openMenu  = () => {
    list.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    links[0]?.focus();
  };
  const closeMenu = () => {
    list.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  btn?.addEventListener('click', () =>
    list.classList.contains('open') ? closeMenu() : openMenu()
  );
  links.forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && list.classList.contains('open')) {
      closeMenu();
      btn?.focus();
    }
  });

  // Highlight active nav link based on which section is in view
  const sections   = document.querySelectorAll('section[id]');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        const active = a.getAttribute('href') === '#' + e.target.id;
        a.setAttribute('aria-current', active ? 'page' : 'false');
        a.style.color = active ? 'var(--amber-pale)' : '';
      });
    });
  }, { threshold: 0.45 });
  sections.forEach(s => sectionObs.observe(s));
})();


/* ─────────────────────────────────────────────────────────────
   6. SCROLL REVEAL
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
   7. ACCESSIBILITY
───────────────────────────────────────────────────────────── */
(function initA11y() {
  // Make sections programmatically focusable for skip-nav / anchor links
  document.querySelectorAll('section[id], main').forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  });

  // Skip link: smooth scroll then focus destination
  const skip = document.querySelector('.skip-link');
  skip?.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(skip.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => target.focus({ preventScroll: true }), 380);
    }
  });

  // Anchor clicks: focus destination after scroll completes
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      const id     = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (target) setTimeout(() => target.focus({ preventScroll: true }), 420);
    });
  });
})();