import { HTML, CLIENT_JS } from './ui.js';

const DEFAULT_FIT_API_URL = 'https://connect.alogaritm.com/api/v1/fit';
const DEFAULT_CORET_URL = 'https://studios.alogaritm.com/coret.js';
const FIT_FIELDS = ['type', 'height', 'weight', 'age', 'style'];
const MAX_BODY = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 10000;

// Version the client script so a redeploy never pairs new HTML with a cached old script.
const APP_VERSION = hashText(CLIENT_JS);
const PAGE = HTML.replace('/assets/app.js', '/assets/app.js?v=' + APP_VERSION);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (url.pathname === '/api/fit') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
      }
      return withHeaders(await handleFit(request, env, url), cors);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json(405, 'Method tidak diizinkan.');
    }

    switch (url.pathname) {
      case '/':
      case '/index.html':
        return new Response(PAGE, { headers: pageHeaders(env) });
      case '/assets/app.js':
        return new Response(CLIENT_JS, {
          headers: {
            'content-type': 'text/javascript; charset=utf-8',
            'cache-control': url.searchParams.get('v') === APP_VERSION ? 'public, max-age=31536000, immutable' : 'no-cache',
          },
        });
      case '/assets/coret.js':
        return coretScript(request, env, ctx);
      case '/health':
        return json(200, 'OK', { configured: Boolean(env.FIT_API_KEY) });
      default:
        return json(404, 'Tidak ditemukan.');
    }
  },
};

async function handleFit(request, env, url) {
  if (request.method !== 'POST') return json(405, 'Gunakan POST.');

  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin && !allowedOrigins(env).includes(origin)) {
    return json(403, 'Origin tidak diizinkan.');
  }

  if (env.FIT_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.FIT_LIMITER.limit({ key: ip });
    if (!success) return json(429, 'Terlalu banyak permintaan. Coba lagi sebentar.');
  }

  if (!env.FIT_API_KEY) return json(500, 'FIT_API_KEY belum diset di Worker.');

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, 'Body terlalu besar.');

  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return json(400, 'Body harus JSON yang valid.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json(400, 'Body harus JSON object.');
  }

  // Forward only Fit parameters; the API stays the single source of truth for validation.
  const input = {};
  const invalid = [];
  for (const field of FIT_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];
    if (value !== null && typeof value === 'object') invalid.push(field);
    else input[field] = value;
  }
  if (invalid.length) return json(400, 'Input tidak valid', null, { fields_error: invalid });

  let upstream;
  try {
    upstream = await fetch(env.FIT_API_URL || DEFAULT_FIT_API_URL, {
      method: 'POST',
      headers: {
        key: env.FIT_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'fit-advisor-worker',
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timeout = error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return json(timeout ? 504 : 502, 'Fit Advisor API tidak dapat dihubungi.');
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return json(502, 'Respons Fit Advisor API tidak valid.');
  }

  // Credential problems are an operator issue; never expose them to the public page.
  if (upstream.status === 401 || upstream.status === 403) {
    console.error('Fit API rejected the Worker credential', upstream.status, payload && payload.meta);
    return json(502, 'Fit Advisor sedang tidak tersedia.');
  }

  const meta = payload && payload.meta ? payload.meta : {};
  return new Response(JSON.stringify({ meta, data: payload ? payload.data ?? null : null }), {
    status: upstream.status,
    headers: apiHeaders(),
  });
}

async function coretScript(request, env, ctx) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(new URL('/assets/coret.js', request.url).toString());
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  let upstream;
  try {
    upstream = await fetch(env.CORET_URL || DEFAULT_CORET_URL, {
      cf: { cacheEverything: true, cacheTtl: 86400 },
    });
  } catch {
    upstream = null;
  }
  if (!upstream || !upstream.ok) {
    return new Response('/* Coret tidak tersedia */', {
      status: 502,
      headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const response = new Response(upstream.body, {
    headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=86400' },
  });
  if (cache && ctx) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin || !allowedOrigins(env).includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function withHeaders(response, extra) {
  if (!extra) return response;
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  return new Response(response.body, { status: response.status, headers });
}

function apiHeaders() {
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  };
}

function pageHeaders(env) {
  const frames = ["'self'", ...allowedOrigins(env)].join(' ');
  return {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-security-policy': [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'self'",
      'frame-ancestors ' + frames,
    ].join('; '),
  };
}

function hashText(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

function json(status, message, extraMeta, data = null) {
  return new Response(JSON.stringify({ meta: { status, message, ...(extraMeta || {}) }, data }), {
    status,
    headers: apiHeaders(),
  });
}
