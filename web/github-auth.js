import { LEADERBOARD_URL } from './leaderboard-config.js';

const TOKEN_KEY = 'museum-mystery-github-session-v1';
const STATE_KEY = 'museum-mystery-github-oauth-state-v1';
const USER_KEY = 'museum-mystery-github-user-v1';   // last known account, for playing on while offline
export const OFFLINE_TEXT = 'Offline – progress saved on this device.';
const ONLINE_GAME_URL = 'https://museum-mystery.vercel.app/';
const endpoint = path => `${LEADERBOARD_URL.replace(/\/$/, '')}${path}`;

export function loginUrl() {
  if (!LEADERBOARD_URL) return typeof location !== 'undefined' && location.hostname.endsWith('github.io')
    ? `${ONLINE_GAME_URL}?github-login=1` : null;
  const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(STATE_KEY, state);
  return `${endpoint('/auth/start')}?state=${state}`;
}
export function sessionToken() { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function clearSession() { try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); } catch {} }
// Only a real "401 Unauthorized" from our server ends the session. Network errors, timeouts and 5xx keep it.
export function isUnauthorized(error) { return error?.status === 401; }

export async function api(path, options = {}) {
  if (!LEADERBOARD_URL) throw new Error('GitHub login is not connected yet.');
  const token = sessionToken();
  const response = await fetch(endpoint(path), { ...options, headers: {
    Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers,
  }, signal: AbortSignal.timeout(10000) });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(value.error || 'Online service unavailable.'), { status: response.status });
  return value;
}

export async function initialSession(locationObject = location, historyObject = history) {
  const fragment = new URLSearchParams(locationObject.hash.slice(1));
  const ticket = fragment.get('auth_ticket');
  const returnedState = fragment.get('auth_state');
  const denied = fragment.has('auth_error');
  if (ticket || denied) historyObject.replaceState(null, '', locationObject.pathname + locationObject.search);
  if (denied) return { user: null, save: null, error: 'GitHub sign-in was cancelled.' };
  try {
    if (ticket) {
      const expectedState = sessionStorage.getItem(STATE_KEY);
      sessionStorage.removeItem(STATE_KEY);
      if (!expectedState || returnedState !== expectedState) throw new Error('GitHub sign-in did not match this browser. Please try again.');
      const result = await api('/auth/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }) });
      sessionStorage.setItem(TOKEN_KEY, result.token);
    }
    if (!sessionToken()) return { user: null, save: null, error: null };
    const { user } = await api('/auth/me');
    try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
    const { snapshot } = await api('/save');
    return { user, save: snapshot, error: null };
  } catch (error) {
    // Offline or server trouble: keep the login and play on with this device's copy of the save.
    const known = !isUnauthorized(error) && sessionToken() ? cachedUser() : null;
    if (known) return { user: known, save: null, error: null, offline: true };
    if (isUnauthorized(error)) clearSession();
    return { user: null, save: null, error: error.message };
  }
}

function cachedUser() {
  try { const user = JSON.parse(sessionStorage.getItem(USER_KEY)); return user && user.id != null ? user : null; } catch { return null; }
}

export async function signOut() {
  try { await api('/auth/logout', { method: 'POST' }); } catch {}
  clearSession();
}

export function createCloudSync(snapshot, onStatus = () => {}, pendingKey = null, retryMs = 15000) {
  let timer = null, pending = false, inFlight = null;
  async function uploadPending() {
    try {
      while (pending) {
        pending = false;
        try {
          await api('/save', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot()) });
          try { if (pendingKey) localStorage.removeItem(pendingKey); } catch {}
          onStatus('Saved online');
        } catch (error) {
          if (isUnauthorized(error)) { clearSession(); onStatus('Signed out – progress saved on this device.'); }
          else { pending = true; onStatus(OFFLINE_TEXT); clearTimeout(timer); timer = setTimeout(() => { send().catch(() => {}); }, retryMs); }
          // Remember the newest state; it is sent automatically with the next successful request.
          try { if (pendingKey) localStorage.setItem(pendingKey, JSON.stringify(snapshot())); } catch {}
          throw error;
        }
      }
    } finally { inFlight = null; }
  }
  function send() {
    if (!inFlight && pending) inFlight = uploadPending();
    return inFlight ?? Promise.resolve();
  }
  return {
    schedule() { pending = true; clearTimeout(timer); timer = setTimeout(() => { send().catch(() => {}); }, 1200); },
    async flush() { pending = true; clearTimeout(timer); await send(); },
  };
}
