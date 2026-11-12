// Case data for "Museum Nocturne" (case 1).
// This file only contains data – no game rules. The engine reads it.
// Museum and people are fictional. The artworks are real (The Met, Open Access).

// Makes an object and everything inside it read-only, so no code can change the case by accident.
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const inner of Object.values(value)) deepFreeze(inner);
    Object.freeze(value);
  }
  return value;
}

export const CASE_VERSION = 1;

// The order of this list is the fixed order of the letters in the journal: B-I-L-D.
export const STATION_IDS = ['landscape', 'portraits', 'restoration', 'archive'];

export const CODEWORD = 'BILD';

export const CASE = deepFreeze({
  id: 'nocturne-1',
  title: 'The Night of the Forgery',
  museum: 'Museum Nocturne, New York',
  disclaimer: 'Fictional museum and characters · Artworks: The Met, Open Access',

  mission: {
    from: 'M',
    title: 'A message from M',
    text:
      'Tonight the Museum Nocturne is yours. Somewhere inside, a safe holds Van Gogh’s ' +
      '“Wheat Field with Cypresses”. Bring it to me before sunrise. The curator left four ' +
      'clues behind – one in each wing. Follow them, and the safe will open. – M',
  },

  stations: [
    {
      id: 'landscape',
      room: 'Landscape Gallery',
      letter: 'B',
      evidenceId: 'false-label',
      evidence: 'Voss approved the false wall label.',
      pointsToVoss: 'The false label went up with Voss’s approval – he wanted the swap to look official.',
      task: 'Compare the wall label with the Met catalogue and correct the year and the material.',
      metIds: [436535, 459193],
    },
    {
      id: 'portraits',
      room: 'Portrait Hall',
      letter: 'I',
      evidenceId: 'shift-log',
      evidence: 'Night-shift log: Leon was elsewhere; the transport was booked as a patron visit.',
      pointsToVoss: 'Leon was on his round; the cart was booked as a “patron visit” – and Voss is the patron.',
      task: 'Read the night-shift log next to the portraits and find out where Leon really was at 21:14.',
      metIds: [12127, 435876],
    },
    {
      id: 'restoration',
      room: 'Conservation Studio',
      letter: 'L',
      evidenceId: 'hidden-mark',
      evidence: 'Hidden mark “V” on the fake transport slip.',
      pointsToVoss: 'Someone marked the fake slip with a hidden “V” to recognise their own paperwork.',
      task: 'With Imani’s material notes, test the transport slip under the lamp and reveal what is hidden on it.',
      metIds: [435882],
    },
    {
      id: 'archive',
      room: 'Frame Archive',
      letter: 'D',
      evidenceId: 'frame-label',
      evidence: 'Frame label: “Ordered by: A. Voss”.',
      pointsToVoss: 'The frame for the forgery was ordered by A. Voss – so the “V” is his, not Vale’s.',
      task: 'Find the empty frame that matches the forgery and read who ordered it.',
      metIds: [436121],
    },
  ],

  // Story notes: they go into the journal but give no letter.
  notes: [
    {
      id: 'transport-cart',
      title: 'Monitor wall, 21:14',
      text: 'Leon saw a transport cart at the delivery exit at 21:14. He could not see what was inside.',
    },
    {
      id: 'duty-roster',
      title: 'Shift schedule',
      text: 'Tonight’s roster: Leon on the night round, Imani in the studio until 22:00. ' +
        'One line says only “21:00 – patron visit”. The night-shift log in the Portrait Hall should say more.',
    },
  ],

  suspects: [
    {
      id: 'leon',
      name: 'Leon',
      role: 'Night guard',
      description: 'Saw a transport cart at the delivery exit, but not the painting. Nervous since the alarm.',
      // Which evidence speaks against this suspect being the planner:
      counterEvidenceId: 'shift-log',
      counterText: 'The night-shift log shows Leon was on his round elsewhere – and the transport was booked as a patron visit, not by a guard.',
    },
    {
      id: 'vale',
      name: 'Dr. Mara Vale',
      role: 'Curator',
      description: 'Locked the original in the safe and left four clues. Her initial is also a “V”.',
      counterEvidenceId: 'frame-label',
      counterText: 'The “V” is not Vale: the frame label says “Ordered by: A. Voss”. Vale hid the original to protect it.',
    },
    {
      id: 'voss',
      name: 'Adrien Voss',
      role: 'Patron',
      description: 'Generous donor of the museum. Signs his messages with a single letter.',
      counterEvidenceId: null,
      counterText: '',
    },
  ],
  culpritId: 'voss',
  accusationQuestion: 'Who planned the false label and the transport slip, and lured you to the safe?',

  // Checked against the Met Collection API (collectionapi.metmuseum.org).
  // `title` is the full Met title, `shortTitle` the name used in the game.
  works: [
    {
      id: 436535, shortTitle: 'Wheat Field with Cypresses', title: 'Wheat Field with Cypresses',
      artist: 'Vincent van Gogh', date: '1889', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/436535',
      image: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg',
      checked: '2026-11-10',
    },
    {
      id: 459193, shortTitle: 'Road in Etten', title: 'Road in Etten',
      artist: 'Vincent van Gogh', date: '1881', medium: 'Chalk, pencil, pastel, watercolor. Underdrawing in pen and brown ink.',
      url: 'https://www.metmuseum.org/art/collection/search/459193',
      image: 'https://images.metmuseum.org/CRDImages/rl/web-large/DP359031.jpg',
      checked: '2026-11-10',
    },
    {
      id: 436121, shortTitle: 'A Woman Seated beside a Vase of Flowers', title: 'A Woman Seated beside a Vase of Flowers (Madame Paul Valpinçon?)',
      artist: 'Edgar Degas', date: '1865', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/436121',
      image: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-25460-001.jpg',
      checked: '2026-11-10',
    },
    {
      id: 12127, shortTitle: 'Madame X', title: 'Madame X (Virginie Amélie Avegno Gautreau)',
      artist: 'John Singer Sargent', date: '1883–84', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/12127',
      image: 'https://images.metmuseum.org/CRDImages/ad/web-large/DP-29006-001.jpg',
      checked: '2026-11-10',
    },
    {
      id: 435876, shortTitle: 'Madame Cézanne in a Red Dress', title: 'Madame Cézanne (Hortense Fiquet, 1850–1922) in a Red Dress',
      artist: 'Paul Cézanne', date: '1888–90', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/435876',
      image: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP320128.jpg',
      checked: '2026-11-10',
    },
    {
      id: 435882, shortTitle: 'Still Life with Apples and a Pot of Primroses', title: 'Still Life with Apples and a Pot of Primroses',
      artist: 'Paul Cézanne', date: 'ca. 1890', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/435882',
      image: 'https://images.metmuseum.org/CRDImages/ep/web-large/DT47.jpg',
      checked: '2026-11-10',
    },
  ],
});

// Small lookup helpers, so other files do not have to search the lists themselves.
export function stationById(stationId) {
  return CASE.stations.find(station => station.id === stationId) ?? null;
}

export function noteById(noteId) {
  return CASE.notes.find(note => note.id === noteId) ?? null;
}

export function suspectById(suspectId) {
  return CASE.suspects.find(suspect => suspect.id === suspectId) ?? null;
}

export function workById(metId) {
  return CASE.works.find(work => work.id === metId) ?? null;
}
