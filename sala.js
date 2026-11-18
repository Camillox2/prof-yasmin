/* Mini aula: sala ilustrada + professora 3D + aluninhos (carregado sob demanda pelo main.js) */
(function () {
  var stage = document.getElementById('salaStage');
  if (!stage || stage._on) return; stage._on = true;
  var sec = document.getElementById('sala');
  var chalk = stage.querySelector('.sala__chalk');
  var bubble = stage.querySelector('.sala__bubble'), btxt = bubble.querySelector('span');
  var canvas = stage.querySelector('.sala__canvas'), poster = stage.querySelector('.sala__poster');
  var cta = sec.querySelector('.sala__cta .btn');
  var kidsBox = sec.querySelector('.sala__kids');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = ['c1', 'c2', 'c3'];
  var kidEls = [].slice.call(sec.querySelectorAll('.aluno'));
  function kids() { return kidEls.filter(function (k) { return k.offsetParent !== null; }); }

  function webgl() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  var nav = navigator, con = nav.connection || {};
  var weak = (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) || con.saveData;
  var lite = /[?&]lite\b/.test(location.search);
  var use3d = !reduce && !weak && !lite && webgl();

  var CHALK = ['w', 'y', 'p', 'b', 'g'];
  function newLine() { var d = document.createElement('div'); d.className = 'sala__line'; chalk.appendChild(d); return d; }
  function addChars(d, text, color) {
    var out = [];
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span'); s.className = 'ch k-' + (typeof color === 'function' ? color(text[i], i) : color); s.textContent = text[i];
      d.appendChild(s); out.push(s);
    }
    return out;
  }
  var rainbow = function () { var n = 0; return function (ch) { return ch === ' ' ? 'w' : CHALK[(n++) % 5]; }; };

  if (reduce) {
    chalk.classList.add('sala__chalk--big');
    addChars(newLine(), 'A B C', rainbow()).forEach(function (s) { s.classList.add('on'); });
    btxt.textContent = 'Olá, pessoal! Eu sou a Prof. Yasmin!'; bubble.classList.add('show', 'c1', 'static'); if (stage.clientWidth >= 700) bubble.classList.add('to-left');
    if (kidEls[1]) { kidEls[1].classList.add('up-r'); var kb = kidEls[1].querySelector('.aluno__say'); kb.textContent = 'Oi, prof!'; kb.classList.add('show'); }
    stage.classList.add('is-lite');
    return;
  }

  // relógio que pausa fora da tela / aba oculta
  var T = 0, waits = [], visible = false, raf = 0, last = 0, teacher = null, writing = null;
  function sleep(ms) { return new Promise(function (r) { waits.push({ t: T + ms, r: r }); }); }
  // escreve no quadro, letra por letra (espaços não contam tempo)
  function write(d, text, color, rate) {
    var spans = addChars(d, text, color);
    return new Promise(function (r) { writing = { spans: spans, next: T, n: 0, r: r, rate: rate || 420 }; });
  }
  var shim = {
    update: function () {}, render: function () {}, resize: function () {}, setX: function () {},
    walkTo: function () { stage.classList.add('is-walk'); return sleep(1000).then(function () { stage.classList.remove('is-walk'); }); },
    face: function () {}, pose: function (m) { stage.setAttribute('data-pose', m); }, talk: function () {},
    head: function () {
      var r = poster.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return { x: r.left - s.left + r.width * 0.5, y: r.top - s.top + r.height * 0.1, s: r.height * 0.55 };
    }
  };
  function tt() { return teacher || shim; }

  // balão da professora: escolhe o lado com espaço e quebra linha se precisar
  var bw = 0, bh = 0, ci = 0, side = 0;
  function measure() {
    var h = tt().head(), W = stage.clientWidth, u = h.s || 200, off = 0.29 * u;
    bubble.style.maxWidth = '300px'; bubble.classList.remove('to-left');
    var nat = bubble.offsetWidth;
    var la = h.x - off - 6, ra = W - (h.x + off) - 6;
    if (la >= nat) side = -1; else if (ra >= nat) side = 1; else { side = la > ra ? -1 : 1; bubble.style.maxWidth = Math.max(150, Math.floor(Math.max(la, ra))) + 'px'; }
    bw = bubble.offsetWidth; bh = bubble.offsetHeight;
  }
  function placeBubble() {
    if (!bubble.classList.contains('show')) return;
    var h = tt().head(), W = stage.clientWidth, u = h.s || 200, off = 0.29 * u;
    if (!bw) measure();
    var left = side > 0 ? h.x + off : h.x - off - bw;
    left = Math.max(6, Math.min(left, W - bw - 6));
    var top = Math.max(4, h.y - bh * 0.5 - 0.06 * u);
    bubble.classList.toggle('to-left', side < 0);
    bubble.style.transform = 'translate(' + Math.round(left) + 'px,' + Math.round(top) + 'px)';
  }
  function bubbleOn(content) {
    if (typeof content === 'string') btxt.textContent = content; else { btxt.innerHTML = ''; btxt.appendChild(content); }
    bubble.classList.remove('c1', 'c2', 'c3'); bubble.classList.add(COLORS[ci++ % 3]);
    bw = 0; bubble.classList.add('show'); placeBubble();
  }
  function bubbleOff() { bubble.classList.remove('show'); tt().talk(false); }
  function readMs(text) { return Math.min(4600, Math.max(3000, 1700 + text.length * 70)); }
  // professora fala (uma pessoa por vez), depois uma pausa
  async function say(text, ms) {
    ms = ms || readMs(text);
    bubbleOn(text); tt().talk(true);
    await sleep(Math.min(1500, ms * 0.45)); tt().talk(false);
    await sleep(ms - Math.min(1500, ms * 0.45));
    bubbleOff(); await sleep(550);
  }
  // aluninho responde (um por vez)
  var kidTurn = 0;
  async function kid(text, idx, ms) {
    var ks = kids(); if (!ks.length) return;
    var k = ks[(idx == null ? kidTurn++ : idx) % ks.length], b = k.querySelector('.aluno__say');
    b.textContent = text; b.classList.add('show'); k.classList.add(k._arm = (kidTurn % 2 ? 'up-l' : 'up-r'));
    await sleep(ms || Math.min(3600, Math.max(2600, 1500 + text.length * 65)));
    b.classList.remove('show'); k.classList.remove('up-l', 'up-r'); await sleep(500);
  }
  function kidsAll(cls, on) { kids().forEach(function (k) { k.classList.toggle(cls, on); }); }

  function tick(now) {
    raf = 0;
    var dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt * 1000;
    for (var i = waits.length - 1; i >= 0; i--) if (waits[i].t <= T) { waits.splice(i, 1)[0].r(); }
    if (writing) {
      while (writing.n < writing.spans.length && T >= writing.next) {
        var sp = writing.spans[writing.n++]; sp.classList.add('on');
        if (sp.textContent !== ' ') writing.next += writing.rate;
      }
      if (writing.n >= writing.spans.length && T >= writing.next) { var r = writing.r; writing = null; r(); }
    }
    if (teacher) { if (dt > 0.05) { teacher.update(dt / 2); teacher.update(dt / 2); } else teacher.update(dt); teacher.render(); }
    placeBubble();
    loop();
  }
  function loop() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; loop(); }, { rootMargin: '80px 0px' }).observe(stage);
  document.addEventListener('visibilitychange', loop);
  if (window.ResizeObserver) new ResizeObserver(function () { bw = 0; if (teacher) teacher.resize(); }).observe(stage);

  function spot() { return stage.clientWidth < 700 ? 0.2 : 0.3; }
  async function arrive() { var t = tt(); await t.walkTo(spot()); t.face('front'); t.pose('idle'); await sleep(400); }
  async function leave(lastOne) {
    var t = tt();
    t.pose('idle'); chalk.classList.add('erase'); await sleep(300);
    await t.walkTo(0.84);
    t.face('front'); t.pose('wave'); await sleep(1400);
    chalk.innerHTML = ''; chalk.className = 'sala__chalk'; cta.classList.remove('is-pop'); t.pose('idle'); await sleep(400);
  }
  async function toBoard() { var t = tt(); t.pose('idle'); t.face('board'); await sleep(700); t.pose('write'); }
  async function toClass() { var t = tt(); t.pose('idle'); await sleep(300); t.face('front'); await sleep(600); }

  // 1) apresentação + alfabeto de A a Z
  async function lessonAlphabet() {
    var t = tt();
    await arrive();
    t.pose('wave'); await say('Olá, pessoal! Eu sou a Prof. Yasmin!');
    t.pose('idle'); await kid('Oi, prof. Yasmin!', 0);
    await say('Hoje vamos aprender o alfabeto!');
    await kid('Ebaaa! O alfabeto!', 1);
    await say('Olhem o quadro!', 2600);
    await toBoard();
    var groups = [['A B C D E', 0, 'A, B, C, D, E...'], [' F G H I', 0, 'F, G, H, I...'], ['J K L M N', 1, 'J, K, L, M, N...'], [' O P Q R', 1, 'O, P, Q, R...'], ['S T U V', 2, 'S, T, U, V...'], [' W X Y Z', 2, 'W, X, Y e Z!']];
    var rows = [], col = rainbow();
    for (var g = 0; g < groups.length; g++) {
      var G = groups[g]; if (!rows[G[1]]) rows[G[1]] = newLine();
      bubbleOn(G[2]); t.talk(true);
      var t0 = T; await write(rows[G[1]], G[0], col, 560); t.talk(false);
      await sleep(Math.max(500, 3000 - (T - t0))); bubbleOff(); await sleep(450);
    }
    await toClass();
    t.pose('point'); await say('Pronto! São 26 letras!');
    t.pose('idle'); await kid('Uau! Quantas letras!', 2);
    t.pose('cheer'); kidsAll('cheer', true); await say('Muito bem, turma!');
    kidsAll('cheer', false); await kid('Eu já sei o alfabeto!', 3);
    await leave();
  }

  // 2) musiquinha do ABC, estilo karaokê
  async function lessonSong() {
    var t = tt();
    await arrive();
    await say('Agora vem a musiquinha do ABC!');
    await kid('Eba! Eu sei cantar!', 4);
    t.pose('wave'); await say('Então canta comigo!', 3000);
    var B = 560;
    var phrases = [['ABCDEFG', [1, 1, 1, 1, 1, 1, 2]], ['HIJKLMNOP', [1, 1, 1, 1, .5, .5, .5, .5, 2]], ['QRS', [1, 1, 2]], ['TUV', [1, 1, 2]], ['WXYZ', [1, 1, 1, 2]]];
    var rows = [newLine(), newLine(), newLine(), newLine()], rowOf = [0, 1, 2, 2, 3], col = rainbow();
    t.pose('sing'); kidsBox.classList.add('singing');
    for (var p = 0; p < phrases.length; p++) {
      var letters = phrases[p][0], beats = phrases[p][1];
      var box = document.createElement('span'), parts = [];
      box.appendChild(document.createTextNode('♪ '));
      for (var i = 0; i < letters.length; i++) { var s = document.createElement('span'); s.textContent = letters[i] + (i < letters.length - 1 ? ' ' : ''); box.appendChild(s); parts.push(s); }
      bubbleOn(box); t.talk(true);
      var row = rows[rowOf[p]];
      if (row.childNodes.length) addChars(row, ' ', 'w').forEach(function (x) { x.classList.add('on'); });
      for (var j = 0; j < letters.length; j++) {
        parts.forEach(function (x, k) { x.className = k < j ? 'k-done' : (k === j ? 'k-now' : ''); });
        var ch = addChars(row, letters[j], col)[0]; ch.classList.add('on', 'sing');
        if (j < letters.length - 1) addChars(row, ' ', 'w')[0].classList.add('on');
        await sleep(B * beats[j]);
      }
      t.talk(false); await sleep(250);
    }
    bubbleOn('♪ Agora eu já sei o ABC!'); t.talk(true); await sleep(1600); t.talk(false); await sleep(1800);
    bubbleOff(); kidsBox.classList.remove('singing'); t.pose('idle'); await sleep(500);
    await kid('De novo, prof! De novo!', 0);
    t.pose('cheer'); kidsAll('cheer', true); await say('Vocês cantaram lindo!');
    kidsAll('cheer', false);
    await leave();
  }

  // 3) vogais
  async function lessonVowels() {
    var t = tt();
    await arrive();
    await say('Agora, as vogais!');
    await kid('Vogais? O que é isso?', 1);
    await toBoard();
    chalk.classList.add('sala__chalk--big');
    var row = newLine();
    bubbleOn('São as letras A, E, I, O, U!'); t.talk(true);
    var t0 = T; await write(row, 'A E I O U', rainbow(), 700); t.talk(false);
    await sleep(Math.max(600, 3800 - (T - t0))); bubbleOff(); await sleep(450);
    await toClass();
    t.pose('point'); await say('Repitam comigo: A, E, I, O, U!');
    t.pose('idle'); kidsAll('nod', true); await kid('A, E, I, O, U!', 2); kidsAll('nod', false);
    t.pose('cheer'); kidsAll('cheer', true); await say('Isso! Muito bem!');
    kidsAll('cheer', false); await kid('Eu acertei!', 3);
    t.pose('wave'); cta.classList.add('is-pop'); await say('Bora estudar comigo?', 3800);
    await leave();
  }

  var LS = [lessonAlphabet, lessonSong, lessonVowels];
  var start = (+((location.search.match(/[?&]aula=(\d)/) || [])[1]) || 1) - 1;
  async function run() { for (var i = start; ; i = (i + 1) % LS.length) await LS[i](); }

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
