import test from 'node:test';
import assert from 'node:assert/strict';
import service, { ranked, validSave, totalMinigameTime } from '../api/_service.js';
import { newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding } from '../web/story/engine.js';
import { STATION_IDS } from '../web/story/case-1.js';
import { synchronizeScore } from '../web/story/scoring.js';
import { initialCatalogue } from '../web/minigames/catalogue-rules.js';
import { initialForgery } from '../web/minigames/forgery-rules.js';
import { initialPuzzle } from '../web/minigames/picture-rules.js';
import { correctOrder, initialTimeline } from '../web/minigames/portrait-rules.js';

const origin = 'https://florianstodden-afk.github.io';
const endpoint = 'https://example.vercel.app';
const env = { ALLOWED_ORIGINS: origin, APP_URL: `${origin}/Museum-Mystery/`, CALLBACK_URL: `${endpoint}/auth/callback`,
  GITHUB_CLIENT_ID: 'client-id', GITHUB_CLIENT_SECRET: 'test-secret' };

function database() {
  const states = new Map(), tickets = new Map(), sessions = new Map(), saves = new Map(), scores = new Map();
  return { expireStates() { for (const row of states.values()) row.expires_at = 0; },
    expireTickets() { for (const row of tickets.values()) row.expires_at = 0; },
    prepare(sql) {
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
  const progress = {
    landscape: { ...initialCatalogue(() => 0), slots: [0, 1, 2, 3], startedAt: 1000, finishedAt: 11000, solved: true },
    portraits: { ...initialTimeline(() => 0), order: correctOrder(), startedAt: 1000,
      flashUntil: 5000, finishedAt: 11000, solved: true },
    restoration: { ...initialPuzzle(() => 0), slots: Array.from({ length: 8 }, (_, i) => i),
      startedAt: 1000, finishedAt: 11000, solved: true },
    archive: { ...initialForgery(), found: [0, 1, 2], startedAt: 1000, finishedAt: 11000, solved: true },
  };
  state = synchronizeScore(state, progress);
  return { story: { story: JSON.stringify(state), progress }, walk: { player: { x: 11, y: 6 } } };
}

async function authorizationTicket(config, browserState = 'b'.repeat(64), githubUser = { id: 12345, login: 'verified-player' }) {
  const start = await service.fetch(request(`/auth/start?state=${browserState}`), config);
  assert.equal(start.status, 302);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes('access_token')
    ? { access_token: 'test-github-token' } : githubUser), { status: 200 });
  try {
    const callback = await service.fetch(request(`/auth/callback?state=${browserState}&code=code`), config);
    assert.equal(callback.status, 302);
    return new URLSearchParams(new URL(callback.headers.get('Location')).hash.slice(1)).get('auth_ticket');
  } finally { globalThis.fetch = originalFetch; }
}

async function authenticatedToken(config, browserState, githubUser) {
  const ticket = await authorizationTicket(config, browserState, githubUser);
  const response = await service.fetch(request('/auth/exchange', 'POST', null, { ticket }), config);
  assert.equal(response.status, 200);
  return (await response.json()).token;
}

test('legacy ranking shares places when time was not recorded', () => {
  assert.deepEqual(ranked([80,70,70,50].map((points,i) => ({ player_id: String(i), display_name: 'x', points, max_points: 80, ending: 'heist' }))).map(x => x.rank), [1,2,2,3]);
});

test('save validation rejects broken cases and accepts a finished current game', () => {
  assert.equal(validSave(wonSave()), true);
  assert.equal(validSave({ story: { story: JSON.stringify(newGame()), progress: {} },
    walk: { player: { x: 4, y: 5 } } }), true);
  assert.equal(validSave({ story: { story: '{}' }, walk: { player: { x: 1, y: 2 } } }), false);
  const change = update => {
    const snapshot = wonSave(), state = JSON.parse(snapshot.story.story);
    update(state, snapshot.story.progress);
    snapshot.story.story = JSON.stringify(state);
    return snapshot;
  };
  assert.equal(validSave(change(state => { state.evidence.pop(); })), false);
  assert.equal(validSave(change(state => { state.stations.portraits.points = 999; })), false);
  assert.equal(validSave(change(state => { state.stations.portraits.points = 10; })), false);
  assert.equal(validSave(change(state => { state.accusation.accused = 'vale'; })), false);
  assert.equal(validSave(change(state => { state.ending = 'lost'; })), false);
  const changedClock = wonSave();
  changedClock.story.progress.portraits.finishedAt = 60000;
  assert.equal(validSave(changedClock), false);
});

test('OAuth rejects invalid and expired requests, and forbids a foreign origin', async () => {
  const db = database(), config = { ...env, DB: db };
  assert.equal((await service.fetch(request('/auth/start?state=bad'), config)).status, 400);
  assert.equal((await service.fetch(new Request(`${endpoint}/runs`, { headers: { Origin: 'https://other.example' } }), config)).status, 403);
  assert.equal((await service.fetch(request('/auth/exchange', 'POST', null, { ticket: 'bad' }), config)).status, 400);
  const expiredState = 'c'.repeat(64);
  assert.equal((await service.fetch(request(`/auth/start?state=${expiredState}`), config)).status, 302);
  db.expireStates();
  assert.equal((await service.fetch(request(`/auth/callback?state=${expiredState}&code=code`), config)).status, 400);
  const ticket = await authorizationTicket(config);
  db.expireTickets();
  assert.equal((await service.fetch(request('/auth/exchange', 'POST', null, { ticket }), config)).status, 401);
});

test('authenticated save rejects invalid JSON, oversized input and impossible game data', async () => {
  const config = { ...env, DB: database() }, token = await authenticatedToken(config);
  const raw = (body, headers = {}) => new Request(`${endpoint}/save`, { method: 'PUT',
    headers: { Origin: origin, Authorization: `Bearer ${token}`, ...headers }, body });
  assert.equal((await service.fetch(raw('{broken'), config)).status, 400);
  assert.equal((await service.fetch(raw('x', { 'Content-Length': '100001' }), config)).status, 413);
  assert.equal((await service.fetch(raw('x'.repeat(100001)), config)).status, 413);
  const forged = wonSave(), story = JSON.parse(forged.story.story);
  story.evidence = [];
  forged.story.story = JSON.stringify(story);
  assert.equal((await service.fetch(request('/save', 'PUT', token, forged), config)).status, 400);
  assert.equal((await service.fetch(request('/save', 'PUT', token, wonSave()), config)).status, 200);
});

test('leaderboard rejects a completed story without four completed puzzle snapshots', async () => {
  const config = { ...env, DB: database() }, token = await authenticatedToken(config);
  const missingPuzzle = wonSave();
  delete missingPuzzle.story.progress.archive;
  assert.equal((await service.fetch(request('/save', 'PUT', token, missingPuzzle), config)).status, 200);
  assert.equal((await service.fetch(request('/runs', 'POST', token), config)).status, 409);
  assert.equal((await service.fetch(request('/save', 'PUT', token, wonSave()), config)).status, 200);
  assert.equal((await service.fetch(request('/runs', 'POST', token), config)).status, 200);
});

test('two GitHub accounts cannot read or overwrite one another’s saved case', async () => {
  const config = { ...env, DB: database() };
  const first = await authenticatedToken(config, 'd'.repeat(64), { id: 111, login: 'first-player' });
  const second = await authenticatedToken(config, 'e'.repeat(64), { id: 222, login: 'second-player' });
  const save = wonSave();
  assert.equal((await service.fetch(request('/save', 'PUT', first, save), config)).status, 200);
  assert.equal((await (await service.fetch(request('/save', 'GET', second), config)).json()).snapshot, null);
  assert.deepEqual((await (await service.fetch(request('/save', 'GET', first), config)).json()).snapshot, save);
  const otherSave = structuredClone(save);
  otherSave.walk.player.x = 2;
  assert.equal((await service.fetch(request('/save', 'PUT', second, otherSave), config)).status, 200);
  assert.deepEqual((await (await service.fetch(request('/save', 'GET', first), config)).json()).snapshot, save);
  assert.deepEqual((await (await service.fetch(request('/save', 'GET', second), config)).json()).snapshot, otherSave);
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
