/**
 * @file This module is responsible for transforming the frontend's complex PokerState
 * into the lean, replayable DTO required by the backend API for saving hand histories.
 */
import { PokerState, StructuredAction, Player } from '@/types/pokerTypes';
import { HandCreateDTO, PlayerDTO } from '@/types/pokerDTOs';
import { formatCard } from '@/lib/utils'; 

/**
 * Maps the final frontend PokerState to a HandCreateDTO.
 * @param state The final state of the hand from the reducer.
 * @returns A DTO object ready to be sent to the backend.
 */
export function toHandCreateDTO(state: PokerState): HandCreateDTO {
  const playersPayload: PlayerDTO[] = state.initialPlayersState.map((player: Player) => {
    const finalPlayerState = state.players.find(p => p.id === player.id);
    return {
      id: player.id,
      name: player.name,
      starting_stack: player.stack,
      cards: finalPlayerState?.cards 
        ? [formatCard(finalPlayerState.cards[0]), formatCard(finalPlayerState.cards[1])] 
        : null,
      position: player.position,
    };
  });

  const formattedActions = state.actionHistory.map((action: StructuredAction) => {
    switch (action.type) {
      case 'fold': return 'f';
      case 'check': return 'x';
      case 'call': return 'c';
      case 'bet': return `b${action.amount}`;
      case 'raise': return `r${action.amount}`;
      case 'all-in': return 'allin';
      case 'deal_flop':
      case 'deal_turn':
      case 'deal_river':
        return action.cards ? action.cards.map(formatCard).join('') : '';
      default: return '';
    }
  }).filter(Boolean);

  return {
    players: playersPayload,
    actions: formattedActions,
    config: {
      sb: state.stakes.smallBlind,
      bb: state.stakes.bigBlind,
      ante: 0,
    },
  };
}
