from game import Attempt
from storage import load_attempt, reset_attempt, save_attempt


def test_saved_attempt_survives_new_connection(tmp_path):
    path = tmp_path / "nested" / "test.db"
    state = Attempt(score=60, clues_bought=1, wrong_guess=437133)
    save_attempt(state, path)
    assert load_attempt(path) == state
    reset_attempt(path)
    assert load_attempt(path) == Attempt()

