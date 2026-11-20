"""Die sichtbare Oberfläche: Daten abrufen, Regeln anwenden, Ergebnis speichern."""

import json
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

import streamlit as st

from game import CANDIDATE_IDS, FREE_CLUE, PAID_CLUES, buy_clue, guess
from storage import load_attempt, reset_attempt, save_attempt


@st.cache_data(ttl=24 * 60 * 60)
def artwork(object_id: int) -> dict:
    """Ein kuratiertes Werk von der offiziellen Met Collection API holen."""
    url = f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}"
    with urlopen(url, timeout=10) as response:
        data = json.load(response)
    if not data.get("isPublicDomain") or not data.get("primaryImageSmall"):
        raise ValueError(f"Met-Werk {object_id} hat kein verwendbares öffentliches Bild.")
    return data


st.set_page_config(page_title="Museum Mystery", page_icon="🖼️", layout="wide")
st.title("🖼️ Museum Mystery")
st.caption("Fall 1 · Das verschwundene Landschaftsbild · lokale Demo")
st.write("Untersuche sechs echte Kunstwerke. Du hast zwei Rateversuche. "
         "Jeder gekaufte Hinweis kostet 15 Punkte; ein erster Fehlversuch kostet 25 Punkte.")

try:
    works = {object_id: artwork(object_id) for object_id in CANDIDATE_IDS}
except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
    st.error("Die Kunstwerke konnten gerade nicht von der Met Collection API geladen werden. "
             "Bitte Verbindung prüfen und die Seite erneut öffnen.")
    st.caption(f"Technischer Hinweis: {error}")
    st.stop()

attempt = load_attempt()
st.metric("Punkte", attempt.score)
st.info(f"Kostenloser Hinweis: {FREE_CLUE}")

for clue in PAID_CLUES[:attempt.clues_bought]:
    st.write(f"🔎 {clue}")
if attempt.outcome == "playing" and attempt.clues_bought < len(PAID_CLUES):
    if st.button("Weiteren Hinweis kaufen (−15 Punkte)"):
        save_attempt(buy_clue(attempt))
        st.rerun()

st.subheader("Die sechs Verdächtigen")
columns = st.columns(3)
for index, object_id in enumerate(CANDIDATE_IDS):
    work = works[object_id]
    with columns[index % 3]:
        st.image(work["primaryImageSmall"], width="stretch")
        st.markdown(f"**{work['title']}**")
        st.caption(f"{work['artistDisplayName']} · {work['objectDate']} · {work['medium']}")
        st.link_button("Werk im Met ansehen", work["objectURL"])
        if attempt.wrong_guess == object_id:
            st.warning("Ausgeschlossen")

if attempt.outcome == "playing":
    available = [object_id for object_id in CANDIDATE_IDS
                 if object_id != attempt.wrong_guess]
    selected = st.selectbox("Welches Kunstwerk ist gesucht?", available,
                            format_func=lambda object_id: works[object_id]["title"])
    if st.button("Tipp abgeben", type="primary"):
        save_attempt(guess(attempt, selected))
        st.rerun()
elif attempt.outcome == "won":
    st.success(f"Richtig! Der Fall ist gelöst. Endstand: {attempt.score} Punkte.")
else:
    st.error("Zweiter Fehlversuch: Der Fall ist beendet.")

if attempt.outcome != "playing":
    st.write("Gesucht war **Wheat Field with Cypresses** von Vincent van Gogh (1889). "
             "Die kostenlose Spur beschreibt eine Landschaft; die bezahlten Spuren "
             "grenzen Entstehungszeit und Künstler weiter ein.")
    if st.button("Neuen Übungsversuch starten"):
        reset_attempt()
        st.rerun()

st.divider()
st.caption("Bilder und Werkdaten: The Metropolitan Museum of Art, Open Access. "
           "Dieser erste Prototyp speichert einen gemeinsamen lokalen Demo-Spielstand, "
           "noch keine getrennten Benutzerkonten.")
