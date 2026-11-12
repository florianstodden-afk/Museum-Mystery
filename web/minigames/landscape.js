// Station B: the museum label is fictional; catalogue facts come from the Met.
export const LANDSCAPE_WORKS = [
  { id: 436535, title: 'Wheat Field with Cypresses', artist: 'Vincent van Gogh', date: '1889', medium: 'Oil on canvas' },
  { id: 459193, title: 'Road in Etten', artist: 'Vincent van Gogh', date: '1881', medium: 'Chalk, pastel and watercolor' },
];

export function initialLandscape() { return { mistakes: 0, hints: 0, solved: false }; }
export function stationScore(state) { return state.solved ? Math.max(5, 20 - state.mistakes * 3 - state.hints * 5) : 0; }
export function answer(state, year, medium) {
  if (state.solved) return state;
  if (year === '1889' && medium === 'oil') return { ...state, solved: true };
  return { ...state, mistakes: state.mistakes + 1 };
}
export function hint(state) {
  return state.solved || state.hints >= 1 ? state : { ...state, hints: state.hints + 1 };
}

// The host owns saving and decides what to do after the station is solved.
export function start(container, caseData, onSolved) {
  let state = caseData.state || initialLandscape();
  const save = () => caseData.onChange(state);
  container.replaceChildren();
  const intro = document.createElement('p');
  intro.textContent = 'Die fiktive Wandtafel behauptet: „1881, Aquarell“. Vergleiche die Met-Katalogdaten und korrigiere sie.';
  container.append(intro);
  const works = document.createElement('div'); works.className = 'station-works'; container.append(works);
  for (const work of LANDSCAPE_WORKS) {
    const card = document.createElement('div');
    const heading = document.createElement('strong'); heading.textContent = `${work.artist}: ${work.title}`;
    const facts = document.createElement('p'); facts.textContent = `${work.date} · ${work.medium}`;
    const link = document.createElement('a'); link.href = `https://www.metmuseum.org/art/collection/search/${work.id}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Met-Katalogeintrag';
    card.append(heading, facts, link); works.append(card);
    fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${work.id}`)
      .then(response => { if (!response.ok) throw new Error('API'); return response.json(); })
      .then(data => { if (data.isPublicDomain && data.primaryImageSmall) { const img = document.createElement('img'); img.src = data.primaryImageSmall; img.alt = work.title; card.prepend(img); } })
      .catch(() => {});
  }
  const form = document.createElement('form');
  form.innerHTML = '<label>Entstehungsjahr <select name="year"><option value="">Bitte wählen</option><option>1881</option><option>1889</option></select></label> <label>Material <select name="medium"><option value="">Bitte wählen</option><option value="watercolor">Aquarell</option><option value="oil">Öl auf Leinwand</option></select></label> <button type="submit">Tafel prüfen</button> <button type="button" data-hint>Hinweis (−5 Punkte)</button><p aria-live="polite"></p>';
  container.append(form); const feedback = form.querySelector('p');
  const render = () => { feedback.textContent = state.solved ? `Gelöst: B. Voss gab die falsche Tafel frei. ${stationScore(state)} Punkte.` : `Fehlversuche: ${state.mistakes} · Hinweise: ${state.hints}.`; form.querySelector('button[type=submit]').disabled = state.solved; form.querySelector('[data-hint]').disabled = state.solved || state.hints >= 1; };
  form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form); if (!data.get('year') || !data.get('medium')) { feedback.textContent = 'Bitte beide Angaben auswählen.'; return; } state = answer(state, data.get('year'), data.get('medium')); save(); render(); if (state.solved) onSolved({ letter: 'B', evidence: 'Voss gab die falsche Wandtafel frei.', points: stationScore(state) }); else feedback.textContent = 'Das stimmt noch nicht. Prüfe Jahr und Material erneut. −3 Punkte.'; });
  form.querySelector('[data-hint]').addEventListener('click', () => { state = hint(state); save(); render(); feedback.textContent = 'Hinweis: Vergleiche das Jahr und Material von Wheat Field with Cypresses.'; });
  render();
}
