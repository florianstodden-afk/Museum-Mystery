import { LEADERBOARD_URL } from './leaderboard-config.js';

const TOKEN_KEY = 'museum-mystery-github-session-v1';
const STATE_KEY = 'museum-mystery-github-oauth-state-v1';
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
export function clearSession() { try { sessionStorage.removeItem(TOKEN_KEY); } catch {} }

export async function api(path, options = {}) {
  if (!LEADERBOARD_URL) throw new Error('GitHub login is not connected yet.');
  const token = sessionToken();
  const response = await fetch(endpoint(path), { ...options, headers: {
    Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers,
  }, signal: AbortSignal.timeout(10000) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Online service unavailable.');
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
    const { snapshot } = await api('/save');
    return { user, save: snapshot, error: null };
  } catch (error) {
    clearSession();
    return { user: null, save: null, error: error.message };
  }
}

export async function signOut() {
  try { await api('/auth/logout', { method: 'POST' }); } catch {}
  clearSession();
}

export function createCloudSync(snapshot, onStatus = () => {}, pendingKey = null) {
  let timer = null, pending = false, running = false;
  async function send() {
    if (running || !pending) return;
    running = true;
    try {
      while (pending) {
        pending = false;
        try {
          await api('/save', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot()) });
          try { if (pendingKey) localStorage.removeItem(pendingKey); } catch {}
          onStatus('Saved online');
        } catch (error) {
          pending = true;
          try { if (pendingKey) localStorage.setItem(pendingKey, JSON.stringify(snapshot())); } catch {}
          onStatus('Online save unavailable; progress remains on this device.'); throw error;
        }
      }
    } finally { running = false; }
  }
  return {
    schedule() { pending = true; clearTimeout(timer); timer = setTimeout(() => { send().catch(() => {}); }, 1200); },
    async flush() { pending = true; clearTimeout(timer); await send(); },
  };
}
