Tools.register({
  id: 'url-encode',
  name: 'URL Encode / Decode',
  icon: '🔗',
  desc: 'Percent-encode or decode URLs, plus a breakdown of query parameters.',
  tags: ['url', 'uri', 'encode', 'decode', 'query', 'percent'],

  html: [
    '<div class="cols">',
    '  <div><label class="field" for="url-in">Input</label><textarea id="url-in" spellcheck="false" placeholder="https://example.com/search?q=hello world"></textarea></div>',
    '  <div><label class="field" for="url-out">Output</label><textarea id="url-out" spellcheck="false" readonly></textarea></div>',
    '</div>',
    '<div class="row" style="margin-top:14px">',
    '  <button class="btn primary" id="url-enc">Encode →</button>',
    '  <button class="btn primary" id="url-dec">← Decode</button>',
    '  <label class="check"><input type="checkbox" id="url-comp" checked> Encode every reserved character</label>',
    '  <span class="spacer"></span>',
    '  <button class="btn" data-copy="#url-out">Copy</button>',
    '  <button class="btn" data-clear="#url-in,#url-out">Clear</button>',
    '</div>',
    '<p class="error" id="url-err"></p>',
    '<div id="url-parts"></div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var inp = $('#url-in', root), out = $('#url-out', root);
    var err = $('#url-err', root), parts = $('#url-parts', root);

    function breakdown(text) {
      parts.innerHTML = '';
      var u;
      try { u = new URL(text); } catch (e) { return; }
      var rows = [
        ['protocol', u.protocol], ['host', u.host], ['path', u.pathname],
        ['hash', u.hash || '—']
      ];
      var qs = [];
      u.searchParams.forEach(function (v, k) { qs.push([k, v]); });
      parts.innerHTML =
        '<h3 style="font-size:14px;margin:22px 0 10px">URL breakdown</h3>' +
        '<div class="kv">' + rows.map(function (r) {
          return '<span>' + r[0] + '</span><div>' + esc(r[1]) + '</div>';
        }).join('') + '</div>' +
        (qs.length
          ? '<h3 style="font-size:14px;margin:22px 0 10px">Query parameters (' + qs.length + ')</h3>' +
            '<div class="kv">' + qs.map(function (r) {
              return '<span>' + esc(r[0]) + '</span><div>' + esc(r[1]) + '</div>';
            }).join('') + '</div>'
          : '');
    }

    $('#url-enc', root).addEventListener('click', function () {
      err.textContent = '';
      out.value = $('#url-comp', root).checked
        ? encodeURIComponent(inp.value)
        : encodeURI(inp.value);
      breakdown(inp.value);
    });

    $('#url-dec', root).addEventListener('click', function () {
      err.textContent = '';
      try {
        out.value = decodeURIComponent(inp.value.replace(/\+/g, ' '));
        breakdown(out.value);
      } catch (e) {
        err.textContent = 'Malformed percent-encoding — cannot decode.';
        out.value = '';
      }
    });
  }
});
