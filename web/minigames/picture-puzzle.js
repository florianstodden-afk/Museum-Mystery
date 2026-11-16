// Station L. The host owns saving; all moves go through the pure puzzle rules.
import { el, button } from '../story/dom.js';
import { initialPuzzle, validPuzzle, startPuzzle, placePiece, elapsedMs } from './picture-rules.js';
import { ARTWORK, loadArtwork } from './picture-artwork.js';
import { pictureSpeedPoints } from '../story/scoring.js';

export function start(container, caseData, onSolved) {
  let state = validPuzzle(caseData.state) ? structuredClone(caseData.state) : initialPuzzle();
  let artwork = null, selected = null, dragged = null, disposed = false, completed = false;
  let slotButtons = [], trayButtons = [];
  const now = caseData.now ?? Date.now;
  const save = () => caseData.onChange(state);
  const area = el('div', { className: 'picture-puzzle' });
  const status = el('p', { attrs: { role: 'status', tabindex: '-1' } });
  const clock = el('p', { className: 'puzzle-clock' });
  const controls = el('div', { className: 'story-actions' });
  const board = el('div', { className: 'puzzle-board', attrs: { 'aria-label': 'Picture board: two rows, four columns' } });
  const tray = el('div', { className: 'puzzle-tray', attrs: { 'aria-label': 'Piece tray' } });
  const layout = el('div', { className: 'puzzle-layout' }, [board, tray]);
  area.append(el('p', { text: 'Restore Renoir’s picture to uncover the hidden mark on the transport slip. Select a piece, then an empty slot. Dragging works too. Use Tab to move between pieces and slots, and Enter or Space to select and place. Wrong placements are free.' }),
    el('p', { text: 'The clock starts with Start puzzle and keeps running when you leave. Finish within 30s: +15 points; within 45s: +10; within 60s: +5; over 60s: 0. Points are awarded on completion.' }),
    clock, status, controls, layout,
    el('p', { className: 'story-muted' }, [
      `${ARTWORK.artist}, ${ARTWORK.title}, ${ARTWORK.date}. Public domain · `,
      el('a', { text: 'The Metropolitan Museum of Art', props: { href: ARTWORK.url, target: '_blank', rel: 'noopener noreferrer' } }),
    ]));
  container.replaceChildren(area);
  save();

  function updateClock() {
    if (disposed) return;
    const elapsed = elapsedMs(state, now());
    const seconds = Math.floor(elapsed / 1000);
    const deduction = pictureSpeedPoints(elapsed);
    clock.textContent = `Elapsed: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · Completion reward: +${deduction} points${state.solved ? ' · finished' : ''}`;
  }

  // Labels follow the shuffled tray, so letters do not reveal the correct slots.
  function label(piece) { return `Piece ${String.fromCharCode(65 + state.order.indexOf(piece))}`; }
  function picture(node, piece) {
    node.style.backgroundImage = `url("${artwork.src}")`;
    node.style.backgroundPosition = `${(piece % 4) * 100 / 3}% ${Math.floor(piece / 4) * 100}%`;
    node.setAttribute('data-piece', piece);
    node.draggable = !state.solved;
    node.setAttribute('aria-pressed', String(selected === piece));
    node.addEventListener('dragstart', event => {
      dragged = piece;
      event.dataTransfer.setData('text/plain', String(piece));
      event.dataTransfer.effectAllowed = 'move';
    });
    node.addEventListener('dragend', () => { dragged = null; });
  }

  function move(piece, target, focusTarget) {
    const next = placePiece(state, piece, target, now());
    if (next === state) { status.textContent = 'Choose an empty slot, or return the selected piece to the tray.'; return; }
    state = next; selected = null; save(); render();
    if (state.solved) status.focus();
    else focusTarget?.()?.focus();
    if (state.solved && !completed) {
      completed = true;
      onSolved({ mistakes: state.mistakes, hints: state.hints });
    }
  }

  function dropTarget(node, target, focusTarget) {
    node.addEventListener('dragover', event => { event.preventDefault(); });
    node.addEventListener('drop', event => {
      event.preventDefault();
      // Ignore external text and stale drags, even if they contain a number.
      if (dragged !== null && event.dataTransfer.getData('text/plain') === String(dragged)) move(dragged, target, focusTarget);
      dragged = null;
    });
  }

  function render() {
    updateClock();
    if (!artwork) return;
    layout.hidden = state.startedAt === null;
    controls.replaceChildren();
    if (state.startedAt === null) {
      controls.append(button('Start puzzle', () => {
        state = startPuzzle(state, now()); save(); render(); trayButtons[0]?.focus();
      }));
      status.textContent = `Eight pieces ready${artwork.offline ? ' · using the bundled Met image' : ''}.`;
      return;
    }
    const returnButton = button('Return selected piece to tray', () => {
      if (selected !== null) move(selected, null, () => trayButtons[0]);
    });
    returnButton.disabled = selected === null || !state.slots.includes(selected) || state.solved;
    controls.append(returnButton);
    slotButtons = state.slots.map((piece, slot) => {
      const slotLabel = `Row ${Math.floor(slot / 4) + 1}, column ${slot % 4 + 1}`;
      const node = button('', () => {
        if (selected !== null && piece === null) move(selected, slot, () => slotButtons[slot]);
        else if (piece !== null) {
          selected = selected === piece ? null : piece; render(); slotButtons[slot].focus();
        }
      }, 'puzzle-slot');
      node.setAttribute('aria-label', `${slotLabel}: ${piece === null ? 'empty' : label(piece)}`);
      node.disabled = state.solved;
      if (piece !== null) picture(node, piece);
      dropTarget(node, slot, () => slotButtons[slot]);
      return node;
    });
    board.replaceChildren(...slotButtons);
    trayButtons = state.order.filter(piece => !state.slots.includes(piece)).map(piece => {
      const node = button('', () => {
        selected = selected === piece ? null : piece; render();
        trayButtons.find(b => b.getAttribute('data-piece') === String(piece))?.focus();
      }, 'puzzle-piece');
      node.setAttribute('aria-label', label(piece));
      picture(node, piece);
      node.append(el('span', { text: label(piece).slice(-1), attrs: { 'aria-hidden': 'true' } }));
      return node;
    });
    tray.replaceChildren(el('p', { text: 'Piece tray · drop here to return' }), ...trayButtons);
    status.textContent = state.solved ? 'Restored! The transport slip reveals a hidden “V”. Letter L and its clue are in your journal.'
      : selected !== null ? `${label(selected)} selected. Choose an empty slot.` : 'Select a piece to continue.';
  }
  dropTarget(tray, null, () => trayButtons[0]);

  async function prepare() {
    controls.replaceChildren(); layout.hidden = true;
    status.textContent = 'Loading the painting…';
    try {
      artwork = await (caseData.loadArtwork ?? loadArtwork)();
      if (disposed) return;
      board.style.aspectRatio = `${artwork.width} / ${artwork.height}`;
      tray.style.setProperty('--piece-ratio', `${artwork.width / 4} / ${artwork.height / 2}`);
      render();
    } catch (error) {
      if (disposed) return;
      status.textContent = error.message;
      controls.append(button('Retry', prepare));
    }
  }
  const timer = setInterval(updateClock, 250);
  prepare();
  return () => { disposed = true; clearInterval(timer); };
}
