Tools.register({
  id: 'uuid',
  name: 'UUID / Password Generator',
  icon: '🆔',
  desc: 'Cryptographically random UUID v4s, random passwords and hex tokens.',
  tags: ['uuid', 'guid', 'password', 'random', 'token', 'generate'],

  html: [
    '<div class="row">',
    '  <label class="check">Type&nbsp;<select id="uu-type" style="width:auto">',
    '    <option value="uuid">UUID v4</option>',
    '    <option value="pass">Password</option>',
    '    <option value="hex">Hex token</option>',
    '  </select></label>',
    '  <label class="check">Count&nbsp;<input type="number" id="uu-count" value="5" min="1" max="500" style="width:80px"></label>',
    '  <label class="check">Length&nbsp;<input type="number" id="uu-len" value="16" min="4" max="128" style="width:80px"></label>',
    '  <label class="check"><input type="checkbox" id="uu-upper"> Uppercase</label>',
    '  <span class="spacer"></span>',
    '  <button class="btn primary" id="uu-gen">Generate</button>',
    '  <button class="btn" data-copy="#uu-out">Copy all</button>',
    '</div>',
    '<p class="note" id="uu-hint"></p>',
    '<textarea id="uu-out" spellcheck="false" readonly style="min-height:260px"></textarea>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$;
    var out = $('#uu-out', root), type = $('#uu-type', root), hint = $('#uu-hint', root);

    function rand(n) {
      var a = new Uint8Array(n);
      (window.crypto || window.msCrypto).getRandomValues(a);
      return a;
    }

    function uuid() {
      var b = rand(16);
      b[6] = (b[6] & 0x0f) | 0x40;   // version 4
      b[8] = (b[8] & 0x3f) | 0x80;   // variant 10xx
      var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join('-');
    }

    function password(len) {
      var set = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_=+?';
      var bytes = rand(len), s = '';
      for (var i = 0; i < len; i++) s += set[bytes[i] % set.length];
      return s;
    }

    function hexToken(len) {
      return Array.prototype.map.call(rand(Math.ceil(len / 2)), function (x) {
        return ('0' + x.toString(16)).slice(-2);
      }).join('').slice(0, len);
    }

    function run() {
      var t = type.value;
      var n = Math.min(500, Math.max(1, Number($('#uu-count', root).value) || 1));
      var len = Math.min(128, Math.max(4, Number($('#uu-len', root).value) || 16));
      var lines = [];
      for (var i = 0; i < n; i++) {
        lines.push(t === 'uuid' ? uuid() : t === 'pass' ? password(len) : hexToken(len));
      }
      var text = lines.join('\n');
      out.value = $('#uu-upper', root).checked ? text.toUpperCase() : text;
      $('#uu-len', root).parentNode.style.opacity = t === 'uuid' ? .35 : 1;
      hint.textContent = t === 'uuid'
        ? 'RFC 4122 version 4, generated with crypto.getRandomValues().'
        : 'Length applies per item. Ambiguous characters (0/O, 1/l) are excluded from passwords.';
    }

    $('#uu-gen', root).addEventListener('click', run);
    ['change'].forEach(function (ev) {
      Tools.$$('select,input', root).forEach(function (el) { el.addEventListener(ev, run); });
    });
    run();
  }
});
