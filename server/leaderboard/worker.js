import { deserialize } from '../../web/story/save.js';
import { scoreboard, synchronizeScore } from '../../web/story/scoring.js';

const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
const reply = (value, status = 200, origin = null) => new Response(JSON.stringify(value), { status, headers: {
  'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
} });
const redirect = url => new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } });

export function ranked(rows) {
  let last = null, rank = 0;
  return rows.map(row => {
    if (row.points !== last) rank++;
    last = row.points;
    return { rank, playerId: row.player_id, name: row.display_name, points: row.points, max: row.max_points, ending: row.ending };
  });
}

async function readBody(request, limit = 100000) {
  if (Number(request.headers.get('Content-Length') || 0) > limit) throw new Error('Request too large.');
  const text = await request.text();
  if (text.length > limit) throw new Error('Request too large.');
  try { return JSON.parse(text); } catch { throw new Error('Invalid JSON.'); }
}

async function identity(request, env) {
  const bearer = request.headers.get('Authorization') || '';
  if (!/^Bearer [a-f0-9]{64}$/.test(bearer)) return null;
  return env.DB.prepare('SELECT github_id, login FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await hash(bearer.slice(7)), Date.now()).first();
}

export function validSave(snapshot) {
  try {
    if (!snapshot || JSON.stringify(snapshot).length > 90000) return false;
    const state = deserialize(snapshot.story?.story);
    const player = snapshot.walk?.player;
    return Boolean(state && snapshot.story.progress && typeof snapshot.story.progress === 'object'
      && Number.isFinite(player?.x) && Number.isFinite(player?.y));
  } catch { return false; }
}

async function start(url, env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.CALLBACK_URL || !env.APP_URL) return reply({ error: 'GitHub login is not configured.' }, 503);
  const state = url.searchParams.get('state');
  if (!/^[a-f0-9]{64}$/.test(state || '')) return reply({ error: 'Invalid sign-in request.' }, 400);
  const verifier = random();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await env.DB.prepare('INSERT INTO oauth_states (state_hash, verifier, expires_at) VALUES (?, ?, ?)')
    .bind(await hash(state), verifier, Date.now() + 600000).run();
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  for (const [key, value] of Object.entries({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: env.CALLBACK_URL, state,
    code_challenge: challenge, code_challenge_method: 'S256', scope: 'read:user' })) authUrl.searchParams.set(key, value);
  return redirect(authUrl.href);
}

async function callback(url, env) {
  if (url.searchParams.get('error')) return redirect(`${env.APP_URL}#auth_error=cancelled`);
  const state = url.searchParams.get('state'), code = url.searchParams.get('code');
  if (!state || !code) return reply({ error: 'Missing GitHub response.' }, 400);
  const stateHash = await hash(state);
  const saved = await env.DB.prepare('SELECT verifier FROM oauth_states WHERE state_hash = ? AND expires_at > ?')
    .bind(stateHash, Date.now()).first();
  if (!saved) return reply({ error: 'Login expired. Try again.' }, 400);
  await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash = ?').bind(stateHash).run();
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
      code, redirect_uri: env.CALLBACK_URL, code_verifier: saved.verifier }) });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) return reply({ error: 'GitHub login failed.' }, 502);
  const userResponse = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token.access_token}`,
    Accept: 'application/vnd.github+json', 'User-Agent': 'Museum-Mystery' } });
  const user = await userResponse.json();
  if (!userResponse.ok || !Number.isSafeInteger(user.id) || !/^[A-Za-z0-9-]{1,39}$/.test(user.login)) return reply({ error: 'GitHub identity unavailable.' }, 502);
  const ticket = random();
  await env.DB.prepare('INSERT INTO login_tickets (ticket_hash, github_id, login, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await hash(ticket), String(user.id), user.login, Date.now() + 120000).run();
  return redirect(`${env.APP_URL}#auth_ticket=${ticket}&auth_state=${state}`);
}

async function exchange(request, env, origin) {
  const value = await readBody(request, 256);
  if (!/^[a-f0-9]{64}$/.test(value?.ticket || '')) return reply({ error: 'Invalid login ticket.' }, 400, origin);
  const ticketHash = await hash(value.ticket);
  const ticket = await env.DB.prepare('SELECT github_id, login FROM login_tickets WHERE ticket_hash = ? AND expires_at > ?')
    .bind(ticketHash, Date.now()).first();
  if (!ticket) return reply({ error: 'Login expired. Try again.' }, 401, origin);
  await env.DB.prepare('DELETE FROM login_tickets WHERE ticket_hash = ?').bind(ticketHash).run();
  const sessionToken = random();
  await env.DB.prepare('INSERT INTO sessions (token_hash, github_id, login, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await hash(sessionToken), ticket.github_id, ticket.login, Date.now() + 604800000).run();
  return reply({ token: sessionToken, user: { id: ticket.github_id, login: ticket.login } }, 200, origin);
}

async function publish(env, user, origin) {
  const row = await env.DB.prepare('SELECT snapshot FROM saves WHERE github_id = ?').bind(user.github_id).first();
  if (!row) return reply({ error: 'Save a finished run first.' }, 409, origin);
  const snapshot = JSON.parse(row.snapshot);
  if (!validSave(snapshot)) return reply({ error: 'Saved game is invalid.' }, 409, origin);
  const state = synchronizeScore(deserialize(snapshot.story.story), snapshot.story.progress);
  const board = scoreboard(state, snapshot.story.progress);
  if (!board.finished || board.ending === 'lost' || board.max !== 80) return reply({ error: 'Finish a winning current run first.' }, 409, origin);
  await env.DB.prepare(`INSERT INTO leaderboard (player_id, display_name, points, max_points, ending) VALUES (?, ?, ?, 80, ?)
    ON CONFLICT(player_id) DO UPDATE SET display_name=excluded.display_name, points=excluded.points,
    ending=excluded.ending, created_at=CURRENT_TIMESTAMP WHERE excluded.points > leaderboard.points`)
    .bind(`github:${user.github_id}`, user.login, board.points, board.ending).run();
  return reply({ ok: true, points: board.points }, 200, origin);
}

export default { async fetch(request, env) {
  const origin = request.headers.get('Origin');
  if (origin && !(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).includes(origin)) return reply({ error: 'Origin not allowed.' }, 403);
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': origin || '', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type', Vary: 'Origin' } });
  if (!env.DB) return reply({ error: 'Database not configured.' }, 503, origin);
  try {
    if (path === '/auth/start' && method === 'GET') return start(url, env);
    if (path === '/auth/callback' && method === 'GET') return callback(url, env);
    if (path === '/auth/exchange' && method === 'POST') return exchange(request, env, origin);
    const user = await identity(request, env);
    if (!user) return reply({ error: 'Sign in with GitHub first.' }, 401, origin);
    if (path === '/runs' && method === 'GET') {
      const rows = await env.DB.prepare("SELECT player_id, display_name, points, max_points, ending FROM leaderboard WHERE player_id LIKE 'github:%' ORDER BY points DESC, created_at ASC, player_id ASC LIMIT 25").all();
      return reply({ entries: ranked(rows.results || []) }, 200, origin);
    }
    if (path === '/auth/me' && method === 'GET') return reply({ user: { id: user.github_id, login: user.login } }, 200, origin);
    if (path === '/auth/logout' && method === 'POST') {
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(request.headers.get('Authorization').slice(7))).run();
      return reply({ ok: true }, 200, origin);
    }
    if (path === '/save' && method === 'GET') {
      const row = await env.DB.prepare('SELECT snapshot FROM saves WHERE github_id = ?').bind(user.github_id).first();
      return reply({ snapshot: row ? JSON.parse(row.snapshot) : null }, 200, origin);
    }
    if (path === '/save' && method === 'PUT') {
      const snapshot = await readBody(request);
      if (!validSave(snapshot)) return reply({ error: 'Invalid game save.' }, 400, origin);
      await env.DB.prepare('INSERT INTO saves (github_id, snapshot) VALUES (?, ?) ON CONFLICT(github_id) DO UPDATE SET snapshot=excluded.snapshot, updated_at=CURRENT_TIMESTAMP')
        .bind(user.github_id, JSON.stringify(snapshot)).run();
      return reply({ ok: true }, 200, origin);
    }
    if (path === '/runs' && method === 'POST') return publish(env, user, origin);
    return reply({ error: 'Not found.' }, 404, origin);
  } catch (error) {
    const status = error.message === 'Request too large.' ? 413 : error.message === 'Invalid JSON.' ? 400 : 503;
    return reply({ error: status === 503 ? 'Service unavailable. Try again later.' : error.message }, status, origin);
  }
} };
