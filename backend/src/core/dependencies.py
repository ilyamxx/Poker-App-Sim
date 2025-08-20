from fastapi import Depends
from psycopg2.extensions import connection

from src.repository.hand_repository import HandRepository
from src.services.poker_service import PokerService
from src.core.database import get_db

def get_hand_repository(conn: connection = Depends(get_db)) -> HandRepository:
    """
    Dependency provider for the HandRepository.
    Injects a database connection into the repository.
    """
    return HandRepository(conn)

def get_poker_service() -> PokerService:
    """Dependency provider for the PokerService."""
    return PokerService()
