Tools.register({
  id: 'hash',
  name: 'Hash Generator',
  icon: '#️⃣',
  desc: 'MD5, SHA-1, SHA-256, SHA-384 and SHA-512 checksums of any text.',
  tags: ['hash', 'md5', 'sha', 'sha256', 'checksum', 'digest'],

  html: [
    '<label class="field" for="hs-in">Text to hash</label>',
    '<textarea id="hs-in" spellcheck="false" style="min-height:150px" placeholder="Type anything…"></textarea>',
    '<div class="row" style="margin-top:14px">',
    '  <label class="check"><input type="checkbox" id="hs-upper"> Uppercase</label>',
    '  <span class="spacer"></span>',
    '  <button class="btn" data-clear="#hs-in">Clear</button>',
    '</div>',
    '<div id="hs-out"></div>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$, esc = Tools.esc;
    var inp = $('#hs-in', root), out = $('#hs-out', root);

    /* ---- tiny pure-JS digests so the page also works from file:// ---- */
    function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
    function rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
    function frac(x) { return x - Math.floor(x); }
    function hex32(x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }
    function hex32le(x) {
      return [0, 8, 16, 24].map(function (s) {
        return ('0' + ((x >>> s) & 255).toString(16)).slice(-2);
      }).join('');
    }
    function pad(bytes, littleEndian) {
      var l = bytes.length, total = (((l + 8) >> 6) + 1) << 6;
      var m = new Uint8Array(total);
      m.set(bytes); m[l] = 0x80;
      var dv = new DataView(m.buffer), bits = l * 8;
      if (littleEndian) {
        dv.setUint32(total - 8, bits >>> 0, true);
        dv.setUint32(total - 4, Math.floor(bits / 4294967296), true);
      } else {
        dv.setUint32(total - 8, Math.floor(bits / 4294967296));
        dv.setUint32(total - 4, bits >>> 0);
      }
      return dv;
    }

    var SHA256_K = [], SHA256_H = [];
    (function () {
      var primes = [], n = 2;
      while (primes.length < 64) {
        var isP = true;
        for (var d = 2; d * d <= n; d++) if (n % d === 0) { isP = false; break; }
        if (isP) primes.push(n);
        n++;
      }
      SHA256_K = primes.map(function (p) { return Math.floor(frac(Math.cbrt(p)) * 4294967296) >>> 0; });
      SHA256_H = primes.slice(0, 8).map(function (p) { return Math.floor(frac(Math.sqrt(p)) * 4294967296) >>> 0; });
    })();

    function sha256(bytes) {
      var dv = pad(bytes, false), h = SHA256_H.slice(), w = new Uint32Array(64), i, j;
      for (i = 0; i < dv.byteLength; i += 64) {
        for (j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
        for (j = 16; j < 64; j++) {
          var x = w[j - 15], y = w[j - 2];
          var s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
          var s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
        }
        var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
        for (j = 0; j < 64; j++) {
          var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
          var t1 = (hh + S1 + ((e & f) ^ (~e & g)) + SHA256_K[j] + w[j]) >>> 0;
          var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
          var t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
          hh = g; g = f; f = e; e = (d + t1) >>> 0;
          d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        var upd = [a, b, c, d, e, f, g, hh];
        for (j = 0; j < 8; j++) h[j] = (h[j] + upd[j]) >>> 0;
      }
      return h.map(hex32).join('');
    }

    function sha1(bytes) {
      var dv = pad(bytes, false);
      var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
      var w = new Uint32Array(80), i, j;
      for (i = 0; i < dv.byteLength; i += 64) {
        for (j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
        for (j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
        var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
        for (j = 0; j < 80; j++) {
          var f, k;
          if (j < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
          else if (j < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
          else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
          else { f = b ^ c ^ d; k = 0xCA62C1D6; }
          var t = (rotl(a, 5) + f + e + k + w[j]) >>> 0;
          e = d; d = c; c = rotl(b, 30); b = a; a = t;
        }
        var upd = [a, b, c, d, e];
        for (j = 0; j < 5; j++) h[j] = (h[j] + upd[j]) >>> 0;
      }
      return h.map(hex32).join('');
    }

    var MD5_S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
                 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
                 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
                 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    var MD5_K = (function () {
      var k = [];
      for (var i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
      return k;
    })();

    function md5(bytes) {
      var dv = pad(bytes, true);
      var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
      var M = new Uint32Array(16), off, i;
      for (off = 0; off < dv.byteLength; off += 64) {
        for (i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
        var A = a0, B = b0, C = c0, D = d0;
        for (i = 0; i < 64; i++) {
          var F, g;
          if (i < 16) { F = (B & C) | (~B & D); g = i; }
          else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
          else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
          else { F = C ^ (B | ~D); g = (7 * i) % 16; }
          F = (F + A + MD5_K[i] + M[g]) >>> 0;
          A = D; D = C; C = B;
          B = (B + rotl(F, MD5_S[i])) >>> 0;
        }
        a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0;
        c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
      }
      return [a0, b0, c0, d0].map(hex32le).join('');
    }

    function subtle(algo, bytes) {
      if (!(window.crypto && crypto.subtle)) return Promise.resolve(null);
      return crypto.subtle.digest(algo, bytes).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      }).catch(function () { return null; });
    }

    function show(rows) {
      var upper = $('#hs-upper', root).checked;
      out.innerHTML = rows.map(function (r) {
        var v = r[1] == null ? '<span class="note">unavailable in this browser context</span>'
                             : esc(upper ? r[1].toUpperCase() : r[1]);
        return '<div style="margin-top:16px">' +
          '<label class="field">' + r[0] + ' <span style="text-transform:none">· ' +
            (r[1] ? r[1].length * 4 + ' bit' : '') + '</span></label>' +
          '<div class="row" style="margin:0">' +
            '<div class="out" style="flex:1">' + v + '</div>' +
            '<button class="btn" data-h="' + esc(r[1] || '') + '">Copy</button>' +
          '</div></div>';
      }).join('');
      Tools.$$('[data-h]', out).forEach(function (b) {
        b.addEventListener('click', function () {
          var t = b.dataset.h;
          Tools.copy($('#hs-upper', root).checked ? t.toUpperCase() : t);
        });
      });
    }

    function run() {
      var bytes = new TextEncoder().encode(inp.value);
      var rows = [['MD5', md5(bytes)], ['SHA-1', sha1(bytes)], ['SHA-256', sha256(bytes)]];
      show(rows.concat([['SHA-384', null], ['SHA-512', null]]));
      Promise.all([subtle('SHA-384', bytes), subtle('SHA-512', bytes)]).then(function (extra) {
        show(rows.concat([['SHA-384', extra[0]], ['SHA-512', extra[1]]]));
      });
    }

    inp.addEventListener('input', run);
    $('#hs-upper', root).addEventListener('change', run);
    run();
  }
});
