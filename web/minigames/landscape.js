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
  intro.textContent = 'The fictional wall label claims “1881, watercolor.” Compare the Met catalogue data and correct it.';
  container.append(intro);
  const works = document.createElement('div'); works.className = 'station-works'; container.append(works);
  for (const work of LANDSCAPE_WORKS) {
    const card = document.createElement('div');
    const heading = document.createElement('strong'); heading.textContent = `${work.artist}: ${work.title}`;
    const facts = document.createElement('p'); facts.textContent = `${work.date} · ${work.medium}`;
    const link = document.createElement('a'); link.href = `https://www.metmuseum.org/art/collection/search/${work.id}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'View in the Met catalogue';
    card.append(heading, facts, link); works.append(card);
    fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${work.id}`)
      .then(response => { if (!response.ok) throw new Error('API'); return response.json(); })
      .then(data => { if (data.isPublicDomain && data.primaryImageSmall) { const img = document.createElement('img'); img.src = data.primaryImageSmall; img.alt = work.title; card.prepend(img); } })
      .catch(() => {});
  }
  const form = document.createElement('form');
  form.innerHTML = '<label>Year created <select name="year"><option value="">Choose an option</option><option>1881</option><option>1889</option></select></label> <label>Material <select name="medium"><option value="">Choose an option</option><option value="watercolor">Watercolor</option><option value="oil">Oil on canvas</option></select></label> <button type="submit">Check label</button> <button type="button" data-hint>Hint (−5 points)</button><p aria-live="polite"></p>';
  container.append(form); const feedback = form.querySelector('p');
  const render = () => { feedback.textContent = state.solved ? `Solved: B. Voss approved the false label. ${stationScore(state)} points.` : `Incorrect attempts: ${state.mistakes} · Hints: ${state.hints}.`; form.querySelector('button[type=submit]').disabled = state.solved; form.querySelector('[data-hint]').disabled = state.solved || state.hints >= 1; };
  form.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(form); if (!data.get('year') || !data.get('medium')) { feedback.textContent = 'Please choose both answers.'; return; } state = answer(state, data.get('year'), data.get('medium')); save(); render(); if (state.solved) onSolved({ letter: 'B', evidence: 'Voss approved the false wall label.', points: stationScore(state) }); else feedback.textContent = 'Not quite. Check the year and medium again. −3 points.'; });
  form.querySelector('[data-hint]').addEventListener('click', () => { state = hint(state); save(); render(); feedback.textContent = 'Hint: Compare the year and medium of Wheat Field with Cypresses.'; });
  render();
}
