import pytest
from typing import Generator, List
from fastapi.testclient import TestClient

from src.main import app
from src.core.dependencies import get_hand_repository
from src.models.hand import Hand
from src.repository.hand_repository import HandRepository

# --- Mock Repository for Testing ---

class InMemoryHandRepository(HandRepository):
    """
    A mock repository that uses an in-memory list instead of a database.
    This allows us to test the API without needing a real database connection.
    """
    def __init__(self):
        self._hands: List[Hand] = []

    def create(self, hand: Hand) -> None:
        self._hands.append(hand)

    def list(self) -> List[Hand]:
        return self._hands

# --- Pytest Fixtures ---

@pytest.fixture(scope="function")
def mock_repo() -> InMemoryHandRepository:
    """Provides a fresh instance of the in-memory repository for each test."""
    return InMemoryHandRepository()

@pytest.fixture(scope="function")
def client(mock_repo: InMemoryHandRepository) -> Generator:
    """
    Creates a FastAPI TestClient that uses the mock repository.
    """
    def override_get_hand_repository():
        """A dependency override that provides the mock repository."""
        return mock_repo
    
    app.dependency_overrides[get_hand_repository] = override_get_hand_repository
    
    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
