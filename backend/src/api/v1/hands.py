from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from dataclasses import asdict
import traceback

from src.core.dependencies import get_hand_repository, get_poker_service
from src.models.hand import Hand, HandCreate, Player
from src.repository.hand_repository import HandRepository
from src.services.poker_service import PokerService

router = APIRouter(prefix="/hands", tags=["Hands"])

@router.post("/", response_model=Hand, status_code=status.HTTP_201_CREATED)
def create_hand(
    hand_request: HandCreate,
    poker_service: PokerService = Depends(get_poker_service),
    repo: HandRepository = Depends(get_hand_repository)
):
    """
    Receives a hand payload from the frontend, validates it, calculates the results,
    saves it to the database, and returns the completed hand object.
    """
    try:
        payload = asdict(hand_request)
        result = poker_service.validate_and_score(payload)

        if result is None:
            raise TypeError("The poker service returned None, indicating an unhandled error.")

        player_objects = [Player(**p_data) for p_data in result["players"]]

        new_hand = Hand(
            players=player_objects,
            actions=result["actions"],
            board=result["board"],
            winnings=result["winnings_by_player_id"],
        )
        
        repo.create(new_hand)
        
        return new_hand
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"An internal server error occurred: {e}"
        )

@router.get("/", response_model=List[Hand])
def get_all_hands(
    repo: HandRepository = Depends(get_hand_repository)
):
    """
    Retrieves a list of all previously saved hands from the database.
    """
    try:
        return repo.list()
    except Exception as e:
        print(f"An error occurred while fetching hands: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=str(e)
        )
