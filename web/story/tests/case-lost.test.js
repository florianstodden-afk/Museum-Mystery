import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding, accusationsLeft, MAX_ACCUSATIONS } from '../engine.js';
import { serialize, deserialize } from '../save.js';
import { endingModel, renderEnding, lostParagraphs } from '../endings.js';
import { renderAccusation } from '../accusation-ui.js';
import { scoreboard, bestRunStore } from '../scoring.js';
import { memoryStorage } from '../host.js';
import { CASE, suspectById } from '../case-1.js';
import { installFakeDom, createContainer, findAll, findButton } from './fake-dom.js';

const words = text => text.trim().split(/\s+/).length;

function atAccusation() {
  let s = readMission(newGame()).state;
  for (const id of ['landscape', 'portraits', 'restoration', 'archive']) s = solveStation(s, id, {}).state;
  return tryOpenSafe(s, 'OILS').state;
}

test('one wrong accusation ends the game with "Case lost"', () => {
  const s = atAccusation();
  assert.equal(MAX_ACCUSATIONS, 1);
  assert.equal(accusationsLeft(s), 1);
  const wrong = accuse(s, 'vale');
  assert.equal(wrong.ok, false);
  assert.equal(wrong.state.ending, 'lost');
  assert.equal(wrong.state.accusation.accused, 'vale');
  assert.match(wrong.message, /Case lost/);
  assert.equal(accuse(wrong.state, 'voss').ok, false, 'no second try');
  assert.equal(chooseEnding(wrong.state, 'heist').ok, false);
  assert.equal(chooseEnding(atAccusation(), 'lost').ok, false, 'lost cannot be chosen');
  assert.equal(deserialize(serialize(wrong.state)).ending, 'lost', 'a lost run survives a reload');
  const model = endingModel(wrong.state);
  assert.equal(model.title, 'Case lost');
  assert.equal(model.status, 'Lost');
  assert.deepEqual([...model.paragraphs, model.truth], lostParagraphs(wrong.state));
  assert.equal(endingModel(chooseEnding(accuse(s, 'voss').state, 'heist').state).truth, null);
});

test('the lost ending names the accused, says who it was and why the accused is innocent', () => {
  for (const id of ['leon', 'vale']) {
    const suspect = suspectById(id);
    const [story, truth] = lostParagraphs(accuse(atAccusation(), id).state);
    assert.equal(story, `You named ${suspect.name}. By morning the word had reached Adrien Voss. He left the city before anyone asked a question – and the case left with him.`);
    assert.ok(words(story) <= 45, `${words(story)} words`);
    assert.match(truth, /^It was Adrien Voss, the patron\./);
    assert.ok(truth.endsWith(suspect.counterText));
    assert.ok(words(truth) <= 30, `${id}: ${words(truth)} words`);
  }
});

test('the right accusation still wins as before', () => {
  const right = accuse(atAccusation(), 'voss');
  assert.equal(right.ok, true);
  assert.equal(right.state.ending, null);
  assert.equal(right.state.accusation.attempts, 0);
  const done = chooseEnding(right.state, 'open-file').state;
  assert.equal(endingModel(done).status, 'Won');
  assert.equal(endingModel(done).total, 80);
});

test('saves: a wrong name without an ending, or "lost" after the right name, is rejected', () => {
  const s = atAccusation();
  assert.equal(deserialize(serialize({ ...s, accusation: { solved: false, attempts: 1, accused: 'vale' } })), null);
  const lost = accuse(s, 'vale').state;
  assert.equal(deserialize(serialize({ ...lost, accusation: { ...lost.accusation, accused: 'voss' } })), null);
  assert.equal(deserialize(serialize({ ...lost, accusation: { ...lost.accusation, accused: 'nobody' } })), null);
});

test('old saves (case version 2, with wrong names and no ending) start fresh without a crash', () => {
  const old = { ...atAccusation(), caseVersion: 2, accusation: { solved: false, attempts: 2 } };
  delete old.accusation.accused;
  assert.equal(deserialize(serialize(old)), null);
  assert.equal(deserialize(serialize({ ...old, accusation: { solved: false, attempts: 1 } })), null);
});

test('choosing a suspect asks first; only the confirmation counts as the accusation', () => {
  installFakeDom();
  const box = createContainer();
  const s = atAccusation();
  const before = structuredClone(s);
  const accused = [];
  renderAccusation(box, { state: s }, id => accused.push(id));
  assert.doesNotMatch(box.textContent, /Attempts left/);
  findButton(box, 'Dr. Mara Vale').click();
  assert.deepEqual(accused, []);
  assert.match(box.textContent, /Name her/);
  assert.match(box.textContent, /Name her ↵/);
  assert.match(box.textContent, /Not yet Esc/);
  assert.equal(findAll(box, node => node.className === 'story-choice').length, 3, 'all suspects remain visible');

  // Cancel by button: back to the list, nothing counted, state unchanged.
  findButton(box, 'Not yet').click();
  assert.deepEqual(accused, []);
  assert.equal(findAll(box, node => node.className === 'story-choice').length, 3);
  assert.deepEqual(s, before);

  // Cancel by Escape, then confirm by Enter.
  findButton(box, 'Leon').click();
  assert.match(box.textContent, /Name him/);
  document.pressKey('Escape');
  assert.deepEqual(accused, []);
  assert.equal(findAll(box, node => node.className === 'story-choice').length, 3);
  findButton(box, 'Adrien Voss').click();
  document.pressKey('Enter');
  assert.deepEqual(accused, ['voss']);
  document.pressKey('Enter');
  assert.deepEqual(accused, ['voss'], 'the key listener is gone after the answer');
  assert.deepEqual(s, before);
});

test('every suspect has a pronoun for the confirm button', () => {
  for (const suspect of CASE.suspects) assert.match(suspect.pronoun, /^(her|him)$/);
});

test('the lost ending offers Try again and Back to menu', () => {
  installFakeDom();
  const box = createContainer();
  const s = accuse(atAccusation(), 'leon').state;
  let again = false, menu = false;
  renderEnding(box, endingModel(s), { onNewGame: () => { again = true; }, onHome: () => { menu = true; } });
  assert.match(box.textContent, /Case lost/);
  assert.match(box.textContent, /You named Leon\./);
  assert.match(box.textContent, /It was Adrien Voss, the patron\. The night-shift log/);
  assert.match(box.textContent, /Lost · time/);
  assert.match(box.textContent, /points/);
  findButton(box, 'Try again').click();
  findButton(box, 'Back to menu').click();
  assert.equal(again && menu, true);
  assert.equal(findAll(box, node => node.className === 'story-ending is-lost').length, 1);
});

test('a lost run is never stored as the best run', () => {
  const storage = memoryStorage();
  const store = bestRunStore(storage);
  const lost = accuse(atAccusation(), 'leon').state;
  const board = scoreboard(lost);
  assert.equal(board.status, 'Lost');
  assert.equal(store.record({ points: board.points, timeMs: board.timeMs, max: board.max, status: board.status }), null);
  assert.equal(store.get(), null);
  store.record({ points: 40, timeMs: 1000, max: 80, status: 'Won' });
  store.record({ points: 70, timeMs: 1000, max: 80, status: 'Lost' });
  assert.equal(store.get().points, 40);
});

test('the accusation view shows a quiet nudge to check the evidence, only while the question is open', async () => {
  const { ACCUSATION_NUDGE } = await import('../accusation-ui.js');
  installFakeDom();
  const box = createContainer();
  assert.ok(ACCUSATION_NUDGE.split(/\s+/).length <= 12);
  renderAccusation(box, { state: atAccusation() }, () => {});
  findButton(box, '?').click();
  assert.ok(box.textContent.includes(ACCUSATION_NUDGE));
  renderAccusation(box, { state: accuse(atAccusation(), 'voss').state }, () => {});
  assert.doesNotMatch(box.textContent, /Check your journal/);
});
