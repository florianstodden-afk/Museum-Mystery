// The story host: connects the story engine with ANY page (main game, preview, …).
//
// It does the work every page would otherwise repeat:
// load and save the game, open stations, show conversations, the safe, the final question,
// the endings and hints – always inside a panel that the page provides.
//
// The page only has to give three things:
//   openPanel(title) → an empty HTML element to draw into (e.g. the body of your dialog)
//   closePanel()     → hide that dialog again
//   onChange(state, message) → called after every action, e.g. to update the journal
//
// Example (main game):
//   const story = createStoryHost({ openPanel, closePanel, onChange, stations: { landscape } });
//   story.start();              // shows M's message on the very first visit
//   story.openStation('landscape');
//   story.openVault();          // safe → final question → decision → ending
import {
  newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding,
} from './engine.js';
import { CASE } from './case-1.js';
import { serialize, deserialize } from './save.js';
import { openStation as runStation } from './stations.js';
import * as placeholderStation from './placeholder-station.js';
import { dialogueFor, renderDialogue } from './dialogues.js';
import { renderSafe } from './safe-ui.js';
import { renderAccusation } from './accusation-ui.js';
import { endingModel, renderEnding, renderEndingChoice } from './endings.js';
import { hintFor } from './hints.js';
import { examine as examineOffice } from './security-office/interactions.js';
import { el, button } from './dom.js';

export const DEFAULT_STORAGE_KEY = 'museum-nocturne-story-v1';

export function createStoryHost(options) {
  const {
    openPanel,
    closePanel,
    onChange = () => {},
    onReset = () => {},       // optional: the page resets its own things (e.g. player position)
    stations = {},
    storage = safeLocalStorage(),
    storageKey = DEFAULT_STORAGE_KEY,
  } = options;

  let { state, progress } = load();
  let hintLevel = 1;          // first hint is gentle, asking again gives a concrete one
  let hintStep = null;        // resets the level when the story moves on

  // ---------- Saving ----------

  function load() {
    try {
      const saved = JSON.parse(storage.getItem(storageKey));
      const story = deserialize(saved?.story);
      if (story) return { state: story, progress: saved.progress ?? {} };
    } catch {
      // Broken or blocked storage: start a fresh game.
    }
    return { state: newGame(), progress: {} };
  }

  function save() {
    try {
      storage.setItem(storageKey, JSON.stringify({ story: serialize(state), progress }));
    } catch {
      // The game keeps working without saving.
    }
  }

  // Every engine action goes through here: keep the new state, save, tell the page.
  function act(result) {
    state = result.state;
    save();
    onChange(state, result.message);
    return result;
  }

  // ---------- Panel helpers ----------

  // Opens the page's panel with a content area and a row of buttons below it.
  function scene(title) {
    const container = openPanel(title);
    const content = el('div', { className: 'story-scene' });
    const actions = el('div', { className: 'story-actions' });
    container.replaceChildren(content, actions);
    return { content, actions };
  }

  function closeButton(label = 'Close') {
    return button(label, () => closePanel());
  }

  // ---------- Scenes ----------

  function showMission() {
    const { content, actions } = scene(CASE.mission.title);
    renderDialogue(content, dialogueFor('m', state));
    if (state.missionRead) {
      actions.append(closeButton());
      return;
    }
    actions.append(button('Accept the mission', () => {
      act(readMission(state));
      closePanel();
    }));
  }

  function talkTo(characterId) {
    const dialogue = dialogueFor(characterId, state);
    if (!dialogue) return;
    const { content, actions } = scene('Conversation');
    renderDialogue(content, dialogue);
    actions.append(closeButton());
  }

  function examine(pointId) {
    const result = act(examineOffice(state, pointId));
    const { content, actions } = scene(result.title || 'Examine');
    content.append(el('p', { className: 'story-text', text: result.text }));
    if (result.message) content.append(el('p', { className: 'story-feedback', text: result.message }));
    actions.append(closeButton());
    return result;
  }

  function openStation(stationId) {
    const station = CASE.stations.find(s => s.id === stationId);
    if (!station) return;
    const { content, actions } = scene(`${station.room} · Station ${station.letter}`);
    actions.append(closeButton('Back to the museum'));
    if (!state.missionRead) {
      content.append(el('p', { className: 'story-text', text: 'Read the message from M first.' }));
      return;
    }
    runStation(stations[stationId] ?? placeholderStation, content, {
      stationId,
      savedProgress: progress[stationId] ?? null,
      onProgress(next) {
        progress = { ...progress, [stationId]: next };
        save();
      },
      onSolved(result) {
        const outcome = act(solveStation(state, stationId, result));
        if (outcome.ok) {
          content.append(el('p', { className: 'story-feedback', text: `Letter ${station.letter} is now in your journal.` }));
        }
      },
    });
  }

  // The vault leads through the end of the story, depending on how far the player is.
  function openVault() {
    if (state.ending) return showEnding();
    if (!state.safe.open) return showSafe('');
    if (!state.accusation.solved) return showAccusation('');
    return showEndingChoice();
  }

  function showSafe(message) {
    const { content, actions } = scene('The Vault');
    renderSafe(content, { state, message }, word => {
      const result = act(tryOpenSafe(state, word));
      showSafe(result.message);
    });
    actions.append(state.safe.open
      ? button('Look at the documents', () => showAccusation(''))
      : closeButton());
  }

  function showAccusation(message) {
    const { content, actions } = scene('The final question');
    renderAccusation(content, { state, message }, suspectId => {
      const result = act(accuse(state, suspectId));
      showAccusation(result.message);
    });
    actions.append(state.accusation.solved
      ? button('Decide what happens', () => showEndingChoice())
      : closeButton());
  }

  function showEndingChoice() {
    const { content, actions } = scene('Before sunrise');
    renderEndingChoice(content, endingId => {
      act(chooseEnding(state, endingId));
      showEnding();
    });
    actions.append(closeButton('Not yet'));
  }

  function showEnding() {
    const model = endingModel(state);
    if (!model) return;
    const { content } = scene('Case closed');
    renderEnding(content, model, { onNewGame: confirmNewGame });
  }

  function showHint() {
    const step = currentStep();
    if (step !== hintStep) { hintStep = step; hintLevel = 1; }
    const hint = hintFor(state, hintLevel);
    const { content, actions } = scene(`A hint from ${hint.from}`);
    content.append(
      el('p', { className: 'story-eyebrow', text: hintLevel === 1 ? 'HINT' : 'MORE CONCRETE HINT' }),
      el('p', { className: 'story-dialogue-line', text: hint.text }),
      el('p', { className: 'story-muted', text: 'Hints from Imani cost no points.' }),
    );
    if (hintLevel === 1) {
      actions.append(button('Tell me more', () => { hintLevel = 2; showHint(); }));
    }
    actions.append(closeButton());
    return hint;
  }

  // A short text that changes whenever the story moves on (used to reset the hint level).
  function currentStep() {
    return JSON.stringify([state.missionRead, state.letters, state.safe.open, state.accusation.solved, state.ending]);
  }

  function confirmNewGame() {
    const { content, actions } = scene('Start a new game?');
    content.append(el('p', { className: 'story-text', text: 'Your progress in this case will be reset.' }));
    actions.append(button('Reset', () => reset()), closeButton('Cancel'));
  }

  function reset() {
    state = newGame();
    progress = {};
    hintStep = null;
    save();
    onReset();
    onChange(state, 'New game started.');
    showMission();
  }

  // What the page can call.
  return {
    get state() { return state; },
    start() { if (!state.missionRead) showMission(); },
    showMission,
    talkTo,
    examine,
    openStation,
    openVault,
    showHint,
    confirmNewGame,
    reset,
  };
}

// localStorage can be missing or blocked (private mode). Then we save nothing.
function safeLocalStorage() {
  try {
    return globalThis.localStorage ?? memoryStorage();
  } catch {
    return memoryStorage();
  }
}

export function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
  };
}
