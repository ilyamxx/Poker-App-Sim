/**
 * @file This module contains handlers that manage the overall flow and progression of a hand,
 * such as advancing to the next street or determining the next action after a player acts.
 */
import { PokerState, StructuredAction, ActionType, ReducerFunction } from '@/types/pokerTypes';
import { dealCards } from '@/lib/game-logic/deck';
import { getNextPlayerId, isRoundOver } from '@/lib/game-logic/flow';

/**
 * Advances the game to the next stage (flop, turn, river, showdown).
 * It deals community cards and resets the betting state for the new round.
 * @param state The current poker state.
 * @returns A new state object representing the start of the next game stage.
 */
export function advanceHandStage(state: PokerState): PokerState {
  const stageOrder: PokerState['gameStage'][] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIndex = stageOrder.indexOf(state.gameStage);
  const nextStage = stageOrder[currentIndex + 1] || 'showdown';
  
  if (nextStage === 'showdown') {
    return { ...state, gameStage: 'showdown', currentPlayer: null };
  }

  const newCommunityCards = [...state.communityCards];
  const deckCopyAdv = [...state.deck];
  
  if (deckCopyAdv.length > 0) dealCards(deckCopyAdv, 1); // Burn card
  const cardsToDealCount = nextStage === 'flop' ? 3 : 1;
  const dealtCards = deckCopyAdv.length >= cardsToDealCount ? dealCards(deckCopyAdv, cardsToDealCount) : [];
  newCommunityCards.push(...dealtCards);

  const playersForNewRound = state.players.map(p => ({ ...p, bet: 0, hasActed: p.status !== 'active' }));
  const dealerIndex = playersForNewRound.findIndex(p => p.position === 'dealer');
  const firstToAct = getNextPlayerId({ ...state, players: playersForNewRound, currentPlayer: playersForNewRound[dealerIndex]?.id || null });

  const newAction: StructuredAction = {
    type: `deal_${nextStage}` as ActionType,
    cards: dealtCards
  };

  return { 
    ...state, 
    gameStage: nextStage, 
    players: playersForNewRound, 
    deck: deckCopyAdv, 
    communityCards: newCommunityCards, 
    currentPlayer: firstToAct, 
    currentBet: 0, 
    lastRaiserId: null, 
    lastRaiseAmount: 0,
    actionHistory: [...state.actionHistory, newAction]
  };
}

/**
 * Determines the next step after a player action, either advancing to the
 * next player or ending the betting round.
 * @param state The state *after* a player's action has been processed.
 * @param reducer A reference to the main poker reducer to dispatch follow-up actions (like advancing the stage).
 * @returns A new state object with the correct next player or game stage.
 */
export function handleEndOfAction(state: PokerState, reducer: ReducerFunction): PokerState {
  const activePlayers = state.players.filter(p => p.status !== 'folded');
  
  if (activePlayers.length <= 1) {
    const winner = activePlayers[0];
    let finalState = { ...state, gameStage: 'showdown' as const, currentPlayer: null };
    if (winner) {
      const finalPot = state.pot;
      const updatedPlayers = state.players.map(p => 
        p.id === winner.id ? { ...p, stack: p.stack + finalPot, bet: 0 } : { ...p, bet: 0 }
      );
      finalState = { ...finalState, players: updatedPlayers, pot: finalPot };
    }
    return finalState;
  }

  if (isRoundOver(state)) {
    return reducer(state, { type: 'ADVANCE_GAME_STAGE' });
  } else {
    const nextPlayerId = getNextPlayerId(state);
    return { ...state, currentPlayer: nextPlayerId };
  }
}
