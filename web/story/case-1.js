import { CATALOGUE_ARTWORKS } from '../minigames/catalogue-data.js';

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

// The rooms that really exist in the game, spelled as on the signs.
export const ROOMS = ['Portrait Hall', 'Gallery', 'Security', 'Vault'];

// Players see station NUMBERS, in walking order (Hall, then Gallery left → middle → right).
// The letters O, I, L, S stay hidden until a station is solved, so the code word cannot be read off the signs.
export function stationsByNumber(stations = CASE.stations) {
  return [...stations].sort((a, b) => a.number - b.number);
}

// Where a station is: the room, plus the spot when a room holds several stations.
export function stationPlace(station) {
  return station.spot ? `${station.room}, ${station.spot}` : station.room;
}

export const CASE_VERSION = 3;   // 3: one accusation only (2: code word OILS); older saves start fresh

// The order of this list is the order of the code word (O-I-L-S). Players never see it:
// journal, signs and scoreboard use the station `number` instead.
export const STATION_IDS = ['landscape', 'portraits', 'restoration', 'archive'];

export const CODEWORD = 'OILS';

export const CASE = deepFreeze({
  id: 'nocturne-1',
  title: 'The Night of the Forgery',
  museum: 'Museum Nocturne, New York',
  disclaimer: 'Fictional museum and characters · Artworks: The Met, Open Access',

  mission: {
    from: 'M',
    title: 'A message from M',
    text:
      'The Van Gogh in the Gallery is a copy. The real ‘Wheat Field with Cypresses’ is locked in the curator’s safe. ' +
      'She hid four clues in the museum – together they open it. Everyone thinks you are the new conservation temp. ' +
      'Bring me the painting tonight. – M',
  },

  stations: [
    {
      id: 'landscape',
      number: 3,
      room: 'Gallery',
      spot: 'middle painting',
      letter: 'O',
      evidenceId: 'false-label',
      evidence: 'The false wall label was approved by a patron – not by museum staff.',
      pointsToVoss: 'A patron, not the staff, approved the false label – Voss wanted the swap to look official.',
      task: 'Play Curator’s Catalogue: match four labels to their artworks to uncover who approved the false wall label.',
      metIds: CATALOGUE_ARTWORKS.map(work => work.id),
    },
    {
      id: 'portraits',
      number: 1,
      room: 'Portrait Hall',
      letter: 'I',
      evidenceId: 'shift-log',
      evidence: 'Night-shift log: Leon was on the east stairs at 21:14, when the cart left. The cart was booked as a ‘patron visit’.',
      pointsToVoss: 'Leon was on his round; the cart was booked as a “patron visit” – and Voss is the patron.',
      task: 'Put the four portraits in the order they were painted, oldest first – their backs hold the night-shift log.',
      metIds: [436703, 436121, 12127, 435876],
    },
    {
      id: 'restoration',
      number: 2,
      room: 'Gallery',
      spot: 'left painting',
      letter: 'L',
      evidenceId: 'hidden-mark',
      evidence: 'Hidden mark “V” on the fake transport slip.',
      pointsToVoss: 'Someone marked the fake slip with a hidden “V” to recognise their own paperwork.',
      task: 'Station 2 hangs left of Curator’s Catalogue in the Gallery. Restore Renoir’s eight-piece picture to reveal a mark on the transport slip.',
      metIds: [459111],
    },
    {
      id: 'archive',
      number: 4,
      room: 'Gallery',
      spot: 'frame rack',
      letter: 'S',
      evidenceId: 'frame-label',
      evidence: 'Frame label: “Ordered by: A. V.”',
      pointsToVoss: 'The frame for the forgery was ordered by “A. V.” – Adrien Voss, the only patron with those initials, not Vale.',
      task: 'Play Spot the Forgery at the Gallery frame rack. Find three changes to uncover the frame label.',
      metIds: [435882],
    },
  ],

  // Story notes: they go into the journal but give no letter.
  notes: [
    {
      id: 'transport-cart',
      title: 'Monitor wall, 21:14',
      text: 'A covered transport cart left the delivery exit at 21:14. No delivery was announced.',
    },
    {
      id: 'duty-roster',
      title: 'Shift schedule',
      text: 'Leon on the night round, Imani in the studio until 22:00. ' +
        'One line says only “21:00 – patron visit”. The Portrait Hall log should say more.',
    },
  ],

  suspects: [
    {
      id: 'leon',
      name: 'Leon',
      pronoun: 'him',
      role: 'Night guard',
      description: 'Night guard. Saw a covered cart leave at 21:14 – and was on duty all night.',
      // Which evidence speaks against this suspect being the planner:
      counterEvidenceId: 'shift-log',
      counterText: 'The night-shift log puts Leon on the east stairs at 21:14, and a guard cannot book a patron visit.',
    },
    {
      id: 'vale',
      name: 'Dr. Mara Vale',
      pronoun: 'her',
      role: 'Curator',
      description: 'Curator. Locked the original in the safe and left four clues. Her initial is also a ‘V’.',
      counterEvidenceId: 'frame-label',
      counterText: 'The ‘V’ is not Vale. The frame label names ‘A. V.’, not M. V. – and Vale hid the original to protect it.',
    },
    {
      id: 'voss',
      name: 'Adrien Voss',
      pronoun: 'him',
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
  // objectBeginDate/objectEndDate: frozen snapshot of the Met fields. Station I sorts by
  // objectBeginDate (for a range like 1883–84 the start year counts). Never use live data for the order.
  works: [
    ...CATALOGUE_ARTWORKS.map(work => ({ ...work, artist: work.artistDisplayName })),
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
      id: 436703, shortTitle: 'Madame Leblanc', title: 'Madame Jacques-Louis Leblanc (Françoise Poncelle, 1788–1839)',
      artist: 'Jean Auguste Dominique Ingres', date: '1823', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/436703',
      objectBeginDate: 1823, objectEndDate: 1823, datesChecked: '2026-11-18',
      image: 'https://images.metmuseum.org/CRDImages/ep/web-large/DT1926.jpg',
      checked: '2026-11-18',
    },
    {
      id: 436121, shortTitle: 'A Woman Seated beside a Vase of Flowers', title: 'A Woman Seated beside a Vase of Flowers (Madame Paul Valpinçon?)',
      artist: 'Edgar Degas', date: '1865', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/436121',
      objectBeginDate: 1865, objectEndDate: 1865, datesChecked: '2026-11-15',
      image: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-25460-001.jpg',
      checked: '2026-11-10',
    },
    {
      id: 12127, shortTitle: 'Madame X', title: 'Madame X (Virginie Amélie Avegno Gautreau)',
      artist: 'John Singer Sargent', date: '1883–84', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/12127',
      objectBeginDate: 1883, objectEndDate: 1884, datesChecked: '2026-11-15',
      image: 'https://images.metmuseum.org/CRDImages/ad/web-large/DP-29006-001.jpg',
      checked: '2026-11-10',
    },
    {
      id: 435876, shortTitle: 'Madame Cézanne in a Red Dress', title: 'Madame Cézanne (Hortense Fiquet, 1850–1922) in a Red Dress',
      artist: 'Paul Cézanne', date: '1888–90', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/435876',
      objectBeginDate: 1888, objectEndDate: 1890, datesChecked: '2026-11-15',
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
    {
      id: 459111, shortTitle: 'Sea and Cliffs', title: 'Sea and Cliffs',
      artist: 'Auguste Renoir', date: 'ca. 1885', medium: 'Oil on canvas',
      url: 'https://www.metmuseum.org/art/collection/search/459111',
      image: 'https://images.metmuseum.org/CRDImages/rl/web-large/DT3130.jpg',
      checked: '2026-11-14',
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
