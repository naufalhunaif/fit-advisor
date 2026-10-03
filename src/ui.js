// Page and client script for the Fit Advisor Worker.
// Four simple steps: garment → height/weight → fit style → result.
// Visuals are Coret SVG animations from studios.alogaritm.com, loaded through /assets/coret.js.

export const HTML = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Fit Advisor</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--line:#e5e7eb;--text:#111827;--muted:#6b7280;--soft:#f3f4f6;--accent:#111827;--on-accent:#fff;--danger:#b91c1c}
@media (prefers-color-scheme:dark){:root{--bg:#0b0d10;--card:#121417;--line:#24272c;--text:#e5e7eb;--muted:#9ca3af;--soft:#1a1d21;--accent:#f3f4f6;--on-accent:#111827;--danger:#f87171}}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
body{display:flex;justify-content:center;padding:24px 16px}
.app{width:100%;max-width:400px;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:16px 20px 24px;overflow:hidden}
.top{display:flex;align-items:center;justify-content:space-between;height:28px;margin-bottom:8px}
.back{border:0;background:none;color:var(--muted);font:inherit;font-size:13px;padding:4px 0;cursor:pointer;transition:opacity .2s}
.back:hover{color:var(--text)}
.back[aria-hidden=true]{opacity:0;pointer-events:none}
.dots{display:flex;gap:4px}
.dots i{width:16px;height:3px;border-radius:2px;background:var(--line);transition:background .3s,width .3s}
.dots i.on{background:var(--accent)}
.dots i.cur{width:24px}
.step{display:none;text-align:center}
.step.active{display:block;animation:in-next .38s cubic-bezier(.2,.7,.2,1) both}
.step.active.from-back{animation-name:in-prev}
@keyframes in-next{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
@keyframes in-prev{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
.art{display:block;width:150px;height:150px;margin:4px auto 8px;color:var(--text)}
h1{font-size:17px;font-weight:600;margin:0 0 16px;letter-spacing:-.01em}
.choices{display:grid;gap:8px}
.choices.two{grid-template-columns:1fr 1fr}
.choice{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;padding:10px 14px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--text);font:inherit;font-weight:500;text-align:left;cursor:pointer;transition:border-color .15s,background .15s,transform .1s}
.choice small{font-weight:400;color:var(--muted)}
.choice:hover{border-color:var(--accent)}
.choice:active{transform:scale(.98)}
.choice.sel{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.choice.sel small{color:inherit;opacity:.7}
.two .choice{justify-content:center}
.choice.wide{grid-column:1/-1}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.num{position:relative;display:block}
.num input{width:100%;height:56px;padding:0 40px 0 14px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--text);font:inherit;font-size:22px;font-weight:600;text-align:left}
.num span{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--muted)}
.num small{display:block;text-align:left;color:var(--muted);font-size:12px;margin-bottom:4px}
.age{margin-top:8px}
.age input{height:40px;font-size:14px;font-weight:400}
input:focus{outline:none;border-color:var(--accent)!important}
input.bad{border-color:var(--danger)}
.err{color:var(--danger);font-size:13px;margin:10px 0 0}
.primary{width:100%;height:44px;margin-top:16px;border:0;border-radius:6px;background:var(--accent);color:var(--on-accent);font:inherit;font-weight:600;cursor:pointer;transition:opacity .15s,transform .1s}
.primary:active{transform:scale(.98)}
.ghost{height:36px;margin-top:20px;padding:0 16px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--text);font:inherit;cursor:pointer}
.ghost:hover{border-color:var(--accent)}
.label{color:var(--muted);margin:0}
.big{font-size:56px;font-weight:700;line-height:1.1;letter-spacing:-.02em;margin:2px 0}
.pct{font-weight:600;margin:0}
.alts{display:flex;justify-content:center;gap:6px;margin-top:12px}
.alts span{padding:3px 8px;border:1px solid var(--line);border-radius:6px;color:var(--muted);font-size:12px}
.hint{color:var(--muted);font-size:13px;margin:14px 0 0}
.pop{animation:pop .45s cubic-bezier(.2,.9,.3,1.3) both}
.fade{animation:fade .4s ease both}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
<script src="/assets/coret.js" defer></script>
<script src="/assets/app.js" defer></script>
</head>
<body>
<main class="app">
  <div class="top">
    <button class="back" id="back" type="button" aria-hidden="true">&#8249; Kembali</button>
    <div class="dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  </div>

  <section class="step active" data-step="1">
    <svg class="art" data-coret="work-measuring-clothing" width="150" height="150"></svg>
    <h1>Mau cek ukuran apa?</h1>
    <div class="choices two">
      <button class="choice" type="button" data-type="suit">Jas</button>
      <button class="choice" type="button" data-type="jacket">Jaket</button>
      <button class="choice" type="button" data-type="shirt">Kemeja</button>
      <button class="choice" type="button" data-type="tshirt">Kaos</button>
      <button class="choice wide" type="button" data-type="pants">Celana</button>
    </div>
  </section>

  <section class="step" data-step="2">
    <svg class="art" data-coret="object-measuring-tape" width="150" height="150"></svg>
    <h1>Tinggi &amp; berat badan</h1>
    <form id="body-form" novalidate>
      <div class="pair">
        <label class="num"><small>Tinggi</small><input name="height" inputmode="numeric" autocomplete="off" placeholder="170"><span>cm</span></label>
        <label class="num"><small>Berat</small><input name="weight" inputmode="decimal" autocomplete="off" placeholder="68"><span>kg</span></label>
      </div>
      <label class="num age"><input name="age" inputmode="numeric" autocomplete="off" placeholder="Usia (opsional)"><span>th</span></label>
      <p class="err" id="body-err" role="alert" hidden></p>
      <button class="primary" type="submit">Lanjut</button>
    </form>
  </section>

  <section class="step" data-step="3">
    <svg class="art" id="style-art" data-coret="object-hanger" width="150" height="150"></svg>
    <h1>Suka yang mana?</h1>
    <div class="choices">
      <button class="choice" type="button" data-style="slim">Slim <small>pas badan</small></button>
      <button class="choice" type="button" data-style="regular">Regular <small>standar</small></button>
      <button class="choice" type="button" data-style="oversize">Oversize <small>longgar</small></button>
    </div>
  </section>

  <section class="step" data-step="4" aria-live="polite">
    <svg class="art" id="result-art" data-coret="object-measuring-tape" width="150" height="150"></svg>
    <div id="loading"><p class="label">Menghitung ukuran...</p></div>
    <div id="result" hidden>
      <p class="label" id="r-label">Ukuran kamu</p>
      <div class="big" id="r-size"></div>
      <p class="pct" id="r-pct"></p>
      <div class="alts" id="r-alts"></div>
      <p class="hint" id="r-hint"></p>
    </div>
    <div id="failed" hidden><p class="label" id="f-msg"></p></div>
    <button class="ghost" id="restart" type="button" hidden>Cek lagi</button>
  </section>
</main>
</body>
</html>`;

export const CLIENT_JS = String.raw`(function () {
  'use strict';
  var TYPES = {
    suit: { label: 'jas', object: 'object-hanger', guide: 'measure-jacket-chest', how: 'Cek di jas: lebar dada dari ketiak kiri ke kanan.' },
    jacket: { label: 'jaket', object: 'object-hanger', guide: 'measure-jacket-chest', how: 'Cek di jaket: lebar dada dari ketiak kiri ke kanan.' },
    shirt: { label: 'kemeja', object: 'object-shirt', guide: 'measure-garment-chest-armhole-width', how: 'Cek di kemeja: bentangkan, ukur bawah ketiak kiri ke kanan.' },
    tshirt: { label: 'kaos', object: 'object-shirt', guide: 'measure-garment-chest-armhole-width', how: 'Cek di kaos: bentangkan, ukur bawah ketiak kiri ke kanan.' },
    pants: { label: 'celana', object: 'object-trousers', guide: 'measure-pants-waist-width', how: 'Cek di celana: lebar ban pinggang kiri ke kanan.' }
  };

  var state = { step: 1, type: null, height: '', weight: '', age: '', style: null };
  var steps = document.querySelectorAll('.step');
  var dots = document.querySelectorAll('.dots i');
  var back = document.getElementById('back');
  var bodyForm = document.getElementById('body-form');
  var bodyErr = document.getElementById('body-err');
  var resultArt = document.getElementById('result-art');
  var restart = document.getElementById('restart');
  var $ = function (id) { return document.getElementById(id); };

  function go(step, backwards) {
    state.step = step;
    steps.forEach(function (el) {
      var active = Number(el.getAttribute('data-step')) === step;
      el.classList.remove('active', 'from-back');
      if (active) {
        void el.offsetWidth; // restart the enter animation
        el.classList.add('active');
        if (backwards) el.classList.add('from-back');
      }
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('on', i < step);
      dot.classList.toggle('cur', i === step - 1);
    });
    back.setAttribute('aria-hidden', step === 1 || step === 4 ? 'true' : 'false');
    if (step === 2) setTimeout(function () { bodyForm.elements[state.height ? 'weight' : 'height'].focus(); }, 60);
  }

  function markSelected(container, attr, value) {
    container.querySelectorAll('[' + attr + ']').forEach(function (el) {
      el.classList.toggle('sel', el.getAttribute(attr) === value);
    });
  }

  function setArt(el, name) {
    if (el.getAttribute('data-coret') !== name) el.setAttribute('data-coret', name);
  }

  function chooseType(type) {
    if (!TYPES[type]) return;
    state.type = type;
    markSelected(steps[0], 'data-type', type);
    setArt($('style-art'), TYPES[type].object);
  }

  // Step 1: garment
  steps[0].addEventListener('click', function (event) {
    var btn = event.target.closest('[data-type]');
    if (!btn) return;
    chooseType(btn.getAttribute('data-type'));
    setTimeout(function () { go(2); }, 140);
  });

  // Step 2: height and weight
  function num(value) { return Number(String(value).replace(',', '.')); }
  function bodyError(message, field) {
    bodyErr.textContent = message;
    bodyErr.hidden = false;
    bodyForm.querySelectorAll('input').forEach(function (i) { i.classList.toggle('bad', i.name === field); });
    if (field) bodyForm.elements[field].focus();
  }
  bodyForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var h = bodyForm.elements.height.value.trim();
    var w = bodyForm.elements.weight.value.trim();
    var a = bodyForm.elements.age.value.trim();
    if (!/^\d+$/.test(h) || num(h) < 1 || num(h) > 300) return bodyError('Isi tinggi dalam cm, contoh 170.', 'height');
    if (!w || isNaN(num(w)) || num(w) < 40 || num(w) > 117) return bodyError('Berat 40–117 kg.', 'weight');
    if (a && (!/^\d+$/.test(a) || num(a) < 1 || num(a) > 120)) return bodyError('Usia 1–120, atau kosongkan.', 'age');
    bodyErr.hidden = true;
    bodyForm.querySelectorAll('input').forEach(function (i) { i.classList.remove('bad'); });
    state.height = h; state.weight = w; state.age = a;
    go(3);
  });

  // Step 3: style, then calculate
  steps[2].addEventListener('click', function (event) {
    var btn = event.target.closest('[data-style]');
    if (!btn) return;
    state.style = btn.getAttribute('data-style');
    markSelected(steps[2], 'data-style', state.style);
    setTimeout(function () { go(4); calculate(); }, 140);
  });

  // Step 4: result
  function show(id) {
    ['loading', 'result', 'failed'].forEach(function (name) { $(name).hidden = name !== id; });
    var el = $(id);
    el.classList.remove('fade'); void el.offsetWidth; el.classList.add('fade');
  }

  function calculate() {
    setArt(resultArt, 'object-measuring-tape');
    show('loading');
    restart.hidden = true;
    var body = { type: state.type, height: state.height, weight: state.weight, style: state.style };
    if (state.age) body.age = state.age;
    var started = Date.now();
    fetch('/api/fit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (json) { return { status: res.status, json: json || {} }; });
      })
      .catch(function () { return { status: 0, json: {} }; })
      .then(function (out) {
        // Keep the measuring animation visible briefly so the change does not flash.
        setTimeout(function () { render(out); }, Math.max(0, 700 - (Date.now() - started)));
      });
  }

  function render(out) {
    var data = out.json.data;
    if (out.status === 200 && data) return renderResult(data);
    var fields = data && data.fields_error;
    if (out.status === 400 && fields && fields.length) {
      go(2, true);
      var field = ['height', 'weight', 'age'].filter(function (f) { return fields.indexOf(f) >= 0; })[0];
      return bodyError('Periksa kembali ' + (field === 'height' ? 'tinggi' : field === 'age' ? 'usia' : 'berat') + '.', field || null);
    }
    setArt(resultArt, 'flow-thinker');
    $('f-msg').textContent = out.status === 0 ? 'Koneksi gagal. Coba lagi.' : ((out.json.meta && out.json.meta.message) || 'Terjadi kesalahan. Coba lagi.');
    show('failed');
    restart.textContent = 'Coba lagi';
    restart.hidden = false;
  }

  function renderResult(data) {
    var info = TYPES[state.type];
    var pants = state.type === 'pants';
    var size = pants ? data.recommended_pants_no : data.recommended_size;
    var known = size != null && size !== 'Tidak diketahui';

    $('r-label').textContent = 'Ukuran ' + info.label + ' kamu';
    var big = $('r-size');
    big.textContent = known ? (pants ? 'No. ' + size : size) : 'Custom';
    big.classList.remove('pop'); void big.offsetWidth; big.classList.add('pop');
    $('r-pct').textContent = known ? (data.recommended_size_percentage || 0) + '% cocok' : 'Di luar ukuran standar';

    var alts = $('r-alts');
    alts.textContent = '';
    (known ? data.fit_percentages || [] : []).filter(function (row) { return !row.is_recommended; }).forEach(function (row) {
      var chip = document.createElement('span');
      chip.textContent = (pants ? row.pants_no : row.size) + ' · ' + row.percentage + '%';
      alts.appendChild(chip);
    });
    alts.hidden = !alts.childNodes.length;

    $('r-hint').textContent = known ? info.how : 'Hubungi CS untuk ukuran custom.';
    setArt(resultArt, info.guide);
    show('result');
    restart.textContent = 'Cek lagi';
    restart.hidden = false;
  }

  restart.addEventListener('click', function () {
    if ($('failed').hidden) {
      state.style = null;
      markSelected(steps[2], 'data-style', '');
      go(1, true);
    } else {
      go(4); calculate();
    }
  });

  back.addEventListener('click', function () {
    if (state.step > 1 && state.step < 4) go(state.step - 1, true);
  });

  // Optional prefill for embeds: ?type=pants&height=170&weight=68&age=30
  var params = new URLSearchParams(location.search);
  ['height', 'weight', 'age'].forEach(function (name) {
    var value = params.get(name);
    if (value) bodyForm.elements[name].value = value;
  });
  var preset = params.get('type');
  if (preset && TYPES[preset]) { chooseType(preset); go(2); } else go(1);
})();
`;
