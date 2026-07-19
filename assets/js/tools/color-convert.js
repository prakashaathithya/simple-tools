Tools.register({
  id: 'color-convert',
  name: 'Color Converter',
  icon: '🎨',
  desc: 'HEX ⇄ RGB ⇄ HSL, with a live preview and shade ramp.',
  tags: ['color', 'hex', 'rgb', 'hsl', 'picker', 'css'],

  html: [
    '<div class="row">',
    '  <input type="color" id="cv-pick" value="#4f9cf9" style="width:56px;height:40px;padding:2px;background:none;border:1px solid var(--border);border-radius:9px">',
    '  <input type="text" id="cv-in" placeholder="#4f9cf9   ·   rgb(79,156,249)   ·   hsl(211,94%,64%)" style="flex:1;min-width:220px">',
    '</div>',
    '<p class="error" id="cv-err"></p>',
    '<div class="cols">',
    '  <div><div class="swatch" id="cv-swatch"></div>',
    '    <div class="kv" style="margin-top:14px" id="cv-values"></div></div>',
    '  <div><label class="field">Shades</label><div id="cv-ramp"></div></div>',
    '</div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var input = $('#cv-in', root), pick = $('#cv-pick', root);
    var err = $('#cv-err', root), swatch = $('#cv-swatch', root);
    var values = $('#cv-values', root), ramp = $('#cv-ramp', root);

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    function parse(str) {
      var s = str.trim().toLowerCase();
      var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
      if (m) {
        var h = m[1];
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      }
      m = /^rgba?\(([^)]+)\)$/.exec(s);
      if (m) {
        var p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        if (p.length >= 3 && p.slice(0, 3).every(function (x) { return !isNaN(x); })) {
          return p.slice(0, 3).map(function (x) { return clamp(Math.round(x), 0, 255); });
        }
      }
      m = /^hsla?\(([^)]+)\)$/.exec(s);
      if (m) {
        var q = m[1].split(/[,\s/]+/).filter(Boolean).map(function (x) { return parseFloat(x); });
        if (q.length >= 3) return hslToRgb(q[0], q[1], q[2]);
      }
      return null;
    }

    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h = 0, s = 0, l = (max + min) / 2, d = max - min;
      if (d) {
        s = l > .5 ? d / (2 - max - min) : d / (max + min);
        h = max === r ? ((g - b) / d + (g < b ? 6 : 0))
          : max === g ? (b - r) / d + 2
          : (r - g) / d + 4;
        h *= 60;
      }
      return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    }

    function hslToRgb(h, s, l) {
      h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
      var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
      var t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
            : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
      return t.map(function (v) { return Math.round((v + m) * 255); });
    }

    function hex(rgb) {
      return '#' + rgb.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
    }

    function luminance(rgb) {
      var a = rgb.map(function (v) {
        v /= 255;
        return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
      });
      return .2126 * a[0] + .7152 * a[1] + .0722 * a[2];
    }

    function render(rgb) {
      var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      var h = hex(rgb);
      swatch.style.background = h;
      pick.value = h;

      var lum = luminance(rgb);
      var contrastWhite = (1.05 / (lum + .05)).toFixed(2);
      var contrastBlack = ((lum + .05) / .05).toFixed(2);

      var rows = [
        ['HEX', h],
        ['RGB', 'rgb(' + rgb.join(', ') + ')'],
        ['HSL', 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)'],
        ['CSS var', '--color: ' + h + ';'],
        ['Contrast', 'vs white ' + contrastWhite + ':1 · vs black ' + contrastBlack + ':1']
      ];
      values.innerHTML = rows.map(function (r) {
        return '<span>' + r[0] + '</span><div style="cursor:pointer" data-v="' + esc(r[1]) + '" title="Click to copy">' + esc(r[1]) + '</div>';
      }).join('');
      Tools.$$('[data-v]', values).forEach(function (el) {
        el.addEventListener('click', function () { Tools.copy(el.dataset.v); });
      });

      ramp.innerHTML = [10, 20, 30, 40, 50, 60, 70, 80, 90].map(function (l) {
        var c = hex(hslToRgb(hsl[0], hsl[1], l));
        return '<div data-v="' + c + '" title="Click to copy" style="cursor:pointer;display:flex;align-items:center;gap:10px;padding:5px 0">' +
          '<span style="width:38px;height:24px;border-radius:6px;border:1px solid var(--border);background:' + c + '"></span>' +
          '<code style="font-size:13px">' + c + '</code>' +
          '<span style="color:var(--muted);font-size:12px">L ' + l + '%</span></div>';
      }).join('');
      Tools.$$('[data-v]', ramp).forEach(function (el) {
        el.addEventListener('click', function () { Tools.copy(el.dataset.v); });
      });
    }

    function run() {
      var rgb = parse(input.value);
      if (!rgb) { err.textContent = input.value.trim() ? 'Unrecognised color format.' : ''; return; }
      err.textContent = '';
      render(rgb);
    }

    input.addEventListener('input', run);
    pick.addEventListener('input', function () { input.value = pick.value; run(); });

    input.value = '#4f9cf9';
    run();
  }
});
