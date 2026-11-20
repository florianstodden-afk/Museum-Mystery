import { LEADERBOARD_URL } from './leaderboard-config.js';

const ID_KEY = 'museum-mystery-leaderboard-id-v1';

export function publicPlayer(storage, profile) {
  const key = `${ID_KEY}:${profile || 'guest'}`;
  let id = storage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(key, id);
  }
  return { playerId: id, name: profile || `Guest-${id.slice(0, 8)}` };
}

export function canPublish(board) {
  return board.finished && board.max === 80 && Number.isInteger(board.points)
    && board.points >= 0 && board.points <= 80;
}

async function request(path, options = {}) {
  if (!LEADERBOARD_URL) throw new Error('Online leaderboard is not connected yet.');
  const response = await fetch(`${LEADERBOARD_URL.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Leaderboard unavailable. Try again later.');
  return data;
}

export function loadLeaderboard() { return request('/runs'); }

export function publishRun(board, ending, player) {
  if (!canPublish(board) || !['heist', 'open-file'].includes(ending)) throw new Error('Finish a current game before publishing.');
  return request('/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...player, points: board.points, max: board.max, ending }),
  });
}

export function renderLeaderboard(container, entries, ownId) {
  const table = document.createElement('table');
  table.className = 'leaderboard-table';
  const caption = document.createElement('caption');
  caption.textContent = 'Shared results';
  table.append(caption);
  const head = document.createElement('thead');
  const header = document.createElement('tr');
  for (const title of ['Place', 'Player', 'Points', 'Ending']) {
    const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = title; header.append(cell);
  }
  head.append(header); table.append(head);
  const body = document.createElement('tbody');
  for (const entry of entries) {
    const row = document.createElement('tr');
    if (entry.playerId === ownId) row.className = 'is-own-run';
    for (const value of [entry.rank, entry.name, `${entry.points} / ${entry.max}`, entry.ending === 'heist' ? 'Thief' : 'Not a thief']) {
      const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell);
    }
    body.append(row);
  }
  table.append(body);
  container.replaceChildren(table);
  if (!entries.length) {
    const empty = document.createElement('p'); empty.className = 'leaderboard-empty';
    empty.textContent = 'No published runs yet.'; container.append(empty);
  }
}
