// The safe code can also be typed: A–Z fill the slots, Backspace erases, Enter tries the lock.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation } from '../engine.js';
import { serialize } from '../save.js';
import { renderSafe } from '../safe-ui.js';
import { createStoryHost, memoryStorage } from '../host.js';
import { installFakeDom, createContainer, findAll } from './fake-dom.js';

function ready() {
  let s = readMission(newGame()).state;
  for (const id of ['landscape', 'portraits', 'restoration', 'archive']) s = solveStation(s, id, {}).state;
  return s;
}
function page(t, onTry = () => {}) {
  const doc = installFakeDom();
  const listeners = [], add = doc.addEventListener;
  doc.addEventListener = (type, listener, capture) => { if (type === 'keydown') listeners.push(listener); add(type, listener, capture); };
  const container = createContainer(), sounds = [];
  renderSafe(container, { state: ready(), playSound: id => sounds.push(id) }, onTry);
  const slots = () => findAll(container, n => n.className === 'vault-code-slot').map(n => n.textContent).join('');
  return { doc, listeners, container, sounds, slots, type: keys => { for (const key of keys) doc.pressKey(key); } };
}

test('typed letters fill the slots like Select, with the same sounds; max four', t => {
  const p = page(t);
  p.type(['o', 'I', 'x']);
  assert.equal(p.slots(), 'OIX·');
  assert.deepEqual(p.sounds.filter(s => s.startsWith('vault-') && s !== 'vault-tick'), ['vault-correct', 'vault-correct', 'vault-set']);
  p.type(['S', 'Q']);
  assert.equal(p.slots(), 'OIXS', 'a fifth letter is ignored');
});

test('digits and symbols are ignored, Backspace erases, Enter tries the lock', t => {
  let tried = null;
  const p = page(t, word => { tried = word; });
  p.type(['1', '?', '-', 'ä', 'O', 'I', 'L', 'L', 'Backspace', 'S']);
  assert.equal(p.slots(), 'OILS');
  p.type(['Enter']);
  assert.equal(tried, 'OILS');
});

test('typing never reaches the game, Esc still does', t => {
  const p = page(t);
  // Like the browser: once a listener calls stopImmediatePropagation, later listeners (the game) see nothing.
  const send = key => {
    const event = { key, repeat: false, target: null, stopped: false, preventDefault() {}, stopImmediatePropagation() { this.stopped = true; } };
    let stopped = false;
    for (const listener of p.listeners) { listener(event); if (event.stopped) { stopped = true; break; } }
    return stopped;
  };
  for (const key of ['w', 'e', 'j', 'm', 'Enter', 'Backspace']) assert.equal(send(key), true, `${key} must not move or trigger shortcuts`);
  assert.equal(send('Escape'), false, 'Esc is left to the page');
});

test('a wrong typed code behaves like before: message, one more attempt, safe stays shut', t => {
  const doc = installFakeDom();
  const storage = memoryStorage();
  storage.setItem('safe-test', JSON.stringify({ story: serialize(ready()), progress: {} }));
  const container = createContainer();
  const host = createStoryHost({ openPanel: () => container, closePanel() {}, storage, storageKey: 'safe-test' });
  host.openVault();
  for (const key of ['L', 'O', 'S', 'T', 'Enter']) doc.pressKey(key);
  assert.equal(host.state.safe.open, false);
  assert.equal(host.state.safe.attempts, 1);
  assert.match(container.textContent, /THE SAFE/);
  assert.ok(findAll(container, n => n.className === 'story-feedback')[0].textContent.length > 0, 'feedback shown');
});
