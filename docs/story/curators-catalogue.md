# Curator’s Catalogue — Station B

Built on GitHub `main` at `ca00e840019675144b826fbe9739820f2255d209` (checked 2026-11-19). The separate `curators-catalogue-main` checkout keeps the original working tree intact. No commit or push is needed to try it.

Station B remains the middle Gallery painting at map position `(14, 3)`, approached from `(14, 4)` with **E**. Its sign says **3 · CATALOGUE** (players see station numbers, the letter only after solving). Both `main.js` and `dev/story-preview.js` register `curators-catalogue.js` under the existing `landscape` save ID. Its letter is still **B**; its evidence ID remains `false-label` and its clue remains **“Voss approved the false wall label.”** Matching the catalogue exposes the approval record.

## Play

Four artworks stay in a 2 × 2 grid. Four shuffled labels list the exact Met `artistDisplayName`, `culture` and `medium`. On wide screens the tray is beside the artworks; below 651px it moves below them. Narrow dialogs scroll vertically. Long titles are visually shortened to fit; full Met titles remain in the accessible artwork names, image descriptions and expandable credits.

- A puzzle-style animated pointer demonstrates the direction from tray to artworks, with both endpoints between fields to avoid suggesting a particular answer. It disappears after the first interaction.
- Drag a label into the dedicated slot below an artwork, or click/tap the label and then its destination. The artwork image itself is not selectable.
- Tab between native buttons; Enter or Space selects and places a label. Selection and keyboard focus are visible.
- Correct matches glow and lock in place. Select an incorrectly placed label to move it. Moving onto another placed label swaps the two. Replacing a placed label from the tray sends the displaced label back to the tray.
- Select an incorrectly placed label and an empty tray space, or drag it into that space. The four tray spaces stay available, just like Station L; labels can also move between tray spaces. Keyboard focus follows the returned label.
- All four matches must be correct to finish. Wrong matches carry no extra point penalty.

The opening screen, help, keyboard badges, time bar and reward popup use Station L’s visual rules and `puzzle-ui.js` helpers. Start is offered only after all four images have loaded and decoded. A missing bundled image falls back to its checked Met source. If either source fails for any artwork, the game shows Retry and cannot start.

## Clock, scores and compatibility

The saved `startedAt` clock begins on **Start**. Like Station L, time spent outside the minigame or reading help counts. The final correct match records `finishedAt`; rewards do not decay after completion.

| Completion time | Points |
| --- | ---: |
| ≤ 30,000 ms | 15 |
| 30,001–45,000 ms | 10 |
| 45,001–60,000 ms | 5 |
| > 60,000 ms | 0 |

Every change saves the shuffled order, placements, start time and finish time. `validCatalogue` validates the version, artwork identity, label uniqueness and clock consistency. The adapter, station and story engine guard duplicate completion. The host recovers a saved final placement if a reload interrupted the award.

Existing completed wall-label saves keep their points, letter and clue and show Already solved. Old unfinished mistake/hint counts survive the conversion, without reducing the new time-based award. Other stations and profile storage keys remain unchanged. New runs have an 80-point maximum; old wall-label/frame-rack awards and best runs on the 85/90-point scales remain supported.

## Met artworks and credits

All four object records were fetched from the Met Collection API on 2026-11-19. Each has `isPublicDomain: true`, nonempty required fields and a working `primaryImageSmall`. Each JPEG was downloaded and visually inspected. None of these IDs appeared in the previous game, including the actual Station D image (437998). The exact API snapshots and unmodified web-size JPEGs are bundled in `web/assets/catalogue/`; gameplay does not depend on live API responses.

| Met work | Artist (`artistDisplayName`) | Culture | Medium |
| --- | --- | --- | --- |
| [Under the Wave off Kanagawa (The Great Wave), 45434](https://www.metmuseum.org/art/collection/search/45434) | Katsushika Hokusai | Japan | Woodblock print; ink and color on paper |
| [Vase, 9485](https://www.metmuseum.org/art/collection/search/9485) | Louis C. Tiffany | American | Favrile glass |
| [Armor Garniture of George Clifford, Third Earl of Cumberland, 23939](https://www.metmuseum.org/art/collection/search/23939) | Jacob Halder | British, Greenwich | Steel, gold, leather, textile |
| [Bassoon, 503615](https://www.metmuseum.org/art/collection/search/503615) | Giosue Esposito | Italian | Maple, nickel-silver |

The Metropolitan Museum of Art, Open Access, public domain. Collection credit lines:

- 45434: H. O. Havemeyer Collection, Bequest of Mrs. H. O. Havemeyer, 1929.
- 9485: Gift of H. O. Havemeyer, 1896.
- 23939: Munsey Fund, 1932.
- 503615: Purchase, Clara Mertens Bequest, in memory of André Mertens, 2003.

The in-game expandable credits include the full titles, artists, dates, collection credits and a separate Met object link for every artwork.

## Validation

The untouched main baseline passed 276 JavaScript tests. The catalogue adds 18 focused tests covering matching, swaps, returns, malformed saves, exact scoring boundaries, frozen rewards, loading failures/retry, cleanup, keyboard focus, host persistence, interrupted completion recovery, duplicate awards and legacy saves. Existing score assertions were updated for the new 80-point maximum. Final result: **297 JavaScript tests passed; 123 real-browser checks passed**, with no uncaught browser errors in the four successful playthroughs. `git diff --check` passed.

Run the full JavaScript suite from the checkout:

```sh
cd web
node --test
```

The real-browser script uses isolated browser storage, plays main and story preview at 1280 × 720 and 390 × 844, and saves screenshots in `docs/screenshots/station-b-*.png`. It covers mouse drag, click and touch placement, swaps, return to tray, Tab/Enter/Space completion, help, close/reopen, exact saved reward, duplicate completion, offline images and failed-image retry. Main-game tests open Station B with **E** from its existing approach position.

```sh
python3 -m http.server 8000 --directory web
# With Playwright installed, in another terminal:
node web/dev/e2e-station-b.mjs
```

Optional environment variables: `STATION_URL` for the server URL, `PLAYWRIGHT_MODULE` for an existing Playwright module path, and `CHROME_PATH` for an installed Chromium/Chrome binary.
