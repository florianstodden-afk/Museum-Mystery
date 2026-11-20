// Finished runs of every local profile and guest on this device, for the home scoreboard.
// Nothing leaves the browser. Broken or blocked storage simply means "no runs yet".
import { el } from './dom.js';
import { formatClock } from './scoring.js';

export const LOCAL_RUNS_KEY = 'museum-mystery-local-runs-v1';
const KEEP = 50;        // stored runs
export const SHOWN = 10; // rows on the scoreboard

function validEntry(run) {
  return run !== null && typeof run === 'object'
    && typeof run.name === 'string' && run.name.length > 0 && run.name.length <= 40
    && Number.isInteger(run.points) && Number.isInteger(run.max) && run.points >= 0 && run.points <= run.max
    && (run.timeMs === null || (Number.isFinite(run.timeMs) && run.timeMs >= 0))
    && (run.status === 'Won' || run.status === 'Lost');
}

/** More points first; on a tie the shorter time; a run without a time comes last. */
export function compareRuns(a, b) {
  if (a.points !== b.points) return b.points - a.points;
  return (a.timeMs ?? Infinity) - (b.timeMs ?? Infinity);
}

export function localRunsStore(storage, key = LOCAL_RUNS_KEY) {
  function all() {
    try {
      const list = JSON.parse(storage?.getItem(key));
      return Array.isArray(list) ? list.filter(validEntry) : [];
    } catch { return []; }
  }
  return {
    all,
    top(limit = SHOWN) { return [...all()].sort(compareRuns).slice(0, limit); },
    add(run) {
      if (!storage || !validEntry(run)) return false;
      const entry = { name: run.name, points: run.points, max: run.max, timeMs: run.timeMs, status: run.status };
      const kept = [...all(), entry].sort(compareRuns).slice(0, KEEP);
      try { storage?.setItem(key, JSON.stringify(kept)); return true; } catch { return false; }
    },
  };
}

export function renderLocalRuns(container, entries) {
  if (!entries.length) {
    container.replaceChildren(el('p', { className: 'leaderboard-empty', text: 'No finished runs on this device yet.' }));
    return;
  }
  const head = el('tr', {}, ['Place', 'Player', 'Points', 'Time', 'Status'].map(text => el('th', { text, attrs: { scope: 'col' } })));
  const rows = entries.map((run, index) => el('tr', { className: run.status === 'Lost' ? 'is-lost' : '' }, [
    el('td', { text: String(index + 1) }),
    el('td', { text: run.name }),
    el('td', { text: `${run.points} / ${run.max}` }),
    el('td', { text: run.timeMs === null ? '–' : formatClock(run.timeMs) }),
    el('td', { text: run.status }),
  ]));
  container.replaceChildren(el('table', { className: 'leaderboard-table local-runs-table' }, [
    el('caption', { text: 'Best runs on this device' }),
    el('thead', {}, [head]),
    el('tbody', {}, rows),
  ]));
}
