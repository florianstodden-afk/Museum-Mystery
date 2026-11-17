// Station I (Portrait Hall) – a speedrun: Start, memorise the dates, sort oldest to newest, Enter.
// Contract (docs/story/minigame-contract.md): start(container, caseData, onSolved).
// The host saves progress through caseData.onChange; the engine gives letter, evidence and points (by time, like L).
import { el, button } from '../story/dom.js';
import {
  initialTimeline, validTimeline, upgradeTimeline, startTimeline, peekDate, revealedDates,
  moveCard, swapCards, checkOrder, elapsedMs, logEntries, FLASH_MS,
} from './portrait-rules.js';
import { PORTRAIT_ARTWORKS, loadPortraits } from './portrait-artwork.js';
import { portraitSpeedPoints, formatClock, PORTRAIT_LIMITS_MS } from '../story/scoring.js';
import { clockBlock, taskLine, cardView, timelineView, footerView, bestTimeStore, ensureStylesheet, safeStorage } from './portrait-view.js';

const TICK_MS = 100;             // how often the clock is redrawn
const BLINK_MS = 300;            // red blink after a penalty
const FLIP_DELAY_MS = 60;        // let the browser draw the front before the cards turn

/** Opens Station I in `container`; returns a cleanup function. */
export function start(container, caseData, onSolved) {
  ensureStylesheet();
  const now = caseData.now ?? Date.now;
  let state = validTimeline(caseData.state) ? upgradeTimeline(structuredClone(caseData.state)) : initialTimeline(caseData.random);
  let selected = null;     // card picked up by click, number key or Space
  let dragged = null;      // card being dragged with the mouse
  let reported = false;
  let disposed = false;
  const best = bestTimeStore(caseData.storage ?? safeStorage());
  const play = id => caseData.playSound?.(id);
  const save = () => caseData.onChange?.(state);

  // ---------- Building the view once ----------
  const clock = clockBlock();
  const cards = Object.fromEntries(state.order.map(id => [id, cardView(id, { onChoose: choose, onPeek: peek })]));
  const grid = el('ol', { className: 'portrait-cards', attrs: { 'aria-label': 'Portraits, oldest on the left' } });
  const axis = timelineView();
  const status = el('p', { className: 'portrait-status', attrs: { role: 'status', 'aria-live': 'polite' } });
  const scanNote = el('span', { className: 'portrait-scan-note' });          // countdown, not read aloud each tick
  const spoken = el('p', { className: 'portrait-help-text', attrs: { 'aria-live': 'polite' } }); // dates for screen readers
  const startButton = button('Start', () => primary(), 'story-button portrait-primary');
  const checkButton = button('Check order ⏎', () => primary(), 'story-button portrait-primary');
  const continueButton = button('Continue', () => primary(), 'story-button portrait-primary');
  const footer = footerView();
  const section = el('section', { className: 'portrait-timeline' }, [
    clock.root, taskLine(), grid, axis.root,
    el('div', { className: 'portrait-actions' }, [startButton, checkButton, continueButton, status, scanNote]), footer.root, spoken,
  ]);
  container.replaceChildren(section);
  section.addEventListener('keydown', onKey);
  for (const id of state.order) wireDrag(id);

  // ---------- Actions ----------
  const playing = () => state.startedAt !== null && !state.solved;

  function update(next, message) {
    const justSolved = next.solved && !state.solved;
    if (next !== state) { state = next; save(); }
    if (message !== undefined) status.textContent = message;
    render();
    if (justSolved) finish();
  }

  // Enter, the big button and the card faces' Enter all do "the next obvious thing".
  function primary() {
    if (state.solved) { close(); return; }
    if (!playing()) { play('page'); update(startTimeline(state, now()), ''); spoken.textContent = announceDates(); cards[state.order[0]].face.focus?.(); return; }
    selected = null;
    const next = checkOrder(state, now());
    if (next.solved) { play('flip'); update(next); return; }
    play('wrong');
    blink();
    update(next, 'Not yet. +5 s');
  }

  function choose(id) {
    if (!playing()) return;
    play('click');
    if (selected === null) { selected = id; update(state, `${cards[id].artwork.shortTitle} picked up.`); return; }
    if (selected === id) { selected = null; update(state, ''); return; }
    const other = selected;
    selected = null;
    checkButton.classList.add('is-ready');
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
    status.textContent = `Solved in ${formatClock(time)} · +${portraitSpeedPoints(time)} · Letter I in your journal${record === time ? ' · New best!' : ''}`;
    setTimeout(() => { if (!disposed) grid.classList.add('is-flipped'); }, FLIP_DELAY_MS);
    continueButton.focus?.();
    report();
  }

  function report() {
    if (reported) return;
    reported = true;
    onSolved({ mistakes: state.mistakes, hints: state.hints });
  }

  // The host shows a close button below the station; Continue presses it (Escape and × work too).
  function close() {
    if (caseData.close) caseData.close();
    else container.nextElementSibling?.querySelector?.('button')?.click();
  }

  function blink() {
    clock.root.classList.add('is-penalty');
    setTimeout(() => clock.root.classList.remove('is-penalty'), BLINK_MS);
  }

  function announceDates() {
    return `Catalogue scan: ${state.order.map(id => `${cards[id].artwork.artist} ${cards[id].artwork.date}`).join(', ')}.`;
  }

  // ---------- Keyboard and mouse ----------
  function onKey(event) {
    const face = Object.values(cards).find(card => card.face === event.target);
    const index = ['1', '2', '3'].indexOf(event.key);
    if (index !== -1) { event.preventDefault(); choose(state.order[index]); return; }
    if (event.key === 'Enter' && (face || event.target === section)) { event.preventDefault(); primary(); return; }
    if (!face || selected === null) return;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (step) { event.preventDefault(); update(moveCard(state, selected, state.order.indexOf(selected) + step), 'Moved.'); cards[selected]?.face.focus?.(); }
  }

  function wireDrag(id) {
    const card = cards[id].root;
    card.addEventListener('dragstart', event => { dragged = id; event.dataTransfer?.setData('text/plain', String(id)); });
    card.addEventListener('dragend', () => { dragged = null; grid.classList.remove('is-dragging'); });
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
      checkButton.classList.add('is-ready');
      update(moveCard(state, from, state.order.indexOf(id)), 'Moved.');
    });
  }

  // ---------- Drawing ----------
  function render() {
    grid.replaceChildren(...state.order.map((id, index) => {
      const card = cards[id];
      card.root.className = ['portrait-card', selected === id ? 'is-selected' : ''].filter(Boolean).join(' ');
      card.root.setAttribute('draggable', String(playing()));
      card.face.disabled = !playing();
      card.face.setAttribute('aria-label', `${index + 1}: ${card.artwork.artist}, ${card.artwork.shortTitle}${selected === id ? ' (picked up)' : ''}`);
      card.back.textContent = state.solved ? logEntries(state)[index] : '';
      return card.root;
    }));
    startButton.hidden = state.startedAt !== null;
    checkButton.hidden = !playing();
    continueButton.hidden = !state.solved;
    if (state.solved) grid.classList.add('is-flipped');
    tick();
  }

  // Runs every TICK_MS: clock, counters and which dates are visible right now.
  function tick() {
    const t = now();
    const shown = revealedDates(state, t);
    const flashing = !state.solved && state.flashUntil !== null && t < state.flashUntil;
    clock.time.textContent = formatClock(elapsedMs(state, t));
    clock.counters.textContent = state.mistakes || state.hints ? `✕${state.mistakes} · Peeks ${state.hints} · ` : '';
    const record = best.get();
    clock.goal.textContent = `${record ? `Best ${formatClock(record)} · ` : ''}<${formatClock(PORTRAIT_LIMITS_MS[0])} = 15 pts`;
    for (const id of state.order) {
      const card = cards[id];
      const visible = shown.includes(id);
      card.chip.textContent = visible ? card.artwork.date : '';
      card.chip.hidden = !visible;
      card.peek.hidden = visible || !playing() || flashing;
    }
    grid.classList.toggle('is-flashing', flashing);
    scanNote.textContent = flashing ? `Catalogue scan · dates vanish in ${Math.ceil((state.flashUntil - t) / 1000)} s · Peek = +5 s` : '';
    status.hidden = flashing;
    axis.bar.style.setProperty('--flash', flashing ? String((state.flashUntil - t) / FLASH_MS) : '0');
  }

  // ---------- Images: bundled copies at once, upgraded if the Met API checks out ----------
  async function loadImages() {
    for (const artwork of PORTRAIT_ARTWORKS) cards[artwork.id].img.src = artwork.local;
    const loaded = await (caseData.loadPortraits ?? loadPortraits)();
    if (disposed) return;
    for (const item of loaded) if (item.src) cards[item.id].img.src = item.src;
    footer.offline.hidden = !loaded.some(item => item.offline);
  }

  render();
  save();
  if (state.solved) report();
  else (state.startedAt === null ? startButton : cards[state.order[0]].face).focus?.();
  loadImages();
  const timer = setInterval(() => { if (!disposed) tick(); }, TICK_MS);
  timer.unref?.(); // in Node tests the timer must not keep the process alive
  return () => { disposed = true; clearInterval(timer); };
}

