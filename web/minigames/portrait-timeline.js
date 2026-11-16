// Station I (Portrait Hall): order three portraits from the oldest to the newest painting.
// Contract (docs/story/minigame-contract.md): start(container, caseData, onSolved).
// The host saves progress through caseData.onChange; the engine gives letter, evidence and points.
import { el, button } from '../story/dom.js';
import {
  initialTimeline, validTimeline, moveCard, swapCards, checkOrder, useHint, MAX_HINTS, logEntries,
} from './portrait-rules.js';
import { PORTRAIT_ARTWORKS, loadPortraits } from './portrait-artwork.js';

const TASK = 'Three portraits from the hall, and on their backs the night-shift log – but someone shuffled them. '
  + 'Put them in the order they were painted, oldest first. Open each catalogue entry to check the dates.';
const HELP = 'Click two cards to swap them, or drag a card to a new place. Keyboard: Tab to a card, '
  + 'Enter or Space to pick it up, arrow keys to move it, Enter or Space to put it down.';
const WRONG = 'Not quite. Check the catalogue dates again – which portrait was painted first?';
const SOLVED = 'Correct order – the cards turn over.';
const VERDICT = 'The log clears Leon – and points to a patron with the initials A. V.';

// The station brings its own stylesheet, so no shared CSS file has to change.
function ensureStylesheet() {
  if (typeof document === 'undefined' || !document.head || document.getElementById('portrait-timeline-css')) return;
  const link = document.createElement('link');
  link.id = 'portrait-timeline-css';
  link.rel = 'stylesheet';
  link.href = new URL('./portrait-timeline.css', import.meta.url).href;
  document.head.append(link);
}

function artworkFor(id) {
  return PORTRAIT_ARTWORKS.find(artwork => artwork.id === id);
}

export function start(container, caseData, onSolved) {
  ensureStylesheet();
  let state = validTimeline(caseData.state) ? structuredClone(caseData.state) : initialTimeline(caseData.random);
  let images = Object.fromEntries(PORTRAIT_ARTWORKS.map(artwork => [artwork.id, artwork.local]));
  let selected = null;        // card picked up by click or keyboard
  let dragged = null;         // card being dragged with the mouse
  let openCatalogue = null;   // card whose catalogue entry is open
  let message = '';
  let offlineNote = '';
  let reported = false;
  let disposed = false;
  let flipped = state.solved; // a station opened already solved shows the backs at once
  let cardButtons = {};

  const save = () => caseData.onChange?.(state);
  const playSound = id => caseData.playSound?.(id); // optional, given by the story host
  const cards = el('ol', { className: 'portrait-cards', attrs: { 'aria-label': 'Portraits, from oldest (left) to newest (right)' } });
  const status = el('p', { className: 'story-feedback portrait-status', attrs: { role: 'status', 'aria-live': 'polite', tabindex: '-1' } });
  const counter = el('p', { className: 'story-muted portrait-counter' });
  const checkButton = button('Check order', () => check());
  const hintButton = button('Hint (−5 points)', () => hint());
  const log = el('div', { className: 'portrait-log' });
  const help = el('p', { className: 'story-muted portrait-help', text: HELP });
  const actionsRow = el('div', { className: 'story-actions portrait-actions' }, [checkButton, hintButton]);

  container.replaceChildren(el('section', { className: 'portrait-timeline' }, [
    el('p', { className: 'story-text portrait-task', text: TASK }),
    help,
    cards,
    el('p', { className: 'portrait-axis', attrs: { 'aria-hidden': 'true' } }, [
      el('span', { text: 'Oldest' }), el('span', { className: 'portrait-axis-line' }), el('span', { text: 'Newest' }),
    ]),
    actionsRow,
    counter,
    status,
    log,
    sourceLine(),
  ]));

  // ---------- Actions ----------

  function update(next, newMessage, focusId = null) {
    const changed = next !== state;
    const justSolved = next.solved && !state.solved;
    state = next;
    if (newMessage !== undefined) message = newMessage;
    if (changed) save();
    render();
    if (focusId !== null) cardButtons[focusId]?.focus();
    if (justSolved) turnCardsOver();
    if (state.solved) reportSolved();
  }

  // Draw the cards face up first, then turn them a moment later, so the CSS turn animation plays.
  function turnCardsOver() {
    status.focus?.();
    setTimeout(() => {
      if (disposed) return;
      flipped = true;
      for (const card of cards.children) card.className += ' is-flipped';
    }, 60);
  }

  function reportSolved() {
    if (reported) return;
    reported = true;
    onSolved({ mistakes: state.mistakes, hints: state.hints });
  }

  function check() {
    if (state.solved) return;
    selected = null;
    const next = checkOrder(state);
    playSound(next.solved ? 'flip' : 'wrong');
    update(next, next.solved ? SOLVED : WRONG);
  }

  function hint() {
    const next = useHint(state);
    if (next === state) return;
    const id = next.revealed[next.revealed.length - 1];
    const artwork = artworkFor(id);
    const which = next.hints === 1 ? 'oldest' : 'newest';
    update(next, `Hint: ${artwork.artist}’s “${artwork.shortTitle}” is the ${which} of the three. Its card is marked.`);
  }

  // Click or Enter/Space on a card: pick it up, put it down, or swap with the picked-up card.
  function choose(id) {
    if (state.solved) return;
    playSound('click');
    if (selected === null) { selected = id; update(state, `${artworkFor(id).shortTitle} picked up. Choose another card to swap, or use the arrow keys.`, id); return; }
    if (selected === id) { selected = null; update(state, 'Card put down.', id); return; }
    const other = selected;
    selected = null;
    update(swapCards(state, other, id), 'Cards swapped.', id);
  }

  // Arrow keys move the picked-up card one place.
  function shift(id, direction) {
    if (state.solved || selected !== id) return;
    const target = state.order.indexOf(id) + direction;
    const next = moveCard(state, id, target);
    if (next !== state) update(next, `Moved to place ${target + 1} of 3.`, id);
  }

  function dropOn(index) {
    if (dragged === null || state.solved) return;
    const id = dragged;
    dragged = null;
    selected = null;
    update(moveCard(state, id, index), 'Card moved.', id);
  }

  // ---------- Drawing ----------

  function render() {
    cardButtons = {};
    cards.replaceChildren(...state.order.map((id, index) => renderCard(id, index)));
    counter.textContent = `Incorrect attempts: ${state.mistakes} · Hints: ${state.hints}`;
    checkButton.disabled = state.solved;
    hintButton.disabled = state.solved || state.hints >= MAX_HINTS;
    // After solving, the controls make room for the log.
    help.hidden = state.solved;
    actionsRow.hidden = state.solved;
    status.textContent = [message, offlineNote].filter(Boolean).join(' ');
    renderLog();
  }

  function renderCard(id, index) {
    const artwork = artworkFor(id);
    const hintIndex = state.revealed.indexOf(id);
    const face = button('', () => choose(id), 'portrait-face');
    face.setAttribute('aria-pressed', String(selected === id));
    face.setAttribute('aria-label', `${artwork.artist}, ${artwork.shortTitle}. Place ${index + 1} of 3.${selected === id ? ' Picked up.' : ''}`);
    face.disabled = state.solved;
    face.append(
      el('img', { props: { src: images[id], alt: `${artwork.shortTitle} by ${artwork.artist}`, draggable: false } }),
      el('span', { className: 'portrait-caption' }, [el('strong', { text: artwork.artist }), el('span', { text: artwork.shortTitle })]),
    );
    face.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); shift(id, -1); }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); shift(id, 1); }
    });
    cardButtons[id] = face;

    const catalogueOpen = openCatalogue === id;
    const catalogueButton = button(catalogueOpen ? 'Close entry' : 'Catalogue entry', () => {
      openCatalogue = catalogueOpen ? null : id;
      render();
      cardButtons[id]?.focus();
    }, 'story-button portrait-catalogue-button');
    catalogueButton.setAttribute('aria-expanded', String(catalogueOpen));
    const catalogue = catalogueOpen ? el('div', { className: 'portrait-catalogue', attrs: { role: 'note' } }, [
      el('strong', { text: artwork.title }),
      el('span', { text: artwork.artist }),
      el('span', { text: `Date: ${artwork.date}` }),
      el('span', { text: artwork.medium }),
      el('a', { text: 'Open at The Met', props: { href: artwork.url, target: '_blank', rel: 'noopener noreferrer' } }),
    ]) : null;

    // The back only exists after solving, so the log times cannot give the order away.
    const back = state.solved ? el('div', { className: 'portrait-back' }, [
      el('span', { className: 'story-eyebrow', text: `LOG · PART ${index + 1}` }),
      el('p', { text: logEntries(state)[index] }),
    ]) : null;

    const classes = ['portrait-card',
      selected === id ? 'is-selected' : '',
      flipped ? 'is-flipped' : '',
      hintIndex !== -1 ? 'is-hinted' : ''].filter(Boolean).join(' ');
    const card = el('li', { className: classes, attrs: { draggable: String(!state.solved) } }, [
      el('div', { className: 'portrait-inner' }, [
        el('div', { className: 'portrait-front' }, [
          hintIndex !== -1 ? el('span', { className: 'portrait-badge', text: hintIndex === 0 ? 'Oldest' : 'Newest' }) : null,
          face, catalogue, catalogueButton,
        ]),
        back,
      ]),
    ]);
    card.addEventListener('dragstart', event => {
      dragged = id;
      event.dataTransfer?.setData('text/plain', String(id));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => { dragged = null; });
    card.addEventListener('dragover', event => { event.preventDefault(); });
    card.addEventListener('drop', event => { event.preventDefault(); dropOn(index); });
    return card;
  }

  function renderLog() {
    if (!state.solved) { log.replaceChildren(); return; }
    log.replaceChildren(
      el('p', { className: 'story-eyebrow', text: 'NIGHT-SHIFT LOG' }),
      el('ol', { className: 'portrait-log-list' }, logEntries(state).map(text => el('li', { text }))),
      el('p', { className: 'story-text portrait-verdict', text: VERDICT }),
    );
  }

  function sourceLine() {
    const parts = [];
    PORTRAIT_ARTWORKS.forEach((artwork, index) => {
      if (index > 0) parts.push(' · ');
      parts.push(`${artwork.artist}, `, el('a', { text: artwork.shortTitle, props: { href: artwork.url, target: '_blank', rel: 'noopener noreferrer' } }));
    });
    parts.push('. Public domain · The Metropolitan Museum of Art.');
    return el('p', { className: 'story-muted portrait-sources' }, parts);
  }

  // ---------- Images: shown at once from the bundled copies, then upgraded if the Met API checks out ----------

  async function loadImages() {
    const loaded = await (caseData.loadPortraits ?? loadPortraits)();
    if (disposed) return;
    images = Object.fromEntries(loaded.map(item => [item.id, item.src ?? images[item.id]]));
    if (loaded.some(item => item.offline)) offlineNote = 'Using the bundled Met images.';
    render();
  }

  render();
  save();
  if (state.solved) reportSolved();
  loadImages();
  return () => { disposed = true; };
}
