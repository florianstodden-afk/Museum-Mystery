import test from 'node:test';
import assert from 'node:assert/strict';
import { canPublish } from './leaderboard.js';
import { initialSession, loginUrl } from './github-auth.js';

test('only current winning runs can enter the shared leaderboard', () => {
  assert.equal(canPublish({ finished: true, ending: 'heist', points: 70, max: 80 }), true);
  assert.equal(canPublish({ finished: true, ending: 'lost', points: 70, max: 80 }), false);
  assert.equal(canPublish({ finished: false, ending: null, points: 70, max: 80 }), false);
  assert.equal(canPublish({ finished: true, ending: 'open-file', points: 87, max: 90 }), false);
});

test('cancelled GitHub login clears the callback fragment', async () => {
  let replaced = null;
  const result = await initialSession({ hash: '#auth_error=cancelled', pathname: '/Museum-Mystery/', search: '' },
    { replaceState: (_state, _title, url) => { replaced = url; } });
  assert.equal(result.user, null);
  assert.equal(replaced, '/Museum-Mystery/');
  assert.equal(loginUrl(), null); // A plain local server has no online login.
});

test('GitHub Pages login hands off to the Vercel game before starting OAuth', () => {
  const originalLocation = globalThis.location;
  globalThis.location = { hostname: 'florianstodden-afk.github.io' };
  try { assert.equal(loginUrl(), 'https://museum-mystery.vercel.app/?github-login=1'); }
  finally { if (originalLocation === undefined) delete globalThis.location; else globalThis.location = originalLocation; }
});

test('login ticket from another browser is rejected before exchange', async () => {
  const original = globalThis.sessionStorage;
  globalThis.sessionStorage = { getItem: () => 'expected', removeItem: () => {} };
  try {
    const result = await initialSession({ hash: '#auth_ticket=ticket&auth_state=other', pathname: '/', search: '' },
      { replaceState: () => {} });
    assert.match(result.error, /did not match this browser/);
    assert.equal(result.user, null);
  } finally { globalThis.sessionStorage = original; }
});
