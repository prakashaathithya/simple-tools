Tools.register({
  id: 'word-count',
  name: 'Word & Character Counter',
  icon: '📊',
  desc: 'Live counts of words, characters, sentences, lines and reading time.',
  tags: ['count', 'word', 'character', 'lines', 'text', 'statistics'],

  html: [
    '<label class="field" for="wc-in">Your text</label>',
    '<textarea id="wc-in" spellcheck="false" style="min-height:260px" placeholder="Start typing or paste your text…"></textarea>',
    '<div class="stats" id="wc-stats"></div>',
    '<h3 style="font-size:14px;margin:24px 0 10px">Most frequent words</h3>',
    '<div class="list" id="wc-freq"></div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var inp = $('#wc-in', root), stats = $('#wc-stats', root), freq = $('#wc-freq', root);

    var STOP = 'the a an and or but of to in on for with is are was were be been it its this that as at by from not have has had you your i we they he she'.split(' ');

    function run() {
      var t = inp.value;
      var words = t.match(/[\p{L}\p{N}'’-]+/gu) || [];
      var sentences = (t.match(/[^.!?]*[.!?]+/g) || []).filter(function (s) { return s.trim(); });
      var paras = t.split(/\n\s*\n/).filter(function (p) { return p.trim(); });
      var mins = words.length / 200;

      var pairs = [
        [words.length, 'words'],
        [t.length, 'characters'],
        [t.replace(/\s/g, '').length, 'chars (no spaces)'],
        [sentences.length, 'sentences'],
        [paras.length, 'paragraphs'],
        [t ? t.split('\n').length : 0, 'lines'],
        [(mins < 1 ? '<1' : Math.round(mins)) + ' min', 'reading time']
      ];
      stats.innerHTML = pairs.map(function (p) {
        return '<div class="stat"><b>' + p[0] + '</b><span>' + p[1] + '</span></div>';
      }).join('');

      var counts = {};
      words.forEach(function (w) {
        w = w.toLowerCase();
        if (w.length < 3 || STOP.indexOf(w) > -1) return;
        counts[w] = (counts[w] || 0) + 1;
      });
      var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 12);
      freq.innerHTML = top.length
        ? top.map(function (w) {
            return '<div>' + esc(w) + ' <span style="color:var(--muted)">— ' + counts[w] + '×</span></div>';
          }).join('')
        : '<p class="note">Nothing to count yet.</p>';
    }

    inp.addEventListener('input', run);
    run();
  }
});
