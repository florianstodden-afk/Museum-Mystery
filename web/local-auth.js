// Device-only profiles for the static GitHub Pages game.
// These checks are for a local game menu, not server authentication.
export const ACCOUNTS_KEY = 'museum-mystery-local-accounts-v1';
export const SESSION_KEY = 'museum-mystery-active-profile-v1';

function normalizedName(name) { return String(name).trim().toLowerCase(); }
function validName(name) { return /^[a-z0-9_-]{3,24}$/.test(name); }
function toBase64(bytes) { return btoa(String.fromCharCode(...bytes)); }
function fromBase64(value) { return Uint8Array.from(atob(value), character => character.charCodeAt(0)); }

function readAccounts(storage) {
  const value = storage.getItem(ACCOUNTS_KEY);
  if (!value) return [];
  const accounts = JSON.parse(value);
  if (!Array.isArray(accounts)) throw new Error('Stored accounts are unreadable on this device.');
  return accounts;
}

async function verifier(password, salt, cryptoApi) {
  const passwordKey = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await cryptoApi.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, passwordKey, 256);
  return new Uint8Array(bits);
}

export async function registerLocalAccount(storage, username, password, cryptoApi = globalThis.crypto) {
  const name = normalizedName(username);
  if (!validName(name)) return { ok: false, message: 'Use 3–24 letters, numbers, _ or - for your username.' };
  if (password.length < 8 || password.length > 128) return { ok: false, message: 'Use a password with 8–128 characters.' };
  try {
    const accounts = readAccounts(storage);
    if (accounts.some(account => account.name === name)) return { ok: false, message: 'This username already exists on this device.' };
    const salt = cryptoApi.getRandomValues(new Uint8Array(16));
    const hash = await verifier(password, salt, cryptoApi);
    storage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, { name, salt: toBase64(salt), hash: toBase64(hash) }]));
    return { ok: true, username: name };
  } catch {
    return { ok: false, message: 'This browser could not save the account. Try guest play.' };
  }
}

export async function logInLocalAccount(storage, username, password, cryptoApi = globalThis.crypto) {
  const name = normalizedName(username);
  try {
    const account = readAccounts(storage).find(item => item.name === name);
    if (!account) return { ok: false, message: 'Username or password does not match on this device.' };
    const expected = fromBase64(account.hash);
    const actual = await verifier(password, fromBase64(account.salt), cryptoApi);
    const matches = expected.length === actual.length && expected.every((value, index) => value === actual[index]);
    return matches ? { ok: true, username: name } : { ok: false, message: 'Username or password does not match on this device.' };
  } catch {
    return { ok: false, message: 'This browser could not read the account. Try guest play.' };
  }
}

export function profileStorageKey(base, username) {
  return username ? `${base}:profile:${normalizedName(username)}` : base;
}
