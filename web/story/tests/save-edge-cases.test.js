// Edge cases for saved games: whatever is in storage, the game never crashes and starts fresh cleanly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission } from '../engine.js';
import { serialize, deserialize } from '../save.js';
import { createStoryHost, memoryStorage } from '../host.js';
import { installFakeDom, createContainer } from './fake-dom.js';

const valid = () => readMission(newGame()).state;
const changed = change => { const state = structuredClone(valid()); change(state); return JSON.stringify(state); };

const BROKEN_SAVES = {
  'empty string': '',
  'broken JSON': '{"caseVersion": 3, ',
  'old version': changed(s => { s.caseVersion = 0; }),
  'missing field': changed(s => { delete s.safe; }),
  'missing station': changed(s => { delete s.stations.portraits; }),
  'points as text': changed(s => { s.stations.portraits.points = '15'; }),
  'missionRead as text': changed(s => { s.missionRead = 'yes'; }),
  'negative mistakes': changed(s => { s.stations.landscape.mistakes = -1; }),
  'unknown station': changed(s => { s.stations.sculptures = { solved: false, mistakes: 0, hints: 0, points: 0 }; }),
};

for (const [name, text] of Object.entries(BROKEN_SAVES)) {
  test(`save with ${name} is rejected, not crashed on`, () => {
    assert.equal(deserialize(text), null);
  });

  test(`host with ${name} starts a fresh game and reports the discarded save`, () => {
    installFakeDom();
    const storage = memoryStorage();
    storage.setItem('key', JSON.stringify({ story: text, progress: {} }));
    const host = createStoryHost({ storage, storageKey: 'key', openPanel: createContainer, closePanel() {} });
    assert.equal(host.state.missionRead, false);
    assert.equal(host.discardedSave, true);
  });
}

test('a valid save is kept and nothing is reported', () => {
  assert.deepEqual(deserialize(serialize(valid())), valid());
  installFakeDom();
  const storage = memoryStorage();
  storage.setItem('key', JSON.stringify({ story: serialize(valid()), progress: {} }));
  const host = createStoryHost({ storage, storageKey: 'key', openPanel: createContainer, closePanel() {} });
  assert.equal(host.state.missionRead, true);
  assert.equal(host.discardedSave, false);
});

test('a first visit (nothing saved) is not reported as discarded', () => {
  installFakeDom();
  const host = createStoryHost({ storage: memoryStorage(), storageKey: 'key', openPanel: createContainer, closePanel() {} });
  assert.equal(host.discardedSave, false);
});

test('a whole storage entry that is not JSON is discarded too', () => {
  installFakeDom();
  const storage = memoryStorage();
  storage.setItem('key', 'garbage');
  const host = createStoryHost({ storage, storageKey: 'key', openPanel: createContainer, closePanel() {} });
  assert.equal(host.discardedSave, true);
});
