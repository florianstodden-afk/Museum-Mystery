import test from 'node:test';
import assert from 'node:assert/strict';
import { accountStorage, accountStorageKey, setCurrentAccount } from './account.js';

test('game progress is separated by account ID', () => {
  const saved = new Map();
  const storage = {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  };
  const flo = { id: 'user_flo', username: 'Flo' };
  const leo = { id: 'user_leo', username: 'Leo' };
  accountStorage(storage, flo).setItem('portrait-best', '31');
  accountStorage(storage, leo).setItem('portrait-best', '42');
  assert.equal(accountStorage(storage, flo).getItem('portrait-best'), '31');
  assert.equal(accountStorage(storage, leo).getItem('portrait-best'), '42');
  assert.notEqual(accountStorageKey('story', flo), accountStorageKey('story', leo));
  setCurrentAccount(null);
  assert.throws(() => accountStorageKey('story'), /account is required/i);
});
