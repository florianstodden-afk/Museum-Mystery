// The journal's "People" page: who is who in the museum tonight.
// Kept apart from journal.js on purpose. Pure model first, then a renderer.
//
// Who counts as met:
// - Leon, Imani: after the first conversation (state.met).
// - Dr. Vale: after reading her office door or talking to her (state.met), or once the safe is open.
// - Adrien Voss: never met in person. He appears once the final question does (safe open).
// Older saves have no `met` field: everyone not unlocked by the story counts as not met.
import { el } from './dom.js';

export const PEOPLE = [
  { id: 'leon', name: 'Leon', role: 'Night guard', line: 'On duty all night.', portrait: 'guard' },
  { id: 'imani', name: 'Imani', role: 'Conservator', line: 'In the studio until 22:00.', portrait: 'restorer' },
  { id: 'vale', name: 'Dr. Mara Vale', role: 'Curator', line: 'Away at the gala tonight.', portrait: 'curator' },
  { id: 'voss', name: 'Adrien Voss', role: 'Patron', line: 'Paid for the new Gallery wing.', portrait: 'silhouette' },
];

export const PERSON_IDS = PEOPLE.map(person => person.id);
export const NOT_MET = 'Not met yet';

/** The ids met so far, tolerant of saves without the field. */
export function metIds(state) {
  return Array.isArray(state?.met) ? state.met.filter(id => PERSON_IDS.includes(id)) : [];
}

export function isMet(state, id) {
  if (metIds(state).includes(id)) return true;
  if (id === 'vale' || id === 'voss') return Boolean(state?.safe?.open);
  return false;
}

export function peopleModel(state) {
  return PEOPLE.map(person => {
    const met = isMet(state, person.id);
    if (!met) return { id: person.id, met: false, name: '?', role: '', line: NOT_MET, portrait: null };
    // After the right accusation the patron's signature is no secret any more.
    const line = person.id === 'voss' && state.accusation?.solved ? `${person.line} Signed as ‘M’.` : person.line;
    return { id: person.id, met: true, name: person.name, role: person.role, line, portrait: person.portrait };
  });
}

// drawPortrait(canvas, kind) is given by the page, so the portraits reuse the game's own figures.
export function renderPeople(container, model, drawPortrait = null) {
  container.replaceChildren(el('ul', { className: 'journal-people', attrs: { 'aria-label': 'People' } }, model.map(person => {
    let portrait;
    if (!person.met) portrait = el('span', { className: 'journal-person-portrait is-unknown', text: '?', attrs: { 'aria-hidden': 'true' } });
    else if (person.portrait === 'silhouette') portrait = el('span', { className: 'journal-person-portrait is-silhouette', attrs: { 'aria-hidden': 'true' } }, [el('span', { className: 'journal-silhouette' })]);
    else {
      const canvas = el('canvas', { className: 'journal-person-portrait', attrs: { width: '64', height: '64', 'aria-hidden': 'true' } });
      drawPortrait?.(canvas, person.portrait);
      portrait = canvas;
    }
    return el('li', { className: person.met ? 'journal-person' : 'journal-person is-unknown' }, [
      portrait,
      el('div', { className: 'journal-person-text' }, [
        el('strong', { text: person.name }),
        person.role ? el('span', { className: 'journal-person-role', text: person.role }) : null,
        el('span', { className: 'journal-person-line', text: person.line }),
      ]),
    ]);
  })));
}

/** A new state with `id` marked as met (the same state if nothing changes). */
export function meet(state, id) {
  if (!PERSON_IDS.includes(id) || metIds(state).includes(id)) return state;
  return { ...state, met: [...metIds(state), id] };
}
