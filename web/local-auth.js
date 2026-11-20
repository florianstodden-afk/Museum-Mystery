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

// Checks the form before anything is stored. The page shows `message` and marks `field`.
// Same rules for Log In and Sign Up: 3–24 characters a–z 0–9 _ -, password 8–128 characters.
export const ENTRY_MESSAGES = Object.freeze({
  empty: 'Enter a username and a password.',
  emptyName: 'Enter a username.',
  emptyPassword: 'Enter a password.',
  name: 'Use 3–24 letters, numbers, _ or - for your username.',
  password: 'Use a password with 8–128 characters.',
});
export function checkEntryInput(username, password) {
  const name = normalizedName(username ?? '');
  const secret = String(password ?? '');
  if (!name && !secret) return { ok: false, field: 'username', message: ENTRY_MESSAGES.empty };
  if (!name) return { ok: false, field: 'username', message: ENTRY_MESSAGES.emptyName };
  if (!validName(name)) return { ok: false, field: 'username', message: ENTRY_MESSAGES.name };
  if (!secret) return { ok: false, field: 'password', message: ENTRY_MESSAGES.emptyPassword };
  if (secret.length < 8 || secret.length > 128) return { ok: false, field: 'password', message: ENTRY_MESSAGES.password };
  return { ok: true };
}

export async function registerLocalAccount(storage, username, password, cryptoApi = globalThis.crypto) {
  const name = normalizedName(username);
  const input = checkEntryInput(username, password);
  if (!input.ok) return input;
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
  const input = checkEntryInput(username, password);
  if (!input.ok) return input;
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
