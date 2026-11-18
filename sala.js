/* Mini aula: quadro negro + professora 3D (carregado sob demanda pelo main.js) */
(function () {
  var stage = document.getElementById('salaStage');
  if (!stage || stage._on) return; stage._on = true;
  var sec = document.getElementById('sala');
  var chalk = stage.querySelector('.sala__chalk');
  var bubble = stage.querySelector('.sala__bubble'), btxt = bubble.querySelector('span');
  var canvas = stage.querySelector('.sala__canvas'), poster = stage.querySelector('.sala__poster');
  var cta = sec.querySelector('.sala__cta .btn');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LESSONS = [
    { lines: [[['A B C', 'w']], [['A', 'y'], [' de ', 'w'], ['abelha', 'p']]], a: 'Oi! Vamos aprender?', b: 'Olha o que eu escrevi!', c: 'Muito bem!',
      on: function (l, i, ch) { if (l === 0 && ch !== ' ') return '♪ ' + ch + '!'; if (l === 1 && i === 4) return 'Abelha!'; }, hi: ['Oi, prof!', 'Vamos!'], yay: ['Ebaaa!', 'A B C!'] },
    { lines: [[['1 + 2 = ', 'w'], ['3', 'y']], [['Contar é ', 'w'], ['divertido', 'b']]], a: 'Agora os números!', b: 'Conta comigo!', c: 'Você é demais!',
      on: function (l, i, ch) { if (l === 0 && ch === '=') return 'Eu sei, prof!'; if (l === 0 && ch === '3') return 'Três!'; }, hi: ['Eba, números!'], yay: ['Ebaaa!', 'Acertei!'] },
    { lines: [[['As cores', 'w']], [['rosa ', 'p'], ['azul ', 'b'], ['verde', 'g']]], a: 'E as cores?', b: 'Que lindo, né?', c: 'Bora estudar comigo?',
      on: function (l, i, ch) { if (l === 1) return ({ 0: 'Rosa!', 5: 'Azul!', 10: 'Verde!' })[i]; }, hi: ['Eu amo cores!'], yay: ['Ebaaa!', 'Eu quero!', 'Ebaaa!'] }
  ];
  var COLORS = ['c1', 'c2', 'c3'];
  var kidEls = [].slice.call(sec.querySelectorAll('.aluno'));
  function kids() { return kidEls.filter(function (k) { return k.offsetParent !== null; }); }
  var kidTurn = 0;
  function kidSay(text, idx, ms) {
    var ks = kids(); if (!ks.length) return;
    var k = ks[(idx == null ? kidTurn++ : idx) % ks.length], b = k.querySelector('.aluno__say');
    b.textContent = text; b.classList.add('show');
    var arm = Math.random() < 0.5 ? 'up-l' : 'up-r'; k.classList.add(arm);
    clearTimeout(k._t); k._n = (k._n || 0) + 1; var n = k._n;
    sleep(ms || 1100).then(function () { if (k._n === n) { b.classList.remove('show'); k.classList.remove('up-l', 'up-r'); } });
  }
  function kidsAll(cls, on) { kids().forEach(function (k) { k.classList.toggle(cls, on); }); }

  function webgl() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  var nav = navigator, con = nav.connection || {};
  var weak = (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) || con.saveData;
  var lite = /[?&]lite\b/.test(location.search);
  var use3d = !reduce && !weak && !lite && webgl();

  function line(parts) {
    var d = document.createElement('div'); d.className = 'sala__line';
    var spans = [];
    parts.forEach(function (p) {
      for (var i = 0; i < p[0].length; i++) {
        var s = document.createElement('span'); s.className = 'ch k-' + p[1]; s.textContent = p[0][i];
        d.appendChild(s); spans.push(s);
      }
    });
    chalk.appendChild(d); return spans;
  }

  if (reduce) {
    LESSONS[0].lines.forEach(function (l) { line(l).forEach(function (s) { s.classList.add('on'); }); });
    btxt.textContent = LESSONS[0].a; bubble.classList.add('show', 'c1', 'static'); if (kidEls[1]) { kidEls[1].classList.add('up-r'); var kb = kidEls[1].querySelector('.aluno__say'); kb.textContent = 'Oi, prof!'; kb.classList.add('show'); } if (stage.clientWidth >= 700) bubble.classList.add('to-left'); stage.classList.add('is-lite');
    return;
  }

  // relógio que pausa fora da tela / aba oculta
  var T = 0, waits = [], visible = false, raf = 0, last = 0, teacher = null, writing = null;
  function sleep(ms) { return new Promise(function (r) { waits.push({ t: T + ms, r: r }); }); }
  function write(parts, on) {
    var spans = line(parts);
    return new Promise(function (r) { writing = { spans: spans, t0: T, n: 0, r: r, on: on }; });
  }
  var shim = {
    update: function () {}, render: function () {}, resize: function () {}, setX: function () {},
    walkTo: function () { stage.classList.add('is-walk'); return sleep(900).then(function () { stage.classList.remove('is-walk'); }); },
    face: function () {}, pose: function (m) { stage.setAttribute('data-pose', m); }, talk: function () {},
    head: function () {
      var r = poster.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return { x: r.left - s.left + r.width * 0.5, y: r.top - s.top + r.height * 0.1, s: r.height * 0.55 };
    }
  };
  var bw = 0, bh = 0, ci = 0;
  function placeBubble() {
    if (!bubble.classList.contains('show')) return;
    var h = (teacher || shim).head(), W = stage.clientWidth;
    if (!bw) { bw = bubble.offsetWidth; bh = bubble.offsetHeight; }
    var u = h.s || 200, off = 0.29 * u;
    var right = h.x - off - bw < 6;
    var left = right ? h.x + off : h.x - off - bw;
    if (left > W - bw - 6) left = W - bw - 6;
    if (left < 6) left = 6;
    var top = Math.max(4, h.y - bh * 0.5 - 0.06 * u);
    bubble.classList.toggle('to-left', !right);
    bubble.style.transform = 'translate(' + Math.round(left) + 'px,' + Math.round(top) + 'px)';
  }
  function say(text, ms) {
    var tt = teacher || shim;
    btxt.textContent = text; bubble.classList.remove('c1', 'c2', 'c3'); bubble.classList.add(COLORS[ci++ % 3]);
    bw = 0; bubble.classList.add('show'); placeBubble(); tt.talk(true);
    return sleep(Math.min(1300, ms)).then(function () { tt.talk(false); return sleep(Math.max(0, ms - 1300)); })
      .then(function () { bubble.classList.remove('show'); return sleep(260); });
  }
  function tick(now) {
    raf = 0;
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; T += dt * 1000;
    for (var i = waits.length - 1; i >= 0; i--) if (waits[i].t <= T) { waits.splice(i, 1)[0].r(); }
    if (writing) {
      var n = Math.min(writing.spans.length, Math.floor((T - writing.t0) / 95));
      while (writing.n < n) { var sp = writing.spans[writing.n]; sp.classList.add('on'); if (writing.on) { var kt = writing.on(writing.n, sp.textContent); if (kt) kidSay(kt); } writing.n++; }
      if (writing.n >= writing.spans.length) { var r = writing.r; writing = null; r(); }
    }
    if (teacher) { teacher.update(dt); teacher.render(); }
    placeBubble();
    loop();
  }
  function loop() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; loop(); }, { rootMargin: '80px 0px' }).observe(stage);
  document.addEventListener('visibilitychange', loop);
  if (window.ResizeObserver) new ResizeObserver(function () { bw = 0; if (teacher) teacher.resize(); }).observe(stage);

  function spot() { return stage.clientWidth < 700 ? 0.2 : 0.3; }
  async function lesson(L, last) {
    var tt = teacher || shim;
    await tt.walkTo(spot());
    tt.face('front'); tt.pose('wave');
    sleep(1300).then(function () { L.hi.forEach(function (h, j) { sleep(j * 500).then(function () { kidSay(h); }); }); });
    await say(L.a, 2300);
    tt.pose('idle'); tt.face('board'); await sleep(450); tt.pose('write');
    for (var i = 0; i < L.lines.length; i++) { await write(L.lines[i], (function (li) { return function (ci, ch) { return L.on && L.on(li, ci, ch); }; })(i)); await sleep(260); }
    tt.pose('idle'); await sleep(250); tt.face('front'); await sleep(300);
    tt.pose('point'); kidsAll('nod', true); sleep(700).then(function () { kidSay('Uau!'); });
    await say(L.b, 2200); kidsAll('nod', false);
    tt.pose('cheer'); if (last) cta.classList.add('is-pop');
    kidsAll('cheer', true); L.yay.forEach(function (y, j) { sleep(250 + j * 380).then(function () { kidSay(y, null, 1300); }); });
    await say(L.c, last ? 2600 : 1900);
    tt.pose('idle'); kidsAll('cheer', false); await sleep(300);
    chalk.classList.add('erase');
    await tt.walkTo(0.84);
    tt.face('front'); tt.pose('wave'); await sleep(1100);
    chalk.innerHTML = ''; chalk.classList.remove('erase'); cta.classList.remove('is-pop');
    tt.pose('idle');
  }
  async function run() {
    for (;;) for (var i = 0; i < LESSONS.length; i++) await lesson(LESSONS[i], i === LESSONS.length - 1);
  }

  if (!use3d) { stage.classList.add('is-lite'); run(); return; }
  stage.classList.add('is-loading');
  import('/prof3d.js').then(function (m) {
    return m.createTeacher(canvas, stage, '/assets/prof-yasmin-3d.vrm', { startX: -0.12 });
  }).then(function (t) {
    teacher = t; stage.classList.remove('is-loading'); stage.classList.add('is-3d'); run();
  }).catch(function (e) {
    if (window.console) console.warn('prof3d fallback', e);
    stage.classList.remove('is-loading'); stage.classList.add('is-lite'); run();
  });
})();
