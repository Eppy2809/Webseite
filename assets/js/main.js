/* =========================================================
   Valtro-Webdesign — Interaktion

   Ohne Fremdbibliothek: Navigation, Reveals, Formularprüfung.
   Alles, was früher GSAP brauchte — Preloader, Zähler, Laufband,
   Scroll-Parallaxe, Magnet-Buttons, eigener Mauszeiger — ist als
   Vorlagen-Manier entfallen. Übrig bleiben CSS-Übergänge und ein
   IntersectionObserver.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.remove('no-js');

  /* ---------------------------------------------------------
     Reveals beim Hereinscrollen
     --------------------------------------------------------- */
  function initReveals() {
    var items = document.querySelectorAll('.reveal');

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Gruppen laufen leicht versetzt ein, damit eine Reihe nicht springt.
    ['.services', '.pricing', '.process'].forEach(function (sel) {
      var group = document.querySelector(sel);
      if (!group) return;
      Array.prototype.forEach.call(group.children, function (kid, i) {
        kid.dataset.delay = Math.min(i, 5) * 70;
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (entry.target.dataset.delay || 0) + 'ms';
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Kurzes Rütteln bei fehlerhaftem Formular
     --------------------------------------------------------- */
  function shake(el) {
    if (reduced) return;
    el.classList.remove('is-shaking');
    void el.offsetWidth; // Neustart der Animation erzwingen
    el.classList.add('is-shaking');
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
    var lastScrollY = window.scrollY || window.pageYOffset;
    var mobileMenu = window.matchMedia('(max-width: 900px)');

    function setMenuState(open, options) {
      if (!links || !burger) return;

      options = options || {};
      open = Boolean(open && mobileMenu.matches);

      links.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      document.body.classList.toggle('is-locked', open);

      // Unsichtbare Menüpunkte dürfen weder per Tab noch durch
      // Assistenztechnik erreichbar sein. Auf Desktop bleibt die
      // Navigation unabhängig vom mobilen Zustand vollständig aktiv.
      links.inert = mobileMenu.matches && !open;
      if (mobileMenu.matches && !open) {
        links.setAttribute('aria-hidden', 'true');
      } else {
        links.removeAttribute('aria-hidden');
      }

      if (open && options.focusFirst) {
        var firstLink = links.querySelector('a[href]');
        if (firstLink) window.requestAnimationFrame(function () { firstLink.focus(); });
      } else if (!open && options.returnFocus) {
        burger.focus();
      }
    }

    function closeMenu(returnFocus) {
      setMenuState(false, { returnFocus: returnFocus });
    }

    if (burger && links) {
      setMenuState(false);

      burger.addEventListener('click', function () {
        if (nav) nav.classList.remove('is-hidden');
        var open = !links.classList.contains('is-open');
        setMenuState(open, { focusFirst: open, returnFocus: !open });
      });

      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeMenu(true);
      });

      document.addEventListener('keydown', function (e) {
        var open = mobileMenu.matches && links.classList.contains('is-open');
        if (!open) return;

        if (e.key === 'Escape') {
          e.preventDefault();
          closeMenu(true);
          return;
        }

        if (e.key === 'Tab') {
          var focusable = [burger].concat(Array.prototype.slice.call(links.querySelectorAll('a[href]')));
          var index = focusable.indexOf(document.activeElement);
          var direction = e.shiftKey ? -1 : 1;
          var next = index < 0 ? 0 : (index + direction + focusable.length) % focusable.length;
          e.preventDefault();
          focusable[next].focus();
        }
      });

      function syncMenuToViewport() {
        setMenuState(false);
      }

      if (mobileMenu.addEventListener) {
        mobileMenu.addEventListener('change', syncMenuToViewport);
      } else {
        mobileMenu.addListener(syncMenuToViewport);
      }
    }

    // Sticky-Zustand + Fortschrittsbalken
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (nav) {
        var menuOpen = links && links.classList.contains('is-open');
        var scrollingDown = y > lastScrollY + 3;
        var scrollingUp = y < lastScrollY - 3;

        nav.classList.toggle('is-stuck', y > 24);
        if (menuOpen || y < nav.offsetHeight) {
          nav.classList.remove('is-hidden');
        } else if (scrollingDown) {
          nav.classList.add('is-hidden');
        } else if (scrollingUp) {
          nav.classList.remove('is-hidden');
        }
      }
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
      lastScrollY = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // Aktiver Link je Sektion
    var sections = ['start', 'leistungen', 'preise', 'projekte', 'kontakt']
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
     Kontaktformular
     --------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var status = document.getElementById('formStatus');
    var summary = document.getElementById('formSummary');
    var submitButton = form.querySelector('button[type="submit"]');
    var formOpenedAt = Date.now();
    var startedAt = form.elements.started_at;

    if (startedAt) startedAt.value = String(formOpenedAt);

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
      service: function (v) {
        return v ? '' : 'Bitte wählen Sie die gewünschte Leistung aus.';
      },
      message: function (v) {
        if (!v.trim()) return 'Bitte schreiben Sie ein paar Zeilen zu Ihrem Projekt.';
        if (v.trim().length < 10) return 'Bitte etwas ausführlicher (min. 10 Zeichen).';
        return '';
      },
      privacy: function (_, el) {
        return el.checked ? '' : 'Bitte bestätigen Sie die Kenntnisnahme der Datenschutzerklärung.';
      }
    };

    function setError(name, msg) {
      var el = form.elements[name];
      var box = form.querySelector('[data-error-for="' + name + '"]');
      var field = el.closest('.field, .check');
      if (box) box.textContent = msg;
      if (field) field.classList.toggle('has-error', Boolean(msg));
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }

    function renderSummary(shouldFocus) {
      if (!summary) return;

      var list = summary.querySelector('ul');
      var invalid = form.querySelectorAll('[aria-invalid="true"]');
      list.textContent = '';

      invalid.forEach(function (el) {
        var box = form.querySelector('[data-error-for="' + el.name + '"]');
        if (!box || !box.textContent) return;
        var item = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + el.id;
        link.textContent = box.textContent;
        link.addEventListener('click', function (e) {
          e.preventDefault();
          el.focus();
        });
        item.appendChild(link);
        list.appendChild(item);
      });

      summary.hidden = invalid.length === 0;
      if (shouldFocus && invalid.length) summary.focus();
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
        if (box && box.textContent) {
          validate(name);
          if (summary && !summary.hidden) renderSummary(false);
        }
      });
    });

    document.querySelectorAll('[data-service]').forEach(function (link) {
      link.addEventListener('click', function () {
        form.elements.service.value = link.dataset.service || '';
        setError('service', '');
        if (summary && !summary.hidden) renderSummary(false);
      });
    });

    function resetSubmitButton() {
      if (!submitButton) return;
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      submitButton.querySelector('span').textContent = 'Nachricht senden';
    }

    form.addEventListener('submit', async function (e) {
      if (status) { status.textContent = ''; status.classList.remove('is-error'); }

      var ok = Object.keys(rules).map(validate).every(Boolean);

      if (!ok) {
        e.preventDefault();
        renderSummary(true);
        shake(form);
        return;
      }

      if (summary) summary.hidden = true;

      // Bots füllen den unsichtbaren Honeypot häufig aus oder senden sofort ab.
      if (form.elements.website.value || Date.now() - formOpenedAt < 2500) {
        e.preventDefault();
        if (status) {
          status.textContent = 'Die Anfrage konnte noch nicht gesendet werden. Bitte versuchen Sie es in einem Moment erneut.';
          status.classList.add('is-error');
        }
        return;
      }

      e.preventDefault();

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        submitButton.querySelector('span').textContent = 'Wird übertragen …';
      }
      if (status) status.textContent = 'Ihre Anfrage wird verschlüsselt übertragen …';

      try {
        var response = await fetch(form.action, {
          method: 'POST',
          body: new URLSearchParams(new FormData(form)),
          headers: { Accept: 'application/json' },
          credentials: 'same-origin'
        });
        var result = await response.json().catch(function () { return {}; });

        if (!response.ok) {
          throw new Error(result.message || 'Die Anfrage konnte nicht gesendet werden.');
        }

        window.location.assign('/danke.html');
      } catch (error) {
        resetSubmitButton();
        if (status) {
          status.textContent = error.message || 'Die Anfrage konnte nicht gesendet werden. Bitte nutzen Sie E-Mail oder WhatsApp.';
          status.classList.add('is-error');
        }
      }
    });

    // Nach einer Rückkehr aus dem Browser-Cache darf der Button nicht gesperrt bleiben.
    window.addEventListener('pageshow', function () {
      resetSubmitButton();
    });
  }

  /* ---------------------------------------------------------
     Befristete Neukundenaktion
     --------------------------------------------------------- */
  function initOffer() {
    var offer = document.getElementById('neukundenangebot');
    var countdown = document.getElementById('offerCountdown');
    if (!offer || !countdown) return;

    var deadline = new Date(offer.dataset.offerDeadline);
    var remaining = deadline.getTime() - Date.now();
    var priceOffers = document.querySelectorAll('.price-card__offer');

    if (!Number.isFinite(deadline.getTime()) || remaining < 0) {
      offer.hidden = true;
      priceOffers.forEach(function (item) { item.hidden = true; });
      return;
    }

    var days = Math.max(1, Math.ceil(remaining / 86400000));
    countdown.textContent = days === 1 ? 'Nur noch 1 Tag' : 'Noch ' + days + ' Tage';
  }

  /* ---------------------------------------------------------
     Kleinkram
     --------------------------------------------------------- */
  function initMisc() {
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // Sanftes Scrollen inkl. Offset für die fixe Navigation. Die Höhe
    // wird gemessen statt geraten: die Leiste trägt jetzt zusätzlich
    // eine Kopfzeile, die unter 900px entfällt.
    var header = document.getElementById('nav');
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = (header ? header.offsetHeight : 68) + 8;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
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
    initOffer();
    initForm();
    initReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
