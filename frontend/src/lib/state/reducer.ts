/**
 * @file This module contains the main reducer for the poker game's state.
 * It acts as a central orchestrator, delegating tasks to pure handlers and services.
 */
import { PokerState, LogEntry, Player, Action, ReducerFunction } from '@/types/pokerTypes';
import { setupNewHand, resetGame } from './handlers/handSetup';
import { advanceHandStage } from './handlers/handHandler';
import { handlePlayerFold, handlePlayerCallCheck, handlePlayerBetRaise, handlePlayerAllIn } from './handlers/playerActionHandler';
import { createHandSetupLogs, createPlayerActionLog, createCommunityCardLog, createEndOfHandLogs } from '../services/log.service';

/** A helper function to convert an array of message strings into LogEntry objects. */
const toLogEntries = (messages: string[]): LogEntry[] => {
  const timestamp = new Date().toISOString();
  return messages.map(message => ({ message, timestamp }));
};

const handleActionAndLog = <T extends Action & { payload: object }>(
  state: PokerState,
  action: T,
  handler: (state: PokerState, payload: T['payload'], helpers: { reducer: ReducerFunction }) => PokerState
): PokerState => {
  const nextState = handler(state, action.payload, { reducer: pokerReducer });

  if (nextState === state) {
    return state;
  }

  const logMessage = createPlayerActionLog(state, action);
  const newLogs = [...state.logs, ...toLogEntries([logMessage])];

  if (nextState.gameStage === 'showdown' && state.gameStage !== 'showdown') {
    const winner = nextState.players.find((p: Player) => p.status !== 'folded');
    if (winner) {
      const endOfHandLogs = createEndOfHandLogs(nextState, winner, nextState.pot);
      return { ...nextState, logs: [...newLogs, ...toLogEntries(endOfHandLogs)] };
    }
  }
  
  return { ...nextState, logs: newLogs };
};

export const pokerReducer: ReducerFunction = (state, action) => {
  switch (action.type) {
    case 'START_NEW_HAND': {
      const nextState = setupNewHand(state, action.payload);
      const setupLogs = createHandSetupLogs(nextState);
      return { ...nextState, logs: toLogEntries(setupLogs) };
    }

    case 'RESET_GAME':
      return resetGame(state);

    case 'ADVANCE_GAME_STAGE': {
      const previousStage = state.gameStage;
      const nextState = advanceHandStage(state);
      if (nextState.gameStage !== previousStage && nextState.gameStage !== 'showdown') {
        const lastAction = nextState.actionHistory[nextState.actionHistory.length - 1];
        if (lastAction?.cards) {
            const communityCardLogs = createCommunityCardLog(nextState.gameStage as 'flop' | 'turn' | 'river', lastAction.cards);
            return { ...nextState, logs: [...nextState.logs, ...toLogEntries(communityCardLogs)] };
        }
      }
      return nextState;
    }

    case 'HANDLE_FOLD':
      return handleActionAndLog(state, action, handlePlayerFold);

    case 'HANDLE_CALL_CHECK':
      return handleActionAndLog(state, action, handlePlayerCallCheck);

    case 'HANDLE_BET_RAISE':
      return handleActionAndLog(state, action, handlePlayerBetRaise);
      
    case 'HANDLE_ALL_IN':
      return handleActionAndLog(state, action, handlePlayerAllIn);

    case 'ADD_HAND_HISTORY':
      return { ...state, handHistory: [...state.handHistory, action.payload] };
      
    case 'SET_HAND_HISTORY':
      return { ...state, handHistory: action.payload };
      
    default:
      return state;
  }
};
