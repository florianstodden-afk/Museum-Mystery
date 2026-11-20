import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding, accusationsLeft, MAX_ACCUSATIONS } from '../engine.js';
import { serialize, deserialize } from '../save.js';
import { endingModel, renderEnding } from '../endings.js';
import { renderAccusation } from '../accusation-ui.js';
import { scoreboard, bestRunStore } from '../scoring.js';
import { memoryStorage } from '../host.js';
import { installFakeDom, createContainer, findAll, findButton } from './fake-dom.js';

function atAccusation() {
  let s = readMission(newGame()).state;
  for (const id of ['landscape', 'portraits', 'restoration', 'archive']) s = solveStation(s, id, {}).state;
  return tryOpenSafe(s, 'OILS').state;
}

test('three wrong accusations end the game with "Case lost"', () => {
  let s = atAccusation();
  assert.equal(MAX_ACCUSATIONS, 3);
  s = accuse(s, 'leon').state;
  s = accuse(s, 'vale').state;
  assert.equal(s.ending, null);
  assert.equal(accusationsLeft(s), 1);
  const last = accuse(s, 'leon');
  assert.equal(last.ok, false);
  assert.equal(last.state.ending, 'lost');
  assert.match(last.message, /Case lost/);
  assert.equal(accuse(last.state, 'voss').ok, false, 'no fourth try');
  assert.equal(chooseEnding(last.state, 'heist').ok, false);
  assert.equal(chooseEnding(atAccusation(), 'lost').ok, false, 'lost cannot be chosen');
  assert.equal(deserialize(serialize(last.state)).ending, 'lost', 'a lost run survives a reload');
  const model = endingModel(last.state);
  assert.equal(model.title, 'Case lost');
  assert.equal(model.status, 'Lost');
  assert.ok(model.paragraphs.join(' ').split(/\s+/).length <= 40);
});

test('two wrong accusations and then the right one still win as before', () => {
  let s = accuse(accuse(atAccusation(), 'leon').state, 'vale').state;
  const right = accuse(s, 'voss');
  assert.equal(right.ok, true);
  assert.equal(right.state.ending, null);
  const done = chooseEnding(right.state, 'open-file').state;
  assert.equal(endingModel(done).status, 'Won');
});

test('a forged save with three wrong names but no ending is rejected', () => {
  const s = accuse(accuse(atAccusation(), 'leon').state, 'vale').state;
  const broken = { ...s, accusation: { solved: false, attempts: 3 } };
  assert.equal(deserialize(serialize(broken)), null);
});

test('the accusation view shows the attempts left, the lost ending offers Try again and Back to menu', () => {
  installFakeDom();
  const box = createContainer();
  let s = atAccusation();
  renderAccusation(box, { state: s }, () => {});
  assert.match(box.textContent, /Attempts left: 3/);
  s = accuse(s, 'leon').state;
  renderAccusation(box, { state: s }, () => {});
  assert.match(box.textContent, /Attempts left: 2/);
  s = accuse(s, 'vale').state;
  renderAccusation(box, { state: s }, () => {});
  assert.match(box.textContent, /Attempts left: 1/);
  s = accuse(s, 'leon').state;
  let again = false, menu = false;
  renderEnding(box, endingModel(s), { onNewGame: () => { again = true; }, onHome: () => { menu = true; } });
  assert.match(box.textContent, /Case lost/);
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
  const lost = accuse(accuse(accuse(atAccusation(), 'leon').state, 'vale').state, 'leon').state;
  const board = scoreboard(lost);
  assert.equal(board.status, 'Lost');
  assert.equal(store.record({ points: board.points, timeMs: board.timeMs, max: board.max, status: board.status }), null);
  assert.equal(store.get(), null);
  store.record({ points: 40, timeMs: 1000, max: 80, status: 'Won' });
  store.record({ points: 70, timeMs: 1000, max: 80, status: 'Lost' });
  assert.equal(store.get().points, 40);
});
