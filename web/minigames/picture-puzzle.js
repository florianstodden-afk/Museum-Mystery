// Station L. The host owns persistence and scoring; this component owns presentation.
import { el, button } from '../story/dom.js';
import { initialPuzzle, validPuzzle, startPuzzle, placePiece, elapsedMs } from './picture-rules.js';
import { ARTWORK, loadArtwork } from './picture-artwork.js';
import { pictureSpeedPoints } from '../story/scoring.js';

export function start(container, caseData, onSolved) {
  let state = validPuzzle(caseData.state) ? structuredClone(caseData.state) : initialPuzzle();
  let artwork, selected = null, dragged = null, disposed = false, completed = false, popup = null;
  let interacted = state.demoDismissed === true || state.slots.some(piece => piece !== null), slotButtons = [], trayButtons = [];
  const now = caseData.now ?? Date.now;
  const save = () => caseData.onChange(state);
  const area = el('div', { className: 'picture-puzzle' });
  const pane = el('div');
  const overlay = el('div');
  const status = el('p', { className: 'puzzle-status', attrs: { role: 'status' } });
  const help = button('?', showHelp, 'story-button puzzle-help');
  help.setAttribute('aria-label', 'Puzzle instructions');
  const intro = el('div', { className: 'puzzle-intro' }, [el('p', { text: 'Restore Renoir’s picture to uncover the hidden mark on the transport slip.' }), el('p', { text: 'Points are given based on speed' }), help]);
  const controls = el('div', { className: 'story-actions puzzle-actions' });
  const startButton = shortcutButton('Start puzzle', begin, 'Enter');
  const back = shortcutButton('Back to museum', leave, 'Escape');
  const board = el('div', { className: 'puzzle-board', attrs: { 'aria-label': 'Picture board: two rows, four columns' } });
  const tray = el('div', { className: 'puzzle-tray', attrs: { 'aria-label': 'Piece tray' } });
  const indicator = el('div', { className: 'puzzle-drag-demo', text: '↖', attrs: { 'aria-hidden': 'true' } });
  const layout = el('div', { className: 'puzzle-layout' }, [board, tray, indicator]);
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(positionIndicator) : null;
  const fill = el('div', { className: 'puzzle-time-fill' });
  const meter = el('div', { className: 'puzzle-time-track', attrs: { role: 'progressbar', 'aria-label': 'Puzzle time', 'aria-valuemin': '0', 'aria-valuemax': '70' } }, [fill]);
  const clock = el('div', { className: 'puzzle-clock' }, [
    el('div', { className: 'puzzle-time-rewards' }, [el('span', { text: '+15 points' }), el('span', { text: '+10 points' }), el('span', { text: '+5 points' }), el('span', { text: '+0 points' })]), meter,
    el('div', { className: 'puzzle-time-marks' }, [el('span', { text: '0s' }), el('span', { text: '30s' }), el('span', { text: '45s' }), el('span', { text: '60s' })]),
  ]);
  const credit = el('p', { className: 'story-muted puzzle-credit' }, [`${ARTWORK.artist}, ${ARTWORK.title}, ${ARTWORK.date}. Public domain · `,
    el('a', { text: 'The Metropolitan Museum of Art', props: { href: ARTWORK.url, target: '_blank', rel: 'noopener noreferrer' } })]);
  area.append(pane, overlay); container.replaceChildren(area);
  save();

  function leave() { if (!disposed) caseData.onClose?.(); }
  function closePopup() {
    popup = null; overlay.replaceChildren(); pane.inert = false; help.focus();
  }
  function shortcutButton(label, action, ...keys) {
    const control = button(label, action);
    control.setAttribute('aria-keyshortcuts', keys.join(' '));
    control.append(...keys.map(key => el('kbd', {
      className: 'puzzle-key',
      text: key === 'Enter' ? '↵' : 'Esc',
      attrs: { 'aria-hidden': 'true' },
    })));
    return control;
  }
  function showPopup(contents, action, label, ...keys) {
    pane.inert = true;
    const actionButton = shortcutButton(label, action, ...keys);
    const dialog = el('div', { className: 'puzzle-popup', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': popup === 'success' ? 'Picture restored' : 'Puzzle instructions' } }, [...contents, actionButton]);
    overlay.replaceChildren(el('div', { className: 'puzzle-overlay' }, [dialog]));
    actionButton.focus();
  }
  function showHelp() {
    popup = 'help';
    showPopup([
      el('h3', { text: 'Restore the picture' }),
      el('p', { text: 'Drag a piece to an empty slot, or select it with a click or Enter. Use Tab to reach a destination, then Enter or Space to place it. Select a placed piece and an empty tray slot to return it. Wrong placements are free.' }),
      el('p', { text: 'The clock starts with Start puzzle and keeps running when you leave or open help. Finish within 30s: +15 points; within 45s: +10; within 60s: +5; over 60s: 0. Points are awarded on completion.' }),
    ], closePopup, 'Back to puzzle', 'Enter', 'Escape');
  }
  function showSuccess() {
    popup = 'success';
    showPopup([
      el('h3', { text: 'Restored! The transport slip reveals a hidden “V”. You receive:' }),
      el('div', { className: 'story-slot is-found puzzle-letter' }, [el('span', { className: 'story-slot-letter', text: 'L' }), el('span', { className: 'story-slot-room', text: 'added to journal' })]),
      el('p', { className: 'puzzle-earned', text: `+${pictureSpeedPoints(elapsedMs(state, now()))} points earned` }),
    ], leave, 'Return to museum', 'Enter', 'Escape');
  }
  function begin() {
    if (!artwork || state.startedAt !== null || disposed) return;
    state = startPuzzle(state, now()); save(); render(); trayButtons[0]?.focus();
  }
  function keydown(event) {
    if (disposed || event.repeat) return;
    if (popup && (event.key === 'Escape' || event.key === 'Enter')) {
      event.preventDefault(); event.stopImmediatePropagation?.();
      if (popup === 'help') closePopup(); else leave();
    } else if (popup && event.key === 'Tab') {
      // Each popup contains one actionable control; keep keyboard focus inside it.
      event.preventDefault(); event.stopImmediatePropagation?.();
    } else if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation?.(); leave();
    } else if (event.key === 'Enter' && state.startedAt === null && event.target !== help && event.target !== back) {
      event.preventDefault(); event.stopImmediatePropagation?.(); begin();
    }
  }
  document.addEventListener?.('keydown', keydown, true);
  function updateClock() {
    if (disposed) return;
    const elapsed = elapsedMs(state, now());
    fill.style.width = `${Math.min(100, elapsed / 700)}%`;
    meter.setAttribute('aria-valuenow', Math.min(70, Math.floor(elapsed / 1000)));
    meter.setAttribute('aria-valuetext', `${Math.floor(elapsed / 1000)} seconds; ${pictureSpeedPoints(elapsed)} points on completion`);
  }
  function label(piece) { return `Piece ${String.fromCharCode(65 + piece)}`; }
  function positionIndicator() {
    if (disposed || indicator.hidden) return;
    const from = trayButtons.find(node => node.draggable);
    const to = slotButtons[state.slots.indexOf(null)];
    if (!from?.getBoundingClientRect || !to) return;

    const source = from.getBoundingClientRect();
    const destination = to.getBoundingClientRect();
    const bounds = layout.getBoundingClientRect();
    indicator.style.setProperty('--drag-start-x', `${source.left + source.width / 2 - bounds.left}px`);
    indicator.style.setProperty('--drag-start-y', `${source.top + source.height / 2 - bounds.top}px`);
    indicator.style.setProperty('--drag-end-x', `${destination.left + destination.width / 2 - bounds.left}px`);
    indicator.style.setProperty('--drag-end-y', `${destination.top + destination.height / 2 - bounds.top}px`);
  }
  function interact() {
    interacted = true;
    indicator.hidden = true;
    resizeObserver?.disconnect();
    if (!state.demoDismissed) {
      state = { ...state, demoDismissed: true };
      save();
    }
  }
  function picture(node, piece) {
    node.style.backgroundImage = `url("${artwork.src}")`;
    node.style.backgroundPosition = `${(piece % 4) * 100 / 3}% ${Math.floor(piece / 4) * 100}%`;
    node.setAttribute('data-piece', piece); node.draggable = !state.solved;
    node.setAttribute('aria-pressed', String(selected === piece));
    node.addEventListener('dragstart', event => { interact(); dragged = piece; event.dataTransfer.setData('text/plain', String(piece)); event.dataTransfer.effectAllowed = 'move'; });
    node.addEventListener('dragend', () => { dragged = null; });
  }
  function move(piece, target, focusTarget, trayIndex = null) {
    let next = placePiece(state, piece, target, now());
    if (next === state) { status.textContent = 'Choose an empty slot.'; return; }
    if (trayIndex !== null) {
      const order = [...next.order], oldIndex = order.indexOf(piece);
      [order[oldIndex], order[trayIndex]] = [order[trayIndex], order[oldIndex]];
      next = { ...next, order };
    }
    state = next; selected = null; save(); render();
    if (state.solved && !completed) { completed = true; onSolved({ mistakes: state.mistakes, hints: state.hints }); showSuccess(); }
    else focusTarget?.()?.focus();
  }
  function dropTarget(node, target, focusTarget, trayIndex = null) {
    node.addEventListener('dragover', event => event.preventDefault());
    node.addEventListener('drop', event => {
      event.preventDefault(); event.stopPropagation?.();
      if (dragged !== null && event.dataTransfer.getData('text/plain') === String(dragged)) move(dragged, target, focusTarget, trayIndex);
      dragged = null;
    });
  }
  function select(piece, getFocus) { interact(); selected = selected === piece ? null : piece; render(); getFocus()?.focus(); }
  function render() {
    updateClock();
    if (!artwork) return;
    if (state.startedAt === null) {
      controls.replaceChildren(startButton, back); pane.replaceChildren(intro, controls); return;
    }
    slotButtons = state.slots.map((piece, slot) => {
      const node = button('', () => {
        if (selected !== null && piece === null) move(selected, slot, () => slotButtons[slot]);
        else if (piece !== null) select(piece, () => slotButtons[slot]);
      }, 'puzzle-slot');
      node.setAttribute('aria-label', `Row ${Math.floor(slot / 4) + 1}, column ${slot % 4 + 1}: ${piece === null ? 'empty' : label(piece)}`);
      node.disabled = state.solved;
      if (piece !== null) picture(node, piece);
      dropTarget(node, slot, () => slotButtons[slot]); return node;
    });
    board.replaceChildren(...slotButtons);
    board.className = state.solved ? 'puzzle-board is-restored' : 'puzzle-board';
    trayButtons = state.order.map((piece, index) => {
      const empty = state.slots.includes(piece);
      const node = button('', () => {
        if (empty && selected !== null) move(selected, null, () => trayButtons[index], index);
        else if (!empty) select(piece, () => trayButtons[index]);
      }, empty ? 'puzzle-piece puzzle-tray-empty' : 'puzzle-piece');
      node.setAttribute('aria-label', empty ? `Tray slot ${index + 1}: empty` : label(piece));
      node.disabled = state.solved;
      if (!empty) picture(node, piece);
      else dropTarget(node, null, () => trayButtons[index], index);
      return node;
    });
    tray.replaceChildren(...trayButtons);
    indicator.hidden = interacted || state.solved;
    status.textContent = selected !== null ? `${label(selected)} selected. Choose an empty slot.` : '';
    controls.replaceChildren(back);
    pane.replaceChildren(intro, clock, layout, status, credit, controls);
    if (!indicator.hidden) {
      positionIndicator();
      resizeObserver?.observe(layout);
    }
  }
  // The tray background also accepts a drag back, using the first empty slot.
  tray.addEventListener('dragover', event => event.preventDefault());
  tray.addEventListener('drop', event => {
    event.preventDefault();
    const index = state.order.findIndex(piece => state.slots.includes(piece));
    if (index >= 0 && dragged !== null && event.dataTransfer.getData('text/plain') === String(dragged)) move(dragged, null, () => trayButtons[index], index);
    dragged = null;
  });
  async function prepare() {
    pane.replaceChildren(intro, el('p', { text: 'Loading the painting…', attrs: { role: 'status' } }), back);
    try {
      artwork = await (caseData.loadArtwork ?? loadArtwork)();
      if (disposed) return;
      board.style.aspectRatio = `${artwork.width} / ${artwork.height}`;
      tray.style.setProperty('--piece-ratio', `${artwork.width / 4} / ${artwork.height / 2}`);
      render();
      if (state.startedAt === null && !popup) startButton.focus();
    } catch (error) {
      if (!disposed) pane.replaceChildren(intro, el('p', { text: error.message }), button('Retry', prepare), back);
    }
  }
  const timer = setInterval(updateClock, 250); prepare();
  return () => {
    disposed = true;
    clearInterval(timer);
    resizeObserver?.disconnect();
    document.removeEventListener?.('keydown', keydown, true);
  };
}
