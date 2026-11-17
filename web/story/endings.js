// The two endings: data model, the choice before it, and the closing screen.
import { CASE, workById } from './case-1.js';
import { evidenceChain } from './journal.js';
import { renderChain } from './accusation-ui.js';
import { scoreBreakdown, totalScore, MAX_SCORE } from './scoring.js';
import { el, button } from './dom.js';

export const ENDINGS = {
  heist: {
    kicker: 'STEAL THE ARTWORK',
    title: 'I am a thief',
    choiceLabel: 'Steal the artwork',
    paragraphs: [
      'You take the original out of the museum and deliver it to Voss. The money is yours, but the forgery stays on the wall.',
    ],
  },
  'open-file': {
    kicker: 'QUIT THE MISSION',
    title: 'I am not a thief',
    choiceLabel: 'Quit the mission',
    paragraphs: [
      'You return the original to Dr. Vale and leave the evidence with the museum. Voss loses his cover; the painting stays where it belongs.',
    ],
  },
};

const PAINTING = workById(436535);

// Everything the end screen needs, or null while the game has no ending.
export function endingModel(state) {
  const ending = ENDINGS[state.ending];
  if (!ending) return null;
  return {
    id: state.ending,
    kicker: ending.kicker,
    title: ending.title,
    paragraphs: ending.paragraphs,
    image: {
      src: new URL('../assets/met-436535.jpg', import.meta.url).href,
      alt: `${PAINTING.shortTitle}, ${PAINTING.artist}, ${PAINTING.date}`,
      caption: `${PAINTING.artist}, ${PAINTING.shortTitle}, ${PAINTING.date}. ${PAINTING.medium}.`,
      url: PAINTING.url,
    },
    chain: evidenceChain(state),
    breakdown: scoreBreakdown(state),
    total: totalScore(state),
    max: MAX_SCORE,
    disclaimer: CASE.disclaimer,
  };
}

// The decision after the right answer. onChoose(endingId).
export function renderEndingChoice(container, onChoose) {
  container.replaceChildren(el('section', { className: 'story-ending-choice' }, [
    el('p', { className: 'story-eyebrow', text: 'ONE FINAL CHOICE' }),
    el('p', { className: 'story-text', text: 'You have the original. What do you do?' }),
    el('div', { className: 'story-choices' }, [
      button(`${ENDINGS.heist.choiceLabel} · I am a thief`, () => onChoose('heist'), 'story-choice'),
      button(`${ENDINGS['open-file'].choiceLabel} · I am not a thief`, () => onChoose('open-file'), 'story-choice'),
    ]),
  ]));
}

// options.onNewGame (optional) adds a "New game" button.
export function renderEnding(container, model, options = {}) {
  const figure = el('figure', { className: 'story-ending-figure' }, [
    el('img', { props: { src: model.image.src, alt: model.image.alt } }),
    el('figcaption', {}, [
      model.image.caption + ' ',
      el('a', { text: 'The Met', props: { href: model.image.url, target: '_blank', rel: 'noopener noreferrer' } }),
    ]),
  ]);

  const rows = model.breakdown.map(row => el('tr', {}, [
    el('th', { text: row.label, attrs: { scope: 'row' } }),
    el('td', { text: row.detail }),
    el('td', { className: 'story-num', text: `${row.points} / ${row.max}` }),
  ]));
  const table = el('table', { className: 'story-score-table' }, [
    el('caption', { text: 'Points per part' }),
    el('tbody', {}, rows),
    el('tfoot', {}, [el('tr', {}, [
      el('th', { text: 'Total', attrs: { scope: 'row' } }),
      el('td', {}),
      el('td', { className: 'story-num', text: `${model.total} / ${model.max}` }),
    ])]),
  ]);

  const details = el('details', { className: 'story-ending-details' }, [
    el('summary', { text: 'View evidence and score details' }),
    renderChain(model.chain),
    table,
    el('p', { className: 'story-disclaimer', text: model.disclaimer }),
  ]);
  const actions = el('div', { className: 'story-ending-actions' });
  if (options.onHome) actions.append(button('Back to home', options.onHome));
  if (options.onNewGame) actions.append(button('New game', options.onNewGame));
  const parts = [
    el('div', { className: 'story-ending-copy' }, [
      el('p', { className: 'story-eyebrow', text: model.kicker }),
      el('h2', { className: 'story-ending-title', text: model.title }),
      ...model.paragraphs.map(text => el('p', { className: 'story-text', text })),
      el('p', { className: 'story-ending-total', text: `${model.total} / ${model.max} points` }),
      actions,
      details,
    ]),
    figure,
  ];
  container.replaceChildren(el('section', { className: `story-ending is-${model.id}` }, parts));
}
