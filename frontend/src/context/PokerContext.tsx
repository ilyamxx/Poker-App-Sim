/**
 * @file This module defines the global state management context for the poker application.
 * It is the primary boundary for side effects, such as API calls and timers,
 * separating them from the pure state logic in the reducer.
 */
"use client";

import { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { PokerState, Action } from '@/types/pokerTypes';
import { pokerReducer } from '@/lib/state/reducer'; 
import { saveHandHistory } from '@/lib/services/hand.service';
import { isRoundOver } from '@/lib/game-logic/flow';
import { createInitialState } from '@/lib/state/initialState'; 

/**
 * Provides the central state and dispatch function for the entire poker application.
 * This is the bridge between the React UI and the game's state logic.
 */
const PokerContext = createContext<{
  state: PokerState;
  dispatch: React.Dispatch<Action>;
}>({
  state: createInitialState(),
  dispatch: () => null,
});

const AUTO_ADVANCE_DELAY_MS = 1500;

/**
 * The provider component that wraps the application, making the poker state available
 * to all child components. It also manages all side effects, such as API calls and timers.
 */
export const PokerProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(pokerReducer, createInitialState());

  const savedHandIds = useRef<Set<string>>(new Set());

  /**
   * Effect to automatically save the hand history to the backend
   * when a hand reaches the 'showdown' stage.
   */
  useEffect(() => {
    const saveAndLogHand = async () => {
      if (state.gameStage === 'showdown' && state.handId && !savedHandIds.current.has(state.handId)) {
        savedHandIds.current.add(state.handId);
        try {
          const savedHand = await saveHandHistory(state);
          if (savedHand) {
            dispatch({ type: 'ADD_HAND_HISTORY', payload: savedHand });
          }
        } catch (error) {
          console.error("Failed to save hand history:", error);
        }
      }
    };
    saveAndLogHand();
  }, [state.gameStage, state.handId, state]);

  /**
   * Effect to automatically advance the game stage when a betting round ends
   * due to all but one player being all-in.
   */
  useEffect(() => {
    const playersWhoCanAct = state.players.filter(p => p.status === 'active');
    
    if (state.gameStage !== 'pregame' && state.gameStage !== 'showdown' && isRoundOver(state) && playersWhoCanAct.length < 2) {
      const timer = setTimeout(() => {
        dispatch({ type: 'ADVANCE_GAME_STAGE' });
      }, AUTO_ADVANCE_DELAY_MS);
      
      return () => clearTimeout(timer);
    }
  }, [state, dispatch]);

  return (
    <PokerContext.Provider value={{ state, dispatch }}>
      {children}
    </PokerContext.Provider>
  );
};

/**
 * A custom hook for easy access to the poker state and dispatch function.
 * It must be used within a component wrapped by the PokerProvider.
 * @returns The current PokerState and the dispatch function.
 */
export const usePoker = () => useContext(PokerContext);
