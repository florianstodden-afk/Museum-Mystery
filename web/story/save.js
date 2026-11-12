// Turns the story state into text and back.
// No localStorage here – the page that uses this decides where the text is stored.
import { CASE, CASE_VERSION, STATION_IDS } from './case-1.js';
import { ENDING_IDS } from './engine.js';

export function serialize(state) {
  return JSON.stringify(state);
}

// Returns the state, or null if the text is broken, from an old version, or does not fit the rules.
export function deserialize(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  return isValidState(value) ? value : null;
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function isStationProgress(value) {
  return value !== null && typeof value === 'object'
    && typeof value.solved === 'boolean'
    && isCount(value.mistakes) && isCount(value.hints) && isCount(value.points);
}

export function isValidState(value) {
  if (value === null || typeof value !== 'object') return false;
  if (value.caseVersion !== CASE_VERSION) return false;
  if (typeof value.missionRead !== 'boolean') return false;

  if (value.stations === null || typeof value.stations !== 'object') return false;
  for (const id of STATION_IDS) {
    if (!isStationProgress(value.stations[id])) return false;
  }

  // Each letter slot is filled exactly when its station is solved, with the right letter.
  if (!Array.isArray(value.letters) || value.letters.length !== STATION_IDS.length) return false;
  for (let i = 0; i < STATION_IDS.length; i++) {
    const station = CASE.stations[i];
    const expected = value.stations[station.id].solved ? station.letter : null;
    if (value.letters[i] !== expected) return false;
  }

  const evidenceIds = CASE.stations.map(station => station.evidenceId);
  if (!isListOf(value.evidence, evidenceIds)) return false;
  const noteIds = CASE.notes.map(note => note.id);
  if (!isListOf(value.notes, noteIds)) return false;

  if (value.safe === null || typeof value.safe !== 'object') return false;
  if (typeof value.safe.open !== 'boolean' || !isCount(value.safe.attempts)) return false;
  if (value.accusation === null || typeof value.accusation !== 'object') return false;
  if (typeof value.accusation.solved !== 'boolean' || !isCount(value.accusation.attempts)) return false;
  if (value.ending !== null && !ENDING_IDS.includes(value.ending)) return false;

  // The story order must hold: safe only after all stations, ending only after the answer.
  const allSolved = STATION_IDS.every(id => value.stations[id].solved);
  if (value.safe.open && !allSolved) return false;
  if (value.accusation.solved && !value.safe.open) return false;
  if (value.ending !== null && !value.accusation.solved) return false;
  return true;
}

// True if `list` is an array of known ids without duplicates.
function isListOf(list, allowedIds) {
  if (!Array.isArray(list)) return false;
  if (new Set(list).size !== list.length) return false;
  return list.every(id => allowedIds.includes(id));
}
