import test from 'node:test';
import assert from 'node:assert/strict';
import { soundFor, recipe, createSoundPlayer, SOUND_IDS, STORAGE_KEY, MUSIC_KEY, stepSoundFor, nextMusicNote, musicPause, MUSIC_SCALE, varyStep, stepReverb } from '../sound.js';
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

test('every room has its own footstep sound', () => {
  assert.equal(stepSoundFor('hall'), 'step-hall');
  assert.equal(stepSoundFor('gallery'), 'step-gallery');
  assert.equal(stepSoundFor('security'), 'step-office');
  assert.equal(stepSoundFor('storage'), 'step-storage');
  assert.equal(stepSoundFor('roof'), null);
  const names = ['hall', 'gallery', 'security', 'storage'].map(stepSoundFor);
  assert.equal(new Set(names).size, 4);
});

test('the melody moves in small steps and never leaves the scale', () => {
  let index = 2;
  for (const r of [0, 0.1, 0.99, 0.5, 0.2, 0.8, 0, 0, 0, 0.99, 0.99, 0.99]) {
    const next = nextMusicNote(index, () => r);
    assert.ok(next >= 0 && next < MUSIC_SCALE.length);
    assert.ok(Math.abs(next - index) <= 2);
    index = next;
  }
  assert.ok(musicPause(() => 0) >= 1.5 && musicPause(() => 0.999) <= 4);
});

test('music is off by default, plays notes when switched on and stops when switched off', () => {
  const { FakeContext, log } = fakeAudio();
  const timers = [];
  const storage = memoryStorage();
  const player = createSoundPlayer({
    AudioContextClass: FakeContext, storage,
    setTimeout: fn => { timers.push(fn); return timers.length; },
    clearTimeout: () => { timers.length = 0; },
  });
  assert.equal(player.musicOn, false);
  player.toggleMusic();
  assert.equal(player.musicOn, true);
  assert.equal(log.tones, 2, 'one note and the drone');
  timers.shift()();                     // time passes: the next note
  assert.equal(log.tones, 4);
  player.toggleMusic();
  assert.equal(timers.length, 0, 'no more notes are planned');
  assert.equal(storage.getItem(MUSIC_KEY), 'off');
  assert.equal(createSoundPlayer({ storage }).musicOn, false);
  player.setMusic(true);
  assert.equal(createSoundPlayer({ storage }).musicOn, true, 'the choice is remembered');
});

test('footsteps sound like heeled shoes: a short hard clack, then the room echoes', () => {
  for (const room of ['hall', 'gallery', 'storage']) {
    const [clack, ring] = recipe(stepSoundFor(room));
    assert.equal(clack.wave, 'noise', room);
    assert.ok(clack.duration <= 0.02, `${room}: the clack is very short`);
    assert.ok(clack.freq >= 1500, `${room}: the clack is bright`);
    assert.ok(ring.freq >= 600 && ring.glideTo < ring.freq, `${room}: the heel rings and dies away`);
  }
  // The carpet swallows the clack.
  assert.ok(recipe('step-office').every(t => t.freq <= 600));
  // The big stone hall echoes longest; the carpeted office hardly at all.
  const seconds = room => stepReverb(room).seconds;
  assert.ok(seconds('hall') > seconds('storage') && seconds('storage') > seconds('gallery') && seconds('gallery') > seconds('security'));
  assert.deepEqual(stepReverb('roof'), { seconds: 0, mix: 0 });
});

test('no two steps are identical, but they only vary a little', () => {
  const base = recipe('step-gallery');
  const left = varyStep(base, 0, () => 0.5);
  const right = varyStep(base, 1, () => 0.5);
  assert.notEqual(left[0].freq, right[0].freq, 'left and right foot differ');
  for (const r of [0, 0.999]) {
    const varied = varyStep(base, 0, () => r);
    varied.forEach((t, i) => {
      assert.ok(Math.abs(t.freq / base[i].freq - 1) <= 0.07, 'pitch within ±7 %');
      assert.ok(Math.abs(t.volume / base[i].volume - 1) <= 0.16, 'volume within ±16 %');
    });
  }
});

test('footsteps are much quieter than story sounds and silent when muted', () => {
  const { FakeContext, log } = fakeAudio();
  const gains = [];
  const original = FakeContext.prototype.createGain;
  FakeContext.prototype.createGain = function () { const g = original.call(this); gains.push(g); return g; };
  const player = createSoundPlayer({ AudioContextClass: FakeContext, storage: memoryStorage() });
  player.play('letter');
  const storyMaster = gains[0].gain.value;
  gains.length = 0;
  assert.equal(player.playStep('gallery'), true);
  const stepMaster = gains[0].gain.value;
  assert.ok(stepMaster <= storyMaster * 0.4, `step master ${stepMaster} vs ${storyMaster}`);
  assert.equal(player.playStep('roof'), false);
  player.setMuted(true);
  const before = log.tones;
  assert.equal(player.playStep('hall'), false);
  assert.equal(log.tones, before);
});
