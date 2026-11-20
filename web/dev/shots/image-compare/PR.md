# README, journal hint, docs in English, lighter images

## Changes (one commit per point)
1. **README:** three endings (Steal, Quit, Case lost after three wrong names), a new **Known limits** section, an updated project structure (`local-runs.js`, `wall-plaque.js`, `legacy/`; no deleted files) and checked links. The code word is not named.
2. **Journal before the mission:** shows “The pages are still blank. The night has not begun.” in the existing journal style. It disappears once M’s message is read. Test added for both journal layouts.
3. **Docs and specs in English:** all German files in `docs/` and `specs/` translated (content unchanged; tables, code and commands kept). One German comment in `web/legacy/prototype-engine.test.js` translated. `legacy/` untouched. Renamed with `git mv`:
   - `docs/arbeitsprotokoll.md` → `docs/work-log.md`
   - `docs/spielkonzept-kurz.md` → `docs/game-concept.md`
   - `docs/story/arbeitsprotokoll-florian-b.md` → `docs/story/work-log-florian-b.md`

   All links were updated. The German-word grep finds only one error message string in `web/legacy/prototype-engine.test.js` (code, not a comment, so left unchanged).
4. **Images:** Nothing was scaled below 2× its largest display size at 1440×900 (canvas backing store 1792×1152, journal book 850×567, Station 4 461×368). The only resize is the Station 4 pair, from 1600×1276 to 1200×957 (exactly ¾, same aspect ratio). Both forgery images use the same size, format and quality, and all five differences were clicked one by one in the game and each registered.

| File | Before | After | Format | PSNR | Size |
|---|---|---|---|---|---|
| `investigation-journal-page.png` → `.webp` | 2705 KB | 567 KB | WebP q98 | 42.2 dB | 1024×1536 |
| `investigation-journal-book.png` → `.webp` | 2504 KB | 547 KB | WebP q100 | 38.7 dB | 1536×1024 |
| `security-office.png` → `.webp` | 2042 KB | 534 KB | WebP q100 | 37.9 dB | 1536×1024 |
| `home-screen-reference.jpg` → `.webp` | 701 KB | 211 KB | WebP q94 | 42.4 dB | 1376×768 |
| `login-screen-reference.jpg` → `.webp` | 622 KB | 139 KB | WebP q92 | 42.2 dB | 1376×768 |
| `great-hall-nyc.jpg` → `.webp` | 596 KB | 442 KB | WebP q94 | 42.3 dB | 1672×941 |
| `login-form-reference.jpg` → `.webp` | 565 KB | 106 KB | WebP q90 | 42.2 dB | 1376×768 |
| `signup-screen-reference.jpg` → `.webp` | 554 KB | 101 KB | WebP q90 | 42.4 dB | 1376×768 |
| `gallery-nocturne-nyc.jpg` | 642 KB | 492 KB | JPEG q88 4:4:4 | 39.1 dB | 1536×1024 |
| `great-hall-security-door.jpg` | 609 KB | 470 KB | JPEG q88 4:4:4 | 40.7 dB | 1672×941 |
| `gallery-vault-open.jpg` | 588 KB | 474 KB | JPEG q88 4:4:4 | 39.6 dB | 1536×1024 |
| `vault-door-closeup.jpg` | 576 KB | 412 KB | JPEG q88 4:4:4 | 39.5 dB | 1086×1448 |
| `treasure-vault.jpg` | 562 KB | 458 KB | JPEG q88 4:4:4 | 39.3 dB | 1536×1024 |
| `security-office-hall-exit.jpg` | 483 KB | 380 KB | JPEG q88 4:4:4 | 41.6 dB | 1536×1024 |
| `DT1946_original.jpg` | 892 KB | 566 KB | JPEG q90 4:4:4 | 36.2 dB* | 1600×1276 → 1200×957 |
| `DT1946_v2_forgery.jpg` | 881 KB | 554 KB | JPEG q90 4:4:4 | 36.5 dB* | 1600×1276 → 1200×957 |

\* PSNR against the resized original; on screen the painting is shown at 461×368.

- **`web/assets` total:** 17,073 KB → 8,007 KB.
- **First load** (entry → guest → home → game, cache off, 1440×900): 5,741 KB → 4,004 KB.
- Ending backgrounds and small Met images were left as they are; WebP would have made them larger.
- `security-office.webp` is not loaded by the game (`story/security-office/security-office.js` looks in its own folder); it was converted so the file stays in the repo at a quarter of the size.
- Cache versions raised: `style.css?v=webp-1`, `main.js?v=webp-1`.

**Pixel comparison:** 19 views (entry, login, sign-up, home, journal, hall, gallery closed/open, vault room, security room, stations 1–4, Station 4 game, safe, three endings), each before and after at 1440×900 and 390×844. A fixed random seed, a frozen clock and reduced motion keep the runs repeatable. Two unchanged runs differ by at most a mean of 0.21 (baseline). After the change, every view differs by a mean of at most 1.07 of 255. The share of pixels that differ by more than 16 levels is 0.12 % or less, all in the Station 4 painting (rescaling); the 0.10 % in one 390 ending is run noise, since the ending images did not change. Contact sheets, the full table and a side-by-side crop of Station 4 are in `web/dev/shots/image-compare/`.

## Checks
- `cd web && node --test`: 316 passed. `node --test server/leaderboard/worker.test.js`: 4 passed.
- Headless Chrome: opened all four stations, opened the safe with the code word, did the accusation, played the Quit ending. No 404 or import errors from the game; the only 404 is `favicon.ico` on the test helper page.
- Screenshots: `web/dev/shots/journal-blank/` (journal hint at 1440×900 and 390×844) and `web/dev/shots/image-compare/`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
