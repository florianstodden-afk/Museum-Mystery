import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryHost, memoryStorage } from '../host.js';
import { installFakeDom, createContainer, findAll, findButton } from './fake-dom.js';

// A fake page: one panel element, a log of what happened.
function fakePage(storage = memoryStorage()) {
  installFakeDom();
  const page = { panel: createContainer(), title: '', open: false, messages: [], storage };
  page.options = {
    storage,
    storageKey: 'test-key',
    openPanel(title) { page.title = title; page.open = true; return page.panel; },
    closePanel() { page.open = false; },
    onChange(state, message) { page.messages.push(message); },
  };
  return page;
}

// A station in the target format that reports one mistake.
const quickStation = {
  start(container, caseData, onSolved) {
    caseData.onChange({ mistakes: 1, hints: 0, solved: true });
    onSolved({ mistakes: 1, hints: 0 });
  },
};

function click(page, label) {
  const target = findButton(page.panel, label);
  assert.ok(target, `button "${label}" not found in panel "${page.title}"`);
  target.click();
}

function submitWord(page, word) {
  const [input] = findAll(page.panel, node => node.tagName === 'INPUT');
  const [form] = findAll(page.panel, node => node.tagName === 'FORM');
  input.value = word;
  form.dispatch('submit');
}

test('start() shows M’s message once and accepting it saves the game', () => {
  const page = fakePage();
  const host = createStoryHost({ ...page.options, stations: {} });
  host.start();
  assert.equal(page.title, 'A message from M');
  click(page, 'Accept the mission');
  assert.equal(host.state.missionRead, true);
  assert.equal(page.open, false);
  page.title = '';
  host.start();
  assert.equal(page.title, '', 'no message on the second start');
  assert.match(page.storage.getItem('test-key'), /"missionRead\\":true/);
});

test('a whole game runs through the host, including wrong answers', () => {
  const page = fakePage();
  const host = createStoryHost({ ...page.options, stations: { landscape: quickStation } });
  host.start();
  click(page, 'Accept the mission');
  host.openStation('landscape'); // fake station reports 1 mistake at once
  // The other three use the placeholder, which waits for a click.
  for (const id of ['portraits', 'restoration', 'archive']) {
    host.openStation(id);
    click(page, 'Solve station (placeholder)');
  }
  assert.deepEqual(host.state.letters, ['B', 'I', 'L', 'D']);
  assert.equal(host.state.stations.landscape.points, 17);

  host.openVault();
  submitWord(page, 'DLIB');
  assert.match(page.panel.textContent, /Check the order in your journal/);
  submitWord(page, 'bild');
  assert.equal(host.state.safe.open, true);

  click(page, 'Look at the documents');
  click(page, 'Leon');
  assert.match(page.panel.textContent, /night-shift log/);
  click(page, 'Adrien Voss');
  click(page, 'Decide what happens');
  click(page, 'Bring painting and evidence to Dr. Vale');
  assert.equal(host.state.ending, 'open-file');
  assert.equal(page.title, 'Case closed');
  // 17 + 20 + 20 + 20 + safe 5 + question 5
  assert.match(page.panel.textContent, /87 \/ 100/);
});

test('the vault always opens the right step of the story', () => {
  const page = fakePage();
  const host = createStoryHost({ ...page.options });
  host.openVault();
  assert.equal(page.title, 'The Vault');
  assert.match(page.panel.textContent, /0 \/ 4/);
});

test('a saved game comes back in a new host', () => {
  const storage = memoryStorage();
  const first = fakePage(storage);
  const host = createStoryHost({ ...first.options });
  host.start();
  click(first, 'Accept the mission');
  host.openStation('archive');
  click(first, 'Solve station (placeholder)');

  const second = fakePage(storage);
  const again = createStoryHost({ ...second.options });
  assert.deepEqual(again.state.letters, [null, null, null, 'D']);
});

test('broken storage starts a fresh game instead of crashing', () => {
  const storage = memoryStorage();
  storage.setItem('test-key', '{ this is not json');
  const page = fakePage(storage);
  const host = createStoryHost({ ...page.options });
  assert.equal(host.state.missionRead, false);

  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const page2 = fakePage();
  const host2 = createStoryHost({ ...page2.options, storage: blocked });
  host2.start();
  click(page2, 'Accept the mission');
  assert.equal(host2.state.missionRead, true, 'the game works even if saving fails');
});

test('hints start gentle, get concrete, and reset when the story moves on', () => {
  const page = fakePage();
  const host = createStoryHost({ ...page.options });
  host.start();
  click(page, 'Accept the mission');
  host.showHint();
  assert.match(page.panel.textContent, /Four wings/);
  click(page, 'Tell me more');
  assert.match(page.panel.textContent, /MORE CONCRETE HINT/);
  host.openStation('landscape');
  click(page, 'Solve station (placeholder)');
  host.showHint();
  assert.match(page.panel.textContent, /HINT/);
  assert.doesNotMatch(page.panel.textContent, /MORE CONCRETE/);
});

test('examining the security office adds the note once', () => {
  const page = fakePage();
  const host = createStoryHost({ ...page.options });
  host.examine('monitor-wall');
  host.examine('monitor-wall');
  assert.deepEqual(host.state.notes, ['transport-cart']);
  assert.match(page.panel.textContent, /already in your journal/);
});

test('new game asks first and then resets everything', () => {
  const page = fakePage();
  const host = createStoryHost({ ...page.options });
  host.start();
  click(page, 'Accept the mission');
  host.confirmNewGame();
  click(page, 'Cancel');
  assert.equal(host.state.missionRead, true);
  host.confirmNewGame();
  click(page, 'Reset');
  assert.equal(host.state.missionRead, false);
  assert.equal(page.title, 'A message from M');
});
