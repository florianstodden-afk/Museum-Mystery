import test from 'node:test';
import assert from 'node:assert/strict';
import { soundFor, recipe, createSoundPlayer, SOUND_IDS, STORAGE_KEY } from '../sound.js';
import { newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding } from '../engine.js';
import { memoryStorage } from '../host.js';

const ALL = ['landscape', 'portraits', 'restoration', 'archive'];

function allSolved() {
  let s = readMission(newGame()).state;
  for (const id of ALL) s = solveStation(s, id, {}).state;
  return s;
}

// A fake AudioContext that only counts what would be played.
function fakeAudio() {
  const log = { tones: 0, contexts: 0, resumed: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {}, gain: param(), frequency: param() });
  class FakeContext {
    constructor() { log.contexts++; this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; }
    resume() { log.resumed++; this.state = 'running'; }
    createGain() { return node(); }
    createBiquadFilter() { return node(); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return { ...node(), start() { log.tones++; }, stop() {} }; }
    createOscillator() { return { ...node(), start() { log.tones++; }, stop() {} }; }
  }
  return { FakeContext, log };
}

test('each story action gets the right sound', () => {
  const start = newGame();
  assert.equal(soundFor('readMission', readMission(start), start), 'page');
  const read = readMission(start).state;
  assert.equal(soundFor('solveStation', solveStation(read, 'portraits', {}), read), 'letter');

  const ready = allSolved();
  assert.equal(soundFor('tryOpenSafe', tryOpenSafe(ready, 'DLIB'), ready), 'wrong');
  assert.equal(soundFor('tryOpenSafe', tryOpenSafe(ready, 'BILD'), ready), 'unlock');

  const open = tryOpenSafe(ready, 'BILD').state;
  assert.equal(soundFor('accuse', accuse(open, 'leon'), open), 'wrong');
  const solved = accuse(open, 'voss').state;
  assert.equal(soundFor('accuse', accuse(open, 'voss'), open), 'letter');
  assert.equal(soundFor('chooseEnding', chooseEnding(solved, 'heist'), solved), 'ending-heist');
  assert.equal(soundFor('chooseEnding', chooseEnding(solved, 'open-file'), solved), 'ending-open');
});

test('rejected actions stay silent (e.g. empty word, station solved twice)', () => {
  const ready = allSolved();
  assert.equal(soundFor('tryOpenSafe', tryOpenSafe(ready, '   '), ready), null);
  const again = solveStation(ready, 'portraits', {});
  assert.equal(soundFor('solveStation', again, ready), null);
  const early = newGame();
  assert.equal(soundFor('accuse', accuse(early, 'voss'), early), null);
  assert.equal(soundFor('unknown-action', { ok: true }, early), null);
});

test('every sound is short and not too loud', () => {
  for (const id of SOUND_IDS) {
    const tones = recipe(id);
    assert.ok(tones.length > 0, id);
    for (const t of tones) {
      assert.ok(t.freq > 20 && t.freq < 8000, `${id} frequency ${t.freq}`);
      assert.ok(t.volume > 0 && t.volume <= 0.5, `${id} volume`);
      assert.ok(t.start + t.duration <= 2.5, `${id} length`);
    }
  }
  assert.deepEqual(recipe('nope'), []);
});

test('the player plays tones, and "muted" really is silent', () => {
  const { FakeContext, log } = fakeAudio();
  const player = createSoundPlayer({ AudioContextClass: FakeContext, storage: memoryStorage() });
  assert.equal(player.play('letter'), true);
  assert.equal(log.tones, recipe('letter').length);
  assert.equal(log.resumed, 1, 'a suspended browser audio context is resumed');
  player.toggle();
  assert.equal(player.muted, true);
  assert.equal(player.play('unlock'), false);
  assert.equal(log.tones, recipe('letter').length, 'no new tones while muted');
  assert.equal(log.contexts, 1, 'one audio context is reused');
});

test('the mute choice is remembered, and broken storage does not break the game', () => {
  const storage = memoryStorage();
  createSoundPlayer({ storage }).setMuted(true);
  assert.equal(storage.getItem(STORAGE_KEY), 'muted');
  assert.equal(createSoundPlayer({ storage }).muted, true);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const player = createSoundPlayer({ storage: blocked });
  assert.equal(player.muted, false);
  assert.equal(player.toggle(), true);
});

test('without Web Audio (e.g. in Node) the player stays silent instead of crashing', () => {
  const player = createSoundPlayer({ AudioContextClass: null, storage: memoryStorage() });
  assert.equal(player.play('letter'), false);
});
