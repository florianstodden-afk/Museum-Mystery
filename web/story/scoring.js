// Points for "Museum Nocturne". Maximum: 2 stations × 20 + Portraits 15 + Renoir 15 + safe 10 + final question 10 = 90.
// The two speedrun stations award points by time: Portraits (I) 15/10/5/0, Renoir (L) 15/10/5/0.
// The other stations keep their standard rules (20 − mistakes − hints).
import { elapsedMs, validPuzzle } from '../minigames/picture-rules.js';
import { elapsedMs as portraitElapsedMs, validTimeline, upgradeTimeline } from '../minigames/portrait-rules.js';
import { CASE, STATION_IDS } from './case-1.js';

export const STATION_MAX = 20;
export const STATION_MIN = 5;
export const MISTAKE_COST = 3;
export const HINT_COST = 5;
export const SAFE_MAX = 10;
export const ACCUSATION_MAX = 10;
export const POINTS_AFTER_MISTAKE = 5;
export const SPEED_MAX = 15;                 // best time at a speedrun station
export const PORTRAIT_UNTIMED_POINTS = 5;    // Station I solved in an old save without a time
const SPEED_STATIONS = ['portraits', 'restoration'];
export const MAX_SCORE = (STATION_IDS.length - SPEED_STATIONS.length) * STATION_MAX + SPEED_STATIONS.length * SPEED_MAX + SAFE_MAX + ACCUSATION_MAX;

// Speedrun limits for Station I (three cards, so faster than Renoir's eight pieces).
export const PORTRAIT_LIMITS_MS = [20000, 35000, 50000];

/** Station I points by final time (penalties included): ≤20 s → 15, ≤35 s → 10, ≤50 s → 5, else 0. */
export function portraitSpeedPoints(ms) {
  const [fast, medium, slow] = PORTRAIT_LIMITS_MS;
  return ms <= fast ? 15 : ms <= medium ? 10 : ms <= slow ? 5 : 0;
}

/** "0:17" */
export function formatClock(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// Points for one solved station: 20 − 3 per mistake − 5 per hint, but never less than 5.
export function stationPoints(mistakes, hints) {
  const points = STATION_MAX - mistakes * MISTAKE_COST - hints * HINT_COST;
  return Math.max(STATION_MIN, points);
}

// `attempts` = number of WRONG code words before the safe opened.
export function safePoints(attempts) {
  return attempts === 0 ? SAFE_MAX : POINTS_AFTER_MISTAKE;
}

// `attempts` = number of WRONG answers before the right suspect was named.
export function accusationPoints(attempts) {
  return attempts === 0 ? ACCUSATION_MAX : POINTS_AFTER_MISTAKE;
}

// One row per scoring part, for the journal and the end screen.
export function scoreBreakdown(state) {
  const rows = CASE.stations.map(station => {
    const progress = state.stations[station.id];
    const max = SPEED_STATIONS.includes(station.id) ? SPEED_MAX : STATION_MAX;
    return {
      id: station.id,
      label: `${station.room} (${station.letter})`,
      points: progress.solved ? Math.min(progress.points, max) : 0,
      max,
      detail: !progress.solved ? 'not solved'
        : station.id === 'portraits' ? portraitDetail(progress)
          : `${progress.mistakes} mistake(s), ${progress.hints} hint(s)`,
    };
  });
  rows.push({
    id: 'safe',
    label: 'Safe',
    points: state.safe.open ? safePoints(state.safe.attempts) : 0,
    max: SAFE_MAX,
    detail: state.safe.open ? `${state.safe.attempts} wrong word(s)` : 'closed',
  });
  rows.push({
    id: 'accusation',
    label: 'Final question',
    points: state.accusation.solved ? accusationPoints(state.accusation.attempts) : 0,
    max: ACCUSATION_MAX,
    detail: state.accusation.solved ? `${state.accusation.attempts} wrong answer(s)` : 'open',
  });
  return rows;
}

// The end screen shows the time for Station I, if one was saved.
function portraitDetail(progress) {
  return progress.timeMs == null ? 'Portrait timeline time: not recorded' : `Portrait timeline time ${formatClock(progress.timeMs)}`;
}

export function totalScore(state) {
  let total = 0;
  for (const row of scoreBreakdown(state)) total += row.points;
  return total;
}

// Compatibility with saves from the former deduction-based branch.
export function emptyPenalties() { return Object.fromEntries([...STATION_IDS, 'safe', 'accusation', 'picture'].map(id => [id, 0])); }
export function pictureSpeedPoints(ms) { return ms <= 30000 ? 15 : ms <= 45000 ? 10 : ms <= 60000 ? 5 : 0; }
/** Sets the time-based points of the speedrun stations from their saved progress. */
export function synchronizeScore(state, progress = {}) {
  return syncPortraits(syncRestoration(state, progress), progress);
}

function withStation(state, id, changes) {
  const current = state.stations[id];
  if (Object.entries(changes).every(([key, value]) => current[key] === value)) return state;
  return { ...state, stations: { ...state.stations, [id]: { ...current, ...changes } } };
}

function syncRestoration(state, progress) {
  const puzzle = progress.restoration;
  if (!state.stations.restoration.solved || !validPuzzle(puzzle) || puzzle.finishedAt === null) return state;
  return withStation(state, 'restoration', { points: pictureSpeedPoints(elapsedMs(puzzle, puzzle.finishedAt)) });
}

// Station I solved with a saved finish time → points by time; solved without one (old save) → 5.
function syncPortraits(state, progress) {
  // The engine calls this without any progress; only the host knows the station's saved timeline.
  if (!state.stations.portraits.solved || !('portraits' in progress)) return state;
  const timeline = validTimeline(progress.portraits) ? upgradeTimeline(progress.portraits) : null;
  if (!timeline || timeline.finishedAt === null) return withStation(state, 'portraits', { points: PORTRAIT_UNTIMED_POINTS });
  const timeMs = portraitElapsedMs(timeline);
  return withStation(state, 'portraits', { points: portraitSpeedPoints(timeMs), timeMs });
}

// ---------- Scoreboard on the home screen ----------
// It only reads the existing numbers (scoreBreakdown, saved times); no second points logic.

/** One row per station (B, I, L, D) with status, time and points, plus the run's totals. */
export function scoreboard(state, progress = {}) {
  const points = Object.fromEntries(scoreBreakdown(state).map(row => [row.id, row]));
  const stations = CASE.stations.map(station => ({
    letter: station.letter,
    room: station.room,
    solved: state.stations[station.id].solved,
    timeMs: state.stations[station.id].solved ? stationTime(state, progress, station.id) : null,
    points: points[station.id].points,
    max: points[station.id].max,
  }));
  const times = stations.map(row => row.timeMs).filter(ms => ms !== null);
  return {
    stations,
    points: totalScore(state),
    max: MAX_SCORE,
    timeMs: times.length ? times.reduce((sum, ms) => sum + ms, 0) : null,   // only timed stations count
    finished: state.ending !== null,
  };
}

// Only the speedrun stations have a clock; the others show no time.
function stationTime(state, progress, id) {
  if (id === 'portraits') return state.stations.portraits.timeMs ?? null;
  if (id === 'restoration' && validPuzzle(progress.restoration) && progress.restoration.finishedAt !== null) {
    return elapsedMs(progress.restoration, progress.restoration.finishedAt);
  }
  return null;
}

/** The better of two finished runs: more points wins, at equal points the shorter time. */
export function betterRun(best, run) {
  if (!validRun(run)) return validRun(best) ? best : null;
  if (!validRun(best)) return run;
  if (run.points !== best.points) return run.points > best.points ? run : best;
  return (run.timeMs ?? Infinity) < (best.timeMs ?? Infinity) ? run : best;
}

/** A saved best run: whole points 0…MAX_SCORE and a time in ms (or null). Anything else is ignored. */
export function validRun(run) {
  return run !== null && typeof run === 'object'
    && Number.isInteger(run.points) && run.points >= 0 && run.points <= MAX_SCORE
    && (run.timeMs === null || (Number.isFinite(run.timeMs) && run.timeMs >= 0));
}

/** Reads and writes the best run in storage. Broken or blocked storage just means "no best run yet". */
export function bestRunStore(storage, key = 'museum-nocturne-best-run-v1') {
  return {
    get() {
      try { const run = JSON.parse(storage?.getItem(key)); return validRun(run) ? run : null; } catch { return null; }
    },
    record(run) {
      const best = betterRun(this.get(), run);
      if (best === run) { try { storage?.setItem(key, JSON.stringify(run)); } catch { /* no saving, still fine */ } }
      return best;
    },
  };
}
