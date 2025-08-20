/**
 * @file This component is responsible for mapping over the players in the state
 * and rendering their information (name, stack, cards) and action controls
 * in the correct positions around the poker table.
 */
"use client";

import { usePoker } from '@/context/PokerContext';
import ActionControls from './ActionControls';
import { Player } from '@/types/pokerTypes';
import PlayingCard from '../ui/playing-card';
import { Badge } from '../ui/badge';

const positions = [
  "bottom-1/2 translate-y-1/2 -left-16",       // Player 1 (Dealer)
  "bottom-8 left-1/4 -translate-x-1/2",        // Player 2 (SB)
  "top-8 left-1/4 -translate-x-1/2",           // Player 3 (BB)
  "top-8 right-1/4 translate-x-1/2",           // Player 4 (UTG)
  "bottom-8 right-1/4 translate-x-1/2",        // Player 5
  "bottom-1/2 translate-y-1/2 -right-16",      // Player 6
];

/**
 * A sub-component that displays a single player's information.
 */
const PlayerDisplay = ({ player, isCurrent }: { player: Player, isCurrent: boolean }) => (
  <div className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${isCurrent ? 'bg-poker-gold/20 shadow-lg scale-110' : 'bg-black/30'}`}>
    <div className="text-sm font-bold text-white">{player.name}</div>
    <div className="text-xs text-poker-gold">${player.stack.toLocaleString()}</div>
    <div className="flex gap-1 mt-1 h-12">
      {player.cards ? (
        <>
          <PlayingCard card={player.cards[0]} />
          <PlayingCard card={player.cards[1]} />
        </>
      ) : (
        <div className="w-16 h-full bg-gray-700 rounded-md" />
      )}
    </div>
    {player.bet > 0 && (
      <Badge variant="secondary" className="mt-1">
        ${player.bet}
      </Badge>
    )}
  </div>
);

// --- Main Component ---

export default function PlayerControls() {
  const { state } = usePoker();
  const { players, currentPlayer, gameStage } = state;

  if (gameStage === 'pregame') {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {players.map((player, index) => {
        const isCurrent = player.id === currentPlayer;
        return (
          <div 
            key={player.id} 
            id={`${player.id}-controls`} 
            className={`absolute ${positions[index]} ${isCurrent ? 'pointer-events-auto' : ''}`}
          >
            {isCurrent ? (
              <ActionControls />
            ) : (
              <PlayerDisplay player={player} isCurrent={isCurrent} />
            )}
          </div>
        );
      })}
    </div>
  );
}
