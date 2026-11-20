import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNTS_KEY, registerLocalAccount, logInLocalAccount, profileStorageKey } from './local-auth.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('a local account can sign up and log in without storing the password as text', async () => {
  const storage = memoryStorage();
  assert.deepEqual(await registerLocalAccount(storage, '  Player_1  ', 'museum-pass-2026'), { ok: true, username: 'player_1' });
  const saved = storage.getItem(ACCOUNTS_KEY);
  assert.equal(saved.includes('museum-pass-2026'), false);
  assert.deepEqual(await logInLocalAccount(storage, 'PLAYER_1', 'museum-pass-2026'), { ok: true, username: 'player_1' });
  assert.equal((await logInLocalAccount(storage, 'player_1', 'wrong-password')).ok, false);
});

test('usernames are unique on one device and profiles receive different save keys', async () => {
  const storage = memoryStorage();
  await registerLocalAccount(storage, 'Flo', 'password-one');
  assert.equal((await registerLocalAccount(storage, 'FLO', 'password-two')).ok, false);
  assert.notEqual(profileStorageKey('game-save', 'Flo'), profileStorageKey('game-save', 'Leo'));
  assert.equal(profileStorageKey('game-save', null), 'game-save');
});

test('bad input or unavailable storage does not create an account', async () => {
  const storage = memoryStorage();
  assert.equal((await registerLocalAccount(storage, 'a', 'password-one')).ok, false);
  assert.equal((await registerLocalAccount(storage, 'player', 'short')).ok, false);
  assert.equal(storage.getItem(ACCOUNTS_KEY), null);
  const blocked = { getItem() { throw new Error('blocked'); } };
  assert.equal((await registerLocalAccount(blocked, 'player', 'password-one')).ok, false);
});

import { checkEntryInput, ENTRY_MESSAGES } from './local-auth.js';
test('the form check names the wrong field with a short message, and nothing is stored', async () => {
  const storage = memoryStorage();
  const cases = [
    ['', '', 'username', ENTRY_MESSAGES.empty],
    ['', 'password-one', 'username', ENTRY_MESSAGES.emptyName],
    ['player', '', 'password', ENTRY_MESSAGES.emptyPassword],
    ['ab', 'password-one', 'username', ENTRY_MESSAGES.name],
    ['bad name!', 'password-one', 'username', ENTRY_MESSAGES.name],
    ['x'.repeat(25), 'password-one', 'username', ENTRY_MESSAGES.name],
    ['player', 'short', 'password', ENTRY_MESSAGES.password],
    ['player', 'p'.repeat(129), 'password', ENTRY_MESSAGES.password],
  ];
  for (const [name, password, field, message] of cases) {
    assert.deepEqual(checkEntryInput(name, password), { ok: false, field, message }, `${name}/${password.length}`);
    const signUp = await registerLocalAccount(storage, name, password);
    assert.equal(signUp.ok, false);
    assert.equal(signUp.message, message, 'Sign Up shows the same message');
    assert.equal((await logInLocalAccount(storage, name, password)).message, message, 'Log In too');
  }
  assert.equal(storage.getItem(ACCOUNTS_KEY), null, 'no account was created');
  assert.deepEqual(checkEntryInput('Player_1', 'password-one'), { ok: true });
});
