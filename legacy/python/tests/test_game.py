import pytest

from game import Attempt, CANDIDATE_IDS, PAID_CLUES, TARGET_ID, buy_clue, guess


def test_correct_guess_wins_without_penalty():
    assert guess(Attempt(), TARGET_ID) == Attempt(outcome="won")


def test_clue_cost_and_limit():
    state = Attempt()
    for _ in PAID_CLUES:
        state = buy_clue(state)
    assert state.score == 55
    with pytest.raises(ValueError):
        buy_clue(state)


def test_first_wrong_guess_second_wrong_guess_loses():
    wrong = CANDIDATE_IDS[1]
    state = guess(Attempt(), wrong)
    assert state.score == 75 and state.outcome == "playing"
    with pytest.raises(ValueError):
        guess(state, wrong)
    assert guess(state, CANDIDATE_IDS[2]).outcome == "lost"


def test_correct_second_guess_keeps_first_penalty():
    state = guess(Attempt(), CANDIDATE_IDS[1])
    assert guess(state, TARGET_ID).score == 75


def test_invalid_or_finished_actions_change_nothing():
    state = Attempt()
    with pytest.raises(ValueError):
        guess(state, 999999)
    assert state == Attempt()
    with pytest.raises(ValueError):
        buy_clue(Attempt(outcome="lost"))

