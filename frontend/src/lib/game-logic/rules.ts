/**
 * @file This module contains pure functions that represent the rules of the game.
 * They determine which actions are legally available to a player at any given time.
 */
import { Player, PokerState } from "@/types/pokerTypes";

/** Returns true if the player is able to fold. (Always true for an active player). */
export function canFold(): boolean { 
  return true; 
}

/** Returns true if the player's current bet matches the table's current bet. */
export function canCheck(player: Player, state: PokerState): boolean { 
  return player.bet === state.currentBet; 
}

/** Returns true if there is a bet to call and the player has chips remaining. */
export function canCall(player: Player, state: PokerState): boolean { 
  return state.currentBet > player.bet && player.stack > 0; 
}

/** Returns true if there has been no betting action on the current street. */
export function canBet(state: PokerState): boolean { 
  return state.currentBet === 0; 
}

/** Returns true if the player has chips remaining. */
export function canAllIn(player: Player): boolean { 
  return player.stack > 0; 
}

/** Returns true if the player can legally make a raise. */
export function canRaise(player: Player, state: PokerState): boolean {
  if (state.currentBet === 0) {
    return false;
  }

  const amountToCall = state.currentBet - player.bet;
  
  if (player.stack <= amountToCall) {
    return false;
  }
  
  const minRaiseTotal = getMinRaiseAmount(state);

  // The player's total potential bet (their current bet + their remaining stack).
  const playerTotalPotential = player.bet + player.stack;

  // Player can raise if their total potential bet meets the minimum raise total.
  return playerTotalPotential >= minRaiseTotal;
}

/**
 * Calculates the minimum total bet amount required for a legal raise.
 * @param state The current poker state.
 * @returns The total amount of a minimum legal raise.
 */
export function getMinRaiseAmount(state: PokerState): number {
  const { currentBet, lastRaiseAmount, stakes } = state;
  // The minimum raise increment is the size of the last raise.
  const minRaiseIncrement = lastRaiseAmount || stakes.bigBlind;
  return currentBet + minRaiseIncrement;
}
