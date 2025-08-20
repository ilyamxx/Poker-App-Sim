import { PokerState, HandHistoryEntry } from '@/types/pokerTypes';

/**
 * Creates the definitive initial state for the poker game.
 * This is the single source of truth for a fresh game state.
 * @param initialStackSize - The starting stack size as a direct integer value.
 * @param handHistory - The existing hand history to preserve between resets.
 */
export const createInitialState = (
    initialStackSize: number = 10000, 
    handHistory: HandHistoryEntry[] = []
): PokerState => ({
  handId: null,
  players: [],
  initialPlayersState: [],
  deck: [],
  currentPlayer: null,
  pot: 0,
  communityCards: [],
  currentBet: 0,
  lastRaiserId: null,
  lastRaiseAmount: 0,
  gameStage: 'pregame',
  handHistory: handHistory,
  logs: [{ message: "Welcome to Poker Simulator!", timestamp: new Date().toISOString() }],
  actionHistory: [],
  stakes: { smallBlind: 20, bigBlind: 40 },
  initialStackSize: initialStackSize,
});
