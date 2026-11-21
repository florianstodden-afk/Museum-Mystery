# Story check “Museum Nocturne” (12.11.2026)

All texts in `web/story/` were proofread (mission, stations, notes, dialogues, feedback, endings). Question: is the story consistent, and can a player **work out** the solution?

## Does all evidence point logically to Voss?

| Letter | Evidence | Points to Voss because … | Enough on its own? |
|---|---|---|---|
| B | The false wall label was approved by a patron – not by museum staff. | rules out the staff (Leon, Vale); points to a patron. | No, needs the suspect list (only Voss is a patron). |
| I | Night-shift log: Leon was elsewhere; the transport was booked as a patron visit. | clears Leon; “patron visit” leads to the patron (Voss). | No, needs the knowledge “Voss = patron” (listed with the suspects). |
| L | Hidden mark “V” on the fake transport slip. | “V” fits **V**oss – but also **V**ale. A deliberate false trail. | No. |
| D | Frame label: “Ordered by: A. V.” | resolves the “V”: Vale’s initials are M. V. | Only together with B or I (patron) and the suspect list. |

*Update 21.11.2026:* B and D no longer name Voss, so the final question stays a puzzle. The solution is still unique: Adrien Voss is the only patron with the initials A. V. A test (`web/story/tests/no-spoiler.test.js`) checks that no text before the accusation names Voss.

**Result:** The chain is consistent. Only all four together rule out Leon (I) and Vale (D explains L). This fits the concept “four stations, one result”.

## Is Leon clearly cleared?

Yes, in three places:
1. Note **Monitor wall** (security office): Leon saw the cart, but not its contents – he reports himself what he saw.
2. Evidence **I** (night-shift log): he was elsewhere; the transport was booked as a “patron visit”.
3. Feedback after a wrong accusation: “The night-shift log shows Leon was on his round elsewhere …”.
After that his dialogue changes too (“The log proves it …”, after the solution: “Thank you for checking the log before you checked me.”).

## Gaps found and what was changed

| Gap | Change |
|---|---|
| **Who is “M”?** After the right answer the game only said “M was Voss”, without a reason. “M” even looks like **M**ara Vale. | After the right answer: “M” stands for *mécène* (old word for patron). Dr. Vale says so in her dialogue too (“Everyone here thinks it means Mara.”). The mix-up is thus a deliberate second false trail that gets resolved. |
| **Why does Voss lure the player character to the safe?** Was not explained. | After the right answer and in Vale’s dialogue: Voss could not open Vale’s safe himself and needed someone who follows her clues. |
| **The chain of evidence gave the solution away** after a wrong answer (every line mentions Voss). | The chain of evidence appears only after the right answer (M4, with a test). |
| Suspect text for Voss: “Signs his messages with a single letter.” | Stays on purpose as a fair hint for attentive players (the mission is signed with “M”). |

## Open points for the team

- **Stations 2–4:** The puzzles must really *show* the evidence, not just display it at the end (e.g. Portrait Hall: read the log and find Leon’s position; archive: find the frame with the right size and read the label). Otherwise the chain of evidence feels handed out.
- **When was the original swapped?** The texts say: Vale locked the original away “the night the false label went up”. The concept should decide whether the forgery hung on the wall before that (Voss’s plan) – the current text hints at this and is free of contradictions.
- **Ending A** is dark on purpose and not a game over. The score is the same for both endings (concept: 0 extra points).
- All characters and the museum are fictional; the note is in the closing screen and the footer of the preview.
