# Guest entry before the home screen

**Historical status from 17.11.2026.** For the local profile access added later, see [Local profiles: sign-in and game start](local-login.md). The following notes document the implementation at that time and no longer describe the current sign-in screen.

**Status: 17.11.2026, branch `codex/guest-entry-flow`.** This is the prepared flow for the next pull request. Until the merge, the public game still starts directly on the home screen.

## Flow for players

1. On opening, Florian’s artwork appears with the drawn buttons **Log In** and **Sign Up**. The real click area sits exactly on top; on small screens the buttons are also shown as readable text.
2. Each button opens its own intermediate view with a matching heading. It says clearly that accounts are not available yet. **Continue as guest** continues without a username or password. **Back** returns to the choice.
3. The existing home screen appears. **Start New Game** opens the museum and shows M’s mission message. For a case already started, **Resume Game** is possible.
4. In the game, **Home** leads back to the home screen. When the page is loaded again, the entry page appears again.

**No sign-in takes place.** Saves stay, as before, only in the browser of this device. All guests on the same browser share the same local save. The Scoreboard button shows no shared online comparison.

## What happens in the code

| File | Purpose |
| --- | --- |
| `web/assets/login-screen-reference.jpg` | Artwork provided by Florian for the first screen. |
| `web/index.html` | Entry page, two intermediate views and the existing home screen. The home screen cannot be used until **Continue as guest**. |
| `web/style.css` | Click areas on top of the drawn buttons, intermediate view and mobile layout. |
| `web/main.js` | Connects the clicks: choice → intermediate view → home screen. The game and M’s message still start only from the home screen. |

**No** Clerk, GitHub or other sign-in service was built in. A later sign-in can be connected in place of **Continue as guest**; the team needs a deliberate technical decision for that again.

## Checks

- `node --test` in the `web` folder: 217 passed, 0 failed.
- `node --check main.js` and `git diff --check`: no errors.
- Local browser run: **Log In → Continue as guest → Home → Start New Game → “A message from M”**. **Sign Up** and **Back** also checked.
- The first view and the Sign Up intermediate view were compared with Florian’s artwork in the browser. A test of the finished GitHub Pages version follows after the merge.
