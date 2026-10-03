// Page and client script for the Fit Advisor Worker.
// Visuals are Coret SVG animations from studios.alogaritm.com, loaded through /assets/coret.js.

export const HTML = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Fit Advisor</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--line:#e5e7eb;--text:#111827;--muted:#6b7280;--soft:#f3f4f6;--accent:#111827;--on-accent:#fff;--bar:#d1d5db;--danger:#b91c1c;--danger-soft:#fef2f2}
@media (prefers-color-scheme:dark){:root{--bg:#0b0d10;--card:#121417;--line:#24272c;--text:#e5e7eb;--muted:#9ca3af;--soft:#1a1d21;--accent:#f3f4f6;--on-accent:#111827;--bar:#3a3f46;--danger:#f87171;--danger-soft:#2a1416}}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--text);font:13px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:880px;margin:0 auto;padding:24px 16px}
.head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}
.head h1{font-size:15px;font-weight:600;margin:0}
.muted{color:var(--muted)}.small{font-size:12px}
.card{display:grid;grid-template-columns:1fr 1fr;background:var(--card);border:1px solid var(--line);border-radius:6px}
.form{padding:16px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:14px}
.panel{padding:16px;display:flex;flex-direction:column;gap:12px;min-width:0}
fieldset{border:0;margin:0;padding:0;min-width:0}
legend,.lbl{display:block;font-size:12px;font-weight:500;margin-bottom:6px}
legend em,.lbl em{font-style:normal;font-weight:400;color:var(--muted)}
.seg{display:flex;flex-wrap:wrap;gap:6px}
.seg label{position:relative}
.seg input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.seg span{display:inline-block;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:var(--card);cursor:pointer;user-select:none}
.seg input:checked+span{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.seg input:focus-visible+span{outline:2px solid var(--accent);outline-offset:2px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.field input{width:100%;height:32px;padding:0 8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--text);font:inherit}
.field input:focus{outline:none;border-color:var(--accent)}
.field.invalid input{border-color:var(--danger);background:var(--danger-soft)}
.btn{height:34px;border:0;border-radius:6px;background:var(--accent);color:var(--on-accent);font:inherit;font-weight:500;cursor:pointer}
.btn:disabled{opacity:.6;cursor:progress}
.btn-sm{height:28px;padding:0 10px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--text);font:inherit;cursor:pointer}
.btn-sm:hover{border-color:var(--accent)}
.err{margin:0;padding:8px 10px;border-radius:6px;background:var(--danger-soft);color:var(--danger)}
.stage{display:grid;place-items:center;background:var(--soft);border-radius:6px;aspect-ratio:16/10;color:var(--text);overflow:hidden}
.stage svg{width:72%;height:auto;max-height:100%;aspect-ratio:1}
.stage.compact svg{width:56%}
.res-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
.size{font-size:28px;font-weight:600;line-height:1.1;letter-spacing:-.01em}
.pct{text-align:right}.pct b{display:block;font-size:15px;font-weight:600}
.bars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.bars li{display:grid;grid-template-columns:44px 1fr 38px;align-items:center;gap:8px}
.track{height:6px;border-radius:3px;background:var(--soft);overflow:hidden}
.fill{height:100%;width:0;background:var(--bar);transition:width .5s ease}
.bars li.top .fill{background:var(--accent)}
.bars .v{text-align:right;font-variant-numeric:tabular-nums}
.pref{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:6px}
.pref div{display:flex;gap:6px}
.foot{margin-top:10px}
[hidden]{display:none!important}
@media (max-width:720px){.card{grid-template-columns:1fr}.form{border-right:0;border-bottom:1px solid var(--line)}.panel{order:-1}}
</style>
<script src="/assets/coret.js" defer></script>
<script src="/assets/app.js" defer></script>
</head>
<body>
<main class="wrap">
  <header class="head"><h1>Fit Advisor</h1><span class="muted small">Rekomendasi ukuran dari tinggi &amp; berat badan</span></header>
  <section class="card">
    <form id="fit-form" class="form" novalidate>
      <fieldset>
        <legend>Jenis pakaian</legend>
        <div class="seg">
          <label><input type="radio" name="type" value="suit" checked><span>Jas</span></label>
          <label><input type="radio" name="type" value="jacket"><span>Jaket</span></label>
          <label><input type="radio" name="type" value="shirt"><span>Kemeja</span></label>
          <label><input type="radio" name="type" value="tshirt"><span>Kaos</span></label>
          <label><input type="radio" name="type" value="pants"><span>Celana</span></label>
        </div>
      </fieldset>
      <div class="grid3">
        <label class="field" data-field="height"><span class="lbl">Tinggi (cm)</span><input name="height" type="number" inputmode="numeric" min="1" max="300" step="1" placeholder="170" required></label>
        <label class="field" data-field="weight"><span class="lbl">Berat (kg)</span><input name="weight" type="text" inputmode="decimal" placeholder="68" required></label>
        <label class="field" data-field="age"><span class="lbl">Usia <em>opsional</em></span><input name="age" type="number" inputmode="numeric" min="1" max="120" step="1" placeholder="30"></label>
      </div>
      <fieldset data-field="style">
        <legend>Gaya <em>opsional</em></legend>
        <div class="seg">
          <label><input type="radio" name="style" value="slim"><span>Slim</span></label>
          <label><input type="radio" name="style" value="regular"><span>Regular</span></label>
          <label><input type="radio" name="style" value="oversize"><span>Oversize</span></label>
        </div>
      </fieldset>
      <button class="btn" id="submit" type="submit">Hitung ukuran</button>
      <p class="err" id="form-error" role="alert" hidden></p>
    </form>
    <aside class="panel" aria-live="polite">
      <div class="stage" id="stage"><svg id="visual" data-coret="work-measuring-clothing" width="160" height="160"></svg></div>
      <div id="result" hidden>
        <div class="res-head">
          <div><div class="muted small" id="res-label">Rekomendasi ukuran</div><div class="size" id="res-size"></div></div>
          <div class="pct"><b id="res-pct"></b><span class="muted small">kecocokan</span></div>
        </div>
        <ul class="bars" id="res-bars" style="margin-top:12px"></ul>
        <div class="pref" id="res-pref" style="margin-top:12px" hidden>
          <span id="res-pref-q"></span>
          <div><button class="btn-sm" type="button" data-style="slim">Slim</button><button class="btn-sm" type="button" data-style="regular">Regular</button></div>
        </div>
      </div>
      <p class="muted small" id="caption">Isi tinggi dan berat badan untuk melihat rekomendasi.</p>
    </aside>
  </section>
  <p class="muted small foot">Estimasi berdasarkan berat, usia, dan gaya. Konfirmasi dengan tabel ukuran produk.</p>
</main>
</body>
</html>`;

export const CLIENT_JS = String.raw`(function () {
  'use strict';
  var TYPES = {
    suit: { label: 'Jas', guide: 'measure-jacket-chest', how: 'Cek di jas: lebar dada dari ketiak kiri ke kanan, jas dikancing.' },
    jacket: { label: 'Jaket', guide: 'measure-jacket-chest', how: 'Cek di jaket: lebar dada dari ketiak kiri ke kanan.' },
    shirt: { label: 'Kemeja', guide: 'measure-garment-chest-armhole-width', how: 'Cek di kemeja: bentangkan, ukur dari bawah ketiak kiri ke kanan.' },
    tshirt: { label: 'Kaos', guide: 'measure-garment-chest-armhole-width', how: 'Cek di kaos: bentangkan, ukur dari bawah ketiak kiri ke kanan.' },
    pants: { label: 'Celana', guide: 'measure-pants-waist-width', how: 'Cek di celana: lebar ban pinggang dari ujung kiri ke kanan.' }
  };
  var VISUAL = { idle: 'work-measuring-clothing', loading: 'object-measuring-tape', error: 'flow-thinker' };
  var FIELD_LABELS = { type: 'jenis pakaian', height: 'tinggi', weight: 'berat', age: 'usia', style: 'gaya' };
  var STYLE_LABELS = { slim: 'Slim', regular: 'Regular', oversize: 'Oversize' };

  var form = document.getElementById('fit-form');
  var submit = document.getElementById('submit');
  var errorBox = document.getElementById('form-error');
  var stage = document.getElementById('stage');
  var visual = document.getElementById('visual');
  var caption = document.getElementById('caption');
  var result = document.getElementById('result');
  var busy = false;

  function setVisual(name, compact) {
    if (visual.getAttribute('data-coret') !== name) visual.setAttribute('data-coret', name);
    stage.classList.toggle('compact', Boolean(compact));
  }

  function currentType() {
    var checked = form.querySelector('input[name=type]:checked');
    return checked ? checked.value : 'suit';
  }

  function clearErrors() {
    errorBox.hidden = true;
    errorBox.textContent = '';
    form.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
  }

  function showError(message, fields) {
    (fields || []).forEach(function (name) {
      var el = form.querySelector('[data-field=' + name + ']');
      if (el) el.classList.add('invalid');
    });
    errorBox.textContent = message;
    errorBox.hidden = false;
    result.hidden = true;
    setVisual(VISUAL.error, true);
    caption.textContent = 'Periksa kembali data yang diisi.';
  }

  function readInput() {
    var data = new FormData(form);
    var input = { type: currentType(), height: String(data.get('height') || '').trim(), weight: String(data.get('weight') || '').trim() };
    var age = String(data.get('age') || '').trim();
    var style = data.get('style');
    if (age) input.age = age;
    if (style) input.style = style;
    return input;
  }

  function localCheck(input) {
    var missing = [];
    if (!input.height) missing.push('height');
    if (!input.weight) missing.push('weight');
    return missing;
  }

  function sizeText(type, data) {
    if (type === 'pants') return data.recommended_pants_no == null ? null : 'No. ' + data.recommended_pants_no;
    return !data.recommended_size || data.recommended_size === 'Tidak diketahui' ? null : data.recommended_size;
  }

  function renderBars(type, rows) {
    var list = document.getElementById('res-bars');
    list.textContent = '';
    (rows || []).forEach(function (row) {
      var li = document.createElement('li');
      if (row.is_recommended) li.className = 'top';
      var label = document.createElement('span');
      label.textContent = type === 'pants' ? String(row.pants_no) : String(row.size);
      var track = document.createElement('div');
      track.className = 'track';
      var fill = document.createElement('div');
      fill.className = 'fill';
      track.appendChild(fill);
      var value = document.createElement('span');
      value.className = 'v';
      value.textContent = row.percentage + '%';
      li.appendChild(label);
      li.appendChild(track);
      li.appendChild(value);
      list.appendChild(li);
      requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = Math.max(0, Math.min(100, row.percentage)) + '%'; }); });
    });
    list.hidden = !rows || !rows.length;
  }

  function renderResult(data) {
    var used = data.input_used || {};
    var type = used.type || currentType();
    var info = TYPES[type] || TYPES.suit;
    var size = sizeText(type, data);

    document.getElementById('res-label').textContent = 'Rekomendasi ukuran ' + info.label.toLowerCase();
    document.getElementById('res-size').textContent = size || 'Di luar rentang standar';
    document.getElementById('res-pct').textContent = size ? (data.recommended_size_percentage || 0) + '%' : '-';
    renderBars(type, size ? data.fit_percentages : []);

    var pref = document.getElementById('res-pref');
    if (data.preference_question) {
      document.getElementById('res-pref-q').textContent = data.preference_question;
      pref.hidden = false;
    } else {
      pref.hidden = true;
    }

    var parts = [used.height + ' cm', String(used.weight).replace('.', ',') + ' kg'];
    if (used.age) parts.push(used.age + ' th');
    parts.push((STYLE_LABELS[used.style] || 'Regular') + (used.style_defaulted ? ' (default)' : ''));

    result.hidden = false;
    setVisual(info.guide, true);
    caption.textContent = size ? parts.join(' · ') + '. ' + info.how : parts.join(' · ') + '. Perlu ukuran custom, hubungi CS.';
  }

  function submitFit() {
    if (busy) return;
    clearErrors();
    var input = readInput();
    var missing = localCheck(input);
    if (missing.length) {
      showError('Isi ' + missing.map(function (f) { return FIELD_LABELS[f]; }).join(' dan ') + '.', missing);
      return;
    }

    busy = true;
    submit.disabled = true;
    submit.textContent = 'Menghitung...';
    result.hidden = true;
    setVisual(VISUAL.loading, true);
    caption.textContent = 'Menghitung ukuran...';

    fetch('/api/fit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input)
    })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (body) { return { status: res.status, body: body }; });
      })
      .then(function (out) {
        var body = out.body || {};
        var meta = body.meta || {};
        if (out.status === 200 && body.data) return renderResult(body.data);
        var fields = body.data && body.data.fields_error;
        if (out.status === 400 && fields && fields.length) {
          return showError('Periksa ' + fields.map(function (f) { return FIELD_LABELS[f] || f; }).join(', ') + '. Berat 40–117 kg.', fields);
        }
        showError(meta.message || 'Terjadi kesalahan. Coba lagi.', []);
      })
      .catch(function () { showError('Koneksi gagal. Coba lagi.', []); })
      .then(function () {
        busy = false;
        submit.disabled = false;
        submit.textContent = 'Hitung ukuran';
      });
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); submitFit(); });

  form.addEventListener('change', function (event) {
    if (event.target.name === 'type' && result.hidden && !busy) {
      clearErrors();
      setVisual(VISUAL.idle, false);
      caption.textContent = 'Isi tinggi dan berat badan untuk melihat rekomendasi.';
    }
  });

  document.getElementById('res-pref').addEventListener('click', function (event) {
    var style = event.target && event.target.getAttribute('data-style');
    if (!style) return;
    var radio = form.querySelector('input[name=style][value=' + style + ']');
    if (radio) radio.checked = true;
    submitFit();
  });

  // Optional prefill for embeds: ?type=pants&height=170&weight=68
  var params = new URLSearchParams(location.search);
  var preset = params.get('type');
  if (preset && TYPES[preset]) {
    var radio = form.querySelector('input[name=type][value=' + preset + ']');
    if (radio) radio.checked = true;
  }
  ['height', 'weight', 'age'].forEach(function (name) {
    var value = params.get(name);
    if (value) form.elements[name].value = value;
  });
})();
`;
