// The two endings: data model, the choice before it, and the closing screen.
import { CASE, workById, suspectById } from './case-1.js';
import { evidenceChain } from './journal.js';
import { renderChain } from './accusation-ui.js';
import { scoreBreakdown, totalScore, maximumScore, scoreboard, formatClock } from './scoring.js';
import { el, button } from './dom.js';

// Shown before the two buttons, so the player knows why stealing is still an option.
export const CHOICE_TEXT = 'Voss planned everything and used you as his thief. The safe is open, the Van Gogh in reach. Take it for yourself, or walk away and let Vale return it to the wall?';

export const ENDINGS = {
  heist: {
    kicker: 'STEAL THE ARTWORK',
    title: 'I am a thief',
    choiceLabel: 'Steal the artwork',
    paragraphs: [
      'You keep the painting, not for Voss, for yourself. He will hunt you; Vale will remember you. Some nights end with a choice, not a reward.',
    ],
  },
  lost: {
    kicker: 'THE WRONG NAME',
    title: 'Case lost',
    // Filled in by lostParagraphs(), because the text names the person the player accused.
    paragraphs: [],
  },
  'open-file': {
    kicker: 'QUIT THE MISSION',
    title: 'I am not a thief',
    choiceLabel: 'Quit the mission',
    paragraphs: [
      'You walk away and leave the painting with Dr. Vale. By morning it hangs on its wall again, and your evidence exposes Voss as the man behind M.',
    ],
  },
};

const PAINTING = workById(436535);

const DETAIL_INTRO = {
  heist: 'You keep the original. The forgery remains in the Gallery.',
  'open-file': 'Dr. Vale keeps the original safe. The evidence reveals Voss’s plan to the museum.',
  lost: 'One wrong name. The evidence you found is listed below.',
};

/** The story after a wrong accusation (≤ 45 words), then who it really was and why the accused is innocent (≤ 30 words). */
export function lostParagraphs(state) {
  const accused = suspectById(state.accusation.accused);
  const culprit = suspectById(CASE.culpritId);
  const name = accused?.name ?? 'the wrong person';
  return [
    `You named ${name}. By morning the word had reached ${culprit.name}. He left the city before anyone asked a question – and the case left with him.`,
    `It was ${culprit.name}, the ${culprit.role.toLowerCase()}. ${accused?.counterText ?? ''}`.trim(),
  ];
}

// Everything the end screen needs, or null while the game has no ending.
// `progress` (optional) is the saved station progress; it adds the Renoir time to the run time.
export function endingModel(state, progress = {}) {
  const ending = ENDINGS[state.ending];
  if (!ending) return null;
  return {
    id: state.ending,
    status: state.ending === 'lost' ? 'Lost' : 'Won',
    timeMs: scoreboard(state, progress).timeMs,
    kicker: ending.kicker,
    title: ending.title,
    paragraphs: state.ending === 'lost' ? lostParagraphs(state).slice(0, 1) : ending.paragraphs,
    truth: state.ending === 'lost' ? lostParagraphs(state)[1] : null,   // who it really was (lost only)
    image: {
      src: new URL('../assets/met-436535.jpg', import.meta.url).href,
      alt: `${PAINTING.shortTitle}, ${PAINTING.artist}, ${PAINTING.date}`,
      caption: `${PAINTING.artist}, ${PAINTING.shortTitle}, ${PAINTING.date}. ${PAINTING.medium}.`,
      url: PAINTING.url,
    },
    chain: evidenceChain(state),
    breakdown: scoreBreakdown(state),
    total: totalScore(state),
    max: maximumScore(state),
    disclaimer: CASE.disclaimer,
  };
}

// The decision after the right answer. onChoose(endingId).
export function renderEndingChoice(container, onChoose) {
  container.replaceChildren(el('section', { className: 'story-ending-choice' }, [
    el('p', { className: 'story-text', text: CHOICE_TEXT }),
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
    el('p', { className: 'story-ending-detail-intro', text: DETAIL_INTRO[model.id] }),
    renderChain(model.chain),
    table,
    el('p', { className: 'story-disclaimer', text: model.disclaimer }),
  ]);
  const actions = el('div', { className: 'story-ending-actions' });
  const lost = model.id === 'lost';
  if (options.onHome) actions.append(button(lost ? 'Back to menu' : 'Back to home', options.onHome));
  if (options.onNewGame) actions.append(button(lost ? 'Try again' : 'New game', options.onNewGame));
  const parts = [
    el('div', { className: 'story-ending-plaque' }, [
      el('p', { className: 'story-eyebrow', text: model.kicker }),
      el('h2', { className: 'story-ending-title', text: model.title }),
      ...model.paragraphs.map(text => el('p', { className: 'story-text', text })),
      model.truth ? el('p', { className: 'story-ending-truth', text: model.truth }) : null,
    ]),
    el('div', { className: 'story-ending-bottom' }, [
      figure,
      el('div', { className: 'story-ending-controls' }, [
        el('p', { className: 'story-ending-total', text: `${model.total} / ${model.max} points` }),
        el('p', { className: 'story-ending-status', text: `${model.status} · time ${model.timeMs == null ? '–' : formatClock(model.timeMs)}` }),
        actions,
        details,
      ]),
    ]),
  ];
  container.replaceChildren(el('section', { className: `story-ending is-${model.id}` }, parts));
}
