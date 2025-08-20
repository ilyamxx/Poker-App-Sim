from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime, timezone
import json
import re

from pydantic.dataclasses import dataclass
from pydantic import Field, field_validator, model_validator

VALID_POSITIONS = {"dealer", "smallblind", "bigblind", "utg", "hijack", "cutoff"}
CARD_REGEX = re.compile(r"^[2-9TJQKA][shdc]$")

@dataclass
class Player:
    """
    Represents a player's state, with robust Pydantic v2 validation.
    """
    id: str
    name: str
    position: str
    starting_stack: int = Field(..., gt=0)
    cards: Optional[List[str]] = None

    @field_validator('position')
    @classmethod
    def position_must_be_valid(cls, v: str) -> str:
        """Validates and normalizes the player's position."""
        normalized = v.lower()
        if normalized not in VALID_POSITIONS:
            raise ValueError(f"Invalid position: '{v}'. Must be one of {VALID_POSITIONS}")
        return normalized

    @field_validator('cards')
    @classmethod
    def cards_must_be_valid(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validates hole cards if they are provided."""
        if v is None:
            return v
        if len(v) != 2:
            raise ValueError("Player must have exactly 2 hole cards if provided.")
        if not all(CARD_REGEX.match(card) for card in v):
            raise ValueError(f"Invalid card format in {v}. Cards must match regex '{CARD_REGEX.pattern}'.")
        return v

@dataclass
class HandCreate:
    """
    Represents the incoming payload from the frontend, with model-level validation.
    """
    actions: List[str]
    players: List[Player] = Field(..., min_length=2, max_length=6)
    config: Optional[Dict[str, Any]] = None

    @model_validator(mode='after')
    def check_players_for_duplicates_and_positions(self) -> 'HandCreate':
        """Ensures player IDs are unique and required positions are present."""
        player_ids = [p.id for p in self.players]
        if len(player_ids) != len(set(player_ids)):
            raise ValueError("Duplicate player IDs are not allowed.")
        
        positions = {p.position for p in self.players}
        if "smallblind" not in positions or "bigblind" not in positions:
            raise ValueError("Hand must include at least a 'smallblind' and a 'bigblind'.")
        
        return self

@dataclass
class Hand:
    """
    Represents the full, scored hand object for database storage.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    players: List[Player] = field(default_factory=list)
    actions: List[str] = field(default_factory=list)
    board: List[str] = field(default_factory=list)
    winnings: Optional[Dict[str, int]] = None

    def to_json(self) -> str:
        """Serializes the dataclass to a JSON string for database storage."""
        return json.dumps(asdict(self), default=str)

    @classmethod
    def from_dict(cls, data: dict) -> "Hand":
        """Creates a Hand instance from a dictionary."""
        players_data = data.get("players", [])
        return cls(
            id=data["id"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            players=[Player(**p) for p in players_data],
            actions=data.get("actions", []),
            board=data.get("board", []),
            winnings=data.get("winnings")
        )
