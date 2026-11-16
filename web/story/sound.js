// Sounds for the story, made in the browser with the Web Audio API – no audio files.
// Three parts, from simple to technical:
//   soundFor(action, result) – which sound fits a story action (pure, tested)
//   recipe(id)               – each sound described as data: a few tones (pure, tested)
//   createSoundPlayer()      – plays a recipe and remembers "muted" (needs a browser)

export const SOUND_IDS = ['page', 'click', 'wrong', 'letter', 'unlock', 'hint', 'flip', 'ending-heist', 'ending-open',
  'step-hall', 'step-gallery', 'step-office', 'step-storage'];
export const MUSIC_KEY = 'museum-nocturne-music-v1';
export const STEP_INTERVAL_MS = 420; // one footstep sound per 0.42 s of walking: a calm pace
const STEP_VOLUME = 0.3;             // footsteps play at about a third of the other sounds
export const STORAGE_KEY = 'museum-nocturne-sound-v1';
const MASTER_VOLUME = 0.22; // quiet by default

// Which sound belongs to an engine action. `result` is the engine answer { ok, state, message },
// `before` the state before the action. The engine's rule: a WRONG answer changes the state
// (attempts + 1), a REJECTED action (e.g. an empty word) returns the same state. Rejected = silent.
export function soundFor(action, result, before) {
  if (!result) return null;
  const counted = result.state !== before; // a wrong answer that was counted
  switch (action) {
    case 'readMission': return result.ok ? 'page' : null;
    case 'examine': return result.ok ? 'page' : null;
    case 'solveStation': return result.ok ? 'letter' : null;
    case 'tryOpenSafe':
      if (result.ok) return 'unlock';
      return counted ? 'wrong' : null;
    case 'accuse':
      if (result.ok) return 'letter';
      return counted ? 'wrong' : null;
    case 'chooseEnding':
      if (!result.ok) return null;
      return result.state.ending === 'heist' ? 'ending-heist' : 'ending-open';
    default: return null;
  }
}

// Note names → frequencies in Hz (equal temperament, A4 = 440).
const NOTES = { C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, G4: 392.0, A4: 440.0, Bb4: 466.16, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A3: 220.0, D3: 146.83, G3: 196.0, C3: 130.81, F3: 174.61 };

// A tone: { wave, freq, start, duration, volume } (seconds, volume 0..1). wave 'noise' = a short hiss.
// filter (only for noise): 'bandpass' keeps a band around freq, 'highpass' keeps everything above it.
function tone(wave, note, start, duration, volume, glideTo = null, filter = 'bandpass') {
  return { wave, freq: typeof note === 'number' ? note : NOTES[note], start, duration, volume, glideTo, filter };
}

export function recipe(id) {
  switch (id) {
    case 'page': // soft paper rustle
      return [tone('noise', 2400, 0, 0.12, 0.35)];
    case 'click': // brass click of the dial or a card
      return [tone('square', 1800, 0, 0.03, 0.25), tone('triangle', 900, 0.02, 0.05, 0.2)];
    case 'wrong': // two low, dull notes going down
      return [tone('triangle', 'D3', 0, 0.18, 0.5), tone('triangle', 'C3', 0.18, 0.28, 0.5)];
    case 'letter': // a short rising arpeggio: a clue clicks into place
      return [tone('sine', 'C5', 0, 0.35, 0.4), tone('sine', 'E5', 0.08, 0.35, 0.35), tone('sine', 'G5', 0.16, 0.5, 0.35)];
    case 'unlock': // heavy bolt, then the door swings open
      return [tone('square', 'C3', 0, 0.08, 0.5), tone('noise', 600, 0.08, 0.2, 0.4), tone('sawtooth', 'G3', 0.25, 0.9, 0.18, NOTES.C4)];
    case 'hint': // gentle bell
      return [tone('sine', 'A4', 0, 0.6, 0.35), tone('sine', 'E5', 0.01, 0.5, 0.12)];
    case 'flip': // cards turning over
      return [tone('noise', 3200, 0, 0.08, 0.3), tone('noise', 3200, 0.12, 0.08, 0.3), tone('noise', 3200, 0.24, 0.08, 0.3), tone('sine', 'G5', 0.4, 0.4, 0.25)];
    case 'ending-heist': // dark, minor
      return [tone('sine', 'D4', 0, 1.2, 0.35), tone('sine', 'F3', 0, 1.2, 0.3), tone('sine', 'A3', 0.3, 1.4, 0.25), tone('sine', 'D3', 0.6, 1.6, 0.3)];
    // Footsteps: heeled shoes. Each step is a very short hard "clack" (a burst of high hiss
    // plus a bright tone that dies away fast). The room echo comes from stepReverb() below.
    case 'step-hall': // heel on marble: hard and bright
      return [tone('noise', 3200, 0, 0.012, 0.5, null, 'highpass'), tone('triangle', 1650, 0, 0.045, 0.22, 1350), tone('sine', 190, 0, 0.03, 0.08, 120)];
    case 'step-gallery': // heel on a wooden floor: a hollower, lower "tock"
      return [tone('noise', 1800, 0, 0.015, 0.38), tone('triangle', 820, 0, 0.06, 0.24, 650), tone('sine', 150, 0, 0.04, 0.1, 100)];
    case 'step-office': // heel on carpet: almost swallowed
      return [tone('noise', 500, 0, 0.03, 0.12), tone('sine', 110, 0, 0.05, 0.08, 80)];
    case 'step-storage': // heel on bare stone: hard, a bit darker than marble
      return [tone('noise', 2600, 0, 0.012, 0.45, null, 'highpass'), tone('triangle', 1350, 0, 0.05, 0.2, 1100), tone('sine', 170, 0, 0.03, 0.08, 110)];
    case 'ending-open': // warm, major
      return [tone('sine', 'C4', 0, 1.2, 0.3), tone('sine', 'E4', 0.15, 1.2, 0.28), tone('sine', 'G4', 0.3, 1.2, 0.28), tone('sine', 'C5', 0.45, 1.5, 0.3)];
    default:
      return [];
  }
}

// Which footstep fits the room the player is in.
export function stepSoundFor(room) {
  return { hall: 'step-hall', gallery: 'step-gallery', security: 'step-office', storage: 'step-storage' }[room] ?? null;
}

// How long each room echoes (seconds) and how strong the echo is. A big stone hall rings longest.
export function stepReverb(room) {
  return {
    hall: { seconds: 1.6, mix: 0.45 },
    storage: { seconds: 0.9, mix: 0.35 },
    gallery: { seconds: 0.6, mix: 0.25 },
    security: { seconds: 0.25, mix: 0.08 },
  }[room] ?? { seconds: 0, mix: 0 };
}

// No two steps sound the same: pitch and volume vary a little, left and right foot differ slightly.
export function varyStep(tones, footIndex, random = Math.random) {
  const pitch = (footIndex % 2 === 0 ? 1 : 0.94) * (0.94 + random() * 0.12); // ±6 %, right foot a bit lower
  const loudness = 0.85 + random() * 0.3;                                       // ±15 %
  return tones.map(t => ({
    ...t,
    freq: t.freq * pitch,
    glideTo: t.glideTo ? t.glideTo * pitch : null,
    volume: Math.min(0.5, t.volume * loudness),
  }));
}

// ---------- Night music: optional, off by default ----------
// Real art museums are usually quiet; where music exists, visitors often choose it themselves.
// So the music is a quiet, slow melody the browser invents note by note (no audio file).
export const MUSIC_SCALE = ['D4', 'F4', 'G4', 'A4', 'C5', 'D5']; // D minor pentatonic: calm, a bit mysterious
const MUSIC_FREQ = { D4: 293.66, F4: 349.23, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33 };

// The next note: a small step up or down from the last one, so it sounds like a melody, not noise.
export function nextMusicNote(previousIndex, random = Math.random) {
  const steps = [-2, -1, -1, 1, 1, 2];
  const step = steps[Math.floor(random() * steps.length)];
  return Math.min(MUSIC_SCALE.length - 1, Math.max(0, previousIndex + step));
}

// Seconds until the next note: slow and a little irregular.
export function musicPause(random = Math.random) {
  return 1.6 + random() * 2.2;
}

// Plays recipes. Works without a browser (in tests) – then it simply stays silent.
// options.AudioContextClass and options.storage can be replaced in tests.
export function createSoundPlayer(options = {}) {
  const storage = options.storage ?? safeStorage();
  const AudioContextClass = options.AudioContextClass ?? globalThis.AudioContext ?? globalThis.webkitAudioContext;
  let muted = readMuted(storage);
  let musicOn = readMusic(storage);
  let musicTimer = null;
  let noteIndex = 2;
  const setTimer = options.setTimeout ?? globalThis.setTimeout;
  const clearTimer = options.clearTimeout ?? globalThis.clearTimeout;
  let context = null;

  function audio() {
    if (!AudioContextClass) return null;
    if (!context) context = new AudioContextClass(); // created on the first sound, i.e. after a click or key
    if (context.state === 'suspended') context.resume?.();
    return context;
  }

  function play(id) {
    if (muted || !id) return false;
    const tones = recipe(id);
    const ctx = tones.length ? audio() : null;
    if (!ctx) return false;
    const master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
    for (const t of tones) playTone(ctx, master, t);
    return true;
  }

  function setMuted(value) {
    muted = Boolean(value);
    try { storage?.setItem(STORAGE_KEY, muted ? 'muted' : 'on'); } catch { /* saving is optional */ }
    return muted;
  }

  // A footstep in the given room: quieter than other sounds and slightly different every time.
  let footIndex = 0;
  function playStep(room) {
    const id = stepSoundFor(room);
    if (muted || !id) return false;
    const ctx = audio();
    if (!ctx) return false;
    const master = ctx.createGain();
    master.gain.value = MASTER_VOLUME * STEP_VOLUME;
    master.connect(ctx.destination);
    // Dry sound plus the room's echo.
    const { seconds, mix } = stepReverb(room);
    const output = seconds > 0 ? withReverb(ctx, master, seconds, mix) : master;
    for (const t of varyStep(recipe(id), footIndex++)) playTone(ctx, output, t);
    return true;
  }

  // A simple artificial room echo: a ConvolverNode with fading noise as the "room answer".
  const echoes = new Map();
  function withReverb(ctx, destination, seconds, mix) {
    if (!ctx.createConvolver) return destination;
    if (!echoes.has(seconds)) {
      const length = Math.floor(ctx.sampleRate * seconds);
      const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
      }
      echoes.set(seconds, impulse);
    }
    const input = ctx.createGain();           // the step goes in here …
    const convolver = ctx.createConvolver();
    convolver.buffer = echoes.get(seconds);
    const wet = ctx.createGain();
    wet.gain.value = mix;
    input.connect(destination);               // … once dry,
    input.connect(convolver);                 // … once through the echo,
    convolver.connect(wet);
    wet.connect(destination);
    return input;
  }

  // One soft note with a quiet low drone under it, then wait and play the next one.
  function playMusicNote() {
    musicTimer = null;
    if (!musicOn) return;
    const ctx = typeof document !== 'undefined' && document.hidden ? null : audio(); // silent in a hidden tab
    if (ctx) {
      noteIndex = nextMusicNote(noteIndex);
      const master = ctx.createGain();
      master.gain.value = MASTER_VOLUME * 0.6; // music sits below the sound effects
      master.connect(ctx.destination);
      playTone(ctx, master, { wave: 'sine', freq: MUSIC_FREQ[MUSIC_SCALE[noteIndex]], start: 0, duration: 2.2, volume: 0.3 });
      playTone(ctx, master, { wave: 'sine', freq: 73.42, start: 0, duration: 3.0, volume: 0.12 }); // D2 drone
    }
    musicTimer = setTimer(playMusicNote, musicPause() * 1000);
  }

  function setMusic(value) {
    musicOn = Boolean(value);
    try { storage?.setItem(MUSIC_KEY, musicOn ? 'on' : 'off'); } catch { /* saving is optional */ }
    if (musicOn && musicTimer === null && AudioContextClass) playMusicNote();
    if (!musicOn && musicTimer !== null) { clearTimer(musicTimer); musicTimer = null; }
    return musicOn;
  }

  return {
    play,
    playStep,
    get muted() { return muted; },
    setMuted,
    toggle() { return setMuted(!muted); },
    get musicOn() { return musicOn; },
    setMusic,
    toggleMusic() { return setMusic(!musicOn); },
    // Call once after the first click or key press: browsers only allow sound after that.
    resumeMusic() { if (musicOn && musicTimer === null && AudioContextClass) playMusicNote(); },
  };
}

// One tone: a short envelope (quick rise, smooth fall) so nothing clicks or hurts.
function playTone(ctx, destination, t) {
  const start = ctx.currentTime + t.start;
  const end = start + t.duration;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, t.volume), start + Math.min(0.02, t.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  gain.connect(destination);

  let source;
  if (t.wave === 'noise') {
    // Noise through a band-pass filter: paper, hinges, cards.
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * t.duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = t.filter ?? 'bandpass';
    filter.frequency.value = t.freq;
    source.connect(filter);
    filter.connect(gain);
  } else {
    source = ctx.createOscillator();
    source.type = t.wave;
    source.frequency.setValueAtTime(t.freq, start);
    if (t.glideTo) source.frequency.exponentialRampToValueAtTime(t.glideTo, end);
    source.connect(gain);
  }
  source.start(start);
  source.stop(end + 0.05);
}

function readMusic(storage) {
  try { return storage?.getItem(MUSIC_KEY) === 'on'; } catch { return false; }
}

function readMuted(storage) {
  try { return storage?.getItem(STORAGE_KEY) === 'muted'; } catch { return false; }
}

function safeStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
