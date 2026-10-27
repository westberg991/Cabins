/* ═══════════════════════════════════════════════════════════
   FRIDEN — Interaktivitet (delas av svenska och engelska sidan)
   Språk avgörs av <html lang="...">, bildmappen av <body data-base="..."> och bildlistan av #slideData
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var lang = html.lang === 'en' ? 'en' : 'sv';
  var base = document.body.getAttribute('data-base') || 'bilder/';

  /* ── Texter som behövs i JavaScript ───────────────────── */
  var T = {
    sv: {
      toDark: 'Byt till mörkt läge',
      toLight: 'Byt till ljust läge',
      menuOpen: 'Öppna meny',
      menuClose: 'Stäng meny',
      show: function (i, n, alt) { return 'Visa ' + i + ' av ' + n + ': ' + alt; }
    },
    en: {
      toDark: 'Switch to dark mode',
      toLight: 'Switch to light mode',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      show: function (i, n, alt) { return 'Show ' + i + ' of ' + n + ': ' + alt; }
    }
  }[lang];

  /* ── Tema (kommer ihåg valet) ─────────────────────────── */
  var themeToggle = document.getElementById('themeToggle');

  function readTheme() {
    try { var saved = localStorage.getItem('friden-theme'); if (saved) return saved; } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  var MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (!themeToggle) return;
    var dark = theme === 'dark';
    themeToggle.innerHTML = dark ? SUN : MOON;
    var label = dark ? T.toLight : T.toDark;
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
  }

  applyTheme(readTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('friden-theme', next); } catch (e) {}
    });
  }

  /* ── Burgarmeny ───────────────────────────────────────── */
  var burger = document.getElementById('burger');
  var navLinks = document.getElementById('navLinks');

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? T.menuClose : T.menuOpen);
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', T.menuOpen);
      }
    });
  }

  /* ── Scroll reveal ────────────────────────────────────── */
  var revealEls = document.querySelectorAll('[data-r]');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { obs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('on'); });
  }

  /* ── Galleri ──────────────────────────────────────────── */
  /* Bildlistan ligger som JSON i respektive sida: <script type="application/json" id="slideData"> */
  var slides = [];
  try {
    slides = JSON.parse(document.getElementById('slideData').textContent)
      .map(function (s) { return { src: base + s.f, alt: s.alt }; });
  } catch (e) {}

  var mainImg = document.getElementById('mainImg');
  var thumbStrip = document.getElementById('thumbStrip');
  if (!mainImg || !thumbStrip || !slides.length) return;

  var counter = document.getElementById('slideCounter');
  var progressEl = document.getElementById('slideProgress');
  var backdrop = document.getElementById('galleryBackdrop');
  var idx = 0;

  slides.forEach(function (s, i) {
    var item = document.createElement('button');
    item.type = 'button';
    item.className = 'gallery-thumb-item' + (i === 0 ? ' active' : '');
    item.setAttribute('aria-label', T.show(i + 1, slides.length, s.alt));
    item.innerHTML = '<img src="' + s.src + '" alt="" loading="lazy" decoding="async" />';
    item.addEventListener('click', function () { goTo(i); });
    thumbStrip.appendChild(item);
  });

  function preload(i) {
    var n = (i + slides.length) % slides.length;
    (new Image()).src = slides[n].src;
  }

  function goTo(newIdx) {
    idx = (newIdx + slides.length) % slides.length;
    var s = slides[idx];

    backdrop.style.backgroundImage = "url('" + s.src + "')";
    mainImg.src = s.src;
    mainImg.alt = s.alt;

    counter.textContent = (idx + 1) + ' / ' + slides.length;
    progressEl.style.width = ((idx + 1) / slides.length * 100) + '%';

    Array.prototype.forEach.call(thumbStrip.children, function (el, i) {
      el.classList.toggle('active', i === idx);
    });
    var activeThumb = thumbStrip.children[idx];
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    preload(idx + 1);
    preload(idx - 1);
  }

  /* Startläge (HTML innehåller redan första bilden) */
  backdrop.style.backgroundImage = "url('" + slides[0].src + "')";
  counter.textContent = '1 / ' + slides.length;
  progressEl.style.width = (100 / slides.length) + '%';

  document.getElementById('next').addEventListener('click', function () { goTo(idx + 1); });
  document.getElementById('prev').addEventListener('click', function () { goTo(idx - 1); });

  /* Piltangenter när fokus är i galleriet */
  var gallery = document.getElementById('galleri');
  document.addEventListener('keydown', function (e) {
    if (!gallery || !gallery.contains(document.activeElement)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(idx - 1); }
  });
})();
