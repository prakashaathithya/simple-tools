Tools.register({
  id: 'case-convert',
  name: 'Case Converter',
  icon: 'Aa',
  desc: 'camelCase, snake_case, kebab-case, Title Case and more, in one click.',
  tags: ['case', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower'],

  html: [
    '<label class="field" for="cc-in">Input text</label>',
    '<textarea id="cc-in" spellcheck="false" style="min-height:130px" placeholder="hello world example"></textarea>',
    '<div class="row" style="margin-top:14px"><button class="btn" data-clear="#cc-in">Clear</button></div>',
    '<div id="cc-out"></div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var inp = $('#cc-in', root), out = $('#cc-out', root);

    function words(s) {
      return s
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_\-.]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    }
    function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }

    var forms = [
      ['lower case', function (s) { return s.toLowerCase(); }],
      ['UPPER CASE', function (s) { return s.toUpperCase(); }],
      ['Title Case', function (s) { return words(s).map(cap).join(' '); }],
      ['Sentence case', function (s) {
        return s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, function (m) { return m.toUpperCase(); });
      }],
      ['camelCase', function (s) {
        return words(s).map(function (w, i) { return i ? cap(w) : w.toLowerCase(); }).join('');
      }],
      ['PascalCase', function (s) { return words(s).map(cap).join(''); }],
      ['snake_case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('_'); }],
      ['CONSTANT_CASE', function (s) { return words(s).map(function (w) { return w.toUpperCase(); }).join('_'); }],
      ['kebab-case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('-'); }],
      ['dot.case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('.'); }],
      ['path/case', function (s) { return words(s).map(function (w) { return w.toLowerCase(); }).join('/'); }],
      ['aLtErNaTiNg', function (s) {
        return s.split('').map(function (c, i) { return i % 2 ? c.toUpperCase() : c.toLowerCase(); }).join('');
      }],
      ['esreveR', function (s) { return s.split('').reverse().join(''); }]
    ];

    function run() {
      var s = inp.value;
      out.innerHTML = forms.map(function (f) {
        var v = s ? f[1](s) : '';
        return '<div style="margin-top:14px"><label class="field">' + esc(f[0]) + '</label>' +
          '<div class="row" style="margin:0">' +
            '<div class="out" style="flex:1">' + esc(v) + '</div>' +
            '<button class="btn" data-v="' + esc(v) + '">Copy</button>' +
          '</div></div>';
      }).join('');
      Tools.$$('[data-v]', out).forEach(function (b) {
        b.addEventListener('click', function () { Tools.copy(b.dataset.v); });
      });
    }

    inp.addEventListener('input', run);
    run();
  }
});
