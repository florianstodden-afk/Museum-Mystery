import { el, button } from '../story/dom.js';
import { pictureSpeedPoints } from '../story/scoring.js';
import { CASE } from '../story/case-1.js';
import { elapsedMs, startPuzzle } from './picture-rules.js';
import { regions, guess, initialForgery, validForgery, REQUIRED_FINDS } from './forgery-rules.js';
import { shortcutButton, puzzlePopup, puzzleReward, puzzleClock } from './puzzle-ui.js';

export const originalUrl = new URL('../assets/DT1946_original.jpg', import.meta.url).href;
const forgeryUrl = new URL('../assets/DT1946_v2_forgery.jpg', import.meta.url).href;

function painting(src, alt) {
  return el('img', { props: { src, alt, draggable: false } });
}

export function start(container, caseData, onSolved) {
  let state = validForgery(caseData.state) ? structuredClone(caseData.state) : initialForgery();
  const now = caseData.now ?? Date.now;
  let disposed = false, ready = false, popup = null;
  let aim = { x: .5, y: .5 };
  const save = () => caseData.onChange(state);
  const leave = () => caseData.onClose?.();
  const pane = el('div'), overlay = el('div');
  const help = button('?', showHelp, 'story-button puzzle-help');
  help.setAttribute('aria-label', 'Spot the Forgery instructions');
  const intro = el('div', { className: 'puzzle-intro' }, [
    el('p', { text: 'Find three differences in the forged version to reveal the frame label.' }),
    el('p', { text: 'Find any 3 of 5 changes. Finish within 30 / 45 / 60 seconds for 15 / 10 / 5 points.' }), help,
  ]);
  const begin = shortcutButton('Start', () => {
    if (!ready || disposed || popup || state.startedAt !== null) return;
    state = startPuzzle(state, now());
    save();
    play();
    target.focus();
  }, 'Enter');
  const back = shortcutButton('Back to museum', leave, 'Escape');
  const controls = el('div', { className: 'story-actions puzzle-actions' });
  const { clock, update } = puzzleClock();
  const status = el('p', { className: 'puzzle-status', attrs: { role: 'status' } });
  const lens = el('span', { className: 'forgery-lens', attrs: { 'aria-hidden': 'true' } });
  const bubble = el('span', { className: 'forgery-countdown', attrs: { 'aria-hidden': 'true' } });
  bubble.hidden = true;
  const misses = el('span', { attrs: { 'aria-hidden': 'true' } });
  const marks = el('span', { className: 'forgery-marks', attrs: { 'aria-hidden': 'true' } });
  const target = button('', event => {
    if (!ready || disposed || popup) return;
    dismissGuide();
    const point = event.detail === 0 ? aim : pointerPosition(event);
    const next = guess(state, point.x, point.y, now());
    if (next === state) return;
    positionLens(point);
    if (next.mistakes > state.mistakes) {
      const mark = el('span', { className: 'forgery-miss' });
      Object.assign(mark.style, { left: point.x * 100 + '%', top: point.y * 100 + '%' });
      misses.append(mark);
    }
    state = next;
    save();
    renderMarks();
    tick();
    if (state.solved) {
      onSolved({ mistakes: state.mistakes, hints: 0 });
      popup = 'success';
      puzzlePopup(pane, overlay, 'Forgery identified', [
        el('h3', { text: 'Forgery identified!' }),
        el('p', { text: CASE.stations.find(s => s.id === 'archive').evidence }),
        ...puzzleReward('D', pictureSpeedPoints(elapsedMs(state))),
      ], { actionLabel: 'Return to museum', onAction: leave, keys: ['Enter', 'Escape'] });
    }
  }, 'forgery-target');
  target.setAttribute('aria-label', 'Inspect the forgery. Move the lens with the arrow keys and press Enter to guess.');
  target.append(marks, misses, lens, bubble);
  const original = painting(originalUrl, 'Original painting of an olive grove');
  const forgery = painting(forgeryUrl, 'Altered copy of the olive grove');
  const figure = (label, children) => el('figure', {}, [
    el('figcaption', { text: label }), el('div', { className: 'forgery-image' }, children),
  ]);
  const layout = el('div', { className: 'puzzle-layout forgery-pair' }, [
    figure('Original', [original]), figure('Forgery', [forgery, target]),
  ]);
  const credit = el('p', { className: 'story-muted puzzle-credit' }, [
    'Vincent van Gogh, Olive Trees. Public domain · ',
    el('a', { text: 'The Metropolitan Museum of Art', props: {
      href: 'https://www.metmuseum.org/art/collection/search/437998', target: '_blank', rel: 'noopener noreferrer',
    } }),
  ]);
  container.replaceChildren(el('div', { className: 'picture-puzzle forgery-puzzle' }, [pane, overlay]));

  function pointerPosition(event) {
    const box = target.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  }
  function dismissGuide() {
    lens.classList.remove('is-guiding');
    if (!state.demoDismissed) {
      state = { ...state, demoDismissed: true };
      save();
    }
  }
  function positionLens(point) {
    aim = point;
    lens.style.left = point.x * 100 + '%';
    lens.style.top = point.y * 100 + '%';
    bubble.style.left = point.x * 100 + '%';
    bubble.style.top = point.y * 100 + '%';
    bubble.classList.toggle('is-left', point.x > .5);
  }
  target.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    dismissGuide();
    positionLens(pointerPosition(event));
    lens.classList.add('is-visible');
  });
  target.addEventListener('pointerleave', () => lens.classList.remove('is-visible'));
  const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  target.addEventListener('keydown', event => {
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    dismissGuide();
    const clamp = n => Math.max(0, Math.min(1, n));
    positionLens({ x: clamp(aim.x + step[0] * .025), y: clamp(aim.y + step[1] * .025) });
  });
  function renderMarks() {
    marks.replaceChildren(...state.found.map((id, i) => {
      const { x, y, rx, ry } = regions[id];
      const mark = el('span', { className: 'forgery-mark' }, [el('b', { text: String(i + 1) })]);
      Object.assign(mark.style, { left: x * 100 + '%', top: y * 100 + '%', width: 2 * rx * 100 + '%', height: 2 * ry * 100 + '%' });
      return mark;
    }));
  }
  function tick() {
    if (!ready || state.startedAt === null || disposed) return;
    const time = now();
    update(elapsedMs(state, time));
    const remaining = Math.max(0, state.blockedUntil - time);
    bubble.hidden = remaining === 0;
    bubble.textContent = remaining ? `Next try in ${Math.ceil(remaining / 1000)}s` : '';
    const message = remaining ? `Miss · Try again in ${Math.ceil(remaining / 1000)}s` : `${state.found.length} of ${REQUIRED_FINDS} found`;
    if (message !== status.textContent) status.textContent = message;
  }
  function play() {
    lens.classList.toggle('is-guiding', !state.demoDismissed && !state.solved && state.found.length === 0);
    controls.replaceChildren(back);
    pane.replaceChildren(intro, clock, layout, status, credit, controls);
    renderMarks();
    tick();
  }
  function closeHelp() {
    popup = null;
    overlay.replaceChildren();
    pane.inert = false;
    help.focus();
  }
  function showHelp() {
    popup = 'help';
    puzzlePopup(pane, overlay, 'Spot the Forgery instructions', [
      el('h3', { text: 'Spot the Forgery' }),
      el('p', { text: 'Compare the original on the left with the forgery on the right. Click or tap any three of the five changes on the forgery. You can also focus the forgery, move the lens with the arrow keys, and press Enter to guess.' }),
      el('p', { text: 'A miss blocks guesses for five seconds while the clock keeps running. A red × marks your miss, and the speech bubble counts down to your next try. Misses cost no extra points.' }),
      el('p', { text: 'Start begins the clock. Help and time away count. Finish within 30 seconds for 15 points, 45 for 10, or 60 for 5. After that you still earn the clue.' }),
    ], { actionLabel: 'Back to game', onAction: closeHelp, keys: ['Enter', 'Escape'] });
  }
  function keydown(event) {
    if (event.repeat || disposed) return;
    if (popup && event.key === 'Tab') {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const enter = event.key === 'Enter';
    if (event.key !== 'Escape' && !(enter && (popup || (ready && state.startedAt === null && event.target !== help && event.target !== back)))) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (popup === 'help') closeHelp();
    else if (popup === 'success' || !enter) leave();
    else begin.click();
  }
  async function prepare() {
    pane.replaceChildren(intro, el('p', { text: 'Loading the paintings…', attrs: { role: 'status' } }), back);
    try {
      await Promise.all([original.decode(), forgery.decode()]);
      if (disposed) return;
      ready = true;
      if (state.startedAt !== null) play();
      else {
        controls.replaceChildren(begin, back);
        pane.replaceChildren(intro, controls);
        if (!popup) begin.focus();
      }
    } catch {
      if (!disposed) pane.replaceChildren(intro, el('p', { text: 'The paintings could not be loaded.' }), button('Retry', () => {
        original.src = originalUrl; forgery.src = forgeryUrl; prepare();
      }), back);
    }
  }
  document.addEventListener?.('keydown', keydown, true);
  const timer = setInterval(tick, 100);
  prepare();
  return () => {
    disposed = true;
    clearInterval(timer);
    document.removeEventListener?.('keydown', keydown, true);
  };
}
