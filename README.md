# Fit Advisor Worker

Cloudflare Worker untuk Fit Advisor. Perhitungan ukuran memakai API
`POST https://connect.alogaritm.com/api/v1/fit` (scope `fit`), visual memakai
animasi SVG Coret dari `studios.alogaritm.com`.

API key hanya disimpan di Worker sebagai secret, tidak pernah dikirim ke browser.

## Route

| Route | Fungsi |
| --- | --- |
| `GET /` | Halaman Fit Advisor |
| `POST /api/fit` | Proxy ke Connect API (`type`, `height`, `weight`, `age`, `style`) |
| `GET /assets/coret.js` | Runtime Coret dari studios.alogaritm.com, di-cache 1 hari di edge |
| `GET /health` | Cek konfigurasi (`meta.configured`) |

Body dan response `/api/fit` sama dengan Connect API:

```bash
curl -X POST https://fit-advisor.<subdomain>.workers.dev/api/fit \
  -H "Content-Type: application/json" \
  -d '{"type":"pants","height":168,"weight":84}'
```

Field selain kelima field Fit dibuang sebelum diteruskan. Error 401/403 dari
Connect (key salah, scope, whitelist IP) dikembalikan sebagai `502` tanpa detail.

## Tampilan

Wizard 4 langkah, tinggi penuh layar (mobile full screen, desktop kartu di tengah), animasi geser antar langkah.

Bahasa: English dan Indonesia — otomatis dari bahasa browser, bisa diganti lewat tombol EN/ID (tersimpan) atau `?lang=en` / `?lang=id`.

| Langkah | Isi | SVG Coret |
| --- | --- | --- |
| 1 | Pilih pakaian (Jas, Jaket, Kemeja, Kaos, Celana) | `work-measuring-clothing` |
| 2 | Tinggi, berat, usia (opsional) | `object-measuring-tape` |
| 3 | Gaya: Slim, Regular, Oversize | `object-hanger` / `object-shirt` / `object-trousers` |
| 4 | Hasil ukuran + alternatif | menghitung: `object-measuring-tape`; hasil: `measure-jacket-chest` / `measure-garment-chest-armhole-width` / `measure-pants-waist-width`; error: `flow-thinker` |

Ganti nama SVG di `ART`, teks di `I18N` pada `src/ui.js`.

## Setup

1. Di Connect: **API Credentials** → buat credential dengan scope `fit`.
   Kosongkan whitelist IP karena IP keluar Cloudflare berubah-ubah.
2. Deploy:

```bash
npm install
npx wrangler secret put FIT_API_KEY
npm run deploy
```

Lokal: salin `.dev.vars.example` ke `.dev.vars`, isi key, lalu `npm run dev`.

## Variabel

| Nama | Jenis | Keterangan |
| --- | --- | --- |
| `FIT_API_KEY` | Secret | API key Connect dengan scope `fit` |
| `FIT_API_URL` | Var | Default `https://connect.alogaritm.com/api/v1/fit` |
| `CORET_URL` | Var | Default `https://studios.alogaritm.com/coret.js` |
| `ALLOWED_ORIGINS` | Var | Origin lain (pisah koma) yang boleh memanggil `/api/fit` (CORS) dan meng-embed halaman via iframe |
| `FIT_LIMITER` | Rate limit | 30 request / menit per IP |

## Embed

```html
<iframe src="https://fit-advisor.<subdomain>.workers.dev/?type=pants" width="100%" height="640" style="border:0"></iframe>
```

Parameter opsional: `type` (`suit`, `jacket`, `shirt`, `tshirt`, `pants`; langsung ke langkah 2), `height`, `weight`, `age`, `lang` (`en`, `id`).
Domain induk iframe harus ada di `ALLOWED_ORIGINS`.

## Test

```bash
npm test
```
