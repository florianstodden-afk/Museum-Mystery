import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, createContainer } from './fake-dom.js';
import { createSpeechBox } from '../speech-box.js';
import { createStoryHost, memoryStorage } from '../host.js';
import { conversationFor } from '../dialogues.js';
import { newGame, readMission } from '../engine.js';

installFakeDom();

// A box with a hand-driven clock: run() lets the typewriter finish.
function setup({ reduced = false } = {}) {
  const timers = [];
  const log = { closed: 0, sounds: [] };
  const parent = createContainer();
  const box = createSpeechBox(parent, {
    onClose: () => log.closed++,
    playSound: id => log.sounds.push(id),
    reducedMotion: () => reduced,
    setTimer: fn => { timers.push(fn); return timers.length; },
    clearTimer: () => {},
  });
  const run = () => { while (timers.length) timers.shift()(); };
  const parts = () => {
    const [tag, inner] = box.element.children;
    const [text, choices, more] = inner.children;
    return { tag, text: text.textContent, choices: choices.children, more };
  };
  return { box, run, parts, log, timers };
}

const conversation = conversationFor('leon', readMission(newGame()).state);
const key = k => ({ key: k });

test('the box shows the name tag and types the greeting letter by letter', () => {
  const { box, run, parts, timers } = setup();
  box.show(conversation);
  assert.equal(box.isOpen, true);
  assert.equal(parts().tag.textContent, 'LeonNight guard');
  assert.equal(parts().text, '', 'starts empty');
  timers.shift()(); timers.shift()();
  assert.equal(parts().text, 'Ev');
  run();
  assert.equal(parts().text, conversation.greeting[0]);
  assert.deepEqual(parts().choices.map(c => c.textContent), [
    'Rough night so far?', 'Quiet in here, isn’t it?', 'I’ll let you get back to it.',
  ]);
  assert.match(parts().choices[2].className, /is-goodbye/);
});

test('Space shows the whole sentence at once; reduced motion skips typing', () => {
  const a = setup();
  a.box.show(conversation);
  a.box.handleKey(key(' '));
  assert.equal(a.parts().text, conversation.greeting[0]);
  const b = setup({ reduced: true });
  b.box.show(conversation);
  assert.equal(b.parts().text, conversation.greeting[0]);
});

test('a question plays its answer box by box, then only unanswered choices come back', () => {
  const { box, run, parts, log } = setup({ reduced: true });
  box.show(conversation);
  box.handleKey(key('1'));
  assert.deepEqual(log.sounds, ['click']);
  const answer = conversation.questions[0].lines;
  assert.equal(parts().text, answer[0]);
  assert.equal(parts().more.hidden, false, 'the ▼ arrow says: more to come');
  assert.equal(parts().choices.length, 0);
  for (let i = 1; i < answer.length; i++) { box.handleKey(key('e')); run(); assert.equal(parts().text, answer[i]); }
  assert.equal(parts().more.hidden, true);
  assert.deepEqual(parts().choices.map(c => c.textContent), [
    'Quiet in here, isn’t it?', 'I’ll let you get back to it.',
  ], 'the answered question stays hidden for this conversation');
});

test('Leon closes after both answers and starts fresh when addressed again', () => {
  const { box, parts, log } = setup({ reduced: true });
  box.show(conversation);
  box.handleKey(key('1'));
  while (!parts().choices.length) box.handleKey(key('e'));
  assert.deepEqual(parts().choices.map(c => c.textContent), ['Quiet in here, isn’t it?', 'I’ll let you get back to it.']);
  box.handleKey(key('1'));
  for (let i = 1; i < conversation.questions[1].lines.length; i++) box.handleKey(key('e'));
  assert.equal(box.isOpen, true, 'the final answer stays visible until the player advances');
  assert.equal(parts().choices.length, 0, 'no question can repeat');
  box.handleKey(key('e'));
  assert.equal(box.isOpen, false);
  assert.equal(log.closed, 1);
  box.show(conversation);
  assert.deepEqual(parts().choices.map(c => c.textContent), [
    'Rough night so far?', 'Quiet in here, isn’t it?', 'I’ll let you get back to it.',
  ]);
});

test('Imani closes after her lines and can be spoken to again', () => {
  const { box, parts, log } = setup({ reduced: true });
  const imani = conversationFor('imani', readMission(newGame()).state);
  box.show(imani);
  assert.equal(parts().choices.length, 0);
  for (let i = 1; i < imani.greeting.length; i++) box.handleKey(key('e'));
  assert.equal(parts().text, imani.greeting.at(-1));
  assert.equal(box.isOpen, true);
  box.handleKey(key('e'));
  assert.equal(box.isOpen, false);
  assert.equal(log.closed, 1);
  box.show(imani);
  assert.equal(parts().text, imani.greeting[0]);
});

test('goodbye says one line and the next key closes the box', () => {
  const { box, parts, log } = setup({ reduced: true });
  box.show(conversation);
  box.handleKey(key('3'));
  assert.equal(parts().text, 'Gloves on before you touch anything.');
  assert.equal(box.isOpen, true);
  box.handleKey(key(' '));
  assert.equal(box.isOpen, false);
  assert.equal(log.closed, 1);
  assert.equal(box.handleKey(key(' ')), false, 'a closed box ignores keys');
});

test('Escape closes the box; walking keys are left to the game', () => {
  const { box, log } = setup({ reduced: true });
  box.show(conversation);
  for (const k of ['w', 'ArrowLeft', 'd']) assert.equal(box.handleKey(key(k)), false, k);
  assert.equal(box.isOpen, true);
  box.handleKey(key('Escape'));
  assert.equal(box.isOpen, false);
  assert.equal(log.closed, 1);
});

test('Enter picks the focused choice', () => {
  const { box, parts } = setup({ reduced: true });
  box.show(conversation);
  const [first, second] = parts().choices;
  assert.equal(document.activeElement, first, 'focus starts on the first question');
  second.focus();
  box.handleKey(key('Enter'));
  assert.equal(parts().text, conversation.questions[1].lines[0]);
});

test('a goodbye without words closes at once', () => {
  const { box, parts } = setup({ reduced: true });
  box.show({ name: 'Imani', role: 'Conservator', greeting: ['Hi.'], questions: [], goodbye: { label: 'Goodbye.', lines: [] } });
  assert.equal(parts().choices.length, 1);
  box.handleKey(key('1'));
  assert.equal(box.isOpen, false);
});

test('the box can move to the top so it never hides the player', () => {
  const { box } = setup();
  box.setPlacement('top');
  assert.match(box.element.className, /is-top/);
  box.setPlacement('bottom');
  assert.doesNotMatch(box.element.className, /is-top/);
});

test('the host lets Leon talk in the speech box; others still use the panel', () => {
  const shown = [];
  let panels = 0;
  const speech = { isOpen: false, show(c) { shown.push(c.name); this.isOpen = true; } };
  const story = createStoryHost({
    openPanel: () => { panels++; return createContainer(); }, closePanel() {},
    storage: memoryStorage(), speech,
  });
  story.talkTo('leon');
  story.talkTo('leon');
  assert.deepEqual(shown, ['Leon'], 'not opened twice');
  assert.equal(panels, 0);
  speech.isOpen = false;
  story.talkTo('imani');
  assert.deepEqual(shown, ['Leon', 'Imani'], 'every character talks in the box');
  assert.equal(panels, 0);
});
