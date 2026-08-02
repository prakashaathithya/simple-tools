Tools.register({
  id: 'sip',
  name: 'SIP Calculator',
  icon: '📈',
  desc: 'Project the future value of a monthly SIP, with an optional annual step-up.',
  tags: ['sip', 'investment', 'mutual fund', 'systematic', 'compounding', 'finance', 'wealth', 'returns'],

  html: [
    '<div class="cols">',
      '<div>',
        '<label class="field" for="sip-amount">Monthly investment</label>',
        '<input id="sip-amount" type="number" min="0" step="any" placeholder="10000">',
      '</div>',
      '<div>',
        '<label class="field" for="sip-period">Period</label>',
        '<div class="row" style="margin:0;flex-wrap:nowrap">',
          '<input id="sip-period" type="number" min="0" step="any" placeholder="15">',
          '<select id="sip-period-unit" style="width:auto"><option value="12">years</option><option value="1">months</option></select>',
        '</div>',
      '</div>',
    '</div>',

    '<div class="cols" style="margin-top:14px">',
      '<div>',
        '<label class="field" for="sip-return">Expected return (% per year)</label>',
        '<input id="sip-return" type="number" min="0" step="any" placeholder="12">',
      '</div>',
      '<div>',
        '<label class="field" for="sip-stepup">Annual step-up (% per year, optional)</label>',
        '<input id="sip-stepup" type="number" min="0" step="any" placeholder="0">',
      '</div>',
    '</div>',

    '<div class="row" style="margin-top:16px">',
      '<label class="field" for="sip-currency" style="margin:0">Currency</label>',
      '<select id="sip-currency" style="width:auto">',
        '<option value="en-IN|₹" selected>₹ Indian Rupee</option>',
        '<option value="en-US|$">$ US Dollar</option>',
        '<option value="en-GB|£">£ Pound</option>',
        '<option value="de-DE|€">€ Euro</option>',
        '<option value="en-US|">No symbol</option>',
      '</select>',
      '<span class="spacer"></span>',
      '<button class="btn" id="sip-copy">Copy summary</button>',
      '<button class="btn" data-clear="#sip-amount,#sip-period,#sip-return,#sip-stepup">Clear</button>',
    '</div>',

    '<div class="stats" id="sip-stats"></div>',
    '<div id="sip-msg"></div>',

    '<div id="sip-sched-wrap" hidden>',
      '<div class="row" style="margin-top:20px">',
        '<h3 style="font-size:14px;margin:0">Growth schedule</h3>',
        '<span class="spacer"></span>',
        '<label class="check"><input type="checkbox" id="sip-monthly"> Show every month</label>',
      '</div>',
      '<div class="out" style="padding:0;overflow-x:auto"><table class="table" id="sip-sched"></table></div>',
    '</div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, $$ = Tools.$$;
    var amount = $('#sip-amount', root), period = $('#sip-period', root),
        unit = $('#sip-period-unit', root), ret = $('#sip-return', root),
        stepup = $('#sip-stepup', root), currency = $('#sip-currency', root),
        stats = $('#sip-stats', root), msg = $('#sip-msg', root),
        schedWrap = $('#sip-sched-wrap', root), sched = $('#sip-sched', root),
        monthly = $('#sip-monthly', root);

    var summary = '';

    function fmt(n) {
      var parts = currency.value.split('|');
      return parts[1] + new Intl.NumberFormat(parts[0], {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(n);
    }

    /* Contribution lands at the start of each month, so it earns that month's
       return too (annuity-due). A step-up raises the contribution once a year. */
    function project(c0, r, n, step) {
      var bal = 0, contrib = c0, invested = 0, rows = [];
      for (var m = 1; m <= n; m++) {
        if (m > 1 && (m - 1) % 12 === 0) contrib *= (1 + step);
        invested += contrib;
        bal = (bal + contrib) * (1 + r);
        rows.push({ m: m, invested: invested, value: bal, contrib: contrib });
      }
      return { balance: bal, invested: invested, rows: rows };
    }

    function run() {
      var c = parseFloat(amount.value);
      var n = parseFloat(period.value) * parseFloat(unit.value);

      stats.innerHTML = '';
      msg.innerHTML = '';
      schedWrap.hidden = true;
      summary = '';

      if (!(c > 0) || !(n > 0)) {
        msg.innerHTML = '<p class="note">Enter a monthly investment and period to begin.</p>';
        return;
      }
      n = Math.round(n);

      var annual = parseFloat(ret.value);
      if (!(annual >= 0)) { msg.innerHTML = '<p class="note">Enter the expected annual return.</p>'; return; }
      var step = parseFloat(stepup.value) || 0;
      if (step < 0) step = 0;

      var r = annual / 12 / 100;
      var res = project(c, r, n, step / 100);
      var gains = res.balance - res.invested;

      var pairs = [
        [fmt(res.balance), 'future value'],
        [fmt(res.invested), 'total invested'],
        [fmt(gains), 'wealth gained'],
        [(res.invested ? (gains / res.invested * 100) : 0).toFixed(1) + ' %', 'gain on investment'],
        [n + ' mo', Math.floor(n / 12) + 'y ' + (n % 12) + 'm']
      ];
      stats.innerHTML = pairs.map(function (x) {
        return '<div class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>';
      }).join('');

      summary = [
        'Monthly investment: ' + fmt(c),
        'Step-up:            ' + step + ' % per year',
        'Period:             ' + n + ' months',
        'Expected return:    ' + annual + ' % per year',
        'Total invested:     ' + fmt(res.invested),
        'Wealth gained:      ' + fmt(gains),
        'Future value:       ' + fmt(res.balance)
      ].join('\n');

      renderSchedule(res.rows, n);
    }

    function renderSchedule(rows, n) {
      if (n > 1200) return;                      // 100 years is past useful
      var out = [];
      if (monthly.checked) {
        rows.forEach(function (row) {
          out.push([row.m, fmt(row.invested), fmt(row.value), fmt(row.value - row.invested)]);
        });
      } else {
        var year = 0;
        rows.forEach(function (row) {
          if (row.m % 12 === 0 || row.m === n) {
            year++;
            out.push(['Year ' + year, fmt(row.invested), fmt(row.value), fmt(row.value - row.invested)]);
          }
        });
      }

      sched.innerHTML =
        '<thead><tr><th>' + (monthly.checked ? 'Month' : 'Period') +
        '</th><th>Invested</th><th>Value</th><th>Gain</th></tr></thead><tbody>' +
        out.map(function (row) {
          return '<tr>' + row.map(function (c, i) {
            return '<td' + (i ? ' class="num"' : '') + '>' + c + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody>';

      schedWrap.hidden = false;
    }

    $('#sip-copy', root).addEventListener('click', function () { Tools.copy(summary); });

    [amount, period, unit, ret, stepup, currency, monthly].forEach(function (el) {
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    run();
  }
});
