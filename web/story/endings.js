// The two endings: data model, the choice before it, and the closing screen.
import { CASE, workById } from './case-1.js';
import { evidenceChain } from './journal.js';
import { renderChain } from './accusation-ui.js';
import { scoreBreakdown, totalScore, MAX_SCORE } from './scoring.js';
import { el, button } from './dom.js';

export const ENDINGS = {
  heist: {
    kicker: 'ENDING A',
    title: 'The Heist',
    choiceLabel: 'Hand the painting to Voss',
    paragraphs: [
      'At the loading dock a dark car waits with its lights off. Adrien Voss takes the painting without a word and hands you an envelope.',
      'By sunrise the forgery still hangs in the Landscape Gallery, under a label that carries his approval. Nobody asks questions.',
      'The file stays closed – for now.',
    ],
  },
  'open-file': {
    kicker: 'ENDING B',
    title: 'The Open File',
    choiceLabel: 'Bring painting and evidence to Dr. Vale',
    paragraphs: [
      'You carry the painting and the folder to Dr. Vale’s office. She lays the evidence out in a row: the label, the log, the slip, the frame.',
      'At seven the board reads the file. By noon Adrien Voss is no longer a patron of the Museum Nocturne.',
      '“Wheat Field with Cypresses” returns to its wall – the real one.',
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
    el('p', { className: 'story-eyebrow', text: 'YOUR DECISION' }),
    el('p', { className: 'story-text', text: 'You hold the original and the proof. Where does the painting go?' }),
    el('div', { className: 'story-choices' }, [
      button(ENDINGS.heist.choiceLabel, () => onChoose('heist'), 'story-choice'),
      button(ENDINGS['open-file'].choiceLabel, () => onChoose('open-file'), 'story-choice'),
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

  const parts = [
    el('p', { className: 'story-eyebrow', text: model.kicker }),
    el('h2', { className: 'story-ending-title', text: model.title }),
    figure,
    ...model.paragraphs.map(text => el('p', { className: 'story-text', text })),
    renderChain(model.chain),
    table,
    el('p', { className: 'story-disclaimer', text: model.disclaimer }),
  ];
  if (options.onNewGame) parts.push(button('New game', options.onNewGame));
  container.replaceChildren(el('section', { className: `story-ending is-${model.id}` }, parts));
}
