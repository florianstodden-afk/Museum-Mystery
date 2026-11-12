// The final question with three answers. After an answer it shows the chain of evidence.
// renderAccusation(container, { state, message }, onAccuse) – onAccuse(suspectId) on click.
import { CASE } from './case-1.js';
import { evidenceChain } from './journal.js';
import { el, button } from './dom.js';

export function renderAccusation(container, { state, message = '' }, onAccuse) {
  const parts = [
    el('p', { className: 'story-eyebrow', text: 'THE FINAL QUESTION' }),
    el('h3', { className: 'story-title', text: CASE.accusationQuestion }),
  ];

  if (!state.accusation.solved) {
    const choices = el('div', { className: 'story-choices' });
    for (const suspect of CASE.suspects) {
      const choice = button('', () => onAccuse(suspect.id), 'story-choice');
      choice.append(
        el('strong', { text: suspect.name }),
        el('span', { className: 'story-choice-role', text: suspect.role }),
        el('span', { className: 'story-choice-text', text: suspect.description }),
      );
      choices.append(choice);
    }
    parts.push(choices);
  }

  parts.push(el('p', { className: 'story-feedback', text: message, attrs: { 'aria-live': 'polite' } }));

  // The chain appears once the player has answered at least once.
  if (state.accusation.solved || state.accusation.attempts > 0) {
    parts.push(renderChain(evidenceChain(state)));
  }
  container.replaceChildren(el('section', { className: 'story-accusation' }, parts));
}

export function renderChain(chain) {
  return el('div', { className: 'story-chain' }, [
    el('p', { className: 'story-eyebrow', text: 'CHAIN OF EVIDENCE' }),
    el('ol', { className: 'story-chain-list' }, chain.map(link =>
      el('li', { className: link.found ? 'story-chain-item' : 'story-chain-item is-missing' }, [
        el('span', { className: 'story-chain-letter', text: link.letter, attrs: { 'aria-hidden': 'true' } }),
        el('div', {}, [
          el('strong', { text: link.text }),
          el('p', { className: 'story-muted', text: link.pointsToVoss }),
        ]),
      ]))),
  ]);
}
