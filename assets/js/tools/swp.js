Tools.register({
  id: 'swp',
  name: 'SWP Calculator',
  icon: '📉',
  desc: 'See how long a corpus lasts under fixed monthly withdrawals — and what is left at the end.',
  tags: ['swp', 'withdrawal', 'systematic', 'retirement', 'pension', 'corpus', 'income', 'finance'],

  html: [
    '<div class="cols">',
      '<div>',
        '<label class="field" for="swp-corpus">Total investment (corpus)</label>',
        '<input id="swp-corpus" type="number" min="0" step="any" placeholder="5000000">',
      '</div>',
      '<div>',
        '<label class="field" for="swp-withdraw">Monthly withdrawal</label>',
        '<input id="swp-withdraw" type="number" min="0" step="any" placeholder="30000">',
      '</div>',
    '</div>',

    '<div class="cols" style="margin-top:14px">',
      '<div>',
        '<label class="field" for="swp-return">Expected return (% per year)</label>',
        '<input id="swp-return" type="number" min="0" step="any" placeholder="8">',
      '</div>',
      '<div>',
        '<label class="field" for="swp-period">Period</label>',
        '<div class="row" style="margin:0;flex-wrap:nowrap">',
          '<input id="swp-period" type="number" min="0" step="any" placeholder="20">',
          '<select id="swp-period-unit" style="width:auto"><option value="12">years</option><option value="1">months</option></select>',
        '</div>',
      '</div>',
    '</div>',

    '<div class="row" style="margin-top:16px">',
      '<label class="field" for="swp-currency" style="margin:0">Currency</label>',
      '<select id="swp-currency" style="width:auto">',
        '<option value="en-IN|₹" selected>₹ Indian Rupee</option>',
        '<option value="en-US|$">$ US Dollar</option>',
        '<option value="en-GB|£">£ Pound</option>',
        '<option value="de-DE|€">€ Euro</option>',
        '<option value="en-US|">No symbol</option>',
      '</select>',
      '<span class="spacer"></span>',
      '<button class="btn" id="swp-copy">Copy summary</button>',
      '<button class="btn" data-clear="#swp-corpus,#swp-withdraw,#swp-return,#swp-period">Clear</button>',
    '</div>',

    '<div class="stats" id="swp-stats"></div>',
    '<div id="swp-msg"></div>',

    '<div id="swp-sched-wrap" hidden>',
      '<div class="row" style="margin-top:20px">',
        '<h3 style="font-size:14px;margin:0">Withdrawal schedule</h3>',
        '<span class="spacer"></span>',
        '<label class="check"><input type="checkbox" id="swp-monthly"> Show every month</label>',
      '</div>',
      '<div class="out" style="padding:0;overflow-x:auto"><table class="table" id="swp-sched"></table></div>',
    '</div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, $$ = Tools.$$;
    var corpus = $('#swp-corpus', root), withdraw = $('#swp-withdraw', root),
        ret = $('#swp-return', root), period = $('#swp-period', root),
        unit = $('#swp-period-unit', root), currency = $('#swp-currency', root),
        stats = $('#swp-stats', root), msg = $('#swp-msg', root),
        schedWrap = $('#swp-sched-wrap', root), sched = $('#swp-sched', root),
        monthly = $('#swp-monthly', root);

    var summary = '';

    function fmt(n) {
      var parts = currency.value.split('|');
      return parts[1] + new Intl.NumberFormat(parts[0], {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(n);
    }

    /* Each month: take the withdrawal off the top, then the remainder earns
       the month's return. A withdrawal larger than the balance is capped, and
       the corpus is marked depleted at that month. */
    function simulate(c, w, r, n) {
      var bal = c, taken = 0, depletedAt = 0, rows = [];
      for (var m = 1; m <= n; m++) {
        var draw = Math.min(w, bal);
        bal = (bal - draw) * (1 + r);
        taken += draw;
        rows.push({ m: m, draw: draw, taken: taken, balance: bal });
        if (!depletedAt && draw < w - 1e-9) depletedAt = m;
        if (bal <= 1e-9 && draw < w - 1e-9) { bal = 0; break; }
      }
      return { balance: bal, taken: taken, depletedAt: depletedAt, rows: rows };
    }

    function run() {
      var c = parseFloat(corpus.value);
      var w = parseFloat(withdraw.value);
      var n = parseFloat(period.value) * parseFloat(unit.value);

      stats.innerHTML = '';
      msg.innerHTML = '';
      schedWrap.hidden = true;
      summary = '';

      if (!(c > 0) || !(w > 0) || !(n > 0)) {
        msg.innerHTML = '<p class="note">Enter a corpus, monthly withdrawal and period to begin.</p>';
        return;
      }
      n = Math.round(n);

      var annual = parseFloat(ret.value);
      if (!(annual >= 0)) { msg.innerHTML = '<p class="note">Enter the expected annual return.</p>'; return; }

      var r = annual / 12 / 100;
      var res = simulate(c, w, r, n);

      var pairs = [
        [fmt(res.balance), 'final balance'],
        [fmt(res.taken), 'total withdrawn'],
        [fmt(res.balance - (c - res.taken)), 'return earned'],
        [res.depletedAt
          ? Math.floor(res.depletedAt / 12) + 'y ' + (res.depletedAt % 12) + 'm'
          : Math.floor(n / 12) + 'y ' + (n % 12) + 'm',
         res.depletedAt ? 'lasted before running out' : 'full period']
      ];
      stats.innerHTML = pairs.map(function (x) {
        return '<div class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>';
      }).join('');

      if (res.depletedAt) {
        msg.innerHTML = '<p class="error">The corpus runs out in month ' + res.depletedAt +
          ' (' + Math.floor(res.depletedAt / 12) + 'y ' + (res.depletedAt % 12) + 'm). ' +
          'Lower the withdrawal below ' + fmt(c * r) + ' per month to draw the returns alone, or shorten the plan.</p>';
      } else if (res.balance > c) {
        msg.innerHTML = '<p class="note">Withdrawals stay under the returns, so the corpus keeps growing.</p>';
      }

      summary = [
        'Corpus:           ' + fmt(c),
        'Monthly withdraw: ' + fmt(w),
        'Expected return:  ' + annual + ' % per year',
        'Period:           ' + n + ' months',
        'Total withdrawn:  ' + fmt(res.taken),
        'Final balance:    ' + fmt(res.balance),
        (res.depletedAt ? 'Corpus depleted:  month ' + res.depletedAt : 'Corpus lasts the full period')
      ].join('\n');

      renderSchedule(res.rows, n);
    }

    function renderSchedule(rows, n) {
      if (rows.length > 1200) return;            // 100 years is past useful
      var out = [];
      var last = rows.length;
      if (monthly.checked) {
        rows.forEach(function (row) {
          out.push([row.m, fmt(row.draw), fmt(row.taken), fmt(row.balance)]);
        });
      } else {
        var year = 0;
        rows.forEach(function (row, i) {
          if (row.m % 12 === 0 || i === last - 1) {
            year++;
            out.push(['Year ' + year, fmt(row.draw), fmt(row.taken), fmt(row.balance)]);
          }
        });
      }

      sched.innerHTML =
        '<thead><tr><th>' + (monthly.checked ? 'Month' : 'Period') +
        '</th><th>Withdrawal</th><th>Total drawn</th><th>Balance</th></tr></thead><tbody>' +
        out.map(function (row) {
          return '<tr>' + row.map(function (c, i) {
            return '<td' + (i ? ' class="num"' : '') + '>' + c + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody>';

      schedWrap.hidden = false;
    }

    $('#swp-copy', root).addEventListener('click', function () { Tools.copy(summary); });

    [corpus, withdraw, ret, period, unit, currency, monthly].forEach(function (el) {
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    run();
  }
});
