// What the characters say. The lines depend on the story progress.
// dialogueFor(characterId, state) → { id, name, role, available, lines }
// renderDialogue(container, dialogue) shows it in any container.
import { CASE } from './case-1.js';
import { el } from './dom.js';

export const CHARACTERS = [
  { id: 'm', name: 'M', role: 'Unknown sender' },
  { id: 'leon', name: 'Leon', role: 'Night guard' },
  { id: 'imani', name: 'Imani', role: 'Conservator' },
  { id: 'vale', name: 'Dr. Mara Vale', role: 'Curator' },
];

export function dialogueFor(characterId, state) {
  const character = CHARACTERS.find(c => c.id === characterId);
  if (!character) return null;
  const linesFor = { m: linesForM, leon: linesForLeon, imani: linesForImani, vale: linesForVale }[characterId];
  const { available, lines } = linesFor(state);
  return { ...character, available, lines };
}

function linesForM(state) {
  if (state.ending === 'heist') {
    return talk(['Pleasure doing business. The car is already gone.', 'No one will ever know you were here.']);
  }
  if (state.ending === 'open-file') {
    return away(['You dial the number from M’s message.', '“The number you have called is no longer in service.”']);
  }
  if (!state.missionRead) return talk([CASE.mission.text]);
  if (state.safe.open) {
    return talk(['You found it? Good.', 'Bring it to the loading dock. Come alone, and do not talk to the curator.']);
  }
  return talk([
    'Keep moving. Four wings, four clues.',
    'The curator thinks she is clever. Her clues will spell the way into the safe.',
  ]);
}

function linesForLeon(state) {
  if (state.accusation.solved) {
    return talk([
      'Voss? He shook my hand at the gala and called me “our loyal Leon”.',
      'Thank you for checking the log before you checked me.',
    ]);
  }
  if (state.stations.portraits.solved) {
    return talk([
      'The log proves it, doesn’t it? I was on the east stairs at 21:14.',
      'Someone booked that cart as a “patron visit”. Not me – guards cannot book anything.',
    ]);
  }
  const lines = [
    'I know how it looks. I was on duty, and a painting is missing.',
    'At 21:14 I saw a transport cart at the delivery exit. I never saw what was inside.',
  ];
  if (!state.notes.includes('transport-cart')) {
    lines.push('If you don’t believe me, look at the monitor wall in the security office.');
  } else {
    lines.push('The night-shift log is in the Portrait Hall. It will show where I really was.');
  }
  return talk(lines);
}

function linesForImani(state) {
  if (state.safe.open) {
    return talk([
      'The original was in the safe all along? Then the one on the wall …',
      'I will test its varnish in the morning. Fresh varnish never lies.',
    ]);
  }
  if (state.stations.restoration.solved) {
    return talk([
      'That “V” was written in an ink that only shows under the lamp.',
      'Someone wanted to recognise their own paperwork. A “V” – that could be more than one person here.',
    ]);
  }
  return talk([
    'Bring me anything made of paper and I will tell you what it is made of.',
    'Forgers forget the lamp. The right light shows what ordinary ink hides.',
  ]);
}

function linesForVale(state) {
  if (!state.safe.open) {
    return away(['Dr. Vale’s office is dark.', 'A card on the door: “Back after the gala. – M. V.”']);
  }
  if (state.ending === 'open-file') {
    return talk(['The file is open. Tomorrow the painting goes back on its wall – the real one.']);
  }
  if (state.ending === 'heist') {
    return away(['Dr. Vale stands in front of the empty safe.', 'She says nothing. She only starts writing a new report.']);
  }
  if (state.accusation.solved) {
    return talk([
      'Voss. I suspected him for weeks, but I needed proof that was not mine.',
      'He signs his private letters with “M” – for mécène, the old word for patron. Everyone here thinks it means Mara.',
      'He could not open my safe, so he needed someone who would follow my clues. You.',
      'You hold the painting and the evidence. The choice is yours now.',
    ]);
  }
  return talk([
    'You opened it. Good. I locked the original away the night the false label went up.',
    'I could not tell anyone – not even Leon. So I left four clues and hoped the right person would follow them.',
    'Now tell me: who is behind this?',
  ]);
}

function talk(lines) {
  return { available: true, lines };
}

function away(lines) {
  return { available: false, lines };
}

export function renderDialogue(container, dialogue) {
  container.replaceChildren(el('section', { className: dialogue.available ? 'story-dialogue' : 'story-dialogue is-away' }, [
    el('p', { className: 'story-eyebrow', text: dialogue.role.toUpperCase() }),
    el('h3', { className: 'story-title', text: dialogue.name }),
    ...dialogue.lines.map(line => el('p', { className: 'story-dialogue-line', text: line })),
  ]));
}
