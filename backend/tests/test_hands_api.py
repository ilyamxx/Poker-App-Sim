import pytest
import copy
from fastapi.testclient import TestClient
from src.main import app
from src.core.dependencies import get_poker_service, get_hand_repository

# --- Test Data & Factory ---

VALID_HAND_PAYLOAD = {
    "players": [
        {"id": "p1", "name": "P1", "starting_stack": 1000, "cards": ["As", "Ks"], "position": "dealer"},
        {"id": "p2", "name": "P2", "starting_stack": 1000, "cards": ["Qh", "Qd"], "position": "smallblind"},
        {"id": "p3", "name": "P3", "starting_stack": 1000, "cards": ["Jc", "Tc"], "position": "bigblind"},
        {"id": "p4", "name": "P4", "starting_stack": 1000, "cards": ["9s", "8s"], "position": "utg"},
        {"id": "p5", "name": "P5", "starting_stack": 1000, "cards": ["7h", "6h"], "position": "hijack"},
        {"id": "p6", "name": "P6", "starting_stack": 1000, "cards": ["5d", "4d"], "position": "cutoff"},
    ],
    "actions": ["r120", "f", "f", "c", "f", "c", "8s7s6s", "x", "b100", "c", "c", "5h", "x", "x", "x", "4d", "x", "x", "x"],
    "config": {"sb": 20, "bb": 40, "ante": 0}
}

def make_payload(**overrides):
    """Factory to create a deep copy of the payload and apply overrides."""
    payload = copy.deepcopy(VALID_HAND_PAYLOAD)
    for key, value in overrides.items():
        if isinstance(value, dict) and key in payload:
            payload[key].update(value)
        else:
            payload[key] = value
    return payload

# --- Test Suite for API Contracts & Happy Paths ---

@pytest.mark.usefixtures("client", "mock_repo")
class TestHandsAPI:
    """Groups all tests for the /hands endpoint."""

    def test_create_hand_success(self, client: TestClient):
        response = client.post("/api/v1/hands/", json=VALID_HAND_PAYLOAD)
        assert response.status_code == 201, response.text
        data = response.json()
        assert "id" in data
        assert "winnings" in data
        assert sum(data["winnings"].values()) == 0

    def test_get_all_hands(self, client: TestClient):
        response_get1 = client.get("/api/v1/hands/")
        assert response_get1.status_code == 200
        assert response_get1.json() == []

        response_post = client.post("/api/v1/hands/", json=VALID_HAND_PAYLOAD)
        assert response_post.status_code == 201
        created_hand_id = response_post.json()["id"]

        response_get2 = client.get("/api/v1/hands/")
        assert response_get2.status_code == 200
        hands_list = response_get2.json()
        assert len(hands_list) == 1
        assert hands_list[0]["id"] == created_hand_id

# --- Test Suite for Poker Edge Cases ---

@pytest.mark.usefixtures("client")
class TestPokerEdgeCases:
    """Tests specific, complex poker scenarios end-to-end."""

    def test_everyone_folds_preflop(self, client: TestClient):
        # A 6-player hand where everyone folds to the Big Blind.
        payload = {
            "players": [
                {"id": "p1", "name": "P1", "starting_stack": 1000, "cards": ["2h","3d"], "position": "dealer"},
                {"id": "p2", "name": "P2", "starting_stack": 1000, "cards": ["4s","5c"], "position": "smallblind"},
                {"id": "p3", "name": "P3", "starting_stack": 1000, "cards": ["6h","7d"], "position": "bigblind"},
                {"id": "p4", "name": "P4", "starting_stack": 1000, "cards": ["8s","9c"], "position": "utg"},
                {"id": "p5", "name": "P5", "starting_stack": 1000, "cards": ["Th","Jd"], "position": "hijack"},
                {"id": "p6", "name": "P6", "starting_stack": 1000, "cards": ["Qh","Kc"], "position": "cutoff"},
            ],
            "actions": ["f", "f", "f", "f", "f"],
            "config": {"sb": 20, "bb": 40, "ante": 0}
        }
        r = client.post("/api/v1/hands/", json=payload)
        assert r.status_code == 201, r.text
        wins = r.json()["winnings"]
        assert wins["p3"] > 0 
        assert wins["p2"] < 0 
        assert sum(wins.values()) == 0

    def test_multiway_allin_with_side_pot(self, client: TestClient):
        payload = {
            "players": [
                {"id":"p1","name":"BTN","starting_stack":1000,"cards":["2h","3d"],"position":"dealer"},
                {"id":"short","name":"Short","starting_stack":80,"cards":["Ah","Ad"],"position":"smallblind"},
                {"id":"mid","name":"Mid","starting_stack":200,"cards":["Kc","Kd"],"position":"bigblind"},
                {"id":"big","name":"Big","starting_stack":300,"cards":["Qs","Qh"],"position":"utg"},
                {"id":"p5","name":"HJ","starting_stack":1000,"cards":["2s","3c"],"position":"hijack"},
                {"id":"p6","name":"CO","starting_stack":1000,"cards":["4h","5d"],"position":"cutoff"},
            ],
            "actions": ["allin", "f", "f", "f", "allin", "allin", "KhQc5h", "6s", "5s"],
            "config": {"sb": 20, "bb": 40, "ante": 0}
        }
        r = client.post("/api/v1/hands/", json=payload)
        assert r.status_code == 201, r.text
        wins = r.json()["winnings"]
        assert sum(wins.values()) == 0
        assert any(v > 0 for v in wins.values()) # At least one winner
        assert any(v < 0 for v in wins.values()) # At least one loser

# --- Test Suite for Error Handling ---

class DummyServiceOK:
    def validate_and_score(self, _):
        return {
            "board": ["Kh","Qc","5h"], "pot": 60, "actions": [],
            "players": VALID_HAND_PAYLOAD["players"],
            "winnings_by_player_id": {"p1": 20, "p2": -20, "p3": 0},
        }

class DummyServiceValueError:
    def validate_and_score(self, payload): raise ValueError("Service validation failed")

class DummyServiceNone:
    def validate_and_score(self, payload): return None

class FaultyRepo:
    def create(self, hand): raise RuntimeError("Database is down")
    def list(self): return []

def test_400_when_service_validation_fails():
    app.dependency_overrides[get_poker_service] = lambda: DummyServiceValueError()
    with TestClient(app) as c:
        r = c.post("/api/v1/hands/", json=VALID_HAND_PAYLOAD)
        assert r.status_code == 400
        assert "Service validation failed" in r.text
    app.dependency_overrides.clear()

@pytest.mark.parametrize("payload, msg", [
    ({
        "players": VALID_HAND_PAYLOAD["players"],
        "actions": ["z", "f", "f", "f", "f", "f"],
        "config": {"sb": 20, "bb": 40}
    }, "Unknown player token"),

    ({
        "players": VALID_HAND_PAYLOAD["players"],
        "actions": ["r120", "f", "f", "c", "f", "c", "Xs7s6s", "x", "b100", "c", "c", "5h", "x", "x", "x", "4d", "x", "x", "x"],
        "config": {"sb": 20, "bb": 40}
    }, "Invalid card format in board token"),
])
def test_bad_tokens_400(client: TestClient, payload, msg):
    r = client.post("/api/v1/hands/", json=payload)
    assert r.status_code == 400
    assert msg.lower() in r.text.lower()

def test_500_when_service_returns_none():
    app.dependency_overrides[get_poker_service] = lambda: DummyServiceNone()
    with TestClient(app) as c:
        r = c.post("/api/v1/hands/", json=VALID_HAND_PAYLOAD)
        assert r.status_code == 500
        assert "internal server error" in r.text.lower()
    app.dependency_overrides.clear()

def test_500_when_repository_fails():
    app.dependency_overrides[get_poker_service] = lambda: DummyServiceOK()
    app.dependency_overrides[get_hand_repository] = lambda: FaultyRepo()
    with TestClient(app) as c:
        r = c.post("/api/v1/hands/", json=VALID_HAND_PAYLOAD)
        assert r.status_code == 500
    app.dependency_overrides.clear()
