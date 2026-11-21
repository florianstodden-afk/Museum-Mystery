import test from 'node:test';
import assert from 'node:assert/strict';
import service, { ranked, validSave, totalMinigameTime } from '../api/_service.js';
import { newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding } from '../web/story/engine.js';
import { STATION_IDS } from '../web/story/case-1.js';

const origin = 'https://florianstodden-afk.github.io';
const endpoint = 'https://example.vercel.app';
const env = { ALLOWED_ORIGINS: origin, APP_URL: `${origin}/Museum-Mystery/`, CALLBACK_URL: `${endpoint}/auth/callback`,
  GITHUB_CLIENT_ID: 'client-id', GITHUB_CLIENT_SECRET: 'test-secret' };

function database() {
  const states = new Map(), tickets = new Map(), sessions = new Map(), saves = new Map(), scores = new Map();
  return { prepare(sql) {
    let args = [];
    return { bind(...values) { args = values; return this; },
      async first() {
        if (sql.includes('FROM oauth_states')) { const row = states.get(args[0]); return row?.expires_at > args[1] ? row : null; }
        if (sql.includes('FROM login_tickets')) { const row = tickets.get(args[0]); return row?.expires_at > args[1] ? row : null; }
        if (sql.includes('FROM sessions')) { const row = sessions.get(args[0]); return row?.expires_at > args[1] ? row : null; }
        if (sql.includes('FROM saves')) return saves.get(args[0]) || null;
        throw new Error(`Unexpected query ${sql}`);
      },
      async all() { return { results: [...scores.values()].sort((a,b) => b.points-a.points) }; },
      async run() {
        if (sql.startsWith('INSERT INTO oauth_states')) states.set(args[0], { verifier: args[1], expires_at: args[2] });
        else if (sql.startsWith('DELETE FROM oauth_states')) states.delete(args[0]);
        else if (sql.startsWith('INSERT INTO login_tickets')) tickets.set(args[0], { github_id: args[1], login: args[2], expires_at: args[3] });
        else if (sql.startsWith('DELETE FROM login_tickets')) tickets.delete(args[0]);
        else if (sql.startsWith('INSERT INTO sessions')) sessions.set(args[0], { github_id: args[1], login: args[2], expires_at: args[3] });
        else if (sql.startsWith('DELETE FROM sessions')) sessions.delete(args[0]);
        else if (sql.startsWith('INSERT INTO saves')) saves.set(args[0], { snapshot: args[1] });
        else if (sql.startsWith('INSERT INTO leaderboard')) {
          const old = scores.get(args[0]);
          if (!old || args[2] > old.points) scores.set(args[0], { player_id: args[0], display_name: args[1], points: args[2], max_points: 80, ending: args[3] });
        } else throw new Error(`Unexpected update ${sql}`);
        return { success: true };
      },
    };
  } };
}

function request(path, method = 'GET', token = null, body = null) {
  return new Request(endpoint + path, { method, headers: { Origin: origin, ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

function wonSave() {
  let state = readMission(newGame()).state;
  for (const id of STATION_IDS) state = solveStation(state, id).state;
  state = tryOpenSafe(state, 'OILS').state;
  state = accuse(state, 'voss').state;
  state = chooseEnding(state, 'heist').state;
  return { story: { story: JSON.stringify(state), progress: {} }, walk: { player: { x: 12, y: 7 } } };
}

test('legacy ranking shares places when time was not recorded', () => {
  assert.deepEqual(ranked([80,70,70,50].map((points,i) => ({ player_id: String(i), display_name: 'x', points, max_points: 80, ending: 'heist' }))).map(x => x.rank), [1,2,2,3]);
});

test('save validation rejects broken cases and accepts a finished current game', () => {
  assert.equal(validSave(wonSave()), true);
  assert.equal(validSave({ story: { story: '{}' }, walk: { player: { x: 1, y: 2 } } }), false);
});

test('GitHub identity gates cloud saves and ranking submissions', async () => {
  const config = { ...env, DB: database() };
  assert.equal((await service.fetch(request('/save'), config)).status, 401);
  assert.equal((await service.fetch(request('/runs', 'POST'), config)).status, 401);
  assert.equal((await service.fetch(request('/runs'), config)).status, 401);
  const browserState = 'a'.repeat(64);
  const start = await service.fetch(request(`/auth/start?state=${browserState}`), config);
  assert.equal(start.status, 302);
  const authorize = new URL(start.headers.get('Location'));
  assert.equal(authorize.hostname, 'github.com');
  assert.equal(authorize.searchParams.get('state'), browserState);
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes('access_token')
    ? { access_token: 'github-token' } : { id: 12345, login: 'verified-player' }), { status: 200 });
  try {
    const callback = await service.fetch(request(`/auth/callback?state=${authorize.searchParams.get('state')}&code=code`), config);
    assert.equal(callback.status, 302);
    const returned = new URL(callback.headers.get('Location'));
    assert.equal(new URLSearchParams(returned.hash.slice(1)).get('auth_state'), browserState);
    const onlyTicket = new URLSearchParams(returned.hash.slice(1)).get('auth_ticket');
    const exchange = await service.fetch(request('/auth/exchange', 'POST', null, { ticket: onlyTicket }), config);
    assert.equal(exchange.status, 200);
    const token = (await exchange.json()).token;
    assert.equal((await service.fetch(request('/auth/exchange', 'POST', null, { ticket: onlyTicket }), config)).status, 401);
    assert.equal((await service.fetch(request('/save', 'PUT', token, wonSave()), config)).status, 200);
    assert.equal((await service.fetch(request('/runs', 'POST', token), config)).status, 200);
    const list = await service.fetch(request('/runs', 'GET', token), config);
    assert.equal((await list.json()).entries[0].name, 'verified-player');
    assert.equal((await service.fetch(request('/auth/logout', 'POST', token), config)).status, 200);
    assert.equal((await service.fetch(request('/save', 'GET', token), config)).status, 401);
  } finally { globalThis.fetch = originalFetch; }
});


test('ranking breaks equal scores by total time and preserves unknown old times', () => {
  const rows=[[80,60000],[80,60000],[80,90000],[80,null],[70,10000]].map(([points,total_time_ms],i)=>({player_id:String(i),display_name:'x',points,max_points:80,ending:'heist',total_time_ms}));
  const result=ranked(rows);
  assert.deepEqual(result.map(x=>x.rank),[1,1,2,3,4]);
  assert.deepEqual(result.map(x=>x.totalTimeMs),[60000,60000,90000,null,10000]);
});


test('tiebreak time sums all four minigames and excludes incomplete or historic timings', () => {
  const board={stations:[1000,2200,3300,4500].map(timeMs=>({solved:true,timeMs}))};
  assert.equal(totalMinigameTime(board),11000);
  board.stations[1].timeMs=null;
  assert.equal(totalMinigameTime(board),null);
  board.stations[1]={solved:false,timeMs:2000};
  assert.equal(totalMinigameTime(board),null);
});
