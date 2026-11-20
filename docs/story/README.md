# Story logic “Museum Nocturne” (`web/story/`)

**Historical architecture overview from November 2026.** Some tables below name earlier placeholders and point values. For the current state see the [README](../../README.md), [Station 3](curators-catalogue.md) and [Leaderboard](../leaderboard.md). The old details stay as development history.

The game’s story as independent, tested building blocks. They do **not** depend on the map. Since 12.11.2026 they are connected in the main game (`web/main.js` uses `createStoryHost`); how this was done: [integration-plan.md](integration-plan.md).

## Files

**Logic (pure functions, no DOM, no localStorage)**

| File | Content |
|---|---|
| `web/story/case-1.js` | Case data (frozen): mission, four stations, notes, suspects, six Met works. |
| `web/story/engine.js` | Game rules: `newGame`, `readMission`, `solveStation`, `addNote`, `canOpenSafe`, `tryOpenSafe`, `accuse`, `chooseEnding`, `nextStep`, `isComplete`. Every action returns `{ state, ok, message }`. |
| `web/story/scoring.js` | Start at 100, saved deductions and puzzle time tiers: `synchronizeScore`, `scoreBreakdown`, `totalScore`. Old points functions stay for save compatibility. |
| `web/story/save.js` | `serialize` / `deserialize` with checks (broken, old version, impossible states → `null`). |
| `web/story/stations.js` | Adapter `openStation`: connects every station the same way and turns its report into `{ mistakes, hints }`. |
| `web/story/hints.js` | `hintFor(state, level)`: a hint matching the progress (costs no points, concrete after two wrong tries). |
| `web/story/security-office/interactions.js` | Texts and notes of the objects in the security office, `examine(state, id)`. Used by Fabian’s room in the game. |

**Interface (renders into any container)**

| File | Content |
|---|---|
| `web/story/host.js` | `createStoryHost(...)`: connects the story with any page (saving, stations, conversations, safe to closing screen, hints). The main game and the preview use it. |
| `web/story/dom.js` | Small helpers `el()` and `button()`, image URL of the Met works. |
| `web/story/placeholder-station.js` | Placeholder for stations not built yet (currently L and D). |
| `web/story/dialogues.js` | `dialogueFor(characterId, state)` and `renderDialogue`. |
| `web/story/journal.js` | `journalModel`, `renderJournal`, `evidenceChain`. |
| `web/story/safe-ui.js` | Code word input for the safe. |
| `web/story/accusation-ui.js` | Final question with three answers and the chain of evidence. |
| `web/story/endings.js` | Decision and closing screen of both endings with a points breakdown. |
| `web/story/story.css` | Style of all building blocks (only classes with the prefix `story-`). |
| `web/story/security-office/security-office.js` | **Prototype:** draws a security office in code. Not used in the game, only in the preview (see [security-office.md](security-office.md)). |

**Stations (mini-games, in `web/minigames/`)**

| Station | Files | Status |
|---|---|---|
| B · Landscape Gallery | `landscape.js` | done (Fabian) |
| I · Portrait Hall | `portrait-rules.js`, `portrait-artwork.js`, `portrait-timeline.js`, `portrait-timeline.css`, `portrait-timeline.test.js` | done (Florian B.) |
| L · Restoration | Leopold’s branch `feature/renoir-picture-puzzle` | not merged yet |
| D · Frame Archive | – | placeholder |

**Preview pages (for trying things out only)**

| File | Content |
|---|---|
| `web/dev/story.html` + `story-preview.js` + `story-preview.css` | The whole story playable, without the map. |
| `web/dev/security-office.html` + `security-office-preview.js` | Prototype drawing of the security office with sample cameras. |

**Tests:** `web/story/tests/*.test.js` (`fake-dom.js` is a test helper, not a test).

**Docs:** [minigame-contract.md](minigame-contract.md) (contract for stations), [security-office.md](security-office.md) (what of the security office is in the game), [integration-plan.md](integration-plan.md), [story-check.md](story-check.md), [work-log-florian-b.md](work-log-florian-b.md), screenshots in `screenshots/`.

## Start the preview

```bash
python3 -m http.server 8000 --directory web
```

Then open in the browser:
- <http://localhost:8000/dev/story.html> – story preview
- <http://localhost:8000/dev/security-office.html> – security office

**Click through (about 3 minutes):**
1. Read the message from M, “Accept the mission”. Try “💡 Hint” at the top right, then “Tell me more”.
2. Security office: look at the monitor wall and the shift schedule (notes in the journal).
3. “Talk to Leon” – then solve the Portrait Hall – talk to Leon again (he is cleared).
4. Landscape Gallery: the real Station 1. Once wrong (1881 + Oil), then right (1889 + Oil).
5. Solve the picture puzzle L; I and D still use placeholders. The journal shows B‑I‑L‑D in fixed places.
6. Safe: two wrong words (e.g. `SLIO`, `LIOS`), then “💡 Hint” (now names the letters), then `oils`.
7. “Look at the documents”: first choose Leon or Dr. Vale (feedback on which evidence speaks against it), then Adrien Voss.
8. Choose an ending, look at the points, “New game” → confirm, play the second ending.

The preview’s save lives in `localStorage` under `museum-nocturne-story-preview-v1` (separate from the main game).

## Run the tests

```bash
cd web && node --test
```

Runs without a browser. Needs Node.js version 20 or later.
