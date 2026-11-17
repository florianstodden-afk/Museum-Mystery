import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryHost, memoryStorage } from '../host.js';
import { installFakeDom, createContainer, findAll, findButton } from './fake-dom.js';
import { initialPuzzle, startPuzzle, placePiece } from '../../minigames/picture-rules.js';
import { totalScore } from '../scoring.js';
import { newGame, readMission, solveStation } from '../engine.js';

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
  // 17 + 15 (Station I max is now 15) + 15 + 20 + safe 5 + question 5
  assert.match(page.panel.textContent, /77 \/ 90/);
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
  let pageReset = false;
  const host2 = createStoryHost({ ...page.options, onReset: () => { pageReset = true; } });
  host2.confirmNewGame();
  click(page, 'Reset');
  assert.equal(host2.state.missionRead, false);
  assert.equal(pageReset, true, 'the page can reset its own state');
  assert.equal(page.title, 'A message from M');
});

test('a completed Station L stays completed and is never started again', () => {
  const page = fakePage();
  const host = createStoryHost({ ...page.options });
  host.start(); click(page, 'Accept the mission');
  host.openStation('restoration'); click(page, 'Solve station (placeholder)');
  let starts = 0;
  const restored = createStoryHost({ ...page.options, stations: { restoration: { start() { starts++; } } } });
  restored.openStation('restoration');
  assert.equal(starts, 0);
  assert.match(page.panel.textContent, /hidden|Hidden/);
  assert.deepEqual(restored.state.evidence, ['hidden-mark']);
  assert.equal(restored.state.letters[2], 'L');
});

test('station cleanup runs on leaving and old callbacks cannot overwrite a new attempt', () => {
  const page = fakePage();
  let report, cleaned = 0;
  const station = { start(container, data, solved) { report = () => { data.onChange({ mistakes: 10, hints: 1 }); solved({ mistakes: 10, hints: 1 }); }; return () => cleaned++; } };
  const host = createStoryHost({ ...page.options, stations: { restoration: station } });
  host.start(); click(page, 'Accept the mission'); host.openStation('restoration');
  host.leaveStation(); report();
  assert.equal(cleaned, 1);
  assert.equal(host.state.stations.restoration.solved, false);
});

test('puzzle order, placements and wall clock survive closing and a fresh host', () => {
  const page = fakePage();
  let now = 1000, data, finish;
  const station = { start(container, supplied, solved) { data = supplied; finish = solved; } };
  const options = { ...page.options, now: () => now, stations: { restoration: station } };
  const host = createStoryHost(options);
  host.start(); click(page, 'Accept the mission'); host.openStation('restoration');
  let puzzle = placePiece(startPuzzle(initialPuzzle(),now),3,6,now);
  data.onChange(puzzle);
  host.leaveStation();
  now = 31001; host.tick();
  assert.equal(totalScore(host.state),0);
  now = 46001;
  const again = createStoryHost(options);
  assert.equal(totalScore(again.state),0,'no points before completion');
  again.openStation('restoration');
  assert.deepEqual(data.state,puzzle);
  puzzle = placePiece(puzzle,3,null,now);
  for (let i=0;i<8;i++) puzzle=placePiece(puzzle,i,i,now);
  data.onChange(puzzle); finish({ mistakes: 0, hints: 0 }); finish({ mistakes: 10, hints: 1 });
  now = 999999; again.tick();
  assert.equal(totalScore(again.state),5,'the final placement freezes the time tier');
  assert.deepEqual(again.state.evidence,['hidden-mark']);
  assert.equal(again.state.letters[2],'L');
  again.openStation('restoration');
  assert.match(page.panel.textContent,/Already solved/);
  again.reset();
  assert.equal(totalScore(again.state),0);
  assert.deepEqual(JSON.parse(page.storage.getItem('test-key')).progress,{});
});

test('old in-progress deductions migrate and a completed legacy L is not timed', () => {
  const page = fakePage();
  const old = solveStation(readMission(newGame()).state,'restoration',{ mistakes:1,hints:1 }).state;
  delete old.penalties;
  page.storage.setItem('test-key',JSON.stringify({ story:JSON.stringify(old), progress:{ landscape:{ mistakes:2,hints:1,solved:false }, restoration:{ solved:true,mistakes:1,hints:1 } } }));
  const host=createStoryHost({...page.options,now:()=>99999999});
  assert.equal(totalScore(host.state),12);
  host.tick(); host.openStation('restoration');
  assert.equal(totalScore(host.state),12);

  assert.deepEqual(host.state.evidence,['hidden-mark']);
});

test('a saved final placement recovers completion once after interruption', () => {
  const page=fakePage();
  let puzzle=startPuzzle(initialPuzzle(),1000);
  for(let i=0;i<8;i++) puzzle=placePiece(puzzle,i,i,31001);
  page.storage.setItem('test-key',JSON.stringify({story:JSON.stringify(readMission(newGame()).state),progress:{restoration:puzzle}}));
  for(let i=0;i<2;i++) {
    const host=createStoryHost({...page.options,now:()=>999999});
    assert.deepEqual(host.state.evidence,['hidden-mark']);
    assert.equal(totalScore(host.state),10);
  }
});
test('the host plays a sound for each story moment and stays silent without a player', () => {
  const page = fakePage();
  const played = [];
  const host = createStoryHost({ ...page.options, sound: { play: id => { if (id) played.push(id); } } });
  host.start();
  click(page, 'Accept the mission');
  for (const id of ['landscape', 'portraits', 'restoration', 'archive']) {
    host.openStation(id);
    click(page, 'Solve station (placeholder)');
  }
  host.showHint();
  host.openVault();
  submitWord(page, '   ');   // rejected: silent
  submitWord(page, 'DLIB');  // wrong
  submitWord(page, 'bild');  // opens
  click(page, 'Look at the documents');
  click(page, 'Leon');       // wrong
  click(page, 'Adrien Voss');
  click(page, 'Decide what happens');
  click(page, 'Hand the painting to Voss');
  assert.deepEqual(played, ['page', 'letter', 'letter', 'letter', 'letter', 'hint', 'wrong', 'unlock', 'wrong', 'letter', 'ending-heist']);

  const silent = createStoryHost({ ...fakePage().options });
  assert.doesNotThrow(() => silent.showHint());
});
