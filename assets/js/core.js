/* Tiny registry + hash router shared by every tool.
   A tool is a plain object:
     { id, name, icon, desc, tags:[], html:"<markup>", init(root){} }
   Drop a new file in assets/js/tools/ and add a <script> tag in index.html. */
window.Tools = (function () {
  var registry = [];
  var app, searchInput;

  function register(tool) {
    if (registry.some(function (t) { return t.id === tool.id; })) {
      console.warn('Duplicate tool id: ' + tool.id);
      return;
    }
    registry.push(tool);
  }

  /* ---------- helpers exposed to tools ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  function copy(text) {
    if (!text) { toast('Nothing to copy'); return; }
    var done = function () { toast('Copied to clipboard'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed'); }
    document.body.removeChild(ta);
  }

  function download(filename, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* Wire up any [data-copy="#selector"] / [data-clear="#selector"] buttons in a tool. */
  function autowire(root) {
    $$('[data-copy]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = $(btn.dataset.copy, root);
        copy(el ? (el.value !== undefined ? el.value : el.textContent) : '');
      });
    });
    $$('[data-clear]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.dataset.clear.split(',').forEach(function (sel) {
          var el = $(sel.trim(), root);
          if (!el) return;
          if (el.value !== undefined) el.value = ''; else el.textContent = '';
          el.dispatchEvent(new Event('input'));
        });
      });
    });
  }

  /* ---------- rendering ---------- */
  function renderHome(query) {
    var q = (query || '').trim().toLowerCase();
    var list = registry.filter(function (t) {
      if (!q) return true;
      return (t.name + ' ' + t.desc + ' ' + (t.tags || []).join(' ')).toLowerCase().indexOf(q) > -1;
    });

    app.innerHTML =
      '<section class="hero">' +
        '<h1>Simple tools that just work</h1>' +
        '<p>' + registry.length + ' small utilities. No sign-up, no uploads, works offline.</p>' +
      '</section>' +
      (list.length
        ? '<section class="grid">' + list.map(function (t) {
            return '<a class="card" href="#/' + t.id + '">' +
              '<div class="card-icon">' + t.icon + '</div>' +
              '<h3>' + esc(t.name) + '</h3>' +
              '<p>' + esc(t.desc) + '</p>' +
            '</a>';
          }).join('') + '</section>'
        : '<p class="empty">No tool matches “' + esc(q) + '”.</p>');
  }

  function renderTool(tool) {
    app.innerHTML =
      '<section class="tool-head">' +
        '<a class="crumb" href="#/">&larr; All tools</a>' +
        '<h1>' + tool.icon + ' ' + esc(tool.name) + '</h1>' +
        '<p>' + esc(tool.desc) + '</p>' +
      '</section>' +
      '<section class="tool-body" id="tool-root">' + tool.html + '</section>';

    var root = document.getElementById('tool-root');
    autowire(root);
    try { if (tool.init) tool.init(root); }
    catch (e) { root.insertAdjacentHTML('beforeend', '<p class="error">Tool error: ' + esc(e.message) + '</p>'); }
  }

  function route() {
    var id = (location.hash || '#/').replace(/^#\/?/, '');
    var tool = registry.filter(function (t) { return t.id === id; })[0];
    document.title = tool ? tool.name + ' — DevTools' : 'DevTools — Simple Online Tools';
    searchInput.style.visibility = tool ? 'hidden' : 'visible';
    if (tool) renderTool(tool); else renderHome(searchInput.value);
    window.scrollTo(0, 0);
  }

  /* ---------- boot ---------- */
  function start() {
    app = document.getElementById('app');
    searchInput = document.getElementById('search');

    registry.sort(function (a, b) { return a.name.localeCompare(b.name); });

    searchInput.addEventListener('input', function () {
      if (location.hash && location.hash !== '#/') location.hash = '#/';
      else renderHome(searchInput.value);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (location.hash && location.hash !== '#/') location.hash = '#/';
        searchInput.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInput) searchInput.blur();
    });

    var saved = localStorage.getItem('devtools-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-toggle').addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('devtools-theme', next);
    });

    window.addEventListener('hashchange', route);
    route();
  }

  return {
    register: register, start: start,
    $: $, $$: $$, esc: esc, copy: copy, toast: toast, download: download
  };
})();
