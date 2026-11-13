document.documentElement.classList.add('js');
(function () {
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('menu');
  function close() { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); }
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // leve parallax no hero
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // barra de progresso
  var bar = document.querySelector('.progress i');
  function prog() {
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(3) : 0);
  }
  window.addEventListener('scroll', prog, { passive: true }); prog();

  // delay escalonado dos tiles
  document.querySelectorAll('.tiles .t').forEach(function (t, i) { t.style.setProperty('--td', (i * 0.07).toFixed(2) + 's'); });

  if (!reduce) {
    // olhos da coruja seguem o mouse
    var owls = document.querySelectorAll('.owl');
    window.addEventListener('pointermove', function (e) {
      owls.forEach(function (o) {
        var r = o.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.42);
        var d = Math.max(1, Math.hypot(dx, dy)), k = Math.min(1, d / 300);
        o.style.setProperty('--ex', (dx / d * 6 * k).toFixed(1) + 'px');
        o.style.setProperty('--ey', (dy / d * 5 * k).toFixed(1) + 'px');
      });
    }, { passive: true });

    // confete nos botoes principais
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
})();
