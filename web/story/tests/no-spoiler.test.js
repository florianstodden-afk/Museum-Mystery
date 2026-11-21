// The evidence is a puzzle: before the final question, no text may name Voss as the planner.
// Only together do the pieces point to him: a patron, initials A. V.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASE, STATION_IDS, CODEWORD, suspectById } from '../case-1.js';
import { newGame, readMission, solveStation, addNote, tryOpenSafe, accuse, nextStep } from '../engine.js';
import { hintFor } from '../hints.js';
import { journalModel, renderJournal } from '../journal.js';
import { dialogueFor, conversationFor, CHARACTERS } from '../dialogues.js';
import { installFakeDom, createContainer } from './fake-dom.js';

// Every story state a player can see before naming anyone.
function statesBeforeAccusation() {
  const states = [newGame()];
  let s = readMission(newGame()).state;
  states.push(s);
  for (const note of CASE.notes) { s = addNote(s, note.id).state; states.push(s); }
  for (const id of STATION_IDS) { s = solveStation(s, id, {}).state; states.push(s); }
  s = tryOpenSafe(s, 'WRONG').state; states.push(s);
  s = tryOpenSafe(s, CODEWORD).state; states.push(s);
  return states;
}

function visibleTexts(state) {
  installFakeDom();
  const texts = [CASE.mission.text, nextStep(state), hintFor(state, 1).text, hintFor(state, 2).text];
  for (const compact of [false, true]) {
    const box = createContainer();
    const evidenceBox = compact ? createContainer() : null;
    renderJournal(box, journalModel(state), evidenceBox);
    texts.push(box.textContent, evidenceBox?.textContent ?? '');
  }
  for (const { id } of CHARACTERS) {
    texts.push(...dialogueFor(id, state).lines);
    const talk = conversationFor(id, state);
    if (talk) texts.push(...talk.greeting, ...talk.questions.flatMap(q => [q.label, ...q.lines]));
  }
  return texts;
}

test('no evidence, task, note, journal page, hint or dialogue names Voss before the final question', () => {
  for (const station of CASE.stations) {
    assert.doesNotMatch(station.evidence, /Voss/, station.id);
    assert.doesNotMatch(station.task, /Voss/, station.id);
    // The message after solving a station repeats the evidence.
    const solved = solveStation(readMission(newGame()).state, station.id, {});
    assert.doesNotMatch(solved.message, /Voss/, station.id);
  }
  for (const note of CASE.notes) assert.doesNotMatch(`${note.title} ${note.text}`, /Voss/, note.id);
  for (const suspect of CASE.suspects) {
    assert.doesNotMatch(suspect.description, /Voss/, suspect.id);
    assert.doesNotMatch(suspect.counterText, /Voss/, suspect.id);
  }
  for (const state of statesBeforeAccusation()) {
    for (const text of visibleTexts(state)) assert.doesNotMatch(text, /Voss/, text);
  }
});

test('the new evidence texts', () => {
  const evidence = Object.fromEntries(CASE.stations.map(s => [s.evidenceId, s.evidence]));
  assert.equal(evidence['false-label'], 'The false wall label was approved by a patron – not by museum staff.');
  assert.equal(evidence['shift-log'], 'Night-shift log: Leon was on the east stairs at 21:14, when the cart left. The cart was booked as a ‘patron visit’.');
  assert.equal(CASE.notes.find(n => n.id === 'transport-cart').text, 'A covered transport cart left the delivery exit at 21:14. No delivery was announced.');
  assert.equal(evidence['hidden-mark'], 'Hidden mark “V” on the fake transport slip.');
  assert.equal(evidence['frame-label'], 'Frame label: “Ordered by: A. V.”');
  assert.match(suspectById('vale').counterText, /frame label names ‘A\. V\.’, not M\. V\./);
});

test('the solution stays unique: only Voss is a patron with the initials A. V.', () => {
  const initials = name => name.replace(/^Dr\.\s+/, '').split(/\s+/).map(part => `${part[0]}.`).join(' ');
  const fits = CASE.suspects.filter(s => /patron/i.test(s.role) && initials(s.name) === 'A. V.');
  assert.deepEqual(fits.map(s => s.id), [CASE.culpritId]);
  // Vale also has a "V", but she is staff, not a patron; Leon has neither.
  assert.equal(initials(suspectById('vale').name), 'M. V.');
  assert.doesNotMatch(suspectById('vale').role, /patron/i);
  assert.doesNotMatch(suspectById('leon').role, /patron/i);
});

test('after the right accusation the chain may name Voss openly', () => {
  let s = readMission(newGame()).state;
  for (const id of STATION_IDS) s = solveStation(s, id, {}).state;
  s = accuse(tryOpenSafe(s, CODEWORD).state, 'voss').state;
  assert.match(CASE.stations.map(st => st.pointsToVoss).join(' '), /Voss/);
  assert.match(journalModel(s).caseNotes[0].text, /Adrien Voss/);
});

test('M promises no deadline: there is no overall clock', () => {
  assert.match(CASE.mission.text, /^The Van Gogh in the Gallery is a copy\./);
  assert.match(CASE.mission.text, /Bring me the painting tonight\. – M$/);
  assert.ok(CASE.mission.text.split(/\s+/).length <= 50, 'mission ≤ 50 words');
  assert.doesNotMatch(CASE.mission.text, /sunrise|dawn|before morning/i);
});

test('no leftovers that contradict the story: nothing is missing, there was no alarm', () => {
  for (const state of statesBeforeAccusation()) {
    for (const text of visibleTexts(state)) assert.doesNotMatch(text, /\balarm\b|painting is missing|cameras have ears|sunrise/i, text);
  }
  for (const suspect of CASE.suspects) assert.doesNotMatch(suspect.description, /alarm|missing/i, suspect.id);
});
