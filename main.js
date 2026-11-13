document.documentElement.classList.add('js');
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- nav ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('menu');
  function closeMenu() { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); }
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- sticker reveal ---------- */
  var rots = [-3.2, 2.6, -2.2, 3.4, -1.6, 2.2];
  var ri = 0;
  document.querySelectorAll('.reveal').forEach(function (el) {
    el.style.setProperty('--rot', rots[ri++ % rots.length] + 'deg');
    el.addEventListener('animationend', function (e) {
      if (e.target === el && e.animationName === 'stick') el.classList.add('settled');
    });
  });
  document.querySelectorAll('.enter').forEach(function (el, i) { el.style.setProperty('--rot', rots[(i + 2) % rots.length] + 'deg'); });
  function observe(sel, cb, thr) {
    var els = document.querySelectorAll(sel);
    if (!('IntersectionObserver' in window)) { els.forEach(cb); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { cb(en.target); io.unobserve(en.target); } });
    }, { threshold: thr || 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
  observe('.reveal', function (el) { el.classList.add('in'); }, 0.12);

  /* ---------- tiles: fall + bounce ---------- */
  var tiles = document.querySelector('.tiles');
  if (tiles) {
    tiles.querySelectorAll('.t').forEach(function (t, i) {
      var r0 = (Math.random() * 90 - 45).toFixed(0) + 'deg', r1 = (Math.random() * 16 - 8).toFixed(0) + 'deg';
      t.style.setProperty('--r0', r0); t.style.setProperty('--r1', r1);
      t.style.setProperty('--td', (i * 0.09 + Math.random() * 0.12).toFixed(2) + 's');
      t.style.setProperty('--ti', (-Math.random() * 3).toFixed(2) + 's');
      t.addEventListener('animationend', function (e) { if (e.animationName === 'drop') t.classList.add('landed'); });
    });
    observe('.tiles', function (el) { el.classList.add('go'); }, 0.45);
  }
  observe('.watch', function (el) { el.classList.add('in'); }, 0.3);

  /* ---------- owl ---------- */
  var owls = [].slice.call(document.querySelectorAll('.owl'));
  var lastInteract = 0;
  owls.forEach(function (o) {
    var pupils = o.querySelector('.pupils');
    var st = { x: 0, y: 0 };
    function look(dx, dy, strength) {
      var d = Math.max(1, Math.hypot(dx, dy)), k = Math.min(1, d / (strength || 260));
      st.x = dx / d * 7 * k; st.y = dy / d * 6 * k;
      pupils.style.transform = 'translate(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px)';
    }
    function lookAtPoint(cx, cy) {
      var r = o.getBoundingClientRect();
      look(cx - (r.left + r.width / 2), cy - (r.top + r.height * 0.42));
    }
    o._lookAt = lookAtPoint; o._look = look;
    function wave() {
      if (reduce) return;
      o.classList.remove('waving'); void o.getBoundingClientRect(); o.classList.add('waving');
      clearTimeout(o._wt); o._wt = setTimeout(function () { o.classList.remove('waving'); }, 2500);
    }
    o._wave = wave;
    o.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') wave(); });
    o.addEventListener('pointerdown', function () { wave(); });
    // blink
    function blink() {
      if (!reduce) {
        o.classList.add('blink');
        setTimeout(function () { o.classList.remove('blink'); }, 220);
        if (Math.random() < 0.25) setTimeout(function () { o.classList.add('blink'); setTimeout(function () { o.classList.remove('blink'); }, 220); }, 380);
      }
      o._bt = setTimeout(blink, 2200 + Math.random() * 3200);
    }
    o._bt = setTimeout(blink, 1500 + Math.random() * 1500);
  });
  if (!reduce && owls.length) {
    // mouse follow
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      lastInteract = performance.now();
      owls.forEach(function (o) { o._lookAt(e.clientX, e.clientY); });
    }, { passive: true });
    // touch: look at last tap
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      lastInteract = performance.now();
      owls.forEach(function (o) { o._lookAt(e.clientX, e.clientY); });
    }, { passive: true });
    // idle look around
    setInterval(function () {
      if (performance.now() - lastInteract < (isTouch ? 3500 : 2500)) return;
      owls.forEach(function (o) {
        var a = Math.random() * Math.PI * 2, m = 40 + Math.random() * 200;
        o._look(Math.cos(a) * m, Math.sin(a) * m * 0.7, 200);
      });
    }, 1700);
    // wave on load, and when contact owl appears
    setTimeout(function () { var h = document.querySelector('.owl--hero'); if (h) h._wave(); }, 2300);
    var oc = document.querySelector('.owl--c');
    if (oc && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { setTimeout(function () { oc._wave(); }, 600); io.disconnect(); } }, { threshold: 0.6 }).observe(oc);
    }
  }

  /* ---------- pencil writing ---------- */
  var write = document.getElementById('write');
  if (write) {
    var strokes = [].slice.call(write.querySelectorAll('.write__strokes path'));
    var pencil = document.getElementById('writePencil');
    var lens = strokes.map(function (p) { return p.getTotalLength(); });
    var total = lens.reduce(function (a, b) { return a + b; }, 0);
    var WRITE_MS = 4200, HOLD_MS = 2600, FADE_MS = 700, GAP = 0.025; // GAP: pen lift pause (fraction of time) between strokes
    function setProgress(prog) {
      var usable = 1 - GAP * (strokes.length - 1), acc = 0, tip = null, lastDone = -1;
      for (var i = 0; i < strokes.length; i++) {
        var s = acc + GAP * i, d = (lens[i] / total) * usable;
        var f = Math.min(1, Math.max(0, (prog - s) / d));
        strokes[i].style.strokeDasharray = lens[i] + ' ' + (lens[i] + 2);
        strokes[i].style.strokeDashoffset = (lens[i] * (1 - f)).toFixed(2);
        if (f > 0 && f < 1) tip = strokes[i].getPointAtLength(lens[i] * f);
        else if (f >= 1) lastDone = i;
        acc += d;
      }
      if (!tip && lastDone >= 0) tip = strokes[lastDone].getPointAtLength(lens[lastDone]);
      return tip;
    }
    function placePencil(tip, extra) {
      if (!tip) return;
      pencil.style.transform = 'translate(' + (tip.x + 2).toFixed(1) + 'px,' + (tip.y + 1 + (extra || 0)).toFixed(1) + 'px)';
    }
    function showAll() {
      strokes.forEach(function (p) { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; });
      pencil.style.display = 'none';
    }
    if (reduce) { showAll(); }
    else {
      var running = false, startT = 0, phase = 'idle', onscreen = false, rafW = 0;
      var endPt = strokes[strokes.length - 1].getPointAtLength(lens[lens.length - 1]);
      function frame(now) {
        rafW = 0;
        if (!onscreen || document.hidden) { running = false; return; }
        var t = now - startT;
        if (t < WRITE_MS) {
          var p = t / WRITE_MS; var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // ease
          e = p * 0.7 + e * 0.3;
          var tip = setProgress(e);
          pencil.style.opacity = 1;
          placePencil(tip || endPt, Math.sin(now / 60) * 0.6);
        } else if (t < WRITE_MS + HOLD_MS) {
          setProgress(1);
          var k = (t - WRITE_MS) / 700;
          if (k < 1) { // pencil lifts away and rests
            pencil.style.transform = 'translate(' + (endPt.x + 2 + k * 90).toFixed(1) + 'px,' + (endPt.y + 1 - Math.sin(k * Math.PI) * 26 + k * 16).toFixed(1) + 'px)';
          }
        } else if (t < WRITE_MS + HOLD_MS + FADE_MS) {
          var f = 1 - (t - WRITE_MS - HOLD_MS) / FADE_MS;
          write.querySelector('.write__strokes').style.opacity = f;
          pencil.style.opacity = f;
        } else {
          write.querySelector('.write__strokes').style.opacity = 1;
          startT = now + 250; setProgress(0); pencil.style.opacity = 0;
        }
        rafW = requestAnimationFrame(frame);
      }
      function start() { if (running) return; running = true; startT = performance.now() + 900; setProgress(0); pencil.style.opacity = 0; rafW = requestAnimationFrame(frame); }
      setProgress(0); pencil.style.opacity = 0;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { onscreen = es[0].isIntersecting; if (onscreen) start(); }).observe(write);
      } else { onscreen = true; start(); }
      document.addEventListener('visibilitychange', function () { if (!document.hidden && onscreen) start(); });
      window.__writeAt = function (prog) { onscreen = false; var tip = setProgress(prog); pencil.style.opacity = 1; placePencil(tip || endPt); };
    }
  }

  /* ---------- parallax, progress, confetti ---------- */
  var items = document.querySelectorAll('[data-speed]');
  if (!reduce && items.length) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        items.forEach(function (el) { el.style.translate = '0 ' + (y * parseFloat(el.dataset.speed) * 4).toFixed(1) + 'px'; });
        ticking = false;
      });
    }, { passive: true });
  }
  var bar = document.querySelector('.progress i');
  function prog() {
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(3) : 0);
  }
  window.addEventListener('scroll', prog, { passive: true }); prog();

  if (!reduce && !isTouch) {
    var colors = ['#ff8fb8', '#ffd36b', '#8fe3c0', '#6cc0f7', '#c9b6ff'];
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('pointerenter', function () {
        var r = b.getBoundingClientRect();
        for (var i = 0; i < 14; i++) {
          var s = document.createElement('i'); s.className = 'confetti';
          s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height / 2) + 'px';
          s.style.background = colors[i % colors.length];
          var a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 70;
          s.style.setProperty('--x', Math.cos(a) * v + 'px'); s.style.setProperty('--y', (Math.sin(a) * v - 30) + 'px');
          s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
          document.body.appendChild(s);
          setTimeout(function (el) { el.remove(); }.bind(null, s), 1000);
        }
      });
    });
  }

  /* ---------- v4: cartinhas que viram ---------- */
  document.querySelectorAll('.flip').forEach(function (f) {
    f.addEventListener('click', function () {
      var on = f.classList.toggle('flipped');
      f.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  /* ---------- v4: linha do tempo desenha sozinha ---------- */
  var tl = document.querySelector('.tl');
  if (tl) {
    var tsteps = [].slice.call(tl.querySelectorAll('.tl__step'));
    var tTick = false;
    var tlUpdate = function () {
      tTick = false;
      var r = tl.getBoundingClientRect();
      var mark = innerHeight * 0.62;
      var p = reduce ? 1 : Math.min(1, Math.max(0, (mark - r.top) / r.height));
      tl.style.setProperty('--tp', p.toFixed(4));
      tsteps.forEach(function (st) {
        if (reduce || st.getBoundingClientRect().top + 50 < mark) st.classList.add('on');
      });
    };
    window.addEventListener('scroll', function () { if (!tTick) { tTick = true; requestAnimationFrame(tlUpdate); } }, { passive: true });
    window.addEventListener('resize', tlUpdate);
    tlUpdate();
  }

  /* ---------- v4: relogios de fuso (Brasilia e onde voce mora) ---------- */
  var clks = [].slice.call(document.querySelectorAll('.clk'));
  if (clks.length) {
    var myTz = '';
    try { myTz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var BR = 'America/Sao_Paulo';
    var zparts = function (tz, d) {
      var f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
      var o = {};
      f.formatToParts(d).forEach(function (p) { o[p.type] = +p.value; });
      return o;
    };
    var zms = function (tz, d) { var p = zparts(tz, d); return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second); };
    var validTz = function (tz) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return !!tz; } catch (e) { return false; } };
    var you = validTz(myTz) ? myTz : BR;
    var cityOf = function (tz) { var c = tz.split('/').pop().replace(/_/g, ' '); return c === 'Sao Paulo' ? 'Brasília' : c; };
    var fmtH = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + 'h' + (r ? (r < 10 ? '0' + r : r) : ''); };
    var diffEl = document.querySelector('.clk__diff');
    var clkOn = true;
    var tickClocks = function () {
      var now = new Date();
      clks.forEach(function (c) {
        var tz = c.getAttribute('data-tz') === 'auto' ? you : BR;
        var p = zparts(tz, now);
        var h = p.hour, m = p.minute, s = p.second;
        c.querySelector('.clk__h').setAttribute('transform', 'rotate(' + ((h % 12) * 30 + m * 0.5) + ' 60 60)');
        c.querySelector('.clk__m').setAttribute('transform', 'rotate(' + (m * 6 + s * 0.1) + ' 60 60)');
        c.querySelector('.clk__time').textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
        c.classList.toggle('night', h < 6 || h >= 18);
      });
      var tzEl = document.querySelector('.clk[data-tz="auto"] .clk__tz');
      if (tzEl) tzEl.textContent = validTz(myTz) ? cityOf(myTz) : 'seu fuso';
      if (diffEl) {
        var d = Math.round((zms(you, now) - zms(BR, now)) / 60000);
        diffEl.textContent = d === 0 ? 'Mesma hora que Brasília' : 'Você está ' + fmtH(Math.abs(d)) + (d > 0 ? ' à frente' : ' atrás');
      }
    };
    tickClocks();
    var clkWrap = document.getElementById('clocks');
    if (clkWrap && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { clkOn = es[0].isIntersecting; if (clkOn) tickClocks(); }).observe(clkWrap);
    }
    setInterval(function () { if (clkOn && !document.hidden) tickClocks(); }, 1000);
  }

  /* ---------- v4: botao fixo de contato ---------- */
  var fab = document.querySelector('.fab');
  if (fab) { setTimeout(function () { fab.classList.add('show'); }, reduce ? 0 : 1400); }
})();
