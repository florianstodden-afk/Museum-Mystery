# The two ending screens

**Status: 19.11.2026, branch `codex/ending-screen-art`.** The change applies to the public game only after the pull request is merged and GitHub Pages has published it.

## The way to the end

1. At the start, M asks for the Van Gogh painting *Wheat Field with Cypresses* from the museum.
2. Four stations deliver the letters B–I–L–D. With the code word the player opens the safe.
3. The evidence shows that Voss planned the forgery and the transport. After the right answer the player decides.
4. **Steal the artwork:** The player gives the original to Voss. The forgery stays on the wall. The night-time ending screen shows “I am a thief”.
5. **Quit the mission:** The player returns the original to Dr. Vale. The evidence exposes Voss. The ending screen in morning light shows “I am not a thief”.

The decision, scoring, chain of evidence, saving and the buttons for Home or a new game stay in the existing story logic. A saved finished case reopens its chosen ending when resumed.

## Why the images were changed

Florian Stodden had two closing images made. The sentence “The mystery remains” on the original not-a-thief image contradicted the existing solution: by then Voss has already been exposed. So text-free versions of both images were made. Their museum scenes and ornamental plaques were kept; the title and short consequences that fit the decision now sit on top as real HTML text. This keeps the text readable and accessible to screen readers independently of the image.

The images are in the repository as `web/assets/ending-thief-background.jpg` and `web/assets/ending-not-thief-background.jpg`. They show **no invented Van Gogh motif**. On both ending screens the real Met work appears as a small image card with a source link. The evidence and the exact points are available under **View evidence and score details**.

## Technical places

| File | Purpose |
| --- | --- |
| `web/story/endings.js` | Gives each chosen ending its story and assembles the image card, points and buttons. |
| `web/story/story.css` | Shows the right background for each ending and places the game text on top. |
| `web/index.html` | Loads the new CSS version so GitHub Pages does not show an old style from the browser cache. |
| `web/story/tests/content.test.js` | Checks the reference to Voss and Dr. Vale and the real Met image in the result. |

## Checks

- Both ending screens viewed in a local browser at 1280 × 720; text, Met work, points and buttons were visible.
- The expandable evidence and score view opened and checked in the browser.
- `cd web && node --test`: 276 tests passed. `git diff --check`: no errors.
- A real phone view and a complete playthrough should still be checked after the merge.
