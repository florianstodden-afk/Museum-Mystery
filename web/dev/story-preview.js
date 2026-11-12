// Story preview: plays the whole Nocturne story without the walkable map.
// It only USES web/story/* and web/minigames/landscape.js – it changes none of them.
import { CASE, workById } from '../story/case-1.js';
import {
  newGame, readMission, solveStation, addNote, canOpenSafe, tryOpenSafe, accuse, chooseEnding,
} from '../story/engine.js';
import { serialize, deserialize } from '../story/save.js';
import { openStation } from '../story/stations.js';
import * as placeholderStation from '../story/placeholder-station.js';
import * as landscapeStation from '../minigames/landscape.js';
import { CHARACTERS, dialogueFor, renderDialogue } from '../story/dialogues.js';
import { journalModel, renderJournal } from '../story/journal.js';
import { renderSafe } from '../story/safe-ui.js';
import { renderAccusation } from '../story/accusation-ui.js';
import { endingModel, renderEnding, renderEndingChoice } from '../story/endings.js';
import { el, button, artworkImageUrl } from '../story/dom.js';

// Which module runs which station. Teammates replace the placeholder with their file here.
const STATION_MODULES = {
  landscape: landscapeStation,
  portraits: placeholderStation,
  restoration: placeholderStation,
  archive: placeholderStation,
};

const STORAGE_KEY = 'museum-nocturne-story-preview-v1';

// ---------- Saving (always with try/catch: storage can be blocked) ----------

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const story = deserialize(saved?.story);
    if (story) return { story, progress: saved.progress ?? {} };
  } catch {
    // Broken or blocked storage: start fresh.
  }
  return { story: newGame(), progress: {} };
}

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ story: serialize(state), progress }));
  } catch {
    // Saving is a convenience here; the game keeps working without it.
  }
}

let { story: state, progress } = loadGame();

// Runs an engine action, stores the new state and refreshes the page. Returns the result.
function act(result) {
  state = result.state;
  saveGame();
  renderPage();
  return result;
}

function toast(text) {
  document.querySelector('#toast').textContent = text;
}

// ---------- Modal ----------

const modal = document.querySelector('#modal');
const modalBody = document.querySelector('#modal-body');
const modalActions = document.querySelector('#modal-actions');

function openModal(title) {
  document.querySelector('#modal-title').textContent = title;
  modalBody.replaceChildren();
  modalActions.replaceChildren();
  if (!modal.open) modal.showModal();
  return modalBody;
}

function setActions(...buttons) {
  modalActions.replaceChildren(...buttons);
}

function closeModal() {
  modal.close();
}

document.querySelector('#modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); }); // click on backdrop

// ---------- Scenes ----------

function showMission() {
  renderDialogue(openModal(CASE.mission.title), dialogueFor('m', state));
  if (!state.missionRead) {
    setActions(button('Accept the mission', () => {
      toast(act(readMission(state)).message);
      closeModal();
    }));
  } else {
    setActions(button('Close', closeModal));
  }
}

function showPerson(characterId) {
  const dialogue = dialogueFor(characterId, state);
  renderDialogue(openModal('Conversation'), dialogue);
  setActions(button('Close', closeModal));
}

function showNote(noteId, title) {
  const body = openModal(title);
  const note = CASE.notes.find(n => n.id === noteId);
  body.append(el('p', { className: 'story-text', text: note.text }));
  const result = act(addNote(state, noteId));
  toast(result.message);
  setActions(button('Close', closeModal));
}

function showStation(stationId) {
  const station = CASE.stations.find(s => s.id === stationId);
  const body = openModal(`${station.room} · Station ${station.letter}`);
  if (!state.missionRead) {
    body.append(el('p', { className: 'story-text', text: 'Read the message from M first.' }));
    return;
  }
  openStation(STATION_MODULES[stationId], body, {
    stationId,
    savedProgress: progress[stationId] ?? null,
    onProgress(next) {
      progress = { ...progress, [stationId]: next };
      saveGame();
    },
    onSolved(result) {
      const outcome = act(solveStation(state, stationId, result));
      toast(outcome.message);
      if (outcome.ok) {
        body.append(el('p', { className: 'story-feedback', text: `Letter ${station.letter} is now in your journal.` }));
        setActions(button('Back to the museum', closeModal));
      }
    },
  });
}

function showSafe(message = '') {
  const body = modal.open ? modalBody : openModal('The Vault');
  renderSafe(body, { state, message }, word => {
    const result = act(tryOpenSafe(state, word));
    showSafe(result.message);
  });
  setActions(state.safe.open
    ? button('Look at the documents', () => showAccusation())
    : button('Close', closeModal));
  body.querySelector('input')?.focus();
}

function showAccusation(message = '') {
  const body = openModal('The final question');
  renderAccusation(body, { state, message }, suspectId => {
    const result = act(accuse(state, suspectId));
    showAccusation(result.message);
  });
  setActions(state.accusation.solved
    ? button('Decide what happens', () => showEndingChoice())
    : button('Close', closeModal));
}

function showEndingChoice() {
  const body = openModal('Before sunrise');
  renderEndingChoice(body, endingId => {
    act(chooseEnding(state, endingId));
    showEnding();
  });
  setActions(button('Not yet', closeModal));
}

function showEnding() {
  const body = openModal('Case closed');
  renderEnding(body, endingModel(state), { onNewGame: confirmNewGame });
  setActions();
}

function confirmNewGame() {
  const body = openModal('Start a new game?');
  body.append(el('p', { className: 'story-text', text: 'Your progress in this preview will be reset.' }));
  setActions(
    button('Reset', () => {
      state = newGame();
      progress = {};
      saveGame();
      renderPage();
      toast('New game started.');
      showMission();
    }),
    button('Cancel', closeModal),
  );
}

// ---------- Page ----------

function roomCard({ title, text, letter = null, solved = false, locked = false, image = null, actions = [] }) {
  const art = el('div', { className: image ? 'story-room-art' : 'story-room-art is-plain' }, [
    letter ? el('span', { className: 'story-room-badge', text: solved ? letter : '?', attrs: { 'aria-hidden': 'true' } }) : null,
  ]);
  if (image) art.style.backgroundImage = `url("${image}")`;
  const classes = ['story-room', solved ? 'is-solved' : '', locked ? 'is-locked' : ''].join(' ').trim();
  return el('article', { className: classes }, [
    art,
    el('div', { className: 'story-room-body' }, [
      el('h3', { text: title }),
      el('p', { text }),
      el('div', { className: 'story-room-actions' }, actions),
    ]),
  ]);
}

function renderRooms() {
  const cards = [];
  cards.push(roomCard({
    title: 'Great Hall',
    image: new URL('../assets/great-hall-nyc.png', import.meta.url).href,
    text: state.missionRead ? 'M’s message is in your pocket. The wings are open.' : 'Your phone buzzes. A message from M.',
    actions: [button(state.missionRead ? 'Read M’s message again' : 'Read M’s message', showMission)],
  }));
  cards.push(roomCard({
    title: 'Security Office',
    text: 'Nine monitors, a cold coffee and Leon’s shift schedule.',
    actions: [
      button(state.notes.includes('transport-cart') ? 'Monitor wall ✓' : 'Check the monitor wall', () => showNote('transport-cart', 'Monitor wall')),
      button(state.notes.includes('duty-roster') ? 'Shift schedule ✓' : 'Read the shift schedule', () => showNote('duty-roster', 'Shift schedule')),
      el('a', { className: 'story-button', text: 'Room preview →', props: { href: 'security-office.html' } }),
    ],
  }));
  for (const station of CASE.stations) {
    const progressNow = state.stations[station.id];
    const work = workById(station.metIds[0]);
    cards.push(roomCard({
      title: station.room,
      text: progressNow.solved ? station.evidence : station.task,
      letter: station.letter,
      solved: progressNow.solved,
      locked: !state.missionRead,
      image: artworkImageUrl(work),
      actions: [button(progressNow.solved ? `Solved · ${progressNow.points} pts` : 'Enter station', () => showStation(station.id))],
    }));
  }
  const vaultText = state.safe.open
    ? 'The safe is open. The original is safe – for now.'
    : canOpenSafe(state) ? 'All four proofs found. The dial is waiting for a word.' : 'A brass safe with a four-letter dial.';
  const vaultActions = [button(state.safe.open ? 'Look inside' : 'Try the safe', () => showSafe())];
  if (state.safe.open && !state.ending) {
    vaultActions.push(button(state.accusation.solved ? 'Decide' : 'Final question', () => (state.accusation.solved ? showEndingChoice() : showAccusation())));
  }
  if (state.ending) vaultActions.push(button('See the ending', showEnding));
  cards.push(roomCard({ title: 'The Vault', text: vaultText, locked: !canOpenSafe(state) && !state.safe.open, actions: vaultActions }));
  document.querySelector('#rooms').replaceChildren(...cards);
}

function renderPeople() {
  const people = CHARACTERS.filter(c => c.id !== 'm').map(character => {
    const talk = button('', () => showPerson(character.id), 'story-button story-person');
    talk.append(
      el('span', { className: 'story-avatar', text: character.name.replace('Dr. ', '').charAt(0), attrs: { 'aria-hidden': 'true' } }),
      el('span', {}, [el('strong', { text: `Talk to ${character.name}` }), el('small', { text: character.role })]),
    );
    return talk;
  });
  document.querySelector('#people').replaceChildren(...people);
}

function renderPage() {
  renderRooms();
  renderPeople();
  renderJournal(document.querySelector('#journal'), journalModel(state));
}

document.querySelector('#new-game').addEventListener('click', confirmNewGame);
document.querySelector('#talk-m').addEventListener('click', showMission);

renderPage();
if (!state.missionRead) showMission();
