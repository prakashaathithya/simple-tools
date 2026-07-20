Tools.register({
  id: 'emi',
  name: 'EMI Calculator',
  icon: '🏦',
  desc: 'Find the monthly EMI from an interest rate — or the interest rate from an EMI.',
  tags: ['emi', 'loan', 'interest', 'rate', 'finance', 'mortgage', 'amortization'],

  html: [
    '<div class="row">',
      '<label class="check"><input type="radio" name="emi-mode" value="emi" checked> Solve EMI (I know the rate)</label>',
      '<label class="check"><input type="radio" name="emi-mode" value="rate"> Solve interest rate (I know the EMI)</label>',
    '</div>',

    '<div class="cols">',
      '<div>',
        '<label class="field" for="emi-principal">Loan amount</label>',
        '<input id="emi-principal" type="number" min="0" step="any" placeholder="500000">',
      '</div>',
      '<div>',
        '<label class="field" for="emi-tenure">Tenure</label>',
        '<div class="row" style="margin:0;flex-wrap:nowrap">',
          '<input id="emi-tenure" type="number" min="0" step="any" placeholder="20">',
          '<select id="emi-tenure-unit" style="width:auto"><option value="12">years</option><option value="1">months</option></select>',
        '</div>',
      '</div>',
    '</div>',

    '<div class="cols" style="margin-top:14px">',
      '<div id="emi-rate-wrap">',
        '<label class="field" for="emi-rate">Interest rate (% per year)</label>',
        '<input id="emi-rate" type="number" min="0" step="any" placeholder="8.5">',
      '</div>',
      '<div id="emi-amount-wrap" hidden>',
        '<label class="field" for="emi-amount">EMI (monthly payment)</label>',
        '<input id="emi-amount" type="number" min="0" step="any" placeholder="4339">',
      '</div>',
    '</div>',

    '<div class="row" style="margin-top:16px">',
      '<label class="field" for="emi-currency" style="margin:0">Currency</label>',
      '<select id="emi-currency" style="width:auto">',
        '<option value="en-IN|₹" selected>₹ Indian Rupee</option>',
        '<option value="en-US|$">$ US Dollar</option>',
        '<option value="en-GB|£">£ Pound</option>',
        '<option value="de-DE|€">€ Euro</option>',
        '<option value="en-US|">No symbol</option>',
      '</select>',
      '<span class="spacer"></span>',
      '<button class="btn" id="emi-copy">Copy summary</button>',
      '<button class="btn" data-clear="#emi-principal,#emi-tenure,#emi-rate,#emi-amount">Clear</button>',
    '</div>',

    '<div class="stats" id="emi-stats"></div>',
    '<div id="emi-msg"></div>',

    '<div id="emi-sched-wrap" hidden>',
      '<div class="row" style="margin-top:20px">',
        '<h3 style="font-size:14px;margin:0">Amortization schedule</h3>',
        '<span class="spacer"></span>',
        '<label class="check"><input type="checkbox" id="emi-monthly"> Show every month</label>',
      '</div>',
      '<div class="out" style="padding:0;overflow-x:auto"><table class="table" id="emi-sched"></table></div>',
    '</div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, $$ = Tools.$$;
    var principal = $('#emi-principal', root), tenure = $('#emi-tenure', root),
        unit = $('#emi-tenure-unit', root), rate = $('#emi-rate', root),
        amount = $('#emi-amount', root), currency = $('#emi-currency', root),
        stats = $('#emi-stats', root), msg = $('#emi-msg', root),
        schedWrap = $('#emi-sched-wrap', root), sched = $('#emi-sched', root),
        monthly = $('#emi-monthly', root);

    var summary = '';

    function fmt(n) {
      var parts = currency.value.split('|');
      return parts[1] + new Intl.NumberFormat(parts[0], {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(n);
    }

    /* EMI = P·r·(1+r)^n / ((1+r)^n − 1), r = monthly rate. r = 0 ⇒ P/n. */
    function emiOf(p, r, n) {
      if (r === 0) return p / n;
      var f = Math.pow(1 + r, n);
      return p * r * f / (f - 1);
    }

    /* Invert the same formula for r by bisection — it is monotonic in r,
       so 100 halvings of [0, 1] per month land well inside float precision. */
    function rateOf(p, e, n) {
      if (e * n < p) return null;              // payments never cover the principal
      if (Math.abs(e * n - p) < 1e-9) return 0; // exactly interest-free
      var lo = 0, hi = 1, mid;
      for (var i = 0; i < 200; i++) {
        mid = (lo + hi) / 2;
        if (emiOf(p, mid, n) > e) hi = mid; else lo = mid;
      }
      return (lo + hi) / 2;
    }

    function mode() {
      return $$('input[name=emi-mode]', root).filter(function (r) { return r.checked; })[0].value;
    }

    function run() {
      var solveRate = mode() === 'rate';
      $('#emi-rate-wrap', root).hidden = solveRate;
      $('#emi-amount-wrap', root).hidden = !solveRate;

      var p = parseFloat(principal.value);
      var n = parseFloat(tenure.value) * parseFloat(unit.value);

      stats.innerHTML = '';
      msg.innerHTML = '';
      schedWrap.hidden = true;
      summary = '';

      if (!(p > 0) || !(n > 0)) {
        msg.innerHTML = '<p class="note">Enter a loan amount and tenure to begin.</p>';
        return;
      }
      n = Math.round(n);

      var r, e;
      if (solveRate) {
        e = parseFloat(amount.value);
        if (!(e > 0)) { msg.innerHTML = '<p class="note">Enter the EMI you pay each month.</p>'; return; }
        r = rateOf(p, e, n);
        if (r === null) {
          msg.innerHTML = '<p class="error">' + n + ' payments of ' + fmt(e) + ' total ' + fmt(e * n) +
            ', which is less than the loan amount. Raise the EMI above ' + fmt(p / n) + ' or extend the tenure.</p>';
          return;
        }
      } else {
        var annual = parseFloat(rate.value);
        if (!(annual >= 0)) { msg.innerHTML = '<p class="note">Enter the annual interest rate.</p>'; return; }
        r = annual / 12 / 100;
        e = emiOf(p, r, n);
      }

      var total = e * n, interest = total - p, annualPct = r * 12 * 100;

      var pairs = [
        [solveRate ? annualPct.toFixed(3) + ' %' : fmt(e), solveRate ? 'interest rate / year' : 'monthly EMI'],
        [fmt(interest), 'total interest'],
        [fmt(total), 'total payable'],
        [n + ' mo', Math.floor(n / 12) + 'y ' + (n % 12) + 'm'],
        [(interest / p * 100).toFixed(1) + ' %', 'interest of principal']
      ];
      stats.innerHTML = pairs.map(function (x) {
        return '<div class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>';
      }).join('');

      summary = [
        'Loan amount:    ' + fmt(p),
        'Tenure:         ' + n + ' months',
        'Interest rate:  ' + annualPct.toFixed(3) + ' % per year',
        'EMI:            ' + fmt(e),
        'Total interest: ' + fmt(interest),
        'Total payable:  ' + fmt(total)
      ].join('\n');

      renderSchedule(p, r, e, n);
    }

    function renderSchedule(p, r, e, n) {
      if (n > 1200) return;                    // 100 years is past useful
      var rows = [], bal = p, year = 0, yi = 0, yp = 0;

      for (var m = 1; m <= n; m++) {
        var int = bal * r;
        var prin = Math.min(e - int, bal);
        bal = Math.max(0, bal - prin);
        yi += int; yp += prin;

        if (monthly.checked) {
          rows.push([m, fmt(int), fmt(prin), fmt(bal)]);
        } else if (m % 12 === 0 || m === n) {
          year++;
          rows.push(['Year ' + year, fmt(yi), fmt(yp), fmt(bal)]);
          yi = 0; yp = 0;
        }
      }

      sched.innerHTML =
        '<thead><tr><th>' + (monthly.checked ? 'Month' : 'Period') +
        '</th><th>Interest</th><th>Principal</th><th>Balance</th></tr></thead><tbody>' +
        rows.map(function (row) {
          return '<tr>' + row.map(function (c, i) {
            return '<td' + (i ? ' class="num"' : '') + '>' + c + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody>';

      schedWrap.hidden = false;
    }

    $('#emi-copy', root).addEventListener('click', function () { Tools.copy(summary); });

    [principal, tenure, unit, rate, amount, currency, monthly].forEach(function (el) {
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });
    $$('input[name=emi-mode]', root).forEach(function (el) {
      el.addEventListener('change', run);
    });

    run();
  }
});
