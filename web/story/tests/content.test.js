import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, addNote, tryOpenSafe, accuse, chooseEnding } from '../engine.js';
import { dialogueFor, renderDialogue } from '../dialogues.js';
import { journalModel, renderJournal, evidenceChain } from '../journal.js';
import { endingModel, renderEnding } from '../endings.js';
import { renderSafe } from '../safe-ui.js';
import { renderAccusation } from '../accusation-ui.js';
import { installFakeDom, createContainer, findAll, findButton } from './fake-dom.js';

const ALL = ['landscape', 'portraits', 'restoration', 'archive'];

function started() {
  return readMission(newGame()).state;
}

function finished(endingId, { wrongWord = false, wrongSuspect = null, stationResult = {} } = {}) {
  let s = started();
  for (const id of ALL) s = solveStation(s, id, stationResult[id] ?? {}).state;
  if (wrongWord) s = tryOpenSafe(s, 'BLID').state;
  s = tryOpenSafe(s, 'BILD').state;
  if (wrongSuspect) s = accuse(s, wrongSuspect).state;
  s = accuse(s, 'voss').state;
  return chooseEnding(s, endingId).state;
}

test('M starts with the mission message', () => {
  const m = dialogueFor('m', newGame());
  assert.match(m.lines[0], /Wheat Field with Cypresses/);
  assert.equal(dialogueFor('nobody', newGame()), null);
});

test('Leon changes his story after the Portrait Hall', () => {
  let s = started();
  const before = dialogueFor('leon', s);
  assert.match(before.lines.join(' '), /21:14/);
  assert.match(before.lines.join(' '), /monitor wall/);
  s = addNote(s, 'transport-cart').state;
  assert.match(dialogueFor('leon', s).lines.join(' '), /night-shift log/);
  s = solveStation(s, 'portraits', {}).state;
  assert.match(dialogueFor('leon', s).lines.join(' '), /log proves it/);
});

test('Imani reacts to the Conservation Studio', () => {
  let s = started();
  assert.match(dialogueFor('imani', s).lines.join(' '), /paper/);
  s = solveStation(s, 'restoration', {}).state;
  assert.match(dialogueFor('imani', s).lines.join(' '), /“V”/);
});

test('Dr. Vale only talks once the safe is open', () => {
  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  assert.equal(dialogueFor('vale', s).available, false);
  s = tryOpenSafe(s, 'BILD').state;
  assert.equal(dialogueFor('vale', s).available, true);
  s = accuse(s, 'voss').state;
  assert.match(dialogueFor('vale', s).lines.join(' '), /choice is yours/);
});

test('journal keeps letters in their fixed slots', () => {
  let s = started();
  s = solveStation(s, 'restoration', {}).state;
  s = solveStation(s, 'landscape', {}).state;
  const model = journalModel(s);
  assert.deepEqual(model.slots.map(slot => slot.letter), ['B', '_', 'L', '_']);
  assert.deepEqual(model.evidence.map(item => item.id), ['hidden-mark', 'false-label']);
  assert.equal(model.score.total, 40);
  assert.match(model.nextStep, /Portrait Hall, Frame Archive/);
});

test('journal renders slots, evidence and notes', () => {
  installFakeDom();
  let s = addNote(solveStation(started(), 'archive', {}).state, 'duty-roster').state;
  const container = createContainer();
  renderJournal(container, journalModel(s));
  const text = container.textContent;
  assert.match(text, /Ordered by: A\. Voss/);
  assert.match(text, /Shift schedule/);
  const slots = findAll(container, node => node.tagName === 'LI' && node.className.startsWith('story-slot'));
  assert.deepEqual(slots.map(slot => slot.textContent.charAt(0)), ['_', '_', '_', 'D']);
});

test('evidence chain marks what has been found', () => {
  const s = solveStation(started(), 'portraits', {}).state;
  assert.deepEqual(evidenceChain(s).map(link => link.found), [false, true, false, false]);
});

test('ending model has no ending before the decision', () => {
  assert.equal(endingModel(started()), null);
});

test('ending model gives the right breakdown for both endings', () => {
  const heist = endingModel(finished('heist', { wrongWord: true, stationResult: { landscape: { mistakes: 1, hints: 1 } } }));
  assert.equal(heist.title, 'The Heist');
  assert.deepEqual(heist.breakdown.map(row => row.points), [12, 20, 20, 20, 5, 10]);
  assert.equal(heist.total, 87);
  assert.match(heist.image.src, /assets\/met-436535\.jpg$/);
  assert.match(heist.disclaimer, /Fictional museum and characters/);

  const openFile = endingModel(finished('open-file', { wrongSuspect: 'vale' }));
  assert.equal(openFile.title, 'The Open File');
  assert.equal(openFile.total, 95);
  assert.equal(openFile.chain.every(link => link.found), true);
});

test('ending renders the score table and a new-game button', () => {
  installFakeDom();
  const container = createContainer();
  let restarted = false;
  renderEnding(container, endingModel(finished('open-file')), { onNewGame: () => { restarted = true; } });
  assert.match(container.textContent, /100 \/ 100/);
  findButton(container, 'New game').click();
  assert.equal(restarted, true);
});

test('safe UI only shows the input when all proofs are there', () => {
  installFakeDom();
  const container = createContainer();
  renderSafe(container, { state: started() }, () => {});
  assert.equal(findAll(container, node => node.tagName === 'INPUT').length, 0);
  assert.match(container.textContent, /0 \/ 4/);

  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  let tried;
  renderSafe(container, { state: s }, word => { tried = word; });
  const [input] = findAll(container, node => node.tagName === 'INPUT');
  const [form] = findAll(container, node => node.tagName === 'FORM');
  input.value = 'bild';
  form.dispatch('submit');
  assert.equal(tried, 'bild');
});

test('accusation UI offers three suspects and reports the choice', () => {
  installFakeDom();
  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  s = tryOpenSafe(s, 'BILD').state;
  const container = createContainer();
  let chosen;
  renderAccusation(container, { state: s }, id => { chosen = id; });
  const choices = findAll(container, node => node.tagName === 'BUTTON');
  assert.equal(choices.length, 3);
  findButton(container, 'Adrien Voss').click();
  assert.equal(chosen, 'voss');
});

test('dialogue renders every line', () => {
  installFakeDom();
  const container = createContainer();
  renderDialogue(container, dialogueFor('vale', newGame()));
  assert.match(container.textContent, /office is dark/);
  assert.equal(findAll(container, node => node.className === 'story-dialogue-line').length, 2);
});
