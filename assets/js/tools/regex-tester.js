Tools.register({
  id: 'regex-tester',
  name: 'Regex Tester',
  icon: '.*',
  desc: 'Test a regular expression against text and inspect every match group.',
  tags: ['regex', 'regexp', 'pattern', 'match', 'test'],

  html: [
    '<div class="row">',
    '  <span style="font-family:var(--mono);color:var(--muted)">/</span>',
    '  <input type="text" id="rx-pat" placeholder="\\b\\w+@\\w+\\.\\w+\\b" style="flex:1;min-width:200px">',
    '  <span style="font-family:var(--mono);color:var(--muted)">/</span>',
    '  <input type="text" id="rx-flags" value="gm" style="width:80px" title="flags: g m i s u y">',
    '</div>',
    '<label class="field" for="rx-text">Test string</label>',
    '<textarea id="rx-text" spellcheck="false" style="min-height:170px" placeholder="Paste the text to search…"></textarea>',
    '<p class="error" id="rx-err"></p>',
    '<h3 style="font-size:14px;margin:22px 0 10px">Highlighted</h3>',
    '<div class="out" id="rx-hl"></div>',
    '<h3 style="font-size:14px;margin:22px 0 10px">Matches <span id="rx-count" style="color:var(--muted);font-weight:400"></span></h3>',
    '<div id="rx-list"></div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var pat = $('#rx-pat', root), flags = $('#rx-flags', root), text = $('#rx-text', root);
    var err = $('#rx-err', root), hl = $('#rx-hl', root), list = $('#rx-list', root), count = $('#rx-count', root);

    function run() {
      err.textContent = ''; list.innerHTML = ''; count.textContent = '';
      var src = text.value;
      hl.innerHTML = esc(src);
      if (!pat.value) return;

      var re;
      try {
        var f = flags.value.replace(/[^gimsuy]/g, '');
        re = new RegExp(pat.value, f.indexOf('g') > -1 ? f : f + 'g');
      } catch (e) {
        err.textContent = 'Invalid pattern: ' + e.message;
        return;
      }

      var matches = [], m, guard = 0;
      while ((m = re.exec(src)) !== null && guard++ < 5000) {
        matches.push({ text: m[0], index: m.index, groups: m.slice(1), named: m.groups || null });
        if (m[0] === '') re.lastIndex++;
      }

      count.textContent = '— ' + matches.length + (matches.length === 1 ? ' match' : ' matches');

      var html = '', last = 0;
      matches.forEach(function (mm) {
        if (mm.index < last) return;
        html += esc(src.slice(last, mm.index)) + '<mark>' + esc(mm.text || '·') + '</mark>';
        last = mm.index + mm.text.length;
      });
      html += esc(src.slice(last));
      hl.innerHTML = html || '<span class="note">No text to search.</span>';

      list.innerHTML = matches.length
        ? matches.slice(0, 200).map(function (mm, i) {
            var groups = mm.groups.map(function (g, gi) {
              return '<span>group ' + (gi + 1) + '</span><div>' + (g === undefined ? '<i style="color:var(--muted)">undefined</i>' : esc(g)) + '</div>';
            }).join('');
            var named = mm.named
              ? Object.keys(mm.named).map(function (k) {
                  return '<span>&lt;' + esc(k) + '&gt;</span><div>' + esc(String(mm.named[k])) + '</div>';
                }).join('')
              : '';
            return '<div style="margin-bottom:12px;padding:10px 12px;border:1px solid var(--border);border-radius:9px;background:var(--bg-soft)">' +
              '<div class="kv"><span>#' + (i + 1) + ' @ ' + mm.index + '</span><div><b>' + esc(mm.text) + '</b></div>' +
              groups + named + '</div></div>';
          }).join('')
        : '<p class="note">No matches.</p>';
    }

    [pat, flags, text].forEach(function (el) { el.addEventListener('input', run); });
    run();
  }
});
