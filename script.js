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
    return 'light';
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

  var track = document.getElementById('carouselTrack');
  var dotsEl = document.getElementById('carouselDots');
  if (!track || !dotsEl || !slides.length) return;

  var live = document.getElementById('slideCounter');
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var els = [], dots = [], bgs = [], imgs = [], idx = 0;

  slides.forEach(function (s, i) {
    var fig = document.createElement('figure');
    fig.className = 'slide';
    fig.setAttribute('role', 'group');
    fig.setAttribute('aria-roledescription', 'slide');
    fig.setAttribute('aria-label', (i + 1) + ' / ' + slides.length);

    var bg = document.createElement('div');
    bg.className = 'slide-bg';
    bg.setAttribute('aria-hidden', 'true');

    var img = new Image();
    img.alt = s.alt;
    img.decoding = 'async';
    img.loading = i < 2 ? 'eager' : 'lazy';
    img.src = s.src;

    fig.appendChild(bg);
    fig.appendChild(img);
    fig.addEventListener('click', function () { if (i !== idx) goTo(i); });
    track.appendChild(fig);

    var d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', T.show(i + 1, slides.length, s.alt));
    d.addEventListener('click', function () { goTo(i); });
    dotsEl.appendChild(d);

    els.push(fig); bgs.push(bg); imgs.push(img); dots.push(d);
  });

  function setActive(i) {
    idx = i;
    els.forEach(function (el, n) {
      var active = n === i;
      var near = Math.abs(n - i) <= 1;
      el.classList.toggle('is-active', active);
      dots[n].classList.toggle('is-active', active);
      if (active) dots[n].setAttribute('aria-current', 'true'); else dots[n].removeAttribute('aria-current');
      /* Suddig bakgrund och förladdning bara för aktuell bild och grannarna */
      if (near) {
        imgs[n].loading = 'eager';
        bgs[n].style.backgroundImage = "url('" + slides[n].src + "')";
      } else {
        bgs[n].style.backgroundImage = '';
      }
    });
    if (live) live.textContent = T.show(i + 1, slides.length, slides[i].alt);
  }

  function scrollTarget(i) {
    var el = els[i];
    return el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
  }

  function goTo(i, instant) {
    var n = (i + slides.length) % slides.length;
    track.scrollTo({ left: scrollTarget(n), behavior: (instant || reduceMotion) ? 'auto' : 'smooth' });
    if (instant) setActive(n);
  }

  /* Vilken bild ligger i mitten just nu? (uppdateras vid svep och knapptryck) */
  var ticking = false;
  track.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bestDist = Infinity;
      els.forEach(function (el, n) {
        var dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = n; }
      });
      if (best !== idx) setActive(best);
    });
  }, { passive: true });

  window.addEventListener('resize', function () { track.scrollTo({ left: scrollTarget(idx), behavior: 'auto' }); });

  document.getElementById('next').addEventListener('click', function () { goTo(idx + 1, idx === slides.length - 1); });
  document.getElementById('prev').addEventListener('click', function () { goTo(idx - 1, idx === 0); });

  setActive(0);

  /* Piltangenter när fokus är i galleriet */
  var gallery = document.getElementById('galleri');
  document.addEventListener('keydown', function (e) {
    if (!gallery || !gallery.contains(document.activeElement)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1, idx === slides.length - 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(idx - 1, idx === 0); }
  });
})();
