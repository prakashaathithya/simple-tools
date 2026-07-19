Tools.register({
  id: 'json-format',
  name: 'JSON Formatter',
  icon: '{ }',
  desc: 'Beautify, minify and validate JSON with clear error positions.',
  tags: ['json', 'format', 'beautify', 'minify', 'validate'],

  html: [
    '<div class="cols">',
    '  <div><label class="field" for="js-in">JSON input</label><textarea id="js-in" spellcheck="false" placeholder=\'{"hello":"world"}\'></textarea></div>',
    '  <div><label class="field" for="js-out">Output</label><textarea id="js-out" spellcheck="false" readonly></textarea></div>',
    '</div>',
    '<div class="row" style="margin-top:14px">',
    '  <button class="btn primary" id="js-pretty">Beautify</button>',
    '  <button class="btn" id="js-min">Minify</button>',
    '  <button class="btn" id="js-sort">Sort keys</button>',
    '  <label class="check">Indent&nbsp;<select id="js-indent" style="width:auto"><option>2</option><option>4</option><option>Tab</option></select></label>',
    '  <span class="spacer"></span>',
    '  <button class="btn" data-copy="#js-out">Copy</button>',
    '  <button class="btn" data-clear="#js-in,#js-out">Clear</button>',
    '</div>',
    '<p class="error" id="js-err"></p><p class="ok" id="js-ok"></p>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$;
    var inp = $('#js-in', root), out = $('#js-out', root);
    var err = $('#js-err', root), ok = $('#js-ok', root);

    function indent() {
      var v = $('#js-indent', root).value;
      return v === 'Tab' ? '\t' : Number(v);
    }

    function parse() {
      err.textContent = ''; ok.textContent = '';
      if (!inp.value.trim()) { out.value = ''; return null; }
      try {
        return { value: JSON.parse(inp.value) };
      } catch (e) {
        var m = /position (\d+)/.exec(e.message);
        var where = '';
        if (m) {
          var pos = Number(m[1]);
          var line = inp.value.slice(0, pos).split('\n').length;
          var col = pos - inp.value.lastIndexOf('\n', pos - 1);
          where = '  (line ' + line + ', column ' + col + ')';
        }
        err.textContent = 'Invalid JSON: ' + e.message + where;
        out.value = '';
        return null;
      }
    }

    function report(data) {
      var n = 0;
      (function walk(v) { n++; if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); }); })(data);
      ok.textContent = '✓ Valid JSON — ' + n + ' nodes, ' + out.value.length + ' chars';
    }

    function sortKeys(v) {
      if (Array.isArray(v)) return v.map(sortKeys);
      if (v && typeof v === 'object') {
        return Object.keys(v).sort().reduce(function (acc, k) { acc[k] = sortKeys(v[k]); return acc; }, {});
      }
      return v;
    }

    $('#js-pretty', root).addEventListener('click', function () {
      var r = parse(); if (!r) return;
      out.value = JSON.stringify(r.value, null, indent()); report(r.value);
    });
    $('#js-min', root).addEventListener('click', function () {
      var r = parse(); if (!r) return;
      out.value = JSON.stringify(r.value); report(r.value);
    });
    $('#js-sort', root).addEventListener('click', function () {
      var r = parse(); if (!r) return;
      out.value = JSON.stringify(sortKeys(r.value), null, indent()); report(r.value);
    });
    inp.addEventListener('input', function () { err.textContent = ''; ok.textContent = ''; });
  }
});
