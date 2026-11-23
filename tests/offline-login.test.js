// Punkt 3: a lost connection must not end the GitHub login.
import test from 'node:test';
import assert from 'node:assert/strict';

function storage() { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
const TOKEN = 'museum-mystery-github-session-v1';
const user = { id: 7, login: 'octo' };
const page = { pathname: '/', search: '', hash: '' };
const history = { replaceState() {} };

async function setup(t) {
  globalThis.location = { hostname: 'game.example' };
  globalThis.sessionStorage = storage();
  globalThis.localStorage = storage();
  t.after(() => { delete globalThis.location; delete globalThis.sessionStorage; delete globalThis.localStorage; });
  return import('../web/github-auth.js');
}
const online = () => async url => Response.json(String(url).endsWith('/auth/me') ? { user } : { snapshot: null });

test('network error, timeout or 5xx keeps the token and the account; 401 removes it', async t => {
  const auth = await setup(t);
  t.mock.method(globalThis, 'fetch', online());
  sessionStorage.setItem(TOKEN, 'abc');
  assert.deepEqual((await auth.initialSession(page, history)).user, user);   // remembers the account

  for (const failure of [
    async () => { throw new TypeError('fetch failed'); },
    async () => { throw new DOMException('timeout', 'TimeoutError'); },
    async () => Response.json({ error: 'down' }, { status: 503 }),
    async () => new Response('Bad gateway', { status: 502 }),
  ]) {
    globalThis.fetch.mock.mockImplementation(failure);
    const result = await auth.initialSession(page, history);
    assert.equal(sessionStorage.getItem(TOKEN), 'abc', 'token kept');
    assert.deepEqual(result.user, user);
    assert.equal(result.offline, true);
  }

  globalThis.fetch.mock.mockImplementation(async () => Response.json({ error: 'Sign in again.' }, { status: 401 }));
  const result = await auth.initialSession(page, history);
  assert.equal(sessionStorage.getItem(TOKEN), null, 'a real 401 ends the session');
  assert.equal(result.user, null);
});

test('offline saves stay pending on this device and are sent after reconnecting', async t => {
  const auth = await setup(t);
  sessionStorage.setItem(TOKEN, 'abc');
  let up = false; const sent = [], statuses = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    if (!up) throw new TypeError('fetch failed');
    sent.push(JSON.parse(options.body));
    return Response.json({ ok: true });
  });
  let progress = 1;
  const sync = auth.createCloudSync(() => ({ progress }), s => statuses.push(s), 'pending', 20);
  await assert.rejects(sync.flush());
  assert.equal(sessionStorage.getItem(TOKEN), 'abc');
  assert.equal(statuses.at(-1), auth.OFFLINE_TEXT);
  assert.ok(auth.OFFLINE_TEXT.split(/\s+/).filter(w => w !== '–').length <= 8);
  assert.deepEqual(JSON.parse(localStorage.getItem('pending')), { progress: 1 });

  progress = 2; up = true;
  await new Promise(resolve => setTimeout(resolve, 60));   // the automatic retry
  assert.deepEqual(sent, [{ progress: 2 }]);
  assert.equal(localStorage.getItem('pending'), null);
  assert.equal(statuses.at(-1), 'Saved online');
});

test('a 401 while saving signs out but keeps the progress on this device', async t => {
  const auth = await setup(t);
  sessionStorage.setItem(TOKEN, 'abc');
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'expired' }, { status: 401 }));
  const sync = auth.createCloudSync(() => ({ progress: 3 }), () => {}, 'pending', 20);
  await assert.rejects(sync.flush());
  assert.equal(sessionStorage.getItem(TOKEN), null);
  assert.deepEqual(JSON.parse(localStorage.getItem('pending')), { progress: 3 });
});
