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

  var form = document.getElementById('form');
  var status = document.getElementById('status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var nome = (d.get('nome') || '').toString().trim();
    var ano = (d.get('ano') || '').toString().trim();
    var msg = (d.get('msg') || '').toString().trim();
    var text = 'Olá, Prof. Yasmin! ' + (nome ? 'Meu nome é ' + nome + '. ' : '') +
      'Tenho interesse em aulas: ' + String(d.get('modalidade')).toLowerCase() + '.' +
      (ano ? ' A criança está no ' + ano + '.' : '') + (msg ? ' ' + msg : '') +
      ' Pode me passar horários e valores?';
    var url = 'https://ig.me/m/yasminmakhare.pedagoga';
    function go() { status.textContent = 'Mensagem copiada! Cole na conversa do Instagram e envie.'; window.open(url, '_blank', 'noopener'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(go, function () { status.textContent = 'Abrindo o Instagram. Escreva sua mensagem por lá.'; window.open(url, '_blank', 'noopener'); });
    } else { status.textContent = 'Abrindo o Instagram. Escreva sua mensagem por lá.'; window.open(url, '_blank', 'noopener'); }
  });
})();
