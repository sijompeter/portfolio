/* ============================================================
   Sijo M Peter — portfolio
   Navigation model: you should always know where you are, what's
   next, and how to get back. Case studies open over the work grid
   instead of replacing it, so closing one returns you to the card
   you came from with your scroll position intact.
   Everything degrades: with no JS, every link is still a real page.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var lenis = null;

  /* ---------- smooth scroll ---------- */
  function smooth() {
    if (reduce || typeof window.Lenis === 'undefined') return;
    try {
      lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      if (hasGsap && window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
      }
    } catch (e) { lenis = null; }
  }
  function stopScroll(on) {
    if (!lenis) return;
    try { on ? lenis.stop() : lenis.start(); } catch (e) {}
  }
  /* the only place that decides where a section lands: flush with the top,
     minus whatever bar is actually on screen at that width */
  function topOffset() { return window.innerWidth <= 880 ? 74 : 28; }
  function scrollToEl(el) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) - topOffset();
    if (y < 0) y = 0;
    if (lenis) { try { lenis.scrollTo(y, { duration: 1 }); return; } catch (e) {} }
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- theme ----------
     Light is the default and the system setting never overrides it. The
     switch is deliberately quiet: footer and menu only. The choice is kept
     in localStorage, which can throw or come back empty in a private window
     or an embedded frame, so every access is guarded and the page still
     renders correctly without it. */
  var THEME_KEY = 'smp-theme';

  /* Carry the choice in the link itself.
     localStorage is the primary store, but a published multi-page artifact can
     serve each page in its own storage partition, and then the preference is
     lost the moment you leave the home page — which is exactly the bug Sijo
     reported: light on home, something else on Work. Stamping t=dark onto every
     internal link makes the choice travel with the click, and the pre-paint
     script in the <head> applies it before the first frame, so there is no
     flash. Light is the default, so light stamps nothing and the address bar
     stays clean for almost everyone. */
  function stampHref(h, mode) {
    var hash = '', q = '', i = h.indexOf('#');
    if (i > -1) { hash = h.slice(i); h = h.slice(0, i); }
    i = h.indexOf('?');
    if (i > -1) { q = h.slice(i + 1); h = h.slice(0, i); }
    var parts = [];
    if (q) {
      q.split('&').forEach(function (kv) { if (kv.slice(0, 2) !== 't=') parts.push(kv); });
    }
    if (mode === 'dark') parts.push('t=dark');
    return h + (parts.length ? '?' + parts.join('&') : '') + hash;
  }

  function stampLinks(mode) {
    Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || a.hasAttribute('download') || a.target === '_blank') return;
      if (h.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(h) || h.indexOf('/_blob/') === 0) return;
      var next = stampHref(h, mode);
      if (next !== h) a.setAttribute('href', next);
    });
  }

  function applyTheme(mode) {
    var root = document.documentElement;
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    Array.prototype.slice.call(document.querySelectorAll('[data-theme-toggle]'))
      .forEach(function (b) {
        b.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
        b.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      });
    stampLinks(mode);
    window.__theme = mode;
  }
  window.__stampLinks = function () { stampLinks(window.__theme || 'light'); };

  /* ---------- working notes ----------
     The same shape as the theme switch: a remembered per-viewer preference,
     off by default, that reveals the pending-evidence markers. */
  var NOTES_KEY = 'smp-notes';

  function notes() {
    var on = false;
    try { on = localStorage.getItem(NOTES_KEY) === 'on'; } catch (e) {}
    document.documentElement.classList.toggle('notes', on);

    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-notes-toggle]') : null;
      if (!b) return;
      e.preventDefault();
      on = !document.documentElement.classList.contains('notes');
      document.documentElement.classList.toggle('notes', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      try { localStorage.setItem(NOTES_KEY, on ? 'on' : 'off'); } catch (err) {}
    });
  }


  /* ---------- Clarity custom events ----------
     The tag records sessions and heatmaps on its own. It cannot know what a
     click MEANT, so the handful of actions worth counting are named here and
     show up in Clarity as filterable events. track() is a no-op when the tag
     is blocked or still loading, so nothing here can break the page. */
  function track(name) {
    try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch (e) {}
  }
  window.__track = track;

  function events() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t || !t.closest) return;
      if (t.closest('a[data-resume]'))            track('resume_download');
      else if (t.closest('a[href*="whatsapp"]'))     track('contact_whatsapp');
      else if (t.closest('a[href^="mailto:"]'))   track('contact_email');
      else if (t.closest('a[href^="tel:"]'))      track('contact_phone');
      else if (t.closest('a[href*="linkedin.com"]'))  track('visit_linkedin');
      else if (t.closest('a[href*="dribbble.com"]'))  track('visit_dribbble');
      else if (t.closest('a[href*="medium.com"]'))    track('visit_medium');
      else {
        var c = t.closest('[data-case]');
        if (c) track('case_open_' + c.getAttribute('data-case'));
      }
    }, true);

    /* a visitor who reaches the footer has read the page, not bounced */
    var foot = document.querySelector('.site-foot');
    if (foot && 'IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (es) {
        if (!seen && es.some(function (x) { return x.isIntersecting; })) {
          seen = true; track('reached_footer');
        }
      }, { threshold: 0.2 }).observe(foot);
    }
  }

  /* The device preference is the starting point; an explicit choice outranks
     it and is remembered. Light is still the answer when the device says
     nothing, which is most desktops. */
  function prefersDark() {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
    catch (e) { return false; }
  }


  /* ---------- employer logos, on hover ----------
     No markup changes anywhere: this finds the company names by reading the
     text of the places they already appear (the hero strip, the timeline
     rows, the About blocks) and matches them against the five keys. That way
     a page I do not regenerate, experience.html among them, picks it up too.
     Pointer devices only, and never over a link's own hover target. */
  var COMPANIES = [
    ['marketfeed', /marketfeed/i],
    ['zolostays',  /zolo(stays)?/i],
    ['hashedin',   /hashed\s*in/i],
    ['dimoda',     /dimoda/i],
    ['greenwich',  /greenwich/i]
  ];

  function cologo() {
    var card = document.getElementById('cologo');
    if (!card) return;
    if (!window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    var root = document.documentElement;
    var items = {};
    Array.prototype.slice.call(card.querySelectorAll('.cl-item')).forEach(function (el) {
      items[el.getAttribute('data-for')] = el;
    });

    function keyFor(text) {
      if (!text) return null;
      for (var i = 0; i < COMPANIES.length; i++) {
        if (COMPANIES[i][1].test(text)) return COMPANIES[i][0];
      }
      return null;
    }

    /* the places a company name is written */
    var candidates = []
      .concat(Array.prototype.slice.call(document.querySelectorAll('[data-co]')))
      .concat(Array.prototype.slice.call(document.querySelectorAll('p.co')))
      .concat(Array.prototype.slice.call(document.querySelectorAll('.sv-body h3')));

    var marked = 0;
    candidates.forEach(function (el) {
      if (el.hasAttribute('data-colog')) return;
      var key = el.getAttribute('data-co') || keyFor(el.textContent);
      if (!key || !items[key]) return;
      el.setAttribute('data-colog', key);
      marked++;
    });
    if (!marked) return;

    var shown = null, raf = null, px = 0, py = 0;

    function move() {
      raf = null;
      var w = card.offsetWidth || 150, h = card.offsetHeight || 60;
      var x = px + 20, y = py + 20;
      if (x + w > window.innerWidth - 10) x = px - 20 - w;
      if (y + h > window.innerHeight - 10) y = py - 20 - h;
      card.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }

    document.addEventListener('mousemove', function (e) {
      var el = e.target.closest ? e.target.closest('[data-colog]') : null;
      var key = el ? el.getAttribute('data-colog') : null;
      if (key !== shown) {
        if (shown && items[shown]) items[shown].classList.remove('on');
        shown = key;
        if (key && items[key]) items[key].classList.add('on');
        root.classList.toggle('cologo-on', !!key);
      }
      if (!key) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = window.requestAnimationFrame(move);
    }, { passive: true });

    window.addEventListener('blur', function () {
      if (shown && items[shown]) items[shown].classList.remove('on');
      shown = null; root.classList.remove('cologo-on');
    });
  }

  function theme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === 'dark' || saved === 'light') applyTheme(saved);
    else applyTheme(prefersDark() ? 'dark' : 'light');

    /* follow the device if it changes while the page is open, but never
       override a choice the visitor has already made */
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) {
        var pick = null;
        try { pick = localStorage.getItem(THEME_KEY); } catch (err) {}
        if (pick !== 'dark' && pick !== 'light') applyTheme(e.matches ? 'dark' : 'light');
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}

    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
      if (!b) return;
      e.preventDefault();
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
    });
  }

  /* ---------- copy an address ----------
     navigator.clipboard is unavailable on insecure origins and can be blocked
     inside an embedded frame, so there is a selection-based fallback. */
  function copy() {
    var live = document.createElement('p');
    live.className = 'sr';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);

    function legacy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    function done(btn, text) {
      btn.classList.add('is-done');
      live.textContent = text + ' copied';
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { btn.classList.remove('is-done'); live.textContent = ''; }, 1900);
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { done(btn, text); },
          function () { if (legacy(text)) done(btn, text); }
        );
      } else if (legacy(text)) {
        done(btn, text);
      }
    });
  }

  /* ---------- always arrive at the top of a page ----------
     A browser restores the previous scroll position when you revisit a page,
     and inside an embedded frame the position can survive the load entirely.
     Either way the reader lands halfway down a page they just opened. A hash
     (index.html#work) is a deliberate deep link and is honoured instead. */
  var touched = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true });
  });

  function arriveAtTop() {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    /* ScrollTrigger keeps its own record of where each page was left and puts
       you back there on a revisit. Clearing it is the only way to stop that. */
    try { if (window.ScrollTrigger) window.ScrollTrigger.clearScrollMemory('manual'); } catch (e) {}
    var h = location.hash;
    var t = (h && h.length > 1) ? document.querySelector(h) : null;
    function go(first) {
      if (!first && touched) return;
      if (t) { scrollToEl(t); return; }
      window.scrollTo(0, 0);
      if (lenis) { try { lenis.scrollTo(0, { immediate: true }); } catch (e) {} }
    }
    go(true);
    [70, 240, 600].forEach(function (ms) { setTimeout(go, ms); });
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) { touched = false; arriveAtTop(); } });

  /* ---------- hero intro ---------- */
  function intro() {
    if (reduce || !hasGsap) return;
    var bits = document.querySelectorAll('[data-intro], [data-split-hero]');
    if (!bits.length) return;
    window.gsap.fromTo(bits,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: .9, stagger: .07, ease: 'power3.out', delay: .05 });
  }

  /* ---------- scroll reveals ---------- */
  function reveals() {
    var items = document.querySelectorAll('.rv');
    if (!items.length) return;
    if (reduce || !hasGsap || !window.ScrollTrigger) return; /* .rv stays visible */
    document.documentElement.classList.add('anim');
    window.gsap.registerPlugin(window.ScrollTrigger);
    items.forEach(function (el) {
      window.gsap.to(el, {
        y: 0, opacity: 1, duration: .85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
    /* safety: never leave content hidden if something above failed */
    setTimeout(function () {
      items.forEach(function (el) {
        if (getComputedStyle(el).opacity === '0') { el.style.opacity = 1; el.style.transform = 'none'; }
      });
    }, 3000);
  }

  /* ---------- counting numerals ---------- */
  function counters() {
    var ns = document.querySelectorAll('[data-count]');
    if (!ns.length) return;
    if (reduce || !hasGsap || !window.ScrollTrigger) return;
    ns.forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var pre = el.getAttribute('data-pre') || '';
      /* data-post was in the markup from the start and never read, so every
         counted figure lost its unit the moment the animation ran: 70%+ became
         70. And a figure below 1 needs its decimal kept, or 0.8% counts up to
         a rounded 1%, which is a different and wronger number. */
      var post = el.getAttribute('data-post') || '';
      var dp = (String(to).split('.')[1] || '').length;
      var fmt = function (v) { return dp ? v.toFixed(dp) : String(Math.round(v)); };
      var o = { v: 0 };
      window.gsap.to(o, {
        v: to, duration: 1.5, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: function () { el.textContent = pre + fmt(o.v) + post; },
        onComplete: function () { el.textContent = pre + fmt(to) + post; }
      });
    });
  }

  /* ---------- cursor ----------
     A dot that sits exactly under the pointer — the transform is written on
     every mousemove with no easing, so there is nothing to lag behind — plus
     a small label that names what a click will do. Elements say so with
     data-cursor; the rest are inferred from what they are, so no markup
     change is needed for a mailto or a download. */
  var CURSOR_RULES = [
    ['[data-cursor]', null],
    ['[data-copy]', 'Copy'],
    ['[data-resume]', 'Download'],
    ['[data-theme-toggle]', 'Theme'],
    ['[data-close]', 'Close'],
    ['#sheetnext', 'Next'],
    ['#sheetprev', 'Previous'],
    ['#nowbtn', 'Menu'],
    ['.scrollcue', 'Scroll'],
    ['a[href^="mailto:"]', 'Mail'],
    ['a[href^="tel:"]', 'Call'],
    ['a[href*="whatsapp"]', 'Message'],
    ['.m-feat, .m-tile', 'Open'],
    ['.touch', 'Visit'],
    ['a[target="_blank"]', 'Visit']
  ];

  /* Walk up from whatever is under the pointer to the first element that
     actually paints a background, and decide whether it is dark. That covers
     the dark band, the footer, the portrait, the black buttons and the whole
     dark theme without any of them having to be listed by name. */
  function backdropIsDark(el) {
    var steps = 0;
    while (el && el.nodeType === 1 && steps++ < 14) {
      var cs = getComputedStyle(el);
      var bg = cs.backgroundColor;
      var m = bg ? bg.match(/[\d.]+/g) : null;
      if (m && m.length >= 3) {
        var alpha = m.length > 3 ? parseFloat(m[3]) : 1;
        if (alpha > 0.5) {
          var c = [0, 1, 2].map(function (i) {
            var v = parseFloat(m[i]) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) < 0.35;
        }
      }
      /* a photograph tells us nothing useful, so fall through to its frame */
      el = el.parentElement;
    }
    return false;
  }

  function cursor() {
    if (reduce || window.matchMedia('(pointer:coarse)').matches) return;
    var root = document.documentElement;
    var dot = document.createElement('div');
    var tag = document.createElement('div');
    dot.className = 'cur-dot';
    tag.className = 'cur-tag';
    document.body.appendChild(dot);
    document.body.appendChild(tag);

    var tagged = false, hot = false, seen = false, dark = false, lastEl = null;

    function place(x, y) {
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (!tagged) return;
      /* the label trails the pointer, and flips when it would run off screen */
      var w = tag.offsetWidth || 90;
      var lx = x + 18, ly = y + 16;
      if (lx + w > window.innerWidth - 8) lx = x - 18 - w;
      if (ly + 34 > window.innerHeight - 8) ly = y - 34;
      tag.style.transform = 'translate3d(' + lx + 'px,' + ly + 'px,0)';
    }

    function label(target) {
      if (!target || !target.closest) return undefined;
      for (var i = 0; i < CURSOR_RULES.length; i++) {
        var el = target.closest(CURSOR_RULES[i][0]);
        if (!el) continue;
        return CURSOR_RULES[i][1] || el.getAttribute('data-cursor') || 'Open';
      }
      return target.closest('a, button, [role="button"]') ? '' : undefined;
    }

    document.addEventListener('mousemove', function (e) {
      if (!seen) { seen = true; root.classList.add('cursor-on'); }
      var text = label(e.target);
      var wantTag = typeof text === 'string' && text !== '';
      var wantHot = text === '';
      if (wantTag && tag.textContent !== text) tag.textContent = text;
      if (wantTag !== tagged) { tagged = wantTag; root.classList.toggle('cur-tagged', wantTag); }
      if (wantHot !== hot) { hot = wantHot; root.classList.toggle('cur-hot', wantHot); }
      /* The dot itself is painted with mix-blend-mode: difference, so it
         inverts against whatever is actually under it and cannot disappear
         on any background, photographs included. The DOM walk below is only
         for the label and for browsers without blend support: guessing the
         backdrop from the element tree is what used to put a white dot on a
         white card whenever the guess was wrong. */
      if (e.target !== lastEl) {
        lastEl = e.target;
        var d = backdropIsDark(e.target);
        if (d !== dark) { dark = d; root.classList.toggle('cur-dark', d); }
      }
      place(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', function () { root.classList.remove('cursor-on'); });
    document.addEventListener('mouseenter', function () { if (seen) root.classList.add('cursor-on'); });
    window.addEventListener('blur', function () { root.classList.remove('cursor-on'); });
  }

  /* ---------- the grid firms up around the pointer ---------- */
  function spotlight() {
    var el = document.querySelector('.gridspot');
    if (!el || reduce || window.matchMedia('(pointer:coarse)').matches) return;
    var x = 0, y = 0, raf = 0;
    document.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        el.style.setProperty('--mx', x + 'px');
        el.style.setProperty('--my', y + 'px');
      });
    }, { passive: true });
    document.documentElement.classList.add('spot');
  }

  /* ---------- sticky header shadow ---------- */
  function header() {
    var h = document.querySelector('.site-head');
    if (!h) return;
    function on() { h.classList.toggle('stuck', window.scrollY > 12); }
    window.addEventListener('scroll', on, { passive: true });
    on();
  }

  /* ============================================================
     WHERE AM I — the dock readout and the bento menu
     ============================================================ */
  var NOW = { no: '', title: '' };

  function nav() {
    var root = document.documentElement;
    var dock = document.getElementById('dock');
    var btn = document.getElementById('nowbtn');
    var noEl = document.getElementById('nowno');
    var ttEl = document.getElementById('nowtitle');
    var map = document.getElementById('map');
    var scrim = document.getElementById('mapscrim');
    if (!dock) return;

    /* --- dock rises past the fold (desktop); CSS pins it on mobile --- */
    var shown = null;
    function dockToggle() {
      var y = window.scrollY || window.pageYOffset || 0;
      var want = y > 140;
      if (want !== shown) { shown = want; root.classList.toggle('docked', want); }
    }
    window.addEventListener('scroll', dockToggle, { passive: true });
    window.addEventListener('resize', dockToggle, { passive: true });
    dockToggle();

    /* --- what the readout says --- */
    var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-ch]'))
      .filter(function (el) { return el.hasAttribute('data-ch-name'); });

    function setNow(no, title) {
      if (NOW.no === no && NOW.title === title) return;
      NOW.no = no; NOW.title = title;
      if (noEl) noEl.textContent = no;
      if (ttEl) ttEl.textContent = title;
    }

    if (chapters.length) {
      var spy = function () {
        var mid = (window.scrollY || 0) + window.innerHeight * 0.38;
        var cur = chapters[0];
        chapters.forEach(function (el) {
          if (el.getBoundingClientRect().top + window.scrollY <= mid) cur = el;
        });
        setNow(cur.getAttribute('data-ch'), cur.getAttribute('data-ch-name'));
      };
      window.addEventListener('scroll', spy, { passive: true });
      window.addEventListener('resize', spy, { passive: true });
      spy();
    } else {
      /* a sub-page: it has no scroll chapters, so it names itself. The
         label is written into the page by the builder; falling back to the
         <h1> used to put a whole sentence in the readout. */
      var lab = document.getElementById('pagelabel');
      if (lab) {
        setNow(lab.getAttribute('data-no') || '', lab.textContent.trim());
      } else {
        var h1 = document.querySelector('.case-hero h1');
        setNow('', h1 ? h1.textContent.trim() : document.title);
      }
    }

    /* --- the map --- */
    function markMap() {
      if (!map) return;
      var path = location.pathname.split('/').pop() || 'index.html';
      var dir = location.pathname.indexOf('/work/') > -1;
      Array.prototype.slice.call(map.querySelectorAll('a[href]')).forEach(function (a) {
        if (a.hasAttribute('download')) return;
        var href = a.getAttribute('href') || '';
        var leaf = href.split('/').pop();
        var inWork = href.indexOf('work/') > -1;
        var here = leaf === path && (dir ? inWork : !inWork);
        a.setAttribute('data-here', here ? '1' : '0');
      });
    }
    markMap();

    var mapOn = false;
    function openMap(on) {
      if (!map || !btn) return;
      /* the mega menu is not part of the mobile layout at all */
      if (getComputedStyle(map).display === 'none') { mapOn = false; return; }
      mapOn = !!on;
      map.classList.toggle('open', mapOn);
      root.classList.toggle('mapopen', mapOn);
      btn.setAttribute('aria-expanded', mapOn ? 'true' : 'false');
      if (scrim) scrim.classList.toggle('on', mapOn);
    }
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openMap(!mapOn);
      });
    }
    if (scrim) scrim.addEventListener('click', function () { openMap(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') openMap(false);
    });
    if (map) {
      map.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (a) openMap(false);
      });
    }
    /* tap or click anywhere else closes it — no full-screen overlay needed,
       so the page underneath stays clickable while the menu is open */
    document.addEventListener('click', function (e) {
      if (!mapOn) return;
      var z = document.getElementById('navzone');
      if (z && z.contains(e.target)) return;
      openMap(false);
    });

    /* --- hover, on a real pointer only ---
       On touch, hover-to-open means the first tap does nothing, so touch keeps
       the tap. The delays stop the menu flickering as the cursor crosses the
       dock on its way somewhere else. */
    var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (fine) {
      var zone = document.getElementById('navzone');
      var tIn = null, tOut = null;
      var loc = document.querySelector('.dock-loc');
      function cancel() { clearTimeout(tIn); clearTimeout(tOut); tIn = tOut = null; }
      if (loc) {
        loc.addEventListener('mouseenter', function () {
          cancel();
          tIn = setTimeout(function () { openMap(true); }, 110);
        });
      }
      if (zone) {
        zone.addEventListener('mouseleave', function () {
          cancel();
          tOut = setTimeout(function () { openMap(false); }, 260);
        });
        zone.addEventListener('mouseenter', cancel);
      }
    }

    /* --- any link pointing at a section of THIS page scrolls to it ---
       Capture phase, so it wins over the page-transition handler: before
       this, "Work" in the dock was a full reload of index.html#work, which
       is why it landed in the middle of the section instead of the top. */
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.hasAttribute('data-case') || a.hasAttribute('download') || a.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var h = a.getAttribute('href');
      if (!h || /^(https?:|mailto:|tel:)/.test(h) || h.indexOf('/_blob/') === 0) return;
      var u;
      try { u = new URL(h, location.href); } catch (err) { return; }
      if (u.pathname !== location.pathname || !u.hash) return;
      var t = document.querySelector(u.hash);
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      scrollToEl(t);
      try { history.replaceState(history.state, '', u.hash); } catch (err) {}
    }, true);

    /* --- the tab bar slides away while you read forward (phones only) ---
       It is pinned over the content there, so it costs real screen height on
       every scroll. Reading forward hides it; scrolling back, or reaching the
       very bottom, brings it straight back. The threshold stops it twitching
       on small scrolls and on iOS rubber-banding. */
    (function tabbar() {
      var HIDE_ON = 'up';   /* 'up' = hide when scrolling back up */
      var narrow = window.matchMedia('(max-width:880px)');
      var last = window.scrollY || 0, hidden = false, ticking = false;

      function clear() { if (hidden) { hidden = false; root.classList.remove('navhide'); } }

      function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          if (!narrow.matches) { clear(); last = window.scrollY || 0; return; }
          var y = window.scrollY || 0;
          var max = (document.documentElement.scrollHeight || 0) - window.innerHeight;
          var delta = y - last;
          if (Math.abs(delta) < 8) return;          /* ignore jitter */
          last = y;
          if (mapOn) { clear(); return; }           /* never hide under an open menu */
          if (y < 90 || y >= max - 4) { clear(); return; }  /* top and very bottom */
          /* Sijo's spec, in his words: scrolling down brings the bar up,
             scrolling back up hides it. That is the inverse of the usual
             pattern, so it lives in one place: flip HIDE_ON to 'down' to get
             the conventional behaviour back. */
          var want = (HIDE_ON === 'down') ? (delta > 0) : (delta < 0);
          if (want !== hidden) { hidden = want; root.classList.toggle('navhide', want); }
        });
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { clear(); last = window.scrollY || 0; },
                              { passive: true });
      /* a tap anywhere on the bar area should bring it back */
      window.addEventListener('touchstart', function () { clear(); }, { passive: true });
    })();

    window.__setNow = setNow;
    window.__markMap = markMap;
  }

  /* ============================================================
     THE SHEET — a case study over the work grid, not instead of it
     ============================================================ */
  var CASES = [
    { n: '01', href: 'work/fresh-journey.html', t: 'Trust you had to wait for' },
    { n: '02', href: 'work/fund-allocation.html', t: 'Capital that already existed' },
    { n: '03', href: 'work/trading-app.html', t: 'Watching your money work' },
    { n: '04', href: 'work/design-system.html', t: 'Keystone' }
  ];

  function sheet() {
    var el = document.getElementById('sheet');
    var body = document.getElementById('sheetbody');
    var ct = document.getElementById('sheetct');
    var tt = document.getElementById('sheettt');
    var prog = document.getElementById('sheetprog');
    var prev = document.getElementById('sheetprev');
    var next = document.getElementById('sheetnext');
    var cards = document.querySelectorAll('[data-case]');
    if (!el || !body || !cards.length) return;
    if (typeof window.fetch !== 'function' || typeof window.DOMParser === 'undefined') return;

    var cache = {};
    var openAt = -1;
    var pushed = false;
    var restoreUrl = location.pathname + location.search + location.hash;
    var lastFocus = null;

    /* Resolve the site root ONCE, now — pushState rewrites location while a
       sheet is open, so resolving relative paths later would compound them
       (work/ + work/…) and every image inside the case study would 404. */
    var ROOT = new URL(location.pathname.indexOf('/work/') > -1 ? '../' : './', location.href).href;

    function idxOf(href) {
      var leaf = href.split('/').pop().split('#')[0];
      for (var i = 0; i < CASES.length; i++) {
        if (CASES[i].href.split('/').pop() === leaf) return i;
      }
      return -1;
    }

    /* pull <main> out of the case page and make its links work from here */
    function extract(html, baseHref) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var main = doc.querySelector('main');
      if (!main) return null;
      var base = new URL(baseHref, location.href);
      Array.prototype.slice.call(main.querySelectorAll('script')).forEach(function (s) { s.remove(); });
      Array.prototype.slice.call(main.querySelectorAll('[src]')).forEach(function (n) {
        try { n.setAttribute('src', new URL(n.getAttribute('src'), base).href); } catch (e) {}
      });
      Array.prototype.slice.call(main.querySelectorAll('a[href]')).forEach(function (a) {
        var h = a.getAttribute('href');
        if (!h || h.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(h) || h.indexOf('/_blob/') === 0) return;
        try { a.setAttribute('href', new URL(h, base).href); } catch (e) {}
      });
      Array.prototype.slice.call(main.querySelectorAll('.rv')).forEach(function (n) {
        n.classList.remove('rv');
      });
      return main;
    }

    function load(i, push) {
      var c = CASES[i];
      if (!c) return;
      openAt = i;
      if (ct) ct.textContent = c.n + ' / ' + String(CASES.length).padStart(2, '0');
      if (tt) tt.textContent = c.t;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === CASES.length - 1;

      var href = new URL(c.href, ROOT).href;

      function paint(main) {
        body.innerHTML = '';
        body.appendChild(main.cloneNode(true));
        body.appendChild(handoff(i));
        body.scrollTop = 0;
        if (prog) prog.style.width = '0%';
      }

      if (cache[c.href]) { paint(cache[c.href]); }
      else {
        body.innerHTML = '<p class="sheet-load">Opening case study ' + c.n + '…</p>';
        fetch(href, { credentials: 'same-origin' })
          .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
          .then(function (html) {
            var main = extract(html, href);
            if (!main) throw new Error('no main');
            cache[c.href] = main;
            if (openAt === i) paint(main);
          })
          .catch(function () { location.href = href; });
      }

      if (push) {
        try {
          history.pushState({ sheet: i }, '', href);
          pushed = true;
        } catch (e) {}
      } else {
        try { history.replaceState({ sheet: i }, '', href); } catch (e) {}
      }
      if (window.__setNow) window.__setNow(c.n, c.t);
      /* the injected case study brings its own links; carry the theme into them */
      if (window.__stampLinks) window.__stampLinks();
    }

    /* the handoff block at the end of every case study in the sheet */
    function handoff(i) {
      var wrap = document.createElement('div');
      wrap.className = 'sheet-next';
      var nxt = CASES[i + 1];
      if (nxt) {
        wrap.innerHTML =
          '<span class="l"><span class="mono">Next &mdash; ' + nxt.n + '</span>' +
          '<h3>' + nxt.t + '</h3></span>' +
          '<button class="btn" type="button" data-go="' + (i + 1) + '">Open ' + nxt.n +
          ' <span class="arw" aria-hidden="true">&rarr;</span></button>';
      } else {
        wrap.innerHTML =
          '<span class="l"><span class="mono">That’s the four</span>' +
          '<h3>Back to the rest of the site</h3></span>' +
          '<button class="btn" type="button" data-close>Close <span class="arw" aria-hidden="true">&rarr;</span></button>';
      }
      return wrap;
    }

    function open(i, push) {
      lastFocus = document.activeElement;
      el.classList.add('open');
      el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sheetopen');
      stopScroll(true);
      requestAnimationFrame(function () { el.classList.add('in'); });
      load(i, push);
      var back = el.querySelector('.sheet-back');
      if (back) setTimeout(function () { back.focus(); }, 60);
    }

    function close(pop) {
      if (!el.classList.contains('open')) return;
      el.classList.remove('in');
      el.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sheetopen');
      stopScroll(false);
      setTimeout(function () { el.classList.remove('open'); body.innerHTML = ''; }, 420);
      openAt = -1;
      if (!pop) {
        if (pushed) { pushed = false; history.back(); }
        else { try { history.replaceState({}, '', restoreUrl); } catch (e) {} }
      }
      if (window.__markMap) window.__markMap();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    /* open from any card or map row that names a case */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-case]');
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var i = idxOf(a.getAttribute('href'));
      if (i < 0) return;
      e.preventDefault();
      open(i, true);
    });

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { e.preventDefault(); close(false); return; }
      var go = e.target.closest('[data-go]');
      if (go) { e.preventDefault(); load(parseInt(go.getAttribute('data-go'), 10), true); return; }
      var a = e.target.closest('a[href]');
      if (!a) return;
      var i = idxOf(a.getAttribute('href'));
      if (i > -1 && a.getAttribute('href').indexOf('/work/') > -1) { e.preventDefault(); load(i, true); }
    });

    if (prev) prev.addEventListener('click', function () { if (openAt > 0) load(openAt - 1, true); });
    if (next) next.addEventListener('click', function () { if (openAt < CASES.length - 1) load(openAt + 1, true); });

    document.addEventListener('keydown', function (e) {
      if (!el.classList.contains('open')) return;
      if (e.key === 'Escape') { close(false); }
      if (e.key === 'ArrowRight' && openAt < CASES.length - 1) load(openAt + 1, true);
      if (e.key === 'ArrowLeft' && openAt > 0) load(openAt - 1, true);
    });

    body.addEventListener('scroll', function () {
      if (!prog) return;
      var max = body.scrollHeight - body.clientHeight;
      prog.style.width = (max > 0 ? (body.scrollTop / max) * 100 : 0) + '%';
    }, { passive: true });

    window.addEventListener('popstate', function (ev) {
      var st = ev.state;
      if (st && typeof st.sheet === 'number') {
        if (!el.classList.contains('open')) open(st.sheet, false);
        else load(st.sheet, false);
      } else {
        pushed = false;
        close(true);
      }
    });
  }

  /* ---------- page transitions (everything that isn't a case) ---------- */
  function transitions() {
    if (reduce || !hasGsap) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a || a.hasAttribute('data-case')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')
        || href.indexOf('/_blob/') === 0 || /^(https?:|mailto:|tel:)/.test(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (document.getElementById('sheet') && document.getElementById('sheet').classList.contains('open')) return;
      e.preventDefault();
      window.gsap.to('main, .site-foot', {
        opacity: 0, duration: .28, ease: 'power2.in',
        onComplete: function () { location.href = href; }
      });
    });
  }

  function boot() {
    theme(); notes(); events(); copy(); cologo(); header(); smooth(); arriveAtTop(); nav(); sheet(); reveals(); counters(); cursor(); spotlight(); transitions(); intro();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ---------- resume download ----------
   The claude.ai viewer sandbox blocks a plain <a download>, so route it
   through the downloads capability when that exists. On a self-hosted copy
   window.claude is absent and the native download attribute handles it. */
(function () {
  'use strict';
  var links = document.querySelectorAll('a[data-resume]');
  if (!links.length) return;
  var DL = null;
  if (window.claude && typeof window.claude.use === 'function') {
    try { window.claude.use('downloads').then(function (ns) { DL = ns; }, function () { DL = null; }); }
    catch (e) { DL = null; }
  }
  Array.prototype.slice.call(links).forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!DL) return;
      e.preventDefault();
      var label = a.textContent;
      a.textContent = 'Preparing…';
      fetch(a.getAttribute('href'))
        .then(function (r) { if (!r.ok) throw new Error('fetch failed'); return r.blob(); })
        .then(function (blob) {
          return DL.save({ filename: 'Sijo-M-Peter-Senior-Product-Designer.pdf', data: blob });
        })
        .then(function () { a.textContent = label; })
        .catch(function (err) {
          a.textContent = (err && err.code === 'declined') ? label : 'Opening…';
          if (!err || err.code !== 'declined') {
            window.open(a.getAttribute('href'), '_blank');
            setTimeout(function () { a.textContent = label; }, 1200);
          }
        });
    });
  });
})();
