// The safe: a code-word field with feedback. The host passes the state and gets the word back.
// renderSafe(container, { state, message }, onTry)  – onTry(word) is called on submit.
import { CASE } from './case-1.js';
import { el } from './dom.js';

export function safeModel(state) {
  const proofs = CASE.stations.filter(station => state.stations[station.id].solved).length;
  return {
    open: state.safe.open,
    proofs,
    needed: CASE.stations.length,
    ready: proofs === CASE.stations.length && !state.safe.open,
    attempts: state.safe.attempts,
  };
}

export function renderSafe(container, { state, message = '' }, onTry) {
  const model = safeModel(state);
  const feedback = el('p', { className: 'story-feedback', text: message, attrs: { 'aria-live': 'polite' } });
  const parts = [
    el('p', { className: 'story-eyebrow', text: 'THE SAFE' }),
    el('p', { className: 'story-status', text: `Station proofs: ${model.proofs} / ${model.needed}` }),
  ];

  if (model.open) {
    parts.push(el('p', { className: 'story-text', text: 'The safe stands open. The original painting and a folder of documents are inside.' }));
  } else if (!model.ready) {
    parts.push(el('p', { className: 'story-text', text: 'A brass dial with four letters. It will not turn until you hold proof from all four stations.' }));
  } else {
    const input = el('input', {
      className: 'story-input',
      attrs: { id: 'story-safe-word', name: 'word', autocomplete: 'off', maxlength: '12', spellcheck: 'false' },
    });
    const form = el('form', { className: 'story-form' }, [
      el('label', { className: 'story-label', text: 'Code word', attrs: { for: 'story-safe-word' } }),
      input,
      el('button', { className: 'story-button', text: 'Try the lock', attrs: { type: 'submit' } }),
    ]);
    form.addEventListener('submit', event => {
      event.preventDefault();
      onTry(input.value);
    });
    parts.push(el('p', { className: 'story-text', text: 'Four letters. The journal knows the order.' }), form);
  }

  parts.push(feedback);
  container.replaceChildren(el('section', { className: 'story-safe' }, parts));
}
