// Station I (Portrait Hall) – a speedrun in the look and flow of Station L:
// intro → Start ↵ → 10 s reading time with the dates (clock waits) → sort oldest to newest with the points bar → success popup with letter I.
// Contract (docs/story/minigame-contract.md): start(container, caseData, onSolved).
// The host saves progress through caseData.onChange; the engine gives letter, evidence and points (by time, like L).
import { el } from '../story/dom.js';
import {
  initialTimeline, validTimeline, upgradeTimeline, startTimeline, peekDate, revealedDates,
  moveCard, swapCards, checkOrder, elapsedMs, logEntries, FLASH_MS,
} from './portrait-rules.js';
import { PORTRAIT_ARTWORKS, loadPortraits } from './portrait-artwork.js';
import { portraitSpeedPoints, formatClock, PORTRAIT_LIMITS_MS } from '../story/scoring.js';
import { introPopup, showPopup, successPopup, creditLine, speedBar, shortcutButton, ensureStationStyles, artCards } from './station-ui.js?v=art-cards-1';
import { cardView, timelineView, bestTimeStore, ensureStylesheet, safeStorage } from './portrait-view.js';

/** Station I's points by time, as tiers for the bar (same limits as portraitSpeedPoints). */
export const PORTRAIT_TIERS = PORTRAIT_LIMITS_MS.reduce((tiers, ms, i) => [...tiers, { s: ms / 1000, p: [10, 5, 0][i] }], [{ s: 0, p: 15 }]);
const TASK = 'Memorise the dates, then sort oldest to newest.';
// "Learn about the art" after solving: at most two short sentences per work, ≤ 30 words.
// Source for each: the Met object page (artwork.url), overview text, read 2026-11-19.
export const ART_NOTES = Object.freeze({
  436703: 'Ingres met the Leblancs in Florence in 1820 and painted husband and wife as a pair. Edgar Degas later bought both portraits.',
  436121: 'The sitter is probably the wife of Degas’s school friend Paul Valpinçon. The late-summer bouquet takes the centre, while she sits off to the side, looking away.',
  12127: 'Virginie Gautreau was a Paris society figure. After the 1884 Salon mocked her slipped dress strap, Sargent repainted it and kept the picture.',
  435876: 'Cézanne painted his wife Hortense in this red dress four times; only here she sits in a furnished room. It is his Paris flat on the quai d’Anjou.',
});
export const ART_KEY = 'a';   // the "Learn about the art" key in the success popup
const TICK_MS = 100;             // how often bar, dates and arrow are redrawn
const BLINK_MS = 300;            // red blink after a penalty
const FLIP_DELAY_MS = 60;        // let the browser draw the front before the cards turn
const STATIC_ARROW_MS = 2500;    // with reduced motion the arrow shows still, then goes

/** Opens Station I in `container`; returns a cleanup function. */
export function start(container, caseData, onSolved) {
  ensureStylesheet();
  ensureStationStyles();
  const now = caseData.now ?? Date.now;
  let state = validTimeline(caseData.state) ? upgradeTimeline(structuredClone(caseData.state)) : initialTimeline(caseData.random);
  let selected = null;       // card picked up by click, number key or Space
  let dragged = null;        // card being dragged with the mouse
  let reported = false;
  let disposed = false;
  let closePopup = null;     // set while the help or success popup is open
  let arrowSince = null;     // when the drag hint arrow appeared
  const best = bestTimeStore(caseData.storage ?? safeStorage());
  const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const play = id => caseData.playSound?.(id);
  const save = () => caseData.onChange?.(state);
  const playing = () => state.startedAt !== null && !state.solved;

  // ---------- Building the view once ----------
  const root = el('div', { className: 'picture-puzzle portrait-timeline' });
  const pane = el('div');
  const overlay = el('div');
  const ui = introPopup({ task: TASK, pointsText: `Finish within ${PORTRAIT_LIMITS_MS.map(ms => ms / 1000).join(' / ')} seconds for 15 / 10 / 5 points.`, onStart: begin, onBack: leave, onHelp: showHelp });
  const bar = speedBar({ tiers: PORTRAIT_TIERS, label: 'Portrait time' });
  const checkButton = shortcutButton('Check order', check, 'Enter');
  const cards = Object.fromEntries(state.order.map(id => [id, cardView(id, { onChoose: choose, onPeek: peek })]));
  const grid = el('ol', { className: 'portrait-cards', attrs: { 'aria-label': 'Portraits, oldest on the left' } });
  const axis = timelineView(state.order.length);
  const arrow = el('div', { className: 'puzzle-drag-demo', text: '↖', attrs: { 'aria-hidden': 'true' } });
  const board = el('div', { className: 'portrait-board' }, [grid, axis.root, arrow]);
  const status = el('p', { className: 'puzzle-status', attrs: { role: 'status', 'aria-live': 'polite' } });
  const spoken = el('p', { className: 'portrait-sr', attrs: { 'aria-live': 'polite' } }); // dates for screen readers
  const credit = creditLine(PORTRAIT_ARTWORKS, { dates: false });
  root.append(pane, overlay, spoken);
  container.replaceChildren(root);
  for (const id of state.order) wireDrag(id);

  // ---------- Actions ----------
  function update(next, message) {
    const justSolved = next.solved && !state.solved;
    if (next !== state) { state = next; save(); }
    if (message !== undefined) status.textContent = message;
    render();
    if (justSolved) finish();
  }

  function begin() {
    if (state.startedAt !== null || disposed) return;
    play('page');
    update(startTimeline(state, now()), '');
    spoken.textContent = `Catalogue scan: ${state.order.map(id => `${cards[id].artwork.artist} ${cards[id].artwork.date}`).join(', ')}.`;
    cards[state.order[0]].face.focus?.();
  }

  function check() {
    if (!playing()) return;
    selected = null;
    const next = checkOrder(state, now());
    if (next.solved) { play('flip'); update(next, ''); return; }
    play('wrong');
    blink();
    update(next, 'Not yet. +5 s');
  }

  // During the reading time the cards stay put, so sorting there cannot save time.
  const reading = () => state.flashUntil !== null && now() < state.flashUntil;

  function choose(id) {
    if (!playing() || reading()) return;
    dismissArrow();
    play('click');
    if (selected === null) { selected = id; update(state, `${cards[id].artwork.shortTitle} picked up.`); return; }
    if (selected === id) { selected = null; update(state, ''); return; }
    const other = selected;
    selected = null;
    update(swapCards(state, other, id), 'Swapped.');
    cards[id].face.focus?.();
  }

  function peek(id) {
    const next = peekDate(state, id, now());
    if (next === state) return;
    play('hint');
    blink();
    update(next, `${cards[id].artwork.artist}: ${cards[id].artwork.date}. +5 s`);
  }

  function finish() {
    const time = elapsedMs(state, now());
    const record = best.offer(time);
    setTimeout(() => { if (!disposed) grid.classList.add('is-flipped'); }, FLIP_DELAY_MS);
    report();
    closePopup = showPopup({
      overlay, pane, label: 'Portraits sorted', actionLabel: 'Return to museum', onAction: leave,
      secondary: { label: 'Learn about the art', onAction: showArt, key: ART_KEY.toUpperCase() },
      contents: successPopup({
        headline: 'Sorted! The night-shift log clears Leon. You receive:', letter: 'I', points: portraitSpeedPoints(time),
        extra: `Time ${formatClock(time)}${record === time ? ' · New best!' : ` · Best ${formatClock(record)}`}`,
      }),
    });
  }

  function report() {
    if (reported) return;
    reported = true;
    onSolved({ mistakes: state.mistakes, hints: state.hints });
  }

  function leave() { if (!disposed) caseData.onClose?.(); }

  // Optional and after solving: the clock already stopped, so nothing here changes time or points.
  function showArt() {
    closePopup?.();
    const works = PORTRAIT_ARTWORKS.map(a => ({ artist: a.artist, title: a.shortTitle, date: a.date, image: cards[a.id].img.src || a.local, text: ART_NOTES[a.id] }));
    closePopup = artCards({ overlay, pane, works, onClose: leave });
  }

  function showHelp() {
    closePopup = showPopup({
      overlay, pane, label: 'Instructions', actionLabel: 'Back to station',
      onAction: () => { closePopup?.(); closePopup = null; focusMain(); },
      contents: [
        el('h3', { text: 'Sort the portraits' }),
        el('p', { text: 'The dates show for 10 seconds, then the clock runs. Sort oldest to newest: drag, click two cards or press their numbers. Enter checks.' }),
        el('p', { text: `Peek shows one date (+5 s). A wrong check adds 5 s. Within ${PORTRAIT_LIMITS_MS[0] / 1000} s: +15 points, ${PORTRAIT_LIMITS_MS[1] / 1000} s: +10, ${PORTRAIT_LIMITS_MS[2] / 1000} s: +5, later: 0.` }),
      ],
    });
  }

  // Enter should always do the main thing: Start before the game, the first card while playing.
  function focusMain() {
    if (state.solved) return;
    (state.startedAt === null ? ui.startButton : cards[state.order[0]].face).focus?.();
  }

  function blink() {
    bar.root.classList.add('is-penalty');
    setTimeout(() => bar.root.classList.remove('is-penalty'), BLINK_MS);
  }

  // ---------- Drag hint arrow (like L): once per round, after the flash, from the last card to place 1 ----------
  function dismissArrow() {
    arrow.hidden = true;
    if (!state.demoDismissed) { state = { ...state, demoDismissed: true }; save(); }
  }

  function positionArrow() {
    const from = cards[state.order[state.order.length - 1]].face;
    const to = axis.slots[0];
    if (!from.getBoundingClientRect || !to.getBoundingClientRect) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), box = board.getBoundingClientRect();
    arrow.style.setProperty('--drag-start-x', `${a.left + a.width / 2 - box.left}px`);
    arrow.style.setProperty('--drag-start-y', `${a.top + a.height / 2 - box.top}px`);
    arrow.style.setProperty('--drag-end-x', `${b.left + b.width / 2 - box.left}px`);
    arrow.style.setProperty('--drag-end-y', `${b.top + b.height / 2 - box.top}px`);
  }

  // ---------- Keyboard (like L: Enter = Start/Check, Esc = back to museum) and mouse ----------
  function keydown(event) {
    if (disposed || event.repeat) return;
    const stop = () => { event.preventDefault(); event.stopImmediatePropagation?.(); };
    if (closePopup) {
      if (closePopup.handleKey?.(event)) { stop(); return; }
      if (closePopup.secondary && event.key.toLowerCase() === ART_KEY) { stop(); closePopup.secondary.click(); return; }
      // Art cards and the two-button success popup: Tab moves between buttons; in the cards Enter presses the focused one.
      if ((closePopup.handleKey && event.key === 'Enter') || (event.key === 'Tab' && (closePopup.handleKey || closePopup.secondary))) return;
      if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Tab') { stop(); if (event.key !== 'Tab') closePopup.action.click(); }
      return;
    }
    if (event.key === 'Escape') { stop(); leave(); return; }
    const index = state.order.findIndex((_, i) => event.key === String(i + 1));   // keys 1…4
    if (index !== -1 && playing()) { stop(); choose(state.order[index]); return; }
    // Enter on "?", "Back to museum" or a Peek button presses that button instead.
    const own = event.target === ui.help || event.target === ui.backButton || Object.values(cards).some(card => card.peek === event.target);
    if (event.key === 'Enter' && !own) { stop(); if (state.startedAt === null) begin(); else check(); return; }
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (step && selected !== null && playing()) { stop(); update(moveCard(state, selected, state.order.indexOf(selected) + step), 'Moved.'); cards[selected]?.face.focus?.(); }
  }
  document.addEventListener?.('keydown', keydown, true);

  function wireDrag(id) {
    const card = cards[id].root;
    card.addEventListener('dragstart', event => { if (reading()) { event.preventDefault?.(); return; } dismissArrow(); dragged = id; event.dataTransfer?.setData('text/plain', String(id)); });
    card.addEventListener('dragend', () => { dragged = null; });
    card.addEventListener('dragover', event => { event.preventDefault(); card.classList.add('is-target'); });
    card.addEventListener('dragleave', () => card.classList.remove('is-target'));
    card.addEventListener('drop', event => {
      event.preventDefault();
      card.classList.remove('is-target');
      if (dragged === null) return;
      const from = dragged;
      dragged = null;
      selected = null;
      play('click');
      update(moveCard(state, from, state.order.indexOf(id)), 'Moved.');
    });
  }

  // ---------- Drawing ----------
  function render() {
    if (state.startedAt === null && !state.solved) {
      ui.controls.replaceChildren(ui.startButton, ui.backButton);
      pane.replaceChildren(ui.intro, ui.controls);
      tick();
      return;
    }
    grid.replaceChildren(...state.order.map((id, index) => {
      const card = cards[id];
      card.root.className = ['portrait-card', selected === id ? 'is-selected' : ''].filter(Boolean).join(' ');
      card.root.setAttribute('draggable', String(playing()));
      card.face.disabled = !playing();
      card.face.setAttribute('aria-pressed', String(selected === id));
      card.face.setAttribute('aria-label', `${index + 1}: ${card.artwork.artist}, ${card.artwork.shortTitle}${selected === id ? ' (picked up)' : ''}`);
      card.back.textContent = state.solved ? logEntries(state)[index] : '';
      return card.root;
    }));
    if (state.solved) grid.classList.add('is-flipped');
    ui.controls.replaceChildren(...(state.solved ? [ui.backButton] : [checkButton, ui.backButton]));
    pane.replaceChildren(ui.intro, bar.root, board, status, credit, ui.controls);
    tick();
  }

  // Runs every TICK_MS: points bar, visible dates, scan countdown and the hint arrow.
  function tick() {
    const t = now();
    bar.update(elapsedMs(state, t));
    if (state.startedAt === null) return;
    const shown = revealedDates(state, t);
    const flashing = !state.solved && state.flashUntil !== null && t < state.flashUntil;
    for (const id of state.order) {
      const card = cards[id];
      const visible = shown.includes(id);
      card.chip.textContent = visible ? card.artwork.date : '';
      card.chip.hidden = !visible;
      card.peek.hidden = visible || !playing() || flashing;
    }
    grid.classList.toggle('is-flashing', flashing);
    axis.bar.style.setProperty('--flash', flashing ? String((state.flashUntil - t) / FLASH_MS) : '0');
    if (flashing) status.textContent = `Dates vanish in ${Math.ceil((state.flashUntil - t) / 1000)} s`;
    else if (status.textContent.startsWith('Dates vanish')) status.textContent = '';
    const wantArrow = playing() && !flashing && !state.demoDismissed;
    if (wantArrow && arrow.hidden !== false) { arrow.hidden = false; arrowSince = t; positionArrow(); }
    if (!wantArrow) arrow.hidden = true;
    if (wantArrow && reducedMotion() && t - arrowSince > STATIC_ARROW_MS) dismissArrow();
  }

  // ---------- Images: bundled copies at once, upgraded if the Met API checks out ----------
  async function loadImages() {
    for (const artwork of PORTRAIT_ARTWORKS) cards[artwork.id].img.src = artwork.local;
    const loaded = await (caseData.loadPortraits ?? loadPortraits)();
    if (disposed) return;
    for (const item of loaded) if (item.src) cards[item.id].img.src = item.src;
  }

  arrow.hidden = true;
  render();
  save();
  if (state.solved) report();
  else {
    focusMain();
    // The page focuses the first button of a new panel (that is "?") right after we return; take it back.
    queueMicrotask(() => { if (!disposed && !closePopup) focusMain(); });
  }
  loadImages();
  const timer = setInterval(() => { if (!disposed) tick(); }, TICK_MS);
  timer.unref?.(); // in Node tests the timer must not keep the process alive
  return () => { disposed = true; clearInterval(timer); closePopup?.(); document.removeEventListener?.('keydown', keydown, true); };
}
