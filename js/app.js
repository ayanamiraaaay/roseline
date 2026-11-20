/* RoseLine — общие скрипты сайта.
   НАСТРОЙКИ САЛОНА: замените номера на настоящие перед запуском. */
var SALON = {
  whatsapp: '37400000000',      // номер WhatsApp без «+» и пробелов
  telegram: 'roseline_salon'    // имя пользователя Telegram без «@»
};

(function () {
  var RL = window.RL || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

  /* Меню на телефоне */
  var burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      $('.ic-open', burger).style.display = open ? 'none' : '';
      $('.ic-close', burger).style.display = open ? '' : 'none';
    });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { mnav.classList.remove('open'); }); });
  }

  /* Ссылки WhatsApp / Telegram */
  $$('[data-wa]').forEach(function (a) { a.href = 'https://wa.me/' + SALON.whatsapp; });
  $$('[data-tg]').forEach(function (a) { a.href = 'https://t.me/' + SALON.telegram; });

  /* Группа кнопок-переключателей */
  function pillGroup(box, onPick) {
    $$('.pill', box).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.pill', box).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        onPick(b.getAttribute('data-v'));
      });
    });
  }
  function pick(box, v) {
    var b = $('.pill[data-v="' + v + '"]', box);
    if (b) b.click();
  }

  /* Калькулятор цены */
  var calc = $('#calc');
  if (calc && RL.services) {
    var st = { svc: RL.services[0].id, len: 1, lvl: 0 };
    var render = function () {
      var s = RL.services.filter(function (x) { return x.id === st.svc; })[0];
      var base = s.p[s.p.length > 1 ? st.len : 0] * (st.lvl ? RL.topK : 1);
      var lo = Math.round(base / 500) * 500, hi = Math.round(base * 1.2 / 500) * 500;
      $('#c-name').textContent = s.name + ' · ' + RL.levels[st.lvl] + (s.p.length > 1 ? ' · ' + RL.lengths[st.len].toLowerCase() : '');
      $('#c-price').textContent = s.p.length > 1 ? fmt(lo) + ' – ' + fmt(hi) + ' ֏' : fmt(lo) + ' ֏';
      $('#c-time').textContent = s.t;
      $('#c-book').href = RL.bookUrl + '?service=' + s.id;
      $('#c-len').style.display = s.p.length > 1 ? '' : 'none';
    };
    pillGroup($('#c-svc'), function (v) { st.svc = v; render(); });
    pillGroup($('#c-lenp'), function (v) { st.len = +v; render(); });
    pillGroup($('#c-lvl'), function (v) { st.lvl = +v; render(); });
    render();
  }

  /* Фильтр работ */
  var wf = $('#works-filter');
  if (wf) {
    pillGroup(wf, function (v) {
      $$('#works-grid .work').forEach(function (w) {
        w.style.display = (v === 'all' || w.getAttribute('data-cat') === v) ? '' : 'none';
      });
    });
  }

  /* Онлайн-запись: заявка уходит в WhatsApp или Telegram салона */
  var form = $('#book-form');
  if (form) {
    var data = { service: '', master: '', time: '' };
    pillGroup($('#b-svc'), function (v) { data.service = v; });
    pillGroup($('#b-master'), function (v) { data.master = v; });
    pillGroup($('#b-time'), function (v) { data.time = v; });
    var q = new URLSearchParams(location.search);
    var label = function (box, v) { var b = $('.pill[data-v="' + v + '"]', $(box)); return b ? b.textContent.trim() : ''; };
    if (q.get('service')) {
      var svcBtn = $('#b-svc .pill[data-v="' + q.get('service') + '"]');
      if (!svcBtn) {
        var s = (RL.services || []).filter(function (x) { return x.id === q.get('service'); })[0];
        if (s) { svcBtn = document.createElement('button'); svcBtn.type = 'button'; svcBtn.className = 'pill'; svcBtn.setAttribute('aria-pressed', 'false'); svcBtn.setAttribute('data-v', s.id); svcBtn.textContent = s.name; $('#b-svc').insertBefore(svcBtn, $('#b-svc').firstChild); pillGroup($('#b-svc'), function (v) { data.service = v; }); }
      }
      pick($('#b-svc'), q.get('service'));
    }
    if (q.get('master')) pick($('#b-master'), q.get('master'));
    var dateIn = $('#b-date');
    if (dateIn) { var t = new Date(); dateIn.min = t.toISOString().slice(0, 10); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#b-name').value.trim(), phone = $('#b-phone').value.trim();
      if (phone.replace(/\D/g, '').length < 8) { $('#b-err').textContent = RL.t.errPhone; $('#b-phone').focus(); return; }
      $('#b-err').textContent = '';
      var lines = [RL.t.msgHello];
      if (name) lines.push(RL.t.fName + ': ' + name);
      lines.push(RL.t.fPhone + ': ' + phone);
      if (data.service) lines.push(RL.t.fService + ': ' + label('#b-svc', data.service));
      if (data.master) lines.push(RL.t.fMaster + ': ' + label('#b-master', data.master));
      if (dateIn && dateIn.value) lines.push(RL.t.fDate + ': ' + dateIn.value.split('-').reverse().join('.'));
      if (data.time) lines.push(RL.t.fTime + ': ' + label('#b-time', data.time));
      if ($('#b-first').checked) lines.push(RL.t.fFirst);
      if ($('#b-silent').checked) lines.push(RL.t.fSilent);
      var c = $('#b-comment').value.trim(); if (c) lines.push(RL.t.fComment + ': ' + c);
      var text = encodeURIComponent(lines.join('\n'));
      $('#b-wa').href = 'https://wa.me/' + SALON.whatsapp + '?text=' + text;
      $('#b-tg').href = 'https://t.me/' + SALON.telegram + '?text=' + text;
      $('#b-summary').textContent = lines.slice(1).join(' · ');
      form.style.display = 'none';
      $('#b-done').classList.add('show');
      $('#b-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    var back = $('#b-back');
    if (back) back.addEventListener('click', function () { form.style.display = ''; $('#b-done').classList.remove('show'); });
  }
})();
