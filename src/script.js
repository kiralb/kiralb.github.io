/* Nav scroll */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* Mobile menu */
const menuBtn = document.getElementById('menu-btn');
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
const activeObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
    if (e.isIntersecting) {
        navAnchors.forEach(a => a.style.color = '');
        const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (a) a.style.color = 'var(--matcha)';
    }
    });
}, { threshold: 0.45 });
document.querySelectorAll('section[id]').forEach(s => activeObs.observe(s));