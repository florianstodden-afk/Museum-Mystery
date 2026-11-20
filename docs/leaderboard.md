# Shared leaderboard · 20.11.2026

**Current status:** Scoreboard is local to this browser; an online version is prepared in `server/leaderboard` but not deployed. As long as `LEADERBOARD_URL` in `web/leaderboard-config.js` is empty, the board shows only the local list (up to 10 finished runs of all profiles and guests in this browser, sorted by points, then by shorter time, status Won/Lost). The online sections, **Refresh** and **Publish finished run** stay hidden. The text below describes the online version for later.

## What the player sees

On the home screen, **Scoreboard** opens a semi-transparent museum board. At the top is the player’s own current run; below it appear up to 25 published results from all devices. The font for headings and buttons is the same Fraunces font as in the existing menus. The home screen background stays visible.

A result is **not sent automatically**: only after an ending does **Publish finished run** appear. The player then decides whether their name, score and ending appear publicly on the board. Passwords, saves, notes, art answers and movement data are not sent. **Refresh** loads the list again. If the service is missing or down, the local scoreboard stays usable and shows a clear message.

## Rules

- The four stations give at most 60 points together, the safe and the final question 10 each: **80 points**.
- The server accepts only finished results on the current 80-point scale. Old saves with 85/90 possible points stay visible locally but are not mixed into the shared list.
- For each browser profile the game creates a permanent random ID. The server keeps the **highest score** per ID. Equal scores share the same place. Time is not a sorting criterion, so solving known puzzles again gives no direct ranking advantage.
- A local profile name is used as the display name; guests appear as `Guest-…`. These names are **not verified** until a later login connection.
- **Limits:** Names are not verified, and a result can be faked through the public interface. The Worker still checks the format and the points cap and rejects everything else.

## Where it happens

| File | Purpose |
| --- | --- |
| `web/index.html`, `web/story/story.css` | Board, buttons, transparent look and journal sources |
| `web/main.js`, `web/leaderboard.js` | Loading, showing, voluntary publishing and local player ID |
| `web/leaderboard-config.js` | Public URL of the online service after deployment |
| `server/leaderboard/worker.js` | Public read and write interface, input checks, ranking |
| `server/leaderboard/migrations/0001_leaderboard.sql` | Database table, one best score per player ID |
| `server/leaderboard/wrangler.jsonc` | Cloudflare Worker configuration |

GitHub Pages cannot store shared results itself. So the database lives in Cloudflare D1 and is accessed through a Worker. **The Worker is online only after someone with a Cloudflare account has carried out the following steps.** Until then the board reports that it is not connected yet. A Cloudflare URL or database ID is not a password; secret credentials never belong in `web/` or in the repository.

## One-time deployment

The steps are run in the `server/leaderboard` folder. Node.js and a Cloudflare account are needed.

1. `npx wrangler login` opens the Cloudflare sign-in.
2. `npx wrangler d1 create museum-mystery-leaderboard` creates the database and shows its `database_id`. Put this ID into `wrangler.jsonc` instead of `REPLACE_WITH_D1_DATABASE_ID`.
3. `npx wrangler d1 migrations apply museum-mystery-leaderboard --remote` creates the table.
4. `npx wrangler deploy` publishes the Worker and shows an `https://…workers.dev` URL.
5. Put this URL as `LEADERBOARD_URL` into `web/leaderboard-config.js` and bring the change into `main` through a pull request. GitHub Pages then loads the connected version.
6. Open the site on two devices. On device A finish a current run and publish it; on device B choose **Scoreboard → Refresh**. The result must appear there.

The Worker currently allows the GitHub Pages address and local development on port 8000. If another game address is used, add it to `ALLOWED_ORIGINS` in `wrangler.jsonc` and deploy again. The origin list prevents accidental calls from other websites; it does **not replace a sign-in**.

## Later login connection

The current local password does not prove to the Worker who sends a request. Before the login connection, anyone who knows the public interface could fake a name or score. The board is therefore usable for the game group, but not yet a tamper-proof competition ranking. For the later connection the Worker must require a sign-in that the server can check, and derive the player ID from the checked identity instead of taking `playerId` and `name` from the request. Only then are names unique. Even a signed login alone does not prove that the score was earned honestly; if that becomes important, the server would also have to check game events or a plausible proof of the result.

## Checks

`cd web && node --test` checks the game modules. `node --test server/leaderboard/worker.test.js` checks the Worker’s rules and responses without a Cloudflare account. The real exchange across two devices can only be checked after step 5.

Technical basis: [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) and [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).
