Tools.register({
  id: 'lorem',
  name: 'Lorem Ipsum Generator',
  icon: '📝',
  desc: 'Placeholder paragraphs, sentences, words or list items for mockups.',
  tags: ['lorem', 'ipsum', 'placeholder', 'dummy', 'text', 'filler'],

  html: [
    '<div class="row">',
    '  <label class="check">Generate&nbsp;<input type="number" id="lo-n" value="4" min="1" max="100" style="width:80px"></label>',
    '  <label class="check"><select id="lo-unit" style="width:auto">',
    '    <option value="para">paragraphs</option><option value="sent">sentences</option>',
    '    <option value="word">words</option><option value="list">list items</option>',
    '  </select></label>',
    '  <label class="check"><input type="checkbox" id="lo-classic" checked> Start with “Lorem ipsum dolor…”</label>',
    '  <span class="spacer"></span>',
    '  <button class="btn primary" id="lo-gen">Generate</button>',
    '  <button class="btn" data-copy="#lo-out">Copy</button>',
    '</div>',
    '<textarea id="lo-out" spellcheck="false" readonly style="min-height:300px;font-family:inherit;font-size:14.5px"></textarea>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$;
    var out = $('#lo-out', root);

    var WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et ' +
      'dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo ' +
      'consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint ' +
      'occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum at vero eos accusamus ' +
      'iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque corrupti quos dolores quas').split(' ');

    var CLASSIC = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

    function word() { return WORDS[Math.floor(Math.random() * WORDS.length)]; }

    function sentence() {
      var n = 6 + Math.floor(Math.random() * 12), w = [];
      for (var i = 0; i < n; i++) w.push(word());
      if (n > 9) w.splice(Math.floor(n / 2), 0, w.splice(Math.floor(n / 2), 1)[0] + ',');
      var s = w.join(' ');
      return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    }

    function paragraph() {
      var n = 3 + Math.floor(Math.random() * 4), s = [];
      for (var i = 0; i < n; i++) s.push(sentence());
      return s.join(' ');
    }

    function run() {
      var n = Math.min(100, Math.max(1, Number($('#lo-n', root).value) || 1));
      var unit = $('#lo-unit', root).value;
      var classic = $('#lo-classic', root).checked;
      var parts = [], i;

      if (unit === 'word') {
        for (i = 0; i < n; i++) parts.push(word());
        out.value = parts.join(' ');
        return;
      }
      for (i = 0; i < n; i++) {
        var chunk = unit === 'para' ? paragraph() : sentence();
        if (i === 0 && classic) chunk = CLASSIC + (unit === 'para' ? ' ' + chunk : '');
        parts.push(unit === 'list' ? '• ' + chunk : chunk);
      }
      out.value = parts.join(unit === 'para' ? '\n\n' : '\n');
    }

    $('#lo-gen', root).addEventListener('click', run);
    Tools.$$('select,input', root).forEach(function (el) { el.addEventListener('change', run); });
    run();
  }
});
