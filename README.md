# 🧰 DevTools — Simple Online Tools

A collection of small, single-purpose browser tools. No build step, no dependencies,
no network calls — every tool runs entirely on the client.

## Run it

Just open `index.html` in a browser. (Optionally serve it: `npx serve .` or `python -m http.server`.)

## Tools

| Tool | What it does |
|---|---|
| 🔍 Text Compare | Side-by-side line diff with added/removed/modified highlighting |
| 🔡 Base64 Encode / Decode | UTF-8 safe text and file → Base64, URL-safe variant |
| { } JSON Formatter | Beautify, minify, sort keys, validate with line/column errors |
| 🔗 URL Encode / Decode | Percent-encoding plus a query-parameter breakdown |
| #️⃣ Hash Generator | MD5, SHA-1, SHA-256 (pure JS) + SHA-384/512 via WebCrypto |
| Aa Case Converter | camel, Pascal, snake, kebab, CONSTANT, title, dot, path… |
| 🆔 UUID / Password Generator | RFC 4122 v4 UUIDs, random passwords, hex tokens |
| 📊 Word & Character Counter | Words, chars, sentences, reading time, frequent words |
| ⏱️ Unix Timestamp Converter | Epoch ⇄ date, both directions, with relative time |
| 🎨 Color Converter | HEX ⇄ RGB ⇄ HSL, shade ramp, contrast ratios |
| `.*` Regex Tester | Live matches, capture groups, named groups |
| 📝 Lorem Ipsum Generator | Paragraphs, sentences, words or list items |
| 🏦 EMI Calculator | EMI from a rate, or the rate from an EMI, plus amortization |

## Layout

```
index.html                 page shell + <script> tag per tool
assets/css/style.css       theme (dark/light), shared components
assets/js/core.js          tool registry, hash router, copy/toast helpers
assets/js/tools/*.js       one self-contained file per tool
```

## Adding a tool

1. Create `assets/js/tools/my-tool.js`:

```js
Tools.register({
  id: 'my-tool',                    // becomes the URL: #/my-tool
  name: 'My Tool',
  icon: '✨',
  desc: 'One line shown on the home card.',
  tags: ['keywords', 'for', 'search'],
  html: '<textarea id="mt-in"></textarea><button class="btn" data-copy="#mt-in">Copy</button>',
  init: function (root) {
    // root is the tool container; Tools.$ / $$ / esc / copy / toast / download are available
  }
});
```

2. Add `<script src="assets/js/tools/my-tool.js"></script>` to `index.html`.

That's it — the card, search entry and route appear automatically.

Helpers: `data-copy="#sel"` and `data-clear="#a,#b"` attributes are wired up for you.

## Keyboard

- `/` — focus search
- `Esc` — leave search
