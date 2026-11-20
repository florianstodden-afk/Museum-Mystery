// What the characters say. The lines depend on the story progress.
// dialogueFor(characterId, state) → { id, name, role, available, lines }
// renderDialogue(container, dialogue) shows it in any container.
import { CASE, STATION_IDS } from './case-1.js';
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
  if (state.ending === 'lost') {
    return away(['You dial the number from M’s message.', '“The number you have called is no longer in service.”']);
  }
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
    'The picture puzzle is on the left side of the Gallery, beside Curator’s Catalogue and the frame rack.',
    'Restore Renoir’s Sea and Cliffs at Station 2. I will then use the lamp to reveal the mark on the transport slip.',
  ]);
}

function linesForVale(state) {
  if (!state.safe.open) {
    return away(['Dr. Vale’s office is dark.', 'A card on the door: “Back after the gala. – M. V.”']);
  }
  if (state.ending === 'lost') {
    return away(['Dr. Vale stands in front of the open safe.', 'The original is gone. So is the patron who planned it.']);
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

// ---------- Short conversations with choices (speech box) ----------
// conversationFor(characterId, state) → { id, name, role, greeting, questions, goodbye } or null.
// Each answer is a list of boxes; each box holds one or two short sentences.
// The help is in the answers, never in the questions. Nobody names a solution.

export function conversationFor(characterId, state) {
  const character = CHARACTERS.find(c => c.id === characterId);
  if (!character || characterId === 'm') return null;
  const build = { leon: leonConversation }[characterId] ?? simpleConversation(characterId);
  return { ...character, ...build(state) };
}

export function questionsFor(characterId, state) {
  return conversationFor(characterId, state)?.questions ?? [];
}

// Characters without their own questions say their usual lines. Imani ends when
// the player has read all of hers; Vale keeps his existing goodbye choice.
function simpleConversation(characterId) {
  return state => ({
    greeting: dialogueFor(characterId, state).lines,
    questions: [],
    autoCloseAfterGreeting: characterId === 'imani',
    goodbye: { id: 'bye', label: 'Goodbye.', lines: [] },
  });
}

function leonConversation(state) {
  return {
    greeting: [leonGreeting(state)],
    questions: [
      { id: 'night', label: 'Rough night so far?', lines: leonNight(state) },
      { id: 'quiet', label: 'Quiet in here, isn’t it?', lines: leonRound(state) },
    ],
    goodbye: { id: 'bye', label: 'I’ll let you get back to it.', lines: ['Mind the cameras.'] },
  };
}

function leonGreeting(state) {
  if (state.accusation.solved) return 'There you are. The whole building is talking.';
  if (state.safe.open) return 'The vault was open? Nobody tells me anything.';
  if (state.stations.portraits.solved) return 'Ah. You again. I suppose you’ve read the log.';
  return 'Evening. Keep your voice down – the cameras have ears tonight.';
}

// Option 1: Leon's own story. It follows the trail of the night.
function leonNight(state) {
  if (state.accusation.solved) return linesForLeon(state).lines;
  if (state.stations.portraits.solved) {
    return [
      'East stairs at 21:14. It’s in the log now, black on white.',
      'And the cart? Booked as a “patron visit”.',
      'I can’t book a coffee, let alone a cart.',
    ];
  }
  if (state.notes.includes('transport-cart')) {
    return [
      'So you’ve seen the footage. A cart, nothing more.',
      'Everyone looks at the guard first.',
      'Funny – nobody asks where the guard actually was.',
      'Somebody keeps the night-shift log by the portraits.',
      'Neat handwriting, terrible coffee.',
    ];
  }
  return [
    'Rough? A cart rolled out of the delivery exit at 21:14.',
    'Covered. Didn’t see what was under the sheet.',
    'The monitors in the security office caught it.',
    'If you don’t believe me, look for yourself.',
  ];
}

// Option 2: small talk about his round. What seemed odd to him points at the first open station.
const ODD_ON_MY_ROUND = {
  landscape: ['Too quiet. That new wall label in the gallery – someone hung it in a hurry.', 'Match the catalogue labels in the middle of the Gallery. They may reveal who approved it.'],
  portraits: ['Quiet, until you count the portraits.', 'Four ladies, and the cards beside them are all shuffled.'],
  restoration: ['Imani’s been muttering about a puzzle of Renoir’s cliffs.', 'Says it hides something on the back of a slip.'],
  archive: ['Someone moved the frames on the Gallery rack during my last round.', 'Frames don’t move themselves.'],
};

function leonRound(state) {
  const open = STATION_IDS.find(id => !state.stations[id].solved);
  if (open) return ODD_ON_MY_ROUND[open];
  if (!state.safe.open) return ['Dr. Vale went down to the vault earlier.', 'Came back pale as a sheet.'];
  if (!state.accusation.solved) return ['Whoever planned this didn’t wear a uniform.', 'Think about who signs things around here.'];
  return ['Quiet again, finally.', 'I might even finish my coffee tonight.'];
}
