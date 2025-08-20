/**
 * @file This module contains functions that control the flow of the game,
 * such as determining turn order and the end of a betting round.
 */
import { PokerState } from "@/types/pokerTypes";

/**
 * Finds the ID of the next player to act, skipping folded or all-in players.
 * @param state The current poker state.
 * @returns The ID of the next player, or null if none can act.
 */
export function getNextPlayerId(state: PokerState): string | null {
  const { players, currentPlayer } = state;
  if (!currentPlayer) return null;

  const currentIndex = players.findIndex(p => p.id === currentPlayer);
  if (currentIndex === -1) return null;

  let nextIndex = (currentIndex + 1) % players.length;
  
  // Loop to find the next player who is still in the hand and has chips.
  for (let i = 0; i < players.length * 2; i++) {
    const nextPlayer = players[nextIndex];
    if (nextPlayer.status !== 'folded' && nextPlayer.stack > 0) {
      return nextPlayer.id;
    }
    nextIndex = (nextIndex + 1) % players.length;
  }

  return null;
}

/**
 * Determines if the current betting round is over.
 * @param state The current poker state.
 * @returns True if the betting round is over, false otherwise.
 */
export function isRoundOver(state: PokerState): boolean {
  const { players, currentBet } = state;
  
  // Players who can still make actions (not folded or all-in).
  const activePlayers = players.filter(p => p.status === 'active');
  
  if (activePlayers.length <= 1) {
    if (activePlayers.length === 1 && !activePlayers[0].hasActed) {
        return false;
    }
    return true;
  }

  // The round is over if every active player has acted and all bets are settled.
  const allHaveActed = activePlayers.every(p => p.hasActed);
  const allBetsAreSettled = activePlayers.every(p => p.bet === currentBet);

  return allHaveActed && allBetsAreSettled;
}
