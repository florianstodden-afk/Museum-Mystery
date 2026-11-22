// The final question with three answers. After the right answer it shows the chain of evidence.
// renderAccusation(container, { state, message }, onAccuse) – onAccuse(suspectId) only after
// the player confirmed the name: there is exactly one accusation, so a click alone never counts.
import { CASE, suspectById } from './case-1.js';
import { evidenceChain } from './journal.js';
import { el, button } from './dom.js';

/** The short question before the one and only accusation (≤ 20 words). */
export function confirmText(suspect) {
  return `Name ${suspect.name}? You get one chance – once you speak, M will hear of it.`;
}

/** A quiet nudge under the question, before anyone is named (≤ 12 words). */
export const ACCUSATION_NUDGE = 'Check your journal’s evidence before you name anyone.';

export function confirmLabel(suspect) {
  return `Name ${suspect.pronoun ?? 'them'}`;
}

export function renderAccusation(container, { state, message = '' }, onAccuse, onContinue) {
  let pendingKey = null;   // the keydown listener while the confirmation is open
  let focusTarget = null;

  function stopKeys() {
    if (pendingKey) document.removeEventListener('keydown', pendingKey, true);
    pendingKey = null;
  }

  function draw(pendingId = null) {
    stopKeys();
    const parts = [];
    const open = !state.accusation.solved && state.ending === null;
    const pending = open && pendingId ? suspectById(pendingId) : null;
    if (open) {
      parts.push(el('h3', { className: 'story-title', text: CASE.accusationQuestion + ' - Careful you get one chance' }),
        el('details', {className:'vault-help'}, [
          el('summary', {text:'?', attrs:{'aria-label':'Accusation help'}}),
          el('p', {text:ACCUSATION_NUDGE + ' You get one chance – once you speak, M will hear of it. A wrong accusation ends the case.'})
        ]));
      const choices = el('div', { className: 'story-choices' });
      for (const suspect of CASE.suspects) {
        const choice = button('', () => draw(suspect.id), 'story-choice');
        choice.append(
          el('strong', { text: suspect.name }),
          el('span', { className: 'story-choice-role', text: suspect.role }),
          el('span', { className: 'story-choice-text', text: suspect.description }),
        );
        choice.setAttribute('aria-expanded', String(suspect.id === pendingId));
        choices.append(choice);
        if (suspect.id === pendingId) choices.append(renderConfirm(suspect));
      }
      parts.push(choices);
    }

    if (state.accusation.solved) {
      const next = button('Decide what happens', onContinue);
      next.append(' ', el('kbd', {text:'↵'}));
      parts.push(el('div', {className:'story-choice vault-correct-option', text:suspectById(CASE.culpritId).name}),
        el('div', {className:'vault-result'}, [
          el('h3', {text:'Correct'}),
          el('p', {text:'Mystery solved – Adrien Voss sent you.'}),
          el('p', {text:'The label, patron visit, “V” and frame order all lead to him. “M” is for mécène, patron.'}),
          renderChain(evidenceChain(state)), next
        ]));
    }
    container.replaceChildren(el('section', { className: 'story-accusation' }, parts));
    if (pending) focusTarget?.focus();
  }

  function renderConfirm(suspect) {
    const confirm = () => { stopKeys(); onAccuse(suspect.id); };
    const cancel = () => draw(null);
    const yes = button('', confirm, 'story-button story-confirm-yes');
    focusTarget = yes;
    yes.append(confirmLabel(suspect), ' ', el('kbd', { text: '↵' }));
    const no = button('', cancel, 'story-button story-confirm-no');
    no.append('Not yet ', el('kbd', { text: 'Esc' }));
    const box = el('div', { className: 'story-confirm', attrs: { role: 'alertdialog', 'aria-label': `Name ${suspect.name}?` } }, [
      el('p', { className: 'story-text', text: confirmText(suspect) }),
      el('div', { className: 'story-confirm-actions' }, [yes, no]),
    ]);
    // Capture phase, so Escape goes back to the list instead of closing the whole panel.
    pendingKey = event => {
      if (box.isConnected === false) { stopKeys(); return; }
      if (event.key !== 'Escape' && event.key !== 'Enter') return;
      if (event.key === 'Enter' && event.target?.tagName && event.target !== yes) return;
      event.preventDefault();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      if (event.key === 'Enter') confirm(); else cancel();
    };
    document.addEventListener('keydown', pendingKey, true);
    return box;
  }

  draw(null);
}

export function renderChain(chain) {
  return el('details', { className: 'story-chain' }, [
    el('summary', { text: 'Chain of evidence' }),
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
