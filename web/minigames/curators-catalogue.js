import { artworkDetails, speedLines } from './station-ui.js?v=clock-note-1';
import { el, button } from '../story/dom.js';
import { stationById } from '../story/case-1.js';
import { pictureSpeedPoints } from '../story/scoring.js';
import { CATALOGUE_ARTWORKS as works } from './catalogue-data.js';
import { loadCatalogue } from './catalogue-artwork.js';
import { initialCatalogue, validCatalogue, startCatalogue, placeLabel, elapsedMs } from './catalogue-rules.js';
import { shortcutButton, puzzleClock, puzzlePopup, puzzleReward } from './puzzle-ui.js?v=clock-note-1';

export function start(container, caseData, onSolved) {
  let state = validCatalogue(caseData.state) ? structuredClone(caseData.state) : initialCatalogue(Math.random, caseData.state);
  let art = null, selected = null, dragged = null, popup = null, disposed = false, completed = false;
  let slots = [], cards = [];
  const now = caseData.now ?? Date.now;
  const save = () => caseData.onChange(state);
  const leave = () => { if (!disposed) caseData.onClose?.(); };
  const pane = el('div'), overlay = el('div');
  const help = button('?', showHelp, 'story-button puzzle-help');
  help.setAttribute('aria-label', 'Curator’s Catalogue instructions');
  const intro = el('div', { className: 'puzzle-intro' }, [
    el('p', { text: 'Match four catalogue labels to the respective artwork to uncover who approved the false wall label.' }),
    ...speedLines(), help,
  ]);
  const begin = shortcutButton('Start', () => {
    if (!art || disposed || popup || state.startedAt !== null) return;
    state = startCatalogue(state, now()); save(); render(); cards[0]?.focus();
  }, 'Enter');
  const back = shortcutButton('Back to museum', leave, 'Escape');
  const controls = el('div', { className: 'story-actions puzzle-actions' });
  const { clock, update } = puzzleClock();
  const status = el('p', { className: 'catalogue-announcement', attrs: { role: 'status' } });
  const board = el('div', { className: 'catalogue-board', attrs: { 'aria-label': 'Artworks: two rows, two columns' } });
  const tray = el('div', { className: 'catalogue-tray', attrs: { 'aria-label': 'Catalogue label tray' } });
  const labelArea = el('div', { className: 'catalogue-labels' }, [
    el('h3', { text: 'Catalogue labels' }), tray,
  ]);
  const indicator = el('div', { className: 'puzzle-drag-demo', text: '↖', attrs: { 'aria-hidden': 'true' } });
  const layout = el('div', { className: 'catalogue-layout' }, [board, labelArea, indicator]);
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(positionIndicator) : null;
  function positionIndicator() {
    if (disposed || indicator.hidden) return;
    if (!cards[0]?.getBoundingClientRect || !cards[1] || !slots[1]) return;
    const source = cards[0].getBoundingClientRect(), next = cards[1].getBoundingClientRect();
    const left = slots[0].getBoundingClientRect(), right = slots[1].getBoundingClientRect();
    const bounds = layout.getBoundingClientRect();
    // Point between fields, never from one particular label to one particular artwork.
    // The tray is a vertical stack on desktop and a two-column grid on narrow screens.
    const sideBySide = next.left >= source.right;
    const startX = sideBySide ? (source.right + next.left) / 2 : source.left + source.width / 2;
    const startY = sideBySide ? source.top + source.height / 2 : (source.bottom + next.top) / 2;
    indicator.style.setProperty('--drag-start-x', `${startX - bounds.left}px`);
    indicator.style.setProperty('--drag-start-y', `${startY - bounds.top}px`);
    indicator.style.setProperty('--drag-end-x', `${(left.right + right.left) / 2 - bounds.left}px`);
    indicator.style.setProperty('--drag-end-y', `${left.top + left.height / 2 - bounds.top}px`);
  }
  function interact() {
    indicator.hidden = true; resizeObserver?.disconnect();
    if (!state.demoDismissed) { state = { ...state, demoDismissed: true }; save(); }
  }
  // Before solving, the credits must not show the answers (artist, title, date, medium, origin):
  // one short line plus "Artwork 1 ↗" … links to the Met pages. After solving, the full credits.
  const shortCredit = artworkDetails(el('p', { className: 'puzzle-credit catalogue-credits' }, [
    'Artworks: The Metropolitan Museum of Art · Public domain · ',
    ...works.flatMap((work, i) => [i ? ' · ' : '', el('a', { text: `Artwork ${i + 1} ↗`, props: {
      href: work.url, target: '_blank', rel: 'noopener noreferrer',
    }, attrs: { 'aria-label': `Artwork ${i + 1}, object page at The Met (opens in a new tab)` } })]).filter(Boolean),
  ]));
  const fullCredit = artworkDetails(el('div', { className: 'puzzle-credit catalogue-credits' }, [
    ...works.map(work => el('p', {}, [
      el('a', { text: `${work.artistDisplayName}, ${work.title}, ${work.date}`, props: {
        href: work.url, target: '_blank', rel: 'noopener noreferrer',
      } }), ` · ${work.credit}. The Metropolitan Museum of Art. Public domain (Open Access).`,
    ])),
  ]));
  container.replaceChildren(el('div', { className: 'picture-puzzle catalogue-puzzle' }, [pane, overlay]));
  save();

  function labelText(id) {
    const work = works[id];
    return `${work.artistDisplayName} · ${work.culture} · ${work.medium}`;
  }
  function labelContents(id) {
    const work = works[id];
    return [el('strong', { text: work.artistDisplayName }),
      el('span', { text: work.culture }), el('span', { text: work.medium })];
  }
  function closeHelp() {
    popup = null; overlay.replaceChildren(); pane.inert = false; help.focus();
  }
  function showHelp() {
    if (disposed || popup) return;
    popup = 'help';
    puzzlePopup(pane, overlay, 'Curator’s Catalogue instructions', [
      el('h3', { text: 'Match the catalogue' }),
      el('p', { text: 'Each label lists an artist, culture and medium. Drag it into the label slot below its artwork, or click or tap a label and then that slot. Match all four to reveal the approval record.' }),
      el('p', { text: 'Keyboard: Tab to a label, Enter or Space to select, then Tab to a label slot below an artwork and Enter or Space to place. Correct labels glow and lock in place. Incorrect labels can be moved or swapped. Select a label and an empty tray space to return it there, or drag it back. Tray labels can also move into empty tray spaces. Wrong matches are free.' }),
      el('p', { text: 'Start begins the saved clock after all four images are ready. Help and time away count. Finish within 30 seconds: +15 points; within 45: +10; within 60: +5; over 60: 0. You always receive the letter and clue.' }),
    ], { actionLabel: 'Back to game', onAction: closeHelp, keys: ['Enter', 'Escape'] });
  }
  function success() {
    popup = 'success';
    puzzlePopup(pane, overlay, 'Catalogue matched', [
      el('h3', { text: 'Catalogue matched!' }),
      el('p', { text: `The corrected catalogue reveals the approval record: ${stationById('landscape').evidence}` }),
      ...puzzleReward('O', pictureSpeedPoints(elapsedMs(state, now()))),
    ], { actionLabel: 'Return to museum', onAction: leave, keys: ['Enter', 'Escape'] });
  }
  function canPlay() { return art && !disposed && !popup && state.startedAt !== null && !state.solved; }
  function move(label, target, getFocus, trayIndex = null) {
    if (!canPlay()) return;
    const next = placeLabel(state, label, target, now(), trayIndex);
    if (next === state) return;
    interact();
    state = { ...next, demoDismissed: true }; selected = null; dragged = null; save(); render();
    if (state.solved && !completed) {
      completed = true;
      onSolved({ mistakes: state.mistakes, hints: state.hints });
      if (!disposed) success();
    } else {
      const focus = target === null ? cards[state.order.indexOf(label)] : getFocus?.();
      (focus && !focus.disabled ? focus : cards.find(node => node.draggable) ?? slots.find(node => !node.disabled))?.focus();
    }
  }
  function select(label, getFocus) {
    if (!canPlay()) return;
    if (state.slots[label] === label) return;
    interact();
    selected = selected === label ? null : label;
    render(); getFocus()?.focus();
  }
  function draggable(node, label) {
    node.draggable = !state.solved;
    node.setAttribute('data-label', label);
    node.setAttribute('aria-pressed', String(selected === label));
    node.addEventListener('dragstart', event => {
      if (!canPlay()) { event.preventDefault(); return; }
      interact();
      dragged = label;
      event.dataTransfer.setData('text/plain', String(label));
      event.dataTransfer.effectAllowed = 'move';
    });
    node.addEventListener('dragend', () => { dragged = null; });
  }
  function dropTarget(node, target, getFocus, trayIndex = null) {
    node.addEventListener('dragover', event => { if (canPlay()) event.preventDefault(); });
    node.addEventListener('drop', event => {
      event.preventDefault(); event.stopPropagation?.();
      if (dragged !== null && event.dataTransfer.getData('text/plain') === String(dragged)) move(dragged, target, getFocus, trayIndex);
      dragged = null;
    });
  }

  function tick() { if (!disposed) update(elapsedMs(state, now())); }
  function render() {
    tick();
    if (!art) return;
    if (state.startedAt === null) {
      controls.replaceChildren(begin, back); pane.replaceChildren(intro, controls); return;
    }
    const figures = [];
    slots = works.map((work, index) => {
      const label = state.slots[index], correct = label === index;
      const node = button('', () => {
        if (selected !== null && selected !== label) move(selected, index, () => slots[index]);
        else if (label !== null) select(label, () => slots[index]);
        else status.textContent = 'Select a catalogue label first.';
      }, `catalogue-placement${correct ? ' is-correct' : ''}`);
      node.setAttribute('data-slot', index);
      node.setAttribute('aria-label', `${work.title}: ${correct ? 'correct, locked: ' : ''}${label === null ? 'empty label slot' : labelText(label)}`);
      node.disabled = state.solved || correct;
      node.append(...(label === null ? ['Place label here'] : labelContents(label)));
      if (label !== null && !correct) draggable(node, label);
      if (!correct) dropTarget(node, index, () => slots[index]);
      figures.push(el('figure', { className: `catalogue-artwork${correct ? ' is-correct' : ''}` }, [
        el('img', { props: { src: art[index].src, alt: work.title, draggable: false } }),
        el('figcaption', { className: 'catalogue-title', text: work.title }), node,
      ]));
      return node;
    });
    board.replaceChildren(...figures);
    cards = state.order.map((label, index) => {
      const placed = state.slots.includes(label);
      const node = button('', () => {
        if (placed && selected !== null) move(selected, null, () => cards[index], index);
        else if (!placed) select(label, () => cards[state.order.indexOf(label)]);
      }, placed ? 'catalogue-card is-empty' : 'catalogue-card');
      node.setAttribute('data-tray', index);
      node.setAttribute('aria-label', placed ? 'Empty tray space: return selected label' : labelText(label));
      node.disabled = state.solved;
      if (placed) {
        dropTarget(node, null, () => cards[index], index);
      } else { node.append(...labelContents(label)); draggable(node, label); }
      return node;
    });
    tray.replaceChildren(...cards);
    status.textContent = selected === null ? '' : `${works[selected].artistDisplayName} selected. Choose a label slot or an empty tray space.`;
    indicator.hidden = state.demoDismissed === true || state.solved || state.slots.some(label => label !== null);
    controls.replaceChildren(back);
    pane.replaceChildren(intro, clock, layout, status, state.solved ? fullCredit : shortCredit, controls);
    if (!indicator.hidden) { positionIndicator(); resizeObserver?.observe(layout); }
  }
  function keydown(event) {
    if (disposed || event.repeat) return;
    if (popup && event.key === 'Tab') {
      event.preventDefault(); event.stopImmediatePropagation?.(); return;
    }
    const enter = event.key === 'Enter';
    // Native button activation handles all matching actions, including Space.
    if (event.key !== 'Escape' && !(enter && (popup || (art && state.startedAt === null && event.target === begin)))) return;
    event.preventDefault(); event.stopImmediatePropagation?.();
    if (popup === 'help') closeHelp();
    else if (popup === 'success' || !enter) leave();
    else begin.click();
  }
  async function prepare() {
    art = null;
    pane.replaceChildren(intro, el('p', { text: 'Loading four artworks…', attrs: { role: 'status' } }), back);
    try {
      const loaded = await (caseData.loadArtwork ?? loadCatalogue)();
      if (disposed) return;
      if (!Array.isArray(loaded) || loaded.length !== works.length || loaded.some((image, i) =>
        image?.id !== works[i].id || !image.src || !(image.width > 0) || !(image.height > 0))) throw new Error('Incomplete art set');
      art = loaded; render();
      if (!popup) {
        if (state.solved) success();
        else if (state.startedAt === null) begin.focus();
        else slots[0]?.focus();
      }
    } catch {
      if (!disposed) {
        const retry = button('Retry', prepare);
        pane.replaceChildren(intro,
          el('p', { text: 'All four artworks must load before you can play. Please retry.', attrs: { role: 'alert' } }),
          retry, back);
        if (!popup) retry.focus();
      }
    }
  }
  document.addEventListener?.('keydown', keydown, true);
  const timer = setInterval(tick, 250);
  prepare();
  return () => {
    disposed = true; clearInterval(timer); resizeObserver?.disconnect();
    document.removeEventListener?.('keydown', keydown, true);
  };
}
