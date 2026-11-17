import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationFor, questionsFor, dialogueFor } from '../dialogues.js';
import { newGame, readMission, addNote, solveStation, tryOpenSafe, accuse } from '../engine.js';
import { STATION_IDS, CODEWORD } from '../case-1.js';

// Game states along the story, in playing order.
function states() {
  const start = readMission(newGame()).state;
  const withNote = addNote(start, 'transport-cart').state;
  const portraits = solveStation(withNote, 'portraits', {}).state;
  let all = portraits;
  for (const id of STATION_IDS) all = solveStation(all, id, {}).state;
  const open = tryOpenSafe(all, CODEWORD).state;
  const solved = accuse(open, 'voss').state;
  return { start, withNote, portraits, all, open, solved };
}

const answer = (state, id) => questionsFor('leon', state).find(q => q.id === id).lines;
const allText = conversation => [
  ...conversation.greeting,
  ...conversation.questions.flatMap(q => [q.label, ...q.lines]),
  conversation.goodbye.label, ...conversation.goodbye.lines,
].join(' ');

test('Leon offers two small-talk questions and a goodbye', () => {
  const talk = conversationFor('leon', states().start);
  assert.equal(talk.name, 'Leon');
  assert.equal(talk.role, 'Night guard');
  assert.deepEqual(talk.questions.map(q => q.label), ['Rough night so far?', 'Quiet in here, isn’t it?']);
  assert.equal(talk.goodbye.label, 'I’ll let you get back to it.');
  assert.deepEqual(talk.goodbye.lines, ['Mind the cameras.']);
  assert.equal(conversationFor('nobody', states().start), null);
  assert.deepEqual(questionsFor('imani', states().start), [], 'only Leon has a conversation for now');
});

test('the greeting follows the story', () => {
  const s = states();
  assert.match(conversationFor('leon', s.start).greeting[0], /Evening/);
  assert.match(conversationFor('leon', s.portraits).greeting[0], /read the log/);
  assert.match(conversationFor('leon', s.open).greeting[0], /vault was open/);
});

test('"Rough night" tells Leon’s story for each stage', () => {
  const s = states();
  assert.match(answer(s.start, 'night').join(' '), /delivery exit at 21:14.*security office/s);
  assert.match(answer(s.withNote, 'night').join(' '), /seen the footage.*by the portraits/s);
  assert.match(answer(s.portraits, 'night').join(' '), /East stairs at 21:14.*patron visit/s);
  assert.deepEqual(answer(s.solved, 'night'), dialogueFor('leon', s.solved).lines, 'after the accusation: his thanks');
});

test('"Quiet in here" points at a different open station each time', () => {
  const start = states().start;
  const seen = new Set();
  for (const open of STATION_IDS) {
    let state = start;
    for (const id of STATION_IDS) if (id !== open) state = solveStation(state, id, {}).state;
    seen.add(answer(state, 'quiet').join(' '));
  }
  assert.equal(seen.size, 4);
  const s = states();
  assert.match(answer(s.start, 'quiet').join(' '), /wall label/);
  assert.match(answer(s.all, 'quiet').join(' '), /vault/);
  assert.match(answer(s.open, 'quiet').join(' '), /signs things/);
});

test('no box holds more than two short sentences', () => {
  for (const state of Object.values(states())) {
    const talk = conversationFor('leon', state);
    for (const line of [...talk.greeting, ...talk.questions.flatMap(q => q.lines), ...talk.goodbye.lines]) {
      const sentences = line.split(/[.?!…](?=\s|$)/).filter(part => part.trim().split(/\s+/).length > 1).length; // "Ah." is no sentence
      assert.ok(sentences <= 2, `too long: ${line}`);
      assert.ok(line.length <= 110, `too long: ${line}`);
    }
  }
});

test('Leon never gives away a solution', () => {
  const s = states();
  for (const [name, state] of Object.entries(s)) {
    const text = allText(conversationFor('leon', state));
    assert.doesNotMatch(text, /1889|BILD|\bcode\b|safe/i, name);
    if (name !== 'solved') assert.doesNotMatch(text, /Voss/, name);
  }
});

test('talking gives no letter and no evidence', () => {
  const before = states().start;
  const copy = structuredClone(before);
  conversationFor('leon', before);
  assert.deepEqual(before, copy);
});
