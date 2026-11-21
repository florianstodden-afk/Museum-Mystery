import { api } from './github-auth.js';
import { formatClock } from './story/scoring.js';

export function canPublish(board) {
  return board.finished && board.ending !== 'lost' && board.max === 80
    && Number.isInteger(board.points) && board.points >= 0 && board.points <= 80;
}

export function loadLeaderboard() { return api('/runs'); }
export function publishRun(board) {
  if (!canPublish(board)) throw new Error('Finish a winning current game before publishing.');
  return api('/runs', { method: 'POST' });
}

export function renderLeaderboard(container, entries, ownId) {
  const table = document.createElement('table');
  table.className = 'leaderboard-table';
  const caption = document.createElement('caption'); caption.textContent = 'Shared results'; table.append(caption);
  const head = document.createElement('thead'), header = document.createElement('tr');
  for (const title of ['Place', 'Player', 'Points', 'Minigame time', 'Ending']) {
    const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = title; header.append(cell);
  }
  head.append(header); table.append(head);
  const body = document.createElement('tbody');
  for (const entry of entries) {
    const row = document.createElement('tr');
    if (entry.playerId === ownId) row.className = 'is-own-run';
    for (const value of [entry.rank, entry.name, `${entry.points} / ${entry.max}`, entry.totalTimeMs == null ? '–' : formatClock(entry.totalTimeMs), entry.ending === 'heist' ? 'Thief' : 'Not a thief']) {
      const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell);
    }
    body.append(row);
  }
  table.append(body); container.replaceChildren(table);
  if (!entries.length) {
    const empty = document.createElement('p'); empty.className = 'leaderboard-empty'; empty.textContent = 'No published runs yet.'; container.append(empty);
  }
}
