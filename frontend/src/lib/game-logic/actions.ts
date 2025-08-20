/**
 * @file This module contains the pure, core logic functions for handling player actions.
 * Each function takes the current game state and returns a new, updated state.
 */
import { PokerState, PlayerStatus } from "@/types/pokerTypes";
import { getMinRaiseAmount } from "./rules";

/**
 * Processes a 'fold' action for the current player.
 * @param state The current poker state.
 * @returns A new state with the player's status updated to 'folded'.
 */
export function handleFold(state: PokerState): PokerState {
  if (!state.currentPlayer) return state;
  const updatedPlayers = state.players.map(p => 
    p.id === state.currentPlayer 
      ? { ...p, status: 'folded' as const, hasActed: true, lastAction: 'fold' as const } 
      : p
  );
  return { ...state, players: updatedPlayers };
}

/**
 * Processes a 'call' or 'check' action for the current player.
 * @param state The current poker state.
 * @returns A new state with the player's stack and bet updated accordingly.
 */
export function handleCallCheck(state: PokerState): PokerState {
  if (!state.currentPlayer) return state;
  const playerIndex = state.players.findIndex(p => p.id === state.currentPlayer);
  if (playerIndex === -1) return state;
  
  const player = state.players[playerIndex];
  const amountToCall = state.currentBet - player.bet;
  const finalCallAmount = Math.min(amountToCall, player.stack);
  
  const becomesAllIn = finalCallAmount === player.stack && amountToCall > 0;
  const status: PlayerStatus = becomesAllIn ? 'all-in' : player.status;
  const actionType: 'call' | 'check' = state.currentBet > player.bet ? 'call' : 'check';

  const updatedPlayer = { 
    ...player, 
    stack: player.stack - finalCallAmount,
    bet: player.bet + finalCallAmount,
    hasActed: true,
    status,
    lastAction: actionType
  };

  const newPlayers = [...state.players];
  newPlayers[playerIndex] = updatedPlayer;

  return { 
    ...state, 
    players: newPlayers, 
    pot: state.pot + finalCallAmount 
  };
}

/**
 * Processes a 'bet' or 'raise' action for the current player.
 * @param state The current poker state.
 * @param amount The total amount the player is betting or raising to.
 * @returns A new state with all relevant betting information updated.
 */
export function handleBetRaise(state: PokerState, amount: number): PokerState {
  if (!state.currentPlayer) return state;
  const playerIndex = state.players.findIndex(p => p.id === state.currentPlayer);
  if (playerIndex === -1) return state;
  
  const player = state.players[playerIndex];
  
  if (amount < player.bet) return state;
  
  const amountToPot = amount - player.bet;
  if (player.stack < amountToPot) return state;

  const isRaise = state.currentBet > 0;
  if (isRaise) {
    const minRaise = getMinRaiseAmount(state);
    if (amount < minRaise && amount < player.stack + player.bet) {
      return state;
    }
  }

  const becomesAllIn = amountToPot === player.stack;
  const status: PlayerStatus = becomesAllIn ? 'all-in' : player.status;
  const raiseAmount = amount - state.currentBet;
  const actionType: 'bet' | 'raise' = state.currentBet === 0 ? 'bet' : 'raise';

  const updatedPlayer = { 
    ...player, 
    stack: player.stack - amountToPot,
    bet: amount,
    hasActed: true,
    status,
    lastAction: actionType
  };

  const resetHasActed = state.players.map(p => 
    p.id === player.id ? updatedPlayer : { ...p, hasActed: p.status !== 'active' }
  );

  return {
    ...state,
    players: resetHasActed,
    pot: state.pot + amountToPot,
    currentBet: amount,
    lastRaiserId: player.id,
    lastRaiseAmount: raiseAmount,
  };
}

/**
 * Processes an 'all-in' action for the current player.
 * @param state The current poker state.
 * @returns A new state with the player's stack and status updated to all-in.
 */
export function handleAllIn(state: PokerState): PokerState {
    if (!state.currentPlayer) return state;
    const playerIndex = state.players.findIndex(p => p.id === state.currentPlayer);
    if (playerIndex === -1) return state;

    const player = state.players[playerIndex];
    const allInAmount = player.stack;
    const totalBet = player.bet + allInAmount;

    const updatedPlayer = { ...player, stack: 0, bet: totalBet, hasActed: true, status: 'all-in' as const, lastAction: 'all-in' as const };
    const newPlayers = [...state.players];
    newPlayers[playerIndex] = updatedPlayer;

    let newState = { ...state };

    if (totalBet > state.currentBet) {
        const raiseAmount = totalBet - state.currentBet;
        const resetHasActed = newPlayers.map(p =>
            p.id === player.id ? updatedPlayer : { ...p, hasActed: p.status !== 'active' }
        );
        newState = {
            ...state,
            players: resetHasActed,
            currentBet: totalBet,
            lastRaiserId: player.id,
            lastRaiseAmount: raiseAmount,
        };
    } else {
        newState = { ...state, players: newPlayers };
    }
    
    return { ...newState, pot: state.pot + allInAmount };
}
