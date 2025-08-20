/**
 * @file This module contains handlers that connect player action dispatches
 * to the core game logic and then determine the next step in the game flow.
 */
import { PokerState, ReducerFunction } from '@/types/pokerTypes';
import { handleFold, handleCallCheck, handleBetRaise, handleAllIn } from '@/lib/game-logic/actions';
import { handleEndOfAction } from './handHandler';

type ReducerHelper = {
  reducer: ReducerFunction;
};

/**
 * Flow controller for the 'fold' action.
 * @param state The current poker state.
 * @param payload The action payload.
 * @param helpers Contains a reference to the main reducer for follow-up actions.
 * @returns The new state after the fold and turn advancement.
 */
export function handlePlayerFold(state: PokerState, payload: { playerId: string }, helpers: ReducerHelper): PokerState {
  const newState = handleFold(state);
  newState.actionHistory = [...newState.actionHistory, { type: 'fold', playerId: state.currentPlayer! }];
  return handleEndOfAction(newState, helpers.reducer);
}

/**
 * Flow controller for the 'call' or 'check' action.
 * @param state The current poker state.
 * @param payload The action payload.
 * @param helpers Contains a reference to the main reducer for follow-up actions.
 * @returns The new state after the call/check and turn advancement.
 */
export function handlePlayerCallCheck(state: PokerState, payload: { playerId: string }, helpers: ReducerHelper): PokerState {
  const isCall = state.currentBet > state.players.find(p => p.id === state.currentPlayer)!.bet;
  const newState = handleCallCheck(state);
  newState.actionHistory = [...newState.actionHistory, { type: isCall ? 'call' : 'check', playerId: state.currentPlayer! }];
  return handleEndOfAction(newState, helpers.reducer);
}

/**
 * Flow controller for the 'bet' or 'raise' action.
 * @param state The current poker state.
 * @param payload The action payload, containing the bet/raise amount.
 * @param helpers Contains a reference to the main reducer for follow-up actions.
 * @returns The new state after the bet/raise and turn advancement.
 */
export function handlePlayerBetRaise(state: PokerState, payload: { playerId: string; amount: number }, helpers: ReducerHelper): PokerState {
  const isRaise = state.currentBet > 0;
  const newState = handleBetRaise(state, payload.amount);
  if (newState === state) return state; // Return early if the action was invalid
  newState.actionHistory = [...newState.actionHistory, { type: isRaise ? 'raise' : 'bet', playerId: state.currentPlayer!, amount: payload.amount }];
  return handleEndOfAction(newState, helpers.reducer);
}

/**
 * Flow controller for the 'all-in' action.
 * @param state The current poker state.
 * @param payload The action payload.
 * @param helpers Contains a reference to the main reducer for follow-up actions.
 * @returns The new state after the all-in and turn advancement.
 */
export function handlePlayerAllIn(state: PokerState, payload: { playerId: string }, helpers: ReducerHelper): PokerState {
  const newState = handleAllIn(state);
  newState.actionHistory = [...newState.actionHistory, { type: 'all-in', playerId: state.currentPlayer! }];
  return handleEndOfAction(newState, helpers.reducer);
}
