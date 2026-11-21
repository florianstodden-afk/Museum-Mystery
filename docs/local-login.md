# Local profiles: sign-in and game start

**Historical implementation.** The current entry screen offers GitHub sign-in or guest play; the local username/password forms are no longer in the game. Existing local account data remains in the browser but is not automatically transferred. See [GitHub sign-in and shared saves](leaderboard.md).

**Status: 19.11.2026, branch `codex/local-login-screens`.** This text describes the change for the pull request. On the published site it applies only after the merge and publication by GitHub Pages.

## Flow for players

1. On opening, the **Log In** / **Sign Up** choice appears on the existing artwork.
2. **Sign Up** shows Florian’s new Sign Up image with real input fields for username and password. The username has 3 to 24 letters, digits, `_` or `-`. The password has 8 to 128 characters. **SUBMIT** creates a profile in this browser and opens the home screen.
3. **Log In** shows the separate Log In artwork. **SUBMIT** checks the data stored on this device and opens the home screen. A wrong password keeps the player on the form.
4. On the home screen, **Start New Game** starts the case with M’s message; **Resume Game** continues an existing save of this profile. **Settings → Switch profile** leads back to the sign-in.
5. **Continue as guest** is still possible. Guests use the existing shared local guest save.

## Where the data lives and what is not possible

The profiles live in this browser’s `localStorage`. Before saving, the password is turned into a check value with PBKDF2/SHA-256 and a random salt; the plain text is not stored. The active profile choice lives in `sessionStorage`. Each username gets its own local save, its own position and its own best run. Sound and music settings apply to the browser.

This is **only a local game profile feature, not an online login**. It offers no accounts across several devices, no central password reset and no shared multiplayer save. Deleting browser data or using another device removes or hides the local profiles and saves. **Forgot Password?** explains in the game that automatic recovery is not possible. Users should not reuse an important password.

GitHub Pages serves static files. The site cannot write new registrations directly into the GitHub repository. So no credentials were committed to GitHub. An account that works across devices or a real shared leaderboard needs a service with a database and server-side sign-in later.

## Implementation

| File | Purpose |
| --- | --- |
| `web/assets/login-form-reference.jpg`, `web/assets/signup-screen-reference.jpg` | Artwork provided by Florian Stodden for the two forms. |
| `web/index.html`, `web/style.css` | Form fields and buttons on top of the images; on small screens a readable, usable form card. |
| `web/local-auth.js` | Creates and checks local accounts, stores password check values, builds storage keys per profile. |
| `web/main.js` | Choice → form → home screen → game, profile switch and separate saves. |
| `web/local-auth.test.js` | Checks registration, sign-in, wrong data and separate profile keys. |

## Checks before the pull request

- In a local browser: Sign Up → home screen, profile switch → Log In, wrong password, correct password → home screen.
- Both provided form graphics checked visually at desktop size.
- `cd web && node --test`, `node --check web/main.js` and `git diff --check` checked; the final number of tests is in the pull request.
