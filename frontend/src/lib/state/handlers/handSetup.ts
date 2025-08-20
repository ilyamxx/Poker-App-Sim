/**
 * @file This module contains handlers for setting up and resetting a poker hand.
 */
import { PokerState, Player } from '@/types/pokerTypes';
import { createDeck, shuffleDeck } from '@/lib/game-logic/deck';
import { v4 as uuidv4 } from 'uuid';
import { createInitialState } from '@/lib/state/initialState'; 

const positionNames = ["dealer", "smallblind", "bigblind", "utg", "hijack", "cutoff"];

/**
 * Creates a new, complete hand ready for play. This includes creating players,
 * dealing cards, posting blinds, and setting the initial game state.
 * @param state The current (pre-game) poker state.
 * @param action The action dispatched, containing the initial stack size.
 * @returns A new PokerState object representing the start of a hand.
 */
export function setupNewHand(state: PokerState, action: { initialStackSize: number }): PokerState {
  const initialState = createInitialState(action.initialStackSize, state.handHistory);
  const { stakes } = initialState;
  
  const stackSize = action.initialStackSize;
  const newDeck = shuffleDeck(createDeck());
  
  const players: Player[] = Array.from({ length: 6 }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i + 1}`,
    stack: stackSize,
    cards: newDeck.splice(0, 2) as [string, string],
    position: positionNames[i],
    status: 'active',
    bet: 0,
    hasActed: false,
    lastAction: null
  }));

  const initialPlayersState = JSON.parse(JSON.stringify(players.map(p => ({...p, cards: null}))));
  
  const updatedPlayers = players.map(player => {
    if (player.position === 'smallblind') {
      return { ...player, stack: player.stack - stakes.smallBlind, bet: stakes.smallBlind };
    }
    if (player.position === 'bigblind') {
      return { ...player, stack: player.stack - stakes.bigBlind, bet: stakes.bigBlind };
    }
    return player;
  });

  const utgPlayer = updatedPlayers.find(p => p.position === 'utg');
  const bigBlindPlayer = updatedPlayers.find(p => p.position === 'bigblind');

  return { 
    ...initialState, 
    handId: uuidv4(),
    players: updatedPlayers, 
    initialPlayersState: initialPlayersState,
    deck: newDeck, 
    currentPlayer: utgPlayer?.id || null, 
    gameStage: 'preflop', 
    pot: stakes.smallBlind + stakes.bigBlind, 
    currentBet: stakes.bigBlind, 
    lastRaiserId: bigBlindPlayer?.id || null,
    logs: [] 
  };
}

/**
 * Resets the game to its initial pre-game state, preserving only the hand history.
 * @param state The current poker state.
 * @returns A clean initial state object.
 */
export function resetGame(state: PokerState): PokerState {
  return createInitialState(state.initialStackSize, state.handHistory);
}
