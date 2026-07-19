Tools.register({
  id: 'base64',
  name: 'Base64 Encode / Decode',
  icon: '🔡',
  desc: 'Convert text or files to Base64 and back. UTF-8 safe, URL-safe option.',
  tags: ['base64', 'encode', 'decode', 'btoa', 'atob'],

  html: [
    '<div class="cols">',
    '  <div><label class="field" for="b64-in">Input</label><textarea id="b64-in" spellcheck="false" placeholder="Plain text, or Base64 to decode…"></textarea></div>',
    '  <div><label class="field" for="b64-out">Output</label><textarea id="b64-out" spellcheck="false" readonly placeholder="Result appears here…"></textarea></div>',
    '</div>',
    '<div class="row" style="margin-top:14px">',
    '  <button class="btn primary" id="b64-enc">Encode →</button>',
    '  <button class="btn primary" id="b64-dec">← Decode</button>',
    '  <label class="check"><input type="checkbox" id="b64-url"> URL-safe (-_ , no padding)</label>',
    '  <span class="spacer"></span>',
    '  <button class="btn" id="b64-file">Encode a file…</button>',
    '  <input type="file" id="b64-fileinput" hidden>',
    '  <button class="btn" data-copy="#b64-out">Copy result</button>',
    '  <button class="btn" data-clear="#b64-in,#b64-out">Clear</button>',
    '</div>',
    '<p class="error" id="b64-err"></p>'
  ].join(''),

  init: function (root) {
    var $ = Tools.$;
    var input = $('#b64-in', root), output = $('#b64-out', root), err = $('#b64-err', root);

    function urlSafe() { return $('#b64-url', root).checked; }
    function fail(msg) { err.textContent = msg; output.value = ''; }

    function encode() {
      err.textContent = '';
      if (!input.value) { output.value = ''; return; }
      try {
        var bytes = new TextEncoder().encode(input.value);
        var bin = '';
        bytes.forEach(function (b) { bin += String.fromCharCode(b); });
        var s = btoa(bin);
        if (urlSafe()) s = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        output.value = s;
      } catch (e) { fail('Could not encode: ' + e.message); }
    }

    function decode() {
      err.textContent = '';
      if (!input.value) { output.value = ''; return; }
      try {
        var s = input.value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        var bin = atob(s);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        output.value = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } catch (e) { fail('Not valid Base64 — check for stray characters.'); }
    }

    $('#b64-enc', root).addEventListener('click', encode);
    $('#b64-dec', root).addEventListener('click', decode);
    $('#b64-url', root).addEventListener('change', function () { if (output.value) encode(); });

    $('#b64-file', root).addEventListener('click', function () { $('#b64-fileinput', root).click(); });
    $('#b64-fileinput', root).addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var dataUrl = r.result;
        output.value = dataUrl.slice(dataUrl.indexOf(',') + 1);
        input.value = '(file: ' + f.name + ', ' + f.size + ' bytes)';
        err.textContent = '';
        Tools.toast('Encoded ' + f.name);
      };
      r.readAsDataURL(f);
    });
  }
});
