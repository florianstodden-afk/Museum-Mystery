// Story preview: plays the whole Nocturne story without the walkable map.
// All story work is done by web/story/host.js – this page only draws the room cards
// and provides a dialog. The main game can use the host in exactly the same way.
import { CASE, workById } from '../story/case-1.js';
import { canOpenSafe } from '../story/engine.js';
import { createStoryHost } from '../story/host.js';
import { CHARACTERS } from '../story/dialogues.js';
import { journalModel, renderJournal } from '../story/journal.js';
import { el, button, artworkImageUrl } from '../story/dom.js';
import * as landscapeStation from '../minigames/landscape.js';

// ---------- The dialog this page offers to the host ----------

const modal = document.querySelector('#modal');
const modalBody = document.querySelector('#modal-body');

// Remember which button opened the dialog, so keyboard users land there again after closing.
let openerLabel = null;

function openPanel(title) {
  document.querySelector('#modal-title').textContent = title;
  if (!modal.open) {
    openerLabel = document.activeElement?.textContent ?? null;
    modal.showModal();
  }
  return modalBody;
}

function closePanel() {
  modal.close();
}

// The page is re-rendered after every action, so the old button may be gone.
// We look for a button with the same label, otherwise the first room button.
modal.addEventListener('close', () => {
  const buttons = [...document.querySelectorAll('main button, header button')];
  const target = buttons.find(b => b.textContent === openerLabel) ?? document.querySelector('#rooms button');
  target?.focus();
});
document.querySelector('#modal-close').addEventListener('click', closePanel);
modal.addEventListener('click', event => { if (event.target === modal) closePanel(); }); // click on backdrop

// ---------- The host ----------

const story = createStoryHost({
  openPanel,
  closePanel,
  onChange(state, message) {
    renderPage();
    document.querySelector('#toast').textContent = message;
  },
  // Teammates replace the placeholder by adding their module here, e.g. portraits: portraitsStation.
  stations: { landscape: landscapeStation },
  storageKey: 'museum-nocturne-story-preview-v1',
});

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

function renderRooms(state) {
  const cards = [];
  cards.push(roomCard({
    title: 'Great Hall',
    image: new URL('../assets/great-hall-nyc.png', import.meta.url).href,
    text: state.missionRead ? 'M’s message is in your pocket. The wings are open.' : 'Your phone buzzes. A message from M.',
    actions: [button(state.missionRead ? 'Read M’s message again' : 'Read M’s message', () => story.showMission())],
  }));
  cards.push(roomCard({
    title: 'Security Office',
    text: 'Nine monitors, a cold coffee and Leon’s shift schedule.',
    actions: [
      button(state.notes.includes('transport-cart') ? 'Monitor wall ✓' : 'Check the monitor wall', () => story.examine('monitor-wall')),
      button(state.notes.includes('duty-roster') ? 'Shift schedule ✓' : 'Read the shift schedule', () => story.examine('shift-schedule')),
      el('a', { className: 'story-button', text: 'Room preview →', props: { href: 'security-office.html' } }),
    ],
  }));
  for (const station of CASE.stations) {
    const progress = state.stations[station.id];
    cards.push(roomCard({
      title: station.room,
      text: progress.solved ? station.evidence : station.task,
      letter: station.letter,
      solved: progress.solved,
      locked: !state.missionRead,
      image: artworkImageUrl(workById(station.metIds[0])),
      actions: [button(progress.solved ? `Solved · ${progress.points} pts` : 'Enter station', () => story.openStation(station.id))],
    }));
  }
  const vaultText = state.ending ? 'The case is closed.'
    : state.safe.open ? 'The safe is open. The documents are waiting.'
      : canOpenSafe(state) ? 'All four proofs found. The dial is waiting for a word.'
        : 'A brass safe with a four-letter dial.';
  const vaultLabel = state.ending ? 'See the ending'
    : state.accusation.solved ? 'Decide'
      : state.safe.open ? 'Final question' : 'Try the safe';
  cards.push(roomCard({
    title: 'The Vault',
    text: vaultText,
    locked: !canOpenSafe(state) && !state.safe.open,
    actions: [button(vaultLabel, () => story.openVault())],
  }));
  document.querySelector('#rooms').replaceChildren(...cards);
}

function renderPeople() {
  const people = CHARACTERS.filter(c => c.id !== 'm').map(character => {
    const talk = button('', () => story.talkTo(character.id), 'story-button story-person');
    talk.append(
      el('span', { className: 'story-avatar', text: character.name.replace('Dr. ', '').charAt(0), attrs: { 'aria-hidden': 'true' } }),
      el('span', {}, [el('strong', { text: `Talk to ${character.name}` }), el('small', { text: character.role })]),
    );
    return talk;
  });
  document.querySelector('#people').replaceChildren(...people);
}

function renderPage() {
  renderRooms(story.state);
  renderPeople();
  renderJournal(document.querySelector('#journal'), journalModel(story.state));
}

document.querySelector('#new-game').addEventListener('click', () => story.confirmNewGame());
document.querySelector('#talk-m').addEventListener('click', () => story.showMission());
document.querySelector('#hint').addEventListener('click', () => story.showHint());

renderPage();
story.start();
