import re
from typing import Any, Dict, List, Tuple

from pokerkit import (
    Automation,
    Mode,
    NoLimitTexasHoldem,
    State,
    Card,
)

# ------------- helpers -------------

def _is_bet_token(t: str) -> bool:
    """Checks if a token represents a bet or raise."""
    return t.startswith("b") or t.startswith("r")

def _amount_from_token(t: str) -> int:
    """Extracts the integer amount from a bet/raise token."""
    if not _is_bet_token(t):
        raise ValueError(f"Token '{t}' is not a bet/raise token")
    try:
        return int(t[1:])
    except (ValueError, IndexError):
        raise ValueError(f"Invalid amount in bet/raise token: '{t}'")

def _is_board_token(t: str) -> bool:
    """Determines if a token represents board cards."""
    return t not in ("f", "x", "c", "allin") and not _is_bet_token(t)

def _clean_card_string(c: Card) -> str:
    """Normalizes card representation from the Card object's repr to 'Th'."""
    return repr(c)

# ------------- service -------------

class PokerService:
    """
    Deterministically replays a poker hand from a payload.
    """

    @staticmethod
    def _automations() -> Tuple[Automation, ...]:
        """Configure engine automations for manual control over the runout."""
        return (
            Automation.ANTE_POSTING,
            Automation.BET_COLLECTION,
            Automation.BLIND_OR_STRADDLE_POSTING,
            Automation.HOLE_CARDS_SHOWING_OR_MUCKING,
            Automation.HAND_KILLING,
            Automation.CHIPS_PUSHING,
            Automation.CHIPS_PULLING,
        )

    @staticmethod
    def _create_state(
        starting_stacks: List[int],
        sb: int,
        bb: int,
        ante: int,
        mode: Mode = Mode.CASH_GAME,
    ) -> State:
        """Creates the initial NoLimitTexasHoldem state."""
        return NoLimitTexasHoldem.create_state(
            PokerService._automations(),
            True,  
            ante,
            (sb, bb),
            bb,  # min bet
            starting_stacks,
            len(starting_stacks),
            mode=mode,
        )

    @staticmethod
    def _deal_holes(state: State, hole_cards: List[List[str]]) -> None:
        """Deals the specified hole cards to each player in order."""
        for seat, cards in enumerate(hole_cards):
            if not cards:
                raise ValueError(f"Missing hole cards for player at seat {seat}")
            if any(not re.match(r"^[2-9TJQKA][shdc]$", c) for c in cards):
                raise ValueError(f"Invalid card format: {cards}")
            
            state.deal_hole("".join(cards))

    @staticmethod
    def _apply_player_action(state: State, token: str) -> None:
        """Applies a single player action token to the state."""
        if token == "f":
            state.fold()
        elif token in ("x", "c"):
            state.check_or_call()
        elif _is_bet_token(token):
            amt = _amount_from_token(token)
            state.complete_bet_or_raise_to(amt)
        elif token == "allin":
            mx = state.max_completion_betting_or_raising_to_amount
            if mx is not None and state.can_complete_bet_or_raise_to(mx):
                state.complete_bet_or_raise_to(mx)
            else:
                state.check_or_call()
        else:
            raise ValueError(f"Unknown player token: '{token}'")

    def _prepare_hand_data(self, payload: Dict[str, Any]) -> Tuple[List[Dict], List[int], List[List[str]]]:
        """Extracts and sorts player data from the payload."""
        players = payload.get("players", [])
        if len(players) < 2:
            raise ValueError(f"A hand must have at least 2 players, got {len(players)}")

        ORDER = ["smallblind", "bigblind", "utg", "hijack", "cutoff", "dealer"]
        player_positions = [p["position"].lower() for p in players]
        active_order = [pos for pos in ORDER if pos in player_positions]
        
        pmap = {p["position"].lower(): p for p in players}
        sorted_players = [pmap[pos] for pos in active_order]
        
        starting_stacks = [int(p["starting_stack"]) for p in sorted_players]
        hole_cards = [p.get("cards", []) for p in sorted_players]

        return sorted_players, starting_stacks, hole_cards

    def _replay_hand(self, state: State, actions: List[str]) -> None:
        """Runs the main game loop, processing actions against the state machine."""
        actions_iter = iter(actions)
        MAX_STEPS = 100
        steps = 0
        while state.status and steps < MAX_STEPS:
            steps += 1
            
            if state.actor_index is not None:
                tok = next(actions_iter, None)
                if tok:
                    self._apply_player_action(state, tok)
                else:
                    raise ValueError("Incomplete action sequence: engine expects an action but no tokens remain.")
            elif state.can_select_runout_count():
                state.select_runout_count(1)
            elif state.can_burn_card():
                state.burn_card('??')
            elif state.can_deal_board():
                tok = next(actions_iter, None)
                if not tok:
                    break

                cards = [tok[i:i+2] for i in range(0, len(tok), 2)]
                if any(not re.match(r"^[2-9TJQKA][shdc]$", c) for c in cards):
                    raise ValueError(f"Invalid card format in board token: '{tok}'")
                
                state.deal_board(tok)
            else:
                state.no_operate()

        if steps >= MAX_STEPS:
            raise RuntimeError("Phase pump stalled: step limit exceeded")

    def validate_and_score(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates the payload, replays the hand using PokerKit, and returns the results.
        """
        actions = payload.get("actions", [])
        config = payload.get("config", {})
        
        sorted_players, starting_stacks, hole_cards = self._prepare_hand_data(payload)
        player_ids = [p["id"] for p in sorted_players]

        sb = int(config.get("sb", 20))
        bb = int(config.get("bb", 40))
        ante = int(config.get("ante", 0))

        state = self._create_state(starting_stacks, sb, bb, ante, mode=Mode.CASH_GAME)
        self._deal_holes(state, hole_cards)
        self._replay_hand(state, actions)

        board_cards_final = [_clean_card_string(c) for c in state.board_cards] if state.board_cards else []
        payoffs = list(state.payoffs or [s - ss for s, ss in zip(state.stacks, starting_stacks)])
        total_pot = sum(abs(p) for p in payoffs if p < 0)

        return {
            "board": board_cards_final,
            "pot": int(total_pot),
            "actions": actions,
            "players": sorted_players,
            "winnings_by_player_id": dict(zip(player_ids, payoffs)),
        }
