import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const ORIGIN = 'https://fit.example.com';
const env = { FIT_API_KEY: 'test-key', FIT_API_URL: 'https://connect.test/api/v1/fit', ALLOWED_ORIGINS: 'https://shop.example.com' };
const realFetch = globalThis.fetch;
let calls;

function upstream(status, body) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  };
}

function post(body, headers = {}, e = env) {
  const request = new Request(ORIGIN + '/api/fit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return worker.fetch(request, e, { waitUntil() {} });
}

beforeEach(() => { calls = []; });
afterEach(() => { globalThis.fetch = realFetch; });

test('serves the page with Coret SVG and CSP', async () => {
  const res = await worker.fetch(new Request(ORIGIN + '/'), env, {});
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /data-coret="work-measuring-clothing"/);
  assert.match(html, /\/assets\/coret\.js/);
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'self' https:\/\/shop\.example\.com/);
});

test('client script parses', async () => {
  const res = await worker.fetch(new Request(ORIGIN + '/assets/app.js'), env, {});
  const code = await res.text();
  assert.doesNotThrow(() => new Function(code));
});

test('forwards only fit fields with the secret key', async () => {
  const data = { recommended_size: 'L', recommended_size_percentage: 70, fit_percentages: [], input_used: {}, preference_question: null };
  upstream(200, { meta: { status: 200, message: 'Success Get Fit Advisor', request_id: 'abc' }, data });
  const res = await post({ type: 'suit', height: 170, weight: '72,5', age: '', style: 'slim', key: 'evil', extra: 1 });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, env.FIT_API_URL);
  assert.equal(calls[0].init.headers.key, 'test-key');
  assert.deepEqual(JSON.parse(calls[0].init.body), { type: 'suit', height: 170, weight: '72,5', age: '', style: 'slim' });
  const body = await res.json();
  assert.equal(body.data.recommended_size, 'L');
  assert.equal(body.meta.request_id, 'abc');
});

test('passes upstream validation errors through', async () => {
  upstream(400, { meta: { status: 400, message: 'Input tidak valid' }, data: { fields_error: ['weight'] } });
  const res = await post({ type: 'pants', height: 170, weight: 20 });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).data.fields_error, ['weight']);
});

test('rejects structured values without calling the API', async () => {
  upstream(200, {});
  const res = await post({ type: 'suit', height: { a: 1 }, weight: [70] });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).data.fields_error, ['height', 'weight']);
  assert.equal(calls.length, 0);
});

test('rejects malformed JSON and non-POST', async () => {
  assert.equal((await post('{bad')).status, 400);
  assert.equal((await post('[1]')).status, 400);
  const get = await worker.fetch(new Request(ORIGIN + '/api/fit'), env, {});
  assert.equal(get.status, 405);
});

test('hides upstream credential errors', async () => {
  upstream(401, { meta: { status: 401, message: 'API key is invalid.' }, data: null });
  const original = console.error;
  console.error = () => {};
  const res = await post({ type: 'suit', height: 170, weight: 70 });
  console.error = original;
  assert.equal(res.status, 502);
  assert.doesNotMatch(JSON.stringify(await res.json()), /API key/);
});

test('requires FIT_API_KEY', async () => {
  const res = await post({ type: 'suit', height: 170, weight: 70 }, {}, { ...env, FIT_API_KEY: '' });
  assert.equal(res.status, 500);
});

test('maps network failure and invalid upstream body', async () => {
  globalThis.fetch = async () => { throw new TypeError('network'); };
  assert.equal((await post({ type: 'suit', height: 170, weight: 70 })).status, 502);
  upstream(200, '<html>');
  assert.equal((await post({ type: 'suit', height: 170, weight: 70 })).status, 502);
});

test('origin policy and CORS', async () => {
  upstream(200, { meta: { status: 200 }, data: {} });
  assert.equal((await post({ type: 'suit', height: 170, weight: 70 }, { Origin: 'https://evil.example' })).status, 403);
  const same = await post({ type: 'suit', height: 170, weight: 70 }, { Origin: ORIGIN });
  assert.equal(same.status, 200);
  const allowed = await post({ type: 'suit', height: 170, weight: 70 }, { Origin: 'https://shop.example.com' });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://shop.example.com');
  const preflight = await worker.fetch(new Request(ORIGIN + '/api/fit', { method: 'OPTIONS', headers: { Origin: 'https://shop.example.com' } }), env, {});
  assert.equal(preflight.status, 204);
});

test('rate limit binding', async () => {
  upstream(200, { meta: { status: 200 }, data: {} });
  const limited = { ...env, FIT_LIMITER: { limit: async () => ({ success: false }) } };
  assert.equal((await post({ type: 'suit', height: 170, weight: 70 }, {}, limited)).status, 429);
  assert.equal(calls.length, 0);
});

test('proxies Coret script', async () => {
  globalThis.fetch = async (url) => {
    calls.push({ url: String(url) });
    return new Response('window.Coret={};', { status: 200 });
  };
  const res = await worker.fetch(new Request(ORIGIN + '/assets/coret.js'), env, { waitUntil() {} });
  assert.equal(res.status, 200);
  assert.equal(calls[0].url, 'https://studios.alogaritm.com/coret.js');
  assert.match(res.headers.get('content-type'), /javascript/);
});

test('health and 404', async () => {
  const health = await worker.fetch(new Request(ORIGIN + '/health'), env, {});
  assert.equal((await health.json()).meta.configured, true);
  assert.equal((await worker.fetch(new Request(ORIGIN + '/nope'), env, {})).status, 404);
});
