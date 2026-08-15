/* Tamil Nadu (TANGEDCO) LT-IA domestic electricity bill on the current tariff.

   The tariff is telescopic *and* grouped: the rate charged for a low slab
   depends on the total consumption for the whole billing period, so the
   schedule is a list of groups (picked by total units) and each group is its
   own slab ladder. Slabs are [cumulative unit ceiling, rate per unit]. */
Tools.register({
  id: 'eb-bill',
  name: 'TN EB Bill Calculator',
  icon: '⚡',
  desc: 'Tamil Nadu electricity bill on the current TANGEDCO domestic tariff, slab by slab.',
  tags: ['eb', 'electricity', 'bill', 'tneb', 'tangedco', 'tamilnadu', 'tariff', 'current', 'unit', 'power'],

  html: [
    '<div class="cols">',
      '<div>',
        '<label class="field" for="eb-units">Units consumed</label>',
        '<div class="row" style="margin:0;flex-wrap:nowrap">',
          '<input id="eb-units" type="number" min="0" step="any" placeholder="450">',
          '<select id="eb-period" style="width:auto">',
            '<option value="1" selected>per 2 months</option>',
            '<option value="2">per month</option>',
          '</select>',
        '</div>',
      '</div>',
      '<div>',
        '<label class="field">Free units</label>',
        '<label class="check" style="height:38px">',
          '<input type="checkbox" id="eb-subsidy" checked> 200-unit subsidy on bills of 500 units or less',
        '</label>',
      '</div>',
    '</div>',

    '<div class="row" style="margin-top:16px">',
      '<span class="spacer"></span>',
      '<button class="btn" id="eb-copy">Copy summary</button>',
      '<button class="btn" data-clear="#eb-units">Clear</button>',
    '</div>',

    '<div class="stats" id="eb-stats"></div>',
    '<div id="eb-msg"></div>',
    '<div class="out" id="eb-table-wrap" style="padding:0;overflow-x:auto" hidden>',
      '<table class="table" id="eb-table"></table>',
    '</div>',
    '<p class="note" id="eb-foot"></p>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$;
    var INF = Infinity;

    var TARIFF = {
      label: 'LT-IA domestic, current TNERC slab rates',
      maxFree: 200,
      groups: [
        { upto: 500, slabs: [[100, 0], [200, 2.35], [400, 4.70], [500, 6.30]] },
        { upto: INF, slabs: [[100, 0], [400, 4.70], [500, 6.30], [600, 8.40], [800, 9.45], [1000, 10.50], [INF, 11.55]] }
      ]
    };

    var units = $('#eb-units', root), period = $('#eb-period', root),
        subsidy = $('#eb-subsidy', root), stats = $('#eb-stats', root),
        msg = $('#eb-msg', root), wrap = $('#eb-table-wrap', root),
        table = $('#eb-table', root), foot = $('#eb-foot', root);

    var summary = '';

    function rupees(n) {
      return '₹' + new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(n);
    }

    /* 100 units are always free; the state's 200-unit subsidy applies only
       while the whole two-month bill stays at 500 units. */
    function freeOf(n) {
      return (subsidy.checked && n <= 500) ? TARIFF.maxFree : 100;
    }

    /* Split `n` units across the slab ladder of whichever group covers `n`. */
    function bill(n, freeTo) {
      var group = TARIFF.groups.filter(function (g) { return n <= g.upto; })[0];
      var rows = [], total = 0, prev = 0;

      group.slabs.forEach(function (slab) {
        var ceiling = slab[0], rate = slab[1];
        var end = Math.min(n, ceiling);
        var qty = end - prev;
        if (qty > 0) {
          var free = prev < freeTo;
          var charged = free ? 0 : qty * rate;
          rows.push({
            label: (prev + 1) + '–' + end,
            qty: qty,
            rate: free ? 0 : rate,
            amount: charged
          });
          total += charged;
        }
        prev = end;
      });

      return { rows: rows, total: total };
    }

    function run() {
      var n = parseFloat(units.value) * parseFloat(period.value);

      stats.innerHTML = '';
      msg.innerHTML = '';
      wrap.hidden = true;
      foot.textContent = '';
      summary = '';

      if (units.value === '' || !(n >= 0)) {
        msg.innerHTML = '<p class="note">Enter the units on your bill to see the charge.</p>';
        return;
      }
      n = Math.round(n);

      var free = freeOf(n);
      var result = bill(n, free);
      var billed = Math.max(0, n - free);

      var pairs = [
        [rupees(result.total), 'bill for 2 months'],
        [n + ' units', 'consumed'],
        [free + ' units', 'free'],
        [billed + ' units', 'charged'],
        [n ? rupees(result.total / n) : '—', 'average / unit']
      ];
      stats.innerHTML = pairs.map(function (x) {
        return '<div class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>';
      }).join('');

      table.innerHTML =
        '<thead><tr><th>Slab</th><th>Units</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' +
        result.rows.map(function (r) {
          return '<tr><td>' + r.label + '</td><td class="num">' + r.qty + '</td>' +
            '<td class="num">' + (r.rate ? r.rate.toFixed(2) : 'free') + '</td>' +
            '<td class="num">' + rupees(r.amount) + '</td></tr>';
        }).join('') +
        '<tr><td><b>Total</b></td><td class="num">' + n + '</td><td class="num"></td>' +
        '<td class="num"><b>' + rupees(result.total) + '</b></td></tr>' +
        '</tbody>';
      wrap.hidden = false;

      foot.textContent = TARIFF.label + '. Billed every two months and telescopic — each rate applies ' +
        'only to the units inside its slab, and crossing 500 units moves the whole bill onto the higher ' +
        'ladder. Fixed and demand charges are nil for domestic connections; meter rent, arrears and any ' +
        'local levy on your bill are not included. Check the rates against your latest bill before ' +
        'relying on the figure.';

      summary = [
        'TN EB bill — ' + n + ' units per 2 months',
        'Free units:  ' + free,
        'Charged:     ' + billed + ' units',
        'Amount:      ' + rupees(result.total)
      ].join('\n');
    }

    $('#eb-copy', root).addEventListener('click', function () { Tools.copy(summary); });

    [units, period, subsidy].forEach(function (el) {
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    run();
  }
});
