/**
 * @file This module defines all the core TypeScript types and interfaces
 * used throughout the frontend application's state management.
 */

/** Represents the possible states a player can be in during a hand. */
export type PlayerStatus = 'active' | 'folded' | 'all-in';

/** Represents all possible game actions, including player moves and dealer actions. */
export type ActionType = 
  | 'fold' 
  | 'check' 
  | 'call' 
  | 'bet' 
  | 'raise' 
  | 'all-in'
  | 'deal_flop'
  | 'deal_turn'
  | 'deal_river';

/** A structured representation of a single action, used for the hand history replay. */
export interface StructuredAction {
  type: ActionType;
  playerId?: string; 
  amount?: number;
  cards?: string[];
}

/** Represents a single entry in the user-facing game log. */
export interface LogEntry {
  message: string;
  timestamp: string;
}

/** Represents a player's state within the frontend during active gameplay. */
export interface Player {
  id: string;
  name: string;
  stack: number;
  cards: [string, string] | null;
  position: string;
  status: PlayerStatus;
  bet: number;
  hasActed: boolean;
  lastAction: ActionType | null;
}

/** * Represents a single, completed hand record fetched from the backend API.
 * This structure matches the backend's `Hand` model.
 */
export interface HandHistoryEntry {
  id: string;
  timestamp: string;
  players: {
    id: string;
    name: string;
    starting_stack: number;
    cards: string[] | null;
    position: string;
  }[];
  actions: string[];
  pot?: number;
  game_stage?: string;
  winnings?: { [key: string]: number };
}

/** The main interface for the entire application state, managed by the reducer. */
export interface PokerState {
  handId: string | null;
  players: Player[];
  initialPlayersState: Player[];
  deck: string[];
  currentPlayer: string | null;
  pot: number;
  communityCards: string[];
  currentBet: number;
  lastRaiserId: string | null;
  lastRaiseAmount: number;
  gameStage: 'pregame' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  handHistory: HandHistoryEntry[];
  logs: LogEntry[];
  actionHistory: StructuredAction[];
  stakes: {
    smallBlind: number;
    bigBlind: number;
  };
  initialStackSize: number;
}

// A discriminated union of all possible actions the reducer can handle.
export type Action =
  | { type: 'START_NEW_HAND'; payload: { initialStackSize: number; stakes: { smallBlind: number; bigBlind: number } } }
  | { type: 'RESET_GAME' }
  | { type: 'ADVANCE_GAME_STAGE' }
  | { type: 'HANDLE_FOLD'; payload: { playerId: string } }
  | { type: 'HANDLE_CALL_CHECK'; payload: { playerId: string } }
  | { type: 'HANDLE_BET_RAISE'; payload: { playerId: string; amount: number } }
  | { type: 'HANDLE_ALL_IN'; payload: { playerId: string } }
  | { type: 'ADD_HAND_HISTORY'; payload: HandHistoryEntry }
  | { type: 'SET_HAND_HISTORY'; payload: HandHistoryEntry[] };

// Defines the signature for the main poker reducer function.
export type ReducerFunction = (state: PokerState, action: Action) => PokerState;
