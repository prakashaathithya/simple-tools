Tools.register({
  id: 'text-compare',
  name: 'Text Compare',
  icon: '🔍',
  desc: 'Side-by-side line diff of two texts, with added / removed highlighting.',
  tags: ['diff', 'compare', 'text', 'merge'],

  html: [
    '<div class="cols">',
    '  <div><label class="field" for="tc-a">Original</label><textarea id="tc-a" spellcheck="false" placeholder="Paste the first text here…"></textarea></div>',
    '  <div><label class="field" for="tc-b">Changed</label><textarea id="tc-b" spellcheck="false" placeholder="Paste the second text here…"></textarea></div>',
    '</div>',
    '<div class="row" style="margin-top:14px">',
    '  <label class="check"><input type="checkbox" id="tc-case"> Ignore case</label>',
    '  <label class="check"><input type="checkbox" id="tc-ws"> Ignore whitespace</label>',
    '  <label class="check"><input type="checkbox" id="tc-empty"> Ignore blank lines</label>',
    '  <span class="spacer"></span>',
    '  <button class="btn" id="tc-swap">Swap sides</button>',
    '  <button class="btn" data-clear="#tc-a,#tc-b">Clear</button>',
    '  <button class="btn primary" id="tc-run">Compare</button>',
    '</div>',
    '<div class="stats" id="tc-stats"></div>',
    '<div class="diff" id="tc-out"></div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var a = $('#tc-a', root), b = $('#tc-b', root);
    var out = $('#tc-out', root), stats = $('#tc-stats', root);

    function opts() {
      return {
        icase: $('#tc-case', root).checked,
        iws: $('#tc-ws', root).checked,
        iempty: $('#tc-empty', root).checked
      };
    }

    function norm(line, o) {
      var s = line;
      if (o.iws) s = s.replace(/\s+/g, ' ').trim();
      if (o.icase) s = s.toLowerCase();
      return s;
    }

    function split(text, o) {
      var lines = text.replace(/\r\n?/g, '\n').split('\n');
      if (o.iempty) lines = lines.filter(function (l) { return l.trim() !== ''; });
      return lines;
    }

    /* Longest-common-subsequence diff over lines -> [{op:'eq'|'del'|'add', a, b}] */
    function diff(A, B, o) {
      var n = A.length, m = B.length;
      var na = A.map(function (l) { return norm(l, o); });
      var nb = B.map(function (l) { return norm(l, o); });
      var ops = [], i, j;

      if (n * m > 4000000) {                       // too big for the O(n*m) table
        for (i = 0; i < Math.max(n, m); i++) {
          if (i < n && i < m && na[i] === nb[i]) ops.push({ op: 'eq', a: i, b: i });
          else {
            if (i < n) ops.push({ op: 'del', a: i });
            if (i < m) ops.push({ op: 'add', b: i });
          }
        }
        return ops;
      }

      var w = m + 1;
      var dp = new Uint32Array((n + 1) * w);
      for (i = n - 1; i >= 0; i--) {
        for (j = m - 1; j >= 0; j--) {
          dp[i * w + j] = na[i] === nb[j]
            ? dp[(i + 1) * w + j + 1] + 1
            : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
        }
      }
      i = 0; j = 0;
      while (i < n && j < m) {
        if (na[i] === nb[j]) { ops.push({ op: 'eq', a: i, b: j }); i++; j++; }
        else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) { ops.push({ op: 'del', a: i }); i++; }
        else { ops.push({ op: 'add', b: j }); j++; }
      }
      while (i < n) { ops.push({ op: 'del', a: i }); i++; }
      while (j < m) { ops.push({ op: 'add', b: j }); j++; }
      return ops;
    }

    /* Group ops into aligned rows so both panes stay in sync. */
    function rows(ops) {
      var r = [], k = 0;
      while (k < ops.length) {
        if (ops[k].op === 'eq') { r.push({ l: ops[k].a, rgt: ops[k].b, kind: 'eq' }); k++; continue; }
        var dels = [], adds = [];
        while (k < ops.length && ops[k].op === 'del') dels.push(ops[k++].a);
        while (k < ops.length && ops[k].op === 'add') adds.push(ops[k++].b);
        for (var x = 0; x < Math.max(dels.length, adds.length); x++) {
          r.push({
            l: x < dels.length ? dels[x] : null,
            rgt: x < adds.length ? adds[x] : null,
            kind: 'chg'
          });
        }
      }
      return r;
    }

    /* Highlight the differing middle of two similar lines. */
    function inline(s, other) {
      if (other == null) return esc(s);
      var p = 0, max = Math.min(s.length, other.length);
      while (p < max && s[p] === other[p]) p++;
      var q = 0;
      while (q < max - p && s[s.length - 1 - q] === other[other.length - 1 - q]) q++;
      if (p === 0 && q === 0) return esc(s);
      var mid = s.slice(p, s.length - q);
      return esc(s.slice(0, p)) + (mid ? '<mark>' + esc(mid) + '</mark>' : '') + esc(s.slice(s.length - q));
    }

    function line(no, text, cls) {
      if (no === null) return '<div class="dline gap"><span class="no"></span><span class="tx"></span></div>';
      return '<div class="dline ' + cls + '"><span class="no">' + (no + 1) + '</span><span class="tx">' + text + '</span></div>';
    }

    function run() {
      var o = opts();
      var A = split(a.value, o), B = split(b.value, o);

      if (!a.value && !b.value) {
        out.innerHTML = '';
        stats.innerHTML = '<p class="note">Paste text into both boxes, then hit Compare.</p>';
        return;
      }

      var rs = rows(diff(A, B, o));
      var added = 0, removed = 0, changed = 0, same = 0;
      var left = '', right = '';

      rs.forEach(function (r) {
        if (r.kind === 'eq') {
          same++;
          left += line(r.l, esc(A[r.l]), 'eq');
          right += line(r.rgt, esc(B[r.rgt]), 'eq');
          return;
        }
        var pair = r.l !== null && r.rgt !== null;
        if (pair) changed++; else if (r.l !== null) removed++; else added++;
        left += line(r.l, r.l === null ? '' : inline(A[r.l], pair ? B[r.rgt] : null), 'del');
        right += line(r.rgt, r.rgt === null ? '' : inline(B[r.rgt], pair ? A[r.l] : null), 'add');
      });

      out.innerHTML =
        '<div class="diff-pane"><div class="diff-title">Original — ' + A.length + ' lines</div><div class="diff-lines">' + left + '</div></div>' +
        '<div class="diff-pane"><div class="diff-title">Changed — ' + B.length + ' lines</div><div class="diff-lines">' + right + '</div></div>';

      var identical = added + removed + changed === 0;
      stats.innerHTML =
        '<div class="stat"><b style="color:var(--ok)">+' + added + '</b><span>added</span></div>' +
        '<div class="stat"><b style="color:var(--del)">-' + removed + '</b><span>removed</span></div>' +
        '<div class="stat"><b style="color:var(--warn)">' + changed + '</b><span>modified</span></div>' +
        '<div class="stat"><b>' + same + '</b><span>unchanged</span></div>' +
        (identical ? '<div class="stat"><b class="ok">✓</b><span>texts match</span></div>' : '');
    }

    ['input', 'change'].forEach(function (ev) {
      [a, b, $('#tc-case', root), $('#tc-ws', root), $('#tc-empty', root)].forEach(function (el) {
        el.addEventListener(ev, function () { clearTimeout(run._t); run._t = setTimeout(run, 180); });
      });
    });
    $('#tc-run', root).addEventListener('click', run);
    $('#tc-swap', root).addEventListener('click', function () {
      var t = a.value; a.value = b.value; b.value = t; run();
    });

    run();
  }
});
