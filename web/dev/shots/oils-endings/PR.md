# OILS code word, Case lost ending, local scoreboard, cleanup

## Changes (one commit per point)
1. **Code word OILS** instead of BILD. Station 3 gives O, Station 4 gives S; I and L stay. First safe hint: "Four letters, one word: what every painter in this museum worked with." `CASE_VERSION` 2, so old saves start fresh with the usual notice.
2. **No archive in visible text.** Hint and Leon's line now point to the Gallery frame rack. The internal id `archive` stays.
3. **Journal "Case notes · Who was M?"** appears only after the right accusation.
4. **Case lost.** The third wrong accusation ends the game. The accusation view shows "Attempts left: 3 / 2 / 1". The end screen uses the existing art with a dark overlay and shows points, time and "Lost", plus "Try again" and "Back to menu". Lost runs never become the best run. The safe still has unlimited tries.
5. **Choice text** before Steal/Quit. The Steal ending says you take it for yourself, not for Voss. The Quit ending has Vale return the original.
6. **Local scoreboard.** Up to 10 finished runs (Won/Lost) of all profiles and guests in this browser, sorted by points, then shorter time. Online section, Refresh and Publish stay hidden while `LEADERBOARD_URL` is empty. `leaderboard.js` and `server/leaderboard/` are unchanged.
7. **Python prototype moved** with `git mv` to `legacy/python/` (`app.py`, `game.py`, `storage.py`, `tests/`, `pyproject.toml`, `uv.lock`) plus a short README. No workflow ran Python. The tests still pass there (6/6).
8. **Deleted unused files** (nothing in `web/`, HTML, CSS, tests or `dev/` loaded them):
   - `web/minigames/landscape.js` (old Station B)
   - `web/minigames/landscape.test.js`
   - `web/assets/met-459193.jpg` (only used by landscape.js)
   - `web/assets/met-459193-source.md`

   `story/tests/stations.test.js` used the landscape rules for an adapter test. It now uses an inline fake station with the same progress events and assertions.

## Tests
- `cd web && node --test`: 315 pass. The 3 landscape tests were removed, and new tests cover Case lost, the local scoreboard, "Who was M?" and the choice text.
- `node --test server/leaderboard/worker.test.js`: 4 pass.
- Headless Chrome flows for Win + Steal, Win + Quit and Case lost at 1440×900, 1280×720 and 390×844: no page scroll, and no 404s or import errors from the game. The only 404 was favicon.ico on the test helper page. The game page now declares an empty icon.

## Screenshots (`web/dev/shots/oils-endings/`)
oils-safe-oils, accusation-attempts-left, choice-text, ending-steal, ending-quit, ending-lost, journal-who-was-m, scoreboard-local

🤖 Generated with [Claude Code](https://claude.com/claude-code)
