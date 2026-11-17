// The speech box: a small text box at the bottom of the game, like in classic console RPGs.
// It only SHOWS a conversation – what a character says comes from conversationFor() in dialogues.js.
//
//   const box = createSpeechBox(document.body, { onClose });
//   box.show(conversation);     // { name, role, greeting, questions, goodbye }
//   box.handleKey(event);       // returns true if the box used the key
//   box.close();
//
// Flow: greeting boxes → choices → answer boxes → choices again … → goodbye line → closed.
import { el } from './dom.js';

export const LETTERS_PER_SECOND = 35;

export function createSpeechBox(parent, options = {}) {
  const {
    onClose = () => {},
    playSound = () => {},
    reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = id => clearTimeout(id),
  } = options;

  // ---------- The HTML (built once, reused) ----------
  const name = el('span', { className: 'speech-name' });
  const role = el('span', { className: 'speech-role' });
  const text = el('p', { className: 'speech-text' });
  text.setAttribute('aria-live', 'polite');
  const choices = el('div', { className: 'speech-choices' });
  const more = el('span', { className: 'speech-more', text: '▼' });
  more.setAttribute('aria-hidden', 'true');
  const box = el('div', { className: 'speech-box' }, [text, choices, more]);
  const root = el('section', { className: 'speech hidden' }, [el('div', { className: 'speech-tag' }, [name, role]), box]);
  root.setAttribute('aria-label', 'Conversation');
  box.addEventListener('click', event => { if (event.target.tagName !== 'BUTTON') advance(); });
  parent.append(root);

  // ---------- What is happening right now ----------
  let conversation = null;
  let queue = [];          // lines still to show
  let afterQueue = null;   // what happens after the last line: 'choices' or 'close'
  let fullLine = '';
  let typed = 0;           // how many letters are visible
  let timer = null;

  function show(next) {
    conversation = next;
    name.textContent = next.name;
    role.textContent = next.role;
    root.classList.remove('hidden');
    say(next.greeting, 'choices');
  }

  function close() {
    if (!conversation) return;
    clearTimer(timer);
    conversation = null;
    root.classList.add('hidden');
    onClose();
  }

  // Shows several lines one after another.
  function say(lines, then) {
    queue = [...lines];
    afterQueue = then;
    nextLine();
  }

  function nextLine() {
    choices.replaceChildren();
    fullLine = queue.shift();
    typed = reducedMotion() ? fullLine.length : 0;
    type();
  }

  // Typewriter: one more letter every 1/35 second.
  function type() {
    clearTimer(timer);
    text.textContent = fullLine.slice(0, typed);
    const done = typed >= fullLine.length;
    root.classList.toggle('is-typing', !done);
    if (!done) { typed++; timer = setTimer(type, 1000 / LETTERS_PER_SECOND); return; }
    if (queue.length || afterQueue === 'close') more.hidden = false;
    else { more.hidden = true; if (afterQueue === 'choices') showChoices(); }
  }

  // Space, E or a click: finish the sentence, or go to the next one.
  function advance() {
    if (!conversation) return;
    if (typed < fullLine.length) { typed = fullLine.length; type(); return; }
    if (queue.length) { nextLine(); return; }
    if (afterQueue === 'close') close();
  }

  function showChoices() {
    const all = [...conversation.questions, { ...conversation.goodbye, isGoodbye: true }];
    choices.replaceChildren(...all.map(choice => {
      const node = el('button', { className: choice.isGoodbye ? 'speech-choice is-goodbye' : 'speech-choice', text: choice.label });
      node.type = 'button';
      node.addEventListener('click', () => choose(choice));
      return node;
    }));
    choices.children[0].focus({ preventScroll: true });
  }

  function choose(choice) {
    playSound('click');
    say(choice.lines, choice.isGoodbye ? 'close' : 'choices');
  }

  function choiceButtons() { return [...choices.children]; }

  // Keyboard: 1/2/3 pick, arrows move between choices, Enter presses, Space/E go on, Escape or walking closes.
  function handleKey(event) {
    if (!conversation) return false;
    const key = event.key.toLowerCase();
    const buttons = choiceButtons();
    if (key === 'escape' || ['w', 'a', 's', 'd'].includes(key)) { close(); return true; }
    if (buttons.length) {
      const index = buttons.indexOf(document.activeElement);
      if (/^[1-9]$/.test(key) && buttons[Number(key) - 1]) { buttons[Number(key) - 1].click(); return true; }
      if (['arrowright', 'arrowdown'].includes(key)) { buttons[(index + 1) % buttons.length].focus(); return true; }
      if (['arrowleft', 'arrowup'].includes(key)) { buttons[(index - 1 + buttons.length) % buttons.length].focus(); return true; }
      if (key === 'enter' || key === ' ') { (buttons[index] ?? buttons[0]).click(); return true; }
      return true;
    }
    if (key.startsWith('arrow')) { close(); return true; }
    if ([' ', 'e', 'enter'].includes(key) && !event.repeat) advance();
    return true;
  }

  // 'top' when the player stands low on the screen, so the box never hides them.
  function setPlacement(place) {
    root.classList.toggle('is-top', place === 'top');
  }

  return {
    show, close, handleKey, advance, setPlacement,
    get isOpen() { return conversation !== null; },
    get element() { return root; },
  };
}
