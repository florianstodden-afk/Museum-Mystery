// Story engine for "Museum Nocturne".
// Pure functions only: no DOM, no localStorage, no import of the old web/engine.js.
//
// Every action returns { state, ok, message }.
// - ok: true  → the action worked.
// - ok: false → it did not work. If the action was NOT ALLOWED (e.g. safe before all
//   stations, anything after the ending), `state` is the unchanged input state.
//   A WRONG ANSWER at the safe or the final question is allowed: it is counted as an
//   attempt, so `state` changes (attempts + 1) and ok is false.
import { CASE, CASE_VERSION, CODEWORD, STATION_IDS, stationById, noteById, suspectById } from './case-1.js';
import { stationPoints } from './scoring.js';

export const ENDING_IDS = ['heist', 'open-file'];

function emptyStation() {
  return { solved: false, mistakes: 0, hints: 0, points: 0 };
}

export function newGame() {
  const stations = {};
  for (const id of STATION_IDS) stations[id] = emptyStation();
  return {
    caseVersion: CASE_VERSION,
    missionRead: false,
    stations,
    letters: [null, null, null, null], // fixed slots: landscape, portraits, restoration, archive
    evidence: [],                      // evidence ids, in the order they were found
    notes: [],                         // story notes without a letter
    safe: { open: false, attempts: 0 },
    accusation: { solved: false, attempts: 0 },
    ending: null,                      // null | "heist" | "open-file"
  };
}

// A deep copy, so we never change the state the caller still holds.
function copy(state) {
  return structuredClone(state);
}

function reject(state, message) {
  return { state, ok: false, message };
}

function accept(state, message) {
  return { state, ok: true, message };
}

function isOver(state) {
  return state.ending !== null;
}

const CLOSED_MESSAGE = 'The case is closed. Start a new game to play again.';

export function readMission(state) {
  if (isOver(state)) return reject(state, CLOSED_MESSAGE);
  if (state.missionRead) return reject(state, 'You have already read the message from M.');
  const next = copy(state);
  next.missionRead = true;
  return accept(next, 'Mission accepted. Explore the museum and find the four stations.');
}

export function solveStation(state, stationId, result = {}) {
  if (isOver(state)) return reject(state, CLOSED_MESSAGE);
  const station = stationById(stationId);
  if (!station) return reject(state, `Unknown station: ${stationId}.`);
  if (!state.missionRead) return reject(state, 'Read the message from M first.');
  if (state.stations[stationId].solved) return reject(state, `${station.room} is already solved.`);

  const mistakes = toCount(result.mistakes);
  const hints = toCount(result.hints);
  const next = copy(state);
  next.stations[stationId] = { solved: true, mistakes, hints, points: stationPoints(mistakes, hints) };
  next.letters[STATION_IDS.indexOf(stationId)] = station.letter;
  next.evidence.push(station.evidenceId);
  return accept(next, `${station.room} solved: letter ${station.letter}. Evidence: ${station.evidence}`);
}

// Turns anything that is not a whole number ≥ 0 into 0, so a broken station cannot break the score.
function toCount(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

export function addNote(state, noteId) {
  if (isOver(state)) return reject(state, CLOSED_MESSAGE);
  const note = noteById(noteId);
  if (!note) return reject(state, `Unknown note: ${noteId}.`);
  if (state.notes.includes(noteId)) return reject(state, 'This note is already in your journal.');
  const next = copy(state);
  next.notes.push(noteId);
  return accept(next, `New note in your journal: ${note.title}.`);
}

export function allStationsSolved(state) {
  return STATION_IDS.every(id => state.stations[id].solved);
}

export function canOpenSafe(state) {
  return !isOver(state) && !state.safe.open && allStationsSolved(state);
}

// "bild", " B I L D " and "Bild" are all accepted.
export function normalizeWord(word) {
  return String(word ?? '').replace(/\s+/g, '').toUpperCase();
}

export function tryOpenSafe(state, word) {
  if (isOver(state)) return reject(state, CLOSED_MESSAGE);
  if (state.safe.open) return reject(state, 'The safe is already open.');
  if (!allStationsSolved(state)) {
    return reject(state, 'The safe stays locked. You need proof from all four stations first.');
  }
  const guess = normalizeWord(word);
  if (guess === '') return reject(state, 'Enter a word first.');

  const next = copy(state);
  if (guess !== CODEWORD) {
    next.safe.attempts += 1;
    return { state: next, ok: false, message: 'The lock does not move. Check the order in your journal.' };
  }
  next.safe.open = true;
  return accept(next, 'The safe opens. Inside: the original painting and a folder of documents.');
}

export function accuse(state, suspectId) {
  if (isOver(state)) return reject(state, CLOSED_MESSAGE);
  if (!state.safe.open) return reject(state, 'Open the safe first – the documents inside are part of the answer.');
  if (state.accusation.solved) return reject(state, 'You have already answered the final question.');
  const suspect = suspectById(suspectId);
  if (!suspect) return reject(state, `Unknown suspect: ${suspectId}.`);

  const next = copy(state);
  if (suspectId !== CASE.culpritId) {
    next.accusation.attempts += 1;
    return { state: next, ok: false, message: `Not ${suspect.name}. ${suspect.counterText} Try again.` };
  }
  next.accusation.solved = true;
  return accept(next, 'Adrien Voss. The false label, the patron visit, the “V” and the frame order all lead to him. “M” was Voss.');
}

export function chooseEnding(state, endingId) {
  if (isOver(state)) return reject(state, CLOSED_MESSAGE);
  if (!state.accusation.solved) return reject(state, 'Answer the final question before you decide.');
  if (!ENDING_IDS.includes(endingId)) return reject(state, `Unknown ending: ${endingId}.`);
  const next = copy(state);
  next.ending = endingId;
  const message = endingId === 'heist'
    ? 'You hand the painting to Voss. The Heist.'
    : 'You bring the painting and the evidence to Dr. Vale. The Open File.';
  return accept(next, message);
}

// The text for "Next step" in the journal.
export function nextStep(state) {
  if (state.ending !== null) return 'Case closed. Start a new game to play again.';
  if (!state.missionRead) return 'Read the message from M.';
  if (!allStationsSolved(state)) {
    const open = CASE.stations.filter(s => !state.stations[s.id].solved).map(s => s.room);
    return `Find the remaining stations: ${open.join(', ')}.`;
  }
  if (!state.safe.open) return 'All four letters found. Open the safe with the word in your journal.';
  if (!state.accusation.solved) return 'Answer the final question: who planned all of this?';
  return 'Decide what happens to the painting.';
}

export function isComplete(state) {
  return state.ending !== null;
}
