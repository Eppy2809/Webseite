/* =========================================================
   Valtro-Webdesign — Interaktion & Animation
   GSAP + ScrollTrigger, mit sauberem Fallback ohne beides.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var gsap = window.gsap;
  var hasGSAP = typeof gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  root.classList.remove('no-js');

  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
  }

  var animate = hasGSAP && !reduced;

  /* ---------------------------------------------------------
     Reveal-Animationen
     --------------------------------------------------------- */
  function initReveals() {
    var items = document.querySelectorAll('.reveal');

    if (!animate || !window.ScrollTrigger) {
      // Fallback: IntersectionObserver (oder direkt sichtbar)
      if (!('IntersectionObserver' in window) || reduced) {
        items.forEach(function (el) { el.classList.add('is-visible'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.style.transitionDelay = (entry.target.dataset.delay || 0) + 'ms';
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' });
      items.forEach(function (el) { io.observe(el); });
      return;
    }

    // Hero-Elemente laufen über die Intro-Timeline,
    // Gruppen-Kinder werden weiter unten gestaffelt.
    Array.prototype.filter.call(items, function (el) {
      return !el.closest('.hero, .cards, .grid, .process');
    }).forEach(function (el) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: .9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // Karten & Projekte gestaffelt
    ['.cards', '.grid', '.process'].forEach(function (sel) {
      var group = document.querySelector(sel);
      if (!group) return;
      var kids = group.children;
      gsap.to(kids, {
        opacity: 1,
        y: 0,
        duration: .9,
        stagger: .09,
        ease: 'power3.out',
        scrollTrigger: { trigger: group, start: 'top 82%', once: true }
      });
    });
  }

  /* ---------------------------------------------------------
     Hero-Intro (Headline wortweise)
     --------------------------------------------------------- */
  function heroIntro() {
    var words = document.querySelectorAll('.hero__title .word');
    if (!animate) {
      words.forEach(function (w) { w.style.transform = 'none'; });
      return null;
    }

    // Zielzustand setzen, bevor die from()-Tweens ihre Startwerte lesen
    gsap.set('.hero .reveal', { opacity: 1, y: 0 });

    var tl = gsap.timeline();
    tl.from(words, {
      yPercent: 118,
      duration: 1.1,
      ease: 'expo.out',
      stagger: .07
    })
      .from('.hero .eyebrow', { opacity: 0, y: 14, duration: .7, ease: 'power2.out' }, .15)
      .from('.hero__lead', { opacity: 0, y: 20, duration: .8, ease: 'power2.out' }, '-=.7')
      .from('.hero__actions .btn', { opacity: 0, y: 20, duration: .7, stagger: .09, ease: 'power2.out' }, '-=.55')
      .from('.hero__stats > div', { opacity: 0, y: 18, duration: .7, stagger: .08, ease: 'power2.out' }, '-=.5')
      .from('.hero__scroll', { opacity: 0, duration: .6 }, '-=.4');

    return tl;
  }

  /* ---------------------------------------------------------
     Preloader
     --------------------------------------------------------- */
  function initPreloader(onDone) {
    var pre = document.getElementById('preloader');
    if (!pre) { onDone(); return; }

    var count = pre.querySelector('.preloader__count');
    var bar = pre.querySelector('.preloader__bar i');

    function finish() {
      pre.remove();
      document.body.style.removeProperty('overflow');
      onDone();
    }

    if (!animate) {
      if (count) count.textContent = '100';
      finish();
      return;
    }

    document.body.style.overflow = 'hidden';
    var state = { v: 0 };

    gsap.timeline({ onComplete: finish })
      .to(state, {
        v: 100,
        duration: 1.1,
        ease: 'power2.inOut',
        onUpdate: function () {
          var v = Math.round(state.v);
          if (count) count.textContent = v;
          if (bar) bar.style.right = (100 - v) + '%';
        }
      })
      .to('.preloader__inner', { opacity: 0, duration: .35, ease: 'power2.in' }, '+=.1')
      .to(pre, { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '-=.1');
  }

  /* ---------------------------------------------------------
     Navigation
     --------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    var links = document.getElementById('navLinks');
    var progress = document.getElementById('navProgress');
    var navLinks = document.querySelectorAll('.nav__link');

    function closeMenu() {
      if (!links || !burger) return;
      links.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Menü öffnen');
      document.body.classList.remove('is-locked');
    }

    if (burger && links) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('is-open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
        document.body.classList.toggle('is-locked', open);
      });

      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeMenu();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
      });
    }

    // Sticky-Zustand + Fortschrittsbalken
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle('is-stuck', y > 24);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // Aktiver Link je Sektion
    var sections = ['start', 'leistungen', 'projekte', 'kontakt']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------------------------------------------------------
     Zähler in der Hero-Statistik
     --------------------------------------------------------- */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count]');

    function run(el) {
      var target = parseFloat(el.dataset.count) || 0;
      var suffix = el.dataset.suffix || '';
      if (!animate) { el.textContent = target + suffix; return; }
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
      });
    }

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: .6 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------
     Endlos-Laufband
     --------------------------------------------------------- */
  function initMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track) return;

    track.innerHTML += track.innerHTML; // nahtlose Wiederholung
    if (!animate) return;

    gsap.to(track, {
      xPercent: -50,
      duration: 26,
      ease: 'none',
      repeat: -1
    });
  }

  /* ---------------------------------------------------------
     Parallax beim Scrollen
     --------------------------------------------------------- */
  function initParallax() {
    if (!animate || !window.ScrollTrigger) return;

    gsap.to('.hero__inner', {
      y: 90,
      opacity: .35,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 }
    });

    gsap.to('.hero__grid', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    document.querySelectorAll('.project__art').forEach(function (art) {
      gsap.fromTo(art, { yPercent: -6 }, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: art, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------------------------------------------------------
     Karten: Spotlight + dezenter Tilt
     --------------------------------------------------------- */
  function initCards() {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');

        if (!animate || !fine) return;
        gsap.to(card, {
          rotateX: ((y / r.height) - .5) * -5,
          rotateY: ((x / r.width) - .5) * 5,
          transformPerspective: 1000,
          duration: .6,
          ease: 'power2.out'
        });
      });

      card.addEventListener('pointerleave', function () {
        if (!animate || !fine) return;
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1, .6)' });
      });
    });
  }

  /* ---------------------------------------------------------
     Magnetische Buttons
     --------------------------------------------------------- */
  function initMagnetic() {
    if (!animate || !fine) return;

    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * .25,
          y: (e.clientY - (r.top + r.height / 2)) * .35,
          duration: .5,
          ease: 'power3.out'
        });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .4)' });
      });
    });
  }

  /* ---------------------------------------------------------
     Eigener Cursor
     --------------------------------------------------------- */
  function initCursor() {
    var cursor = document.getElementById('cursor');
    if (!cursor || !fine || reduced) { if (cursor) cursor.remove(); return; }

    var ring = cursor.querySelector('.cursor__ring');
    var dot = cursor.querySelector('.cursor__dot');
    var pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var ringPos = { x: pos.x, y: pos.y };

    document.addEventListener('pointermove', function (e) {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px) translate(-50%,-50%)';
    }, { passive: true });

    (function loop() {
      ringPos.x += (pos.x - ringPos.x) * .16;
      ringPos.y += (pos.y - ringPos.y) * .16;
      ring.style.transform = 'translate(' + ringPos.x + 'px,' + ringPos.y + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a, button, .card, .project, input, textarea, label')
      .forEach(function (el) {
        el.addEventListener('pointerenter', function () { cursor.classList.add('is-hover'); });
        el.addEventListener('pointerleave', function () { cursor.classList.remove('is-hover'); });
      });
  }

  /* ---------------------------------------------------------
     Kontaktformular
     --------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var status = document.getElementById('formStatus');
    var mail = 'kontakt@valtro.cloud';

    var rules = {
      name: function (v) {
        if (!v.trim()) return 'Bitte geben Sie Ihren Namen an.';
        if (v.trim().length < 2) return 'Der Name ist zu kurz.';
        return '';
      },
      email: function (v) {
        if (!v.trim()) return 'Bitte geben Sie Ihre E-Mail-Adresse an.';
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())) return 'Diese E-Mail-Adresse sieht nicht gültig aus.';
        return '';
      },
      message: function (v) {
        if (!v.trim()) return 'Bitte schreiben Sie ein paar Zeilen zu Ihrem Projekt.';
        if (v.trim().length < 10) return 'Bitte etwas ausführlicher (min. 10 Zeichen).';
        return '';
      },
      privacy: function (_, el) {
        return el.checked ? '' : 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.';
      }
    };

    function setError(name, msg) {
      var el = form.elements[name];
      var box = form.querySelector('[data-error-for="' + name + '"]');
      var field = el.closest('.field');
      if (box) box.textContent = msg;
      if (field) field.classList.toggle('has-error', Boolean(msg));
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }

    function validate(name) {
      var el = form.elements[name];
      return setError(name, rules[name](el.value || '', el));
    }

    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      el.addEventListener('blur', function () { validate(name); });
      el.addEventListener('input', function () {
        var box = form.querySelector('[data-error-for="' + name + '"]');
        if (box && box.textContent) validate(name);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) { status.textContent = ''; status.classList.remove('is-error'); }

      var ok = Object.keys(rules).map(validate).every(Boolean);

      if (!ok) {
        if (status) {
          status.textContent = 'Bitte prüfen Sie die markierten Felder.';
          status.classList.add('is-error');
        }
        var firstError = form.querySelector('.has-error input, .has-error textarea, [aria-invalid="true"]');
        if (firstError) firstError.focus();
        if (animate) gsap.fromTo(form, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .35)' });
        return;
      }

      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();

      var subject = 'Projektanfrage von ' + name;
      var body = 'Name: ' + name + '\nE-Mail: ' + email + '\n\n' + message;

      // Statisches Hosting: Anfrage wird ins E-Mail-Programm übergeben.
      window.location.href = 'mailto:' + mail +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      if (status) {
        status.textContent = 'Danke, ' + name + '! Ihre Anfrage wird im E-Mail-Programm geöffnet. ' +
          'Falls sich nichts tut: einfach direkt an ' + mail + ' schreiben.';
      }

      if (animate) {
        gsap.fromTo(form.querySelector('button[type="submit"]'),
          { scale: .96 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .5)' });
      }
    });
  }

  /* ---------------------------------------------------------
     Kleinkram
     --------------------------------------------------------- */
  function initMisc() {
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // Sanftes Scrollen inkl. Offset für die fixe Navigation
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 68;
        window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
        history.replaceState(null, '', id);
      });
    });
  }

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */
  function boot() {
    initNav();
    initMisc();
    initForm();
    initCards();
    initMagnetic();
    initCursor();
    initMarquee();

    initPreloader(function () {
      heroIntro();
      initReveals();
      initCounters();
      initParallax();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
