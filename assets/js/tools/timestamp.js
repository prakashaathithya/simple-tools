Tools.register({
  id: 'timestamp',
  name: 'Unix Timestamp Converter',
  icon: '⏱️',
  desc: 'Convert between Unix epoch seconds/milliseconds and human dates.',
  tags: ['timestamp', 'unix', 'epoch', 'date', 'time', 'iso'],

  html: [
    '<div class="stats"><div class="stat" style="min-width:200px"><b id="ts-now">…</b><span>current unix time (seconds)</span></div></div>',
    '<div class="cols" style="margin-top:10px">',
    '  <div>',
    '    <label class="field" for="ts-epoch">Timestamp → date</label>',
    '    <input type="text" id="ts-epoch" placeholder="1752883200 or 1752883200000">',
    '    <div class="out" id="ts-date-out" style="margin-top:12px"></div>',
    '  </div>',
    '  <div>',
    '    <label class="field" for="ts-date">Date → timestamp</label>',
    '    <input type="text" id="ts-date" placeholder="2026-07-19 14:30  or  19 Jul 2026">',
    '    <div class="out" id="ts-epoch-out" style="margin-top:12px"></div>',
    '  </div>',
    '</div>',
    '<div class="row" style="margin-top:14px"><button class="btn" id="ts-fill">Use current time</button></div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var epochIn = $('#ts-epoch', root), dateIn = $('#ts-date', root);
    var dOut = $('#ts-date-out', root), eOut = $('#ts-epoch-out', root);

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function relative(ms) {
      var d = (ms - Date.now()) / 1000, abs = Math.abs(d);
      var units = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']];
      for (var i = 0; i < units.length; i++) {
        if (abs >= units[i][0]) {
          var n = Math.round(abs / units[i][0]);
          return n + ' ' + units[i][1] + (n === 1 ? '' : 's') + (d < 0 ? ' ago' : ' from now');
        }
      }
      return 'just now';
    }

    function describe(date) {
      var local = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
        ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
      return [
        ['ISO 8601 (UTC)', date.toISOString()],
        ['Local time', local],
        ['UTC string', date.toUTCString()],
        ['Relative', relative(date.getTime())],
        ['Seconds', Math.floor(date.getTime() / 1000)],
        ['Milliseconds', date.getTime()]
      ].map(function (r) { return '<b style="color:var(--muted);font-weight:400">' + r[0] + ':</b>  ' + esc(String(r[1])); }).join('\n');
    }

    function fromEpoch() {
      var raw = epochIn.value.trim().replace(/[,_\s]/g, '');
      if (!raw) { dOut.innerHTML = ''; return; }
      if (!/^-?\d+(\.\d+)?$/.test(raw)) { dOut.innerHTML = '<span class="error">Not a number.</span>'; return; }
      var n = Number(raw);
      var ms = Math.abs(n) > 1e11 ? n : n * 1000;   // heuristics: >1e11 already ms
      var d = new Date(ms);
      dOut.innerHTML = isNaN(d.getTime()) ? '<span class="error">Out of range.</span>' : describe(d);
    }

    function fromDate() {
      var raw = dateIn.value.trim();
      if (!raw) { eOut.innerHTML = ''; return; }
      var d = new Date(raw.replace(' ', 'T'));
      if (isNaN(d.getTime())) d = new Date(raw);
      eOut.innerHTML = isNaN(d.getTime())
        ? '<span class="error">Could not parse that date.</span>'
        : describe(d);
    }

    epochIn.addEventListener('input', fromEpoch);
    dateIn.addEventListener('input', fromDate);
    $('#ts-fill', root).addEventListener('click', function () {
      epochIn.value = Math.floor(Date.now() / 1000);
      fromEpoch();
    });

    var nowEl = $('#ts-now', root);
    (function tick() {
      nowEl.textContent = Math.floor(Date.now() / 1000);
      if (document.body.contains(nowEl)) setTimeout(tick, 1000);
    })();
  }
});
