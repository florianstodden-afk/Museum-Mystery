// Sounds for the story, made in the browser with the Web Audio API – no audio files.
// Three parts, from simple to technical:
//   soundFor(action, result) – which sound fits a story action (pure, tested)
//   recipe(id)               – each sound described as data: a few tones (pure, tested)
//   createSoundPlayer()      – plays a recipe and remembers "muted" (needs a browser)

export const SOUND_IDS = ['page', 'click', 'wrong', 'letter', 'unlock', 'hint', 'flip', 'ending-heist', 'ending-open'];
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
function tone(wave, note, start, duration, volume, glideTo = null) {
  return { wave, freq: typeof note === 'number' ? note : NOTES[note], start, duration, volume, glideTo };
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
    case 'ending-open': // warm, major
      return [tone('sine', 'C4', 0, 1.2, 0.3), tone('sine', 'E4', 0.15, 1.2, 0.28), tone('sine', 'G4', 0.3, 1.2, 0.28), tone('sine', 'C5', 0.45, 1.5, 0.3)];
    default:
      return [];
  }
}

// Plays recipes. Works without a browser (in tests) – then it simply stays silent.
// options.AudioContextClass and options.storage can be replaced in tests.
export function createSoundPlayer(options = {}) {
  const storage = options.storage ?? safeStorage();
  const AudioContextClass = options.AudioContextClass ?? globalThis.AudioContext ?? globalThis.webkitAudioContext;
  let muted = readMuted(storage);
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

  return {
    play,
    get muted() { return muted; },
    setMuted,
    toggle() { return setMuted(!muted); },
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
    filter.type = 'bandpass';
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

function readMuted(storage) {
  try { return storage?.getItem(STORAGE_KEY) === 'muted'; } catch { return false; }
}

function safeStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
