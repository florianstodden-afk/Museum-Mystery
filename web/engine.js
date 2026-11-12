export const WIDTH = 28;
export const HEIGHT = 18;
export const START = { x: 3, y: 9 };
export const EVIDENCE = ["ledger", "painting", "note"];

export const OBJECTS = [
  { id: "guard", x: 5, y: 5, label: "Wachmann" },
  { id: "ledger", x: 5, y: 12, label: "Besucherprotokoll" },
  { id: "painting", x: 14, y: 4, label: "Ausgetauschtes Gemälde" },
  { id: "restorer", x: 15, y: 12, label: "Restauratorin" },
  { id: "note", x: 12, y: 13, label: "Restaurierungsnotiz" },
  { id: "vault", x: 23, y: 5, label: "Verstecktes Original" },
];

export function initialState() {
  return { player: { ...START }, clues: [], pass: false, vaultOpen: false,
    ending: null, steps: 0 };
}

export function validState(value) {
  return value && Number.isInteger(value.player?.x) && Number.isInteger(value.player?.y)
    && Array.isArray(value.clues) && value.clues.every(c => EVIDENCE.includes(c))
    && typeof value.pass === "boolean" && typeof value.vaultOpen === "boolean"
    && (value.ending === null || ["restore", "expose"].includes(value.ending))
    && Number.isInteger(value.steps) && value.steps >= 0;
}

export function hasAllEvidence(state) {
  return EVIDENCE.every(id => state.clues.includes(id));
}

export function canEnter(state, x, y) {
  if (x <= 0 || y <= 0 || x >= WIDTH - 1 || y >= HEIGHT - 1) return false;
  if (x === 9 && y !== 9) return false;
  if (x === 18 && y !== 9) return false;
  if (x === 18 && y === 9 && !state.vaultOpen) return false;
  if (OBJECTS.some(object => object.x === x && object.y === y)) return false;
  return true;
}

export function move(state, dx, dy) {
  if (state.ending || Math.abs(dx) + Math.abs(dy) !== 1) return state;
  const x = state.player.x + dx;
  const y = state.player.y + dy;
  if (!canEnter(state, x, y)) return state;
  return { ...state, player: { x, y }, steps: state.steps + 1 };
}

export function nearbyObject(state) {
  return OBJECTS.find(object =>
    Math.abs(object.x - state.player.x) + Math.abs(object.y - state.player.y) === 1
  ) ?? null;
}

export function interact(state, id) {
  const object = OBJECTS.find(item => item.id === id);
  if (!object || Math.abs(object.x - state.player.x) + Math.abs(object.y - state.player.y) !== 1) {
    return { state, text: "Geh näher an das Objekt heran." };
  }
  if (state.ending) return { state, text: "Der Fall ist abgeschlossen. Starte ein neues Spiel." };
  if (EVIDENCE.includes(id)) {
    if (state.clues.includes(id)) return { state, text: "Diesen Beleg hast du schon im Journal." };
    const texts = {
      ledger: "Besucherprotokoll: Ein fremder Kurier wurde um 21:14 am Seiteneingang registriert.",
      painting: "Die Signatur passt, doch der Firnis glänzt ungewöhnlich frisch: Das Bild an der Wand ist eine Fälschung.",
      note: "Restaurierungsnotiz: Das Original wurde vor der Gala heimlich ins Depot gebracht. Warum?",
    };
    return { state: { ...state, clues: [...state.clues, id] }, text: texts[id], artwork: id === "painting" };
  }
  if (id === "guard") {
    if (!state.clues.includes("ledger")) return { state, text: "Wachmann: Finde zuerst das Besucherprotokoll am Empfang. Ohne Beleg kann ich nichts tun." };
    if (state.pass) return { state, text: "Wachmann: Du hast meinen Depotausweis bereits. Such weiter nach Beweisen." };
    return { state: { ...state, pass: true }, text: "Wachmann: 21:14? Das war nach Dienstschluss. Hier ist mein Depotausweis. Finde heraus, was dort liegt." };
  }
  if (id === "restorer") return { state, text: "Restauratorin: Achte auf Firnis und die Notiz bei meinem Arbeitstisch. Das Depot öffnet nur mit Ausweis und drei Belegen." };
  if (id === "vault") {
    if (!state.vaultOpen) return { state, text: "Das Depot ist noch verschlossen." };
    return { state, text: "Im Depot steht das echte Gemälde. Die Museumsleitung verschwieg den Austausch. Was tust du?", choice: true };
  }
  return { state, text: "Hier gibt es nichts zu entdecken." };
}

export function openVault(state, code) {
  if (state.ending || state.player.x !== 17 || state.player.y !== 9
      || !state.pass || !hasAllEvidence(state)) {
    return { state, text: "Depot verschlossen: Du brauchst drei Belege und den Ausweis des Wachmanns." };
  }
  if (code !== "2114") {
    return { state, text: "Der Zahlencode ist falsch. Welche Uhrzeit stand im Besucherprotokoll?" };
  }
  return { state: { ...state, vaultOpen: true }, text: "Der Ausweis klickt. Die Depottür ist offen!" };
}

export function chooseEnding(state, ending) {
  if (!state.vaultOpen || !hasAllEvidence(state) || !["restore", "expose"].includes(ending)
      || Math.abs(state.player.x - 23) + Math.abs(state.player.y - 5) !== 1) {
    return state;
  }
  return { ...state, ending };
}
