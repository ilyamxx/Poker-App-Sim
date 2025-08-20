/**
 * @file This component renders the central poker table, including the community cards,
 * the pot, and the individual seats for each player.
 */
"use client";

import { usePoker } from '@/context/PokerContext';
import { Badge } from '@/components/ui/badge';
import PlayingCard from '@/components/ui/playing-card';
import { cn } from "@/lib/utils";
import { Player } from '@/types/pokerTypes';


const playerPositions = [
  'bottom-[5%] left-1/2 -translate-x-1/2', // Player 1 (Dealer)
  'bottom-[25%] left-[10%]',                // Player 2 (SB)
  'top-[25%] left-[10%]',                    // Player 3 (BB)
  'top-[5%] left-1/2 -translate-x-1/2',      // Player 4 (UTG)
  'top-[25%] right-[10%]',                   // Player 5 (HJ)
  'bottom-[25%] right-[10%]',                // Player 6 (CO)
];

/**
 * A sub-component responsible for rendering a single player's seat at the table,
 * including their name, stack, cards, and current bet.
 */
const PlayerSeat = ({ player, positionClass, isCurrent }: { player: Player, positionClass: string, isCurrent: boolean }) => (
  <div className={`absolute ${positionClass} transition-all duration-300`}>
    <div className={cn(
      "bg-poker-blue/80 p-2 md:p-3 rounded-lg border-2 min-w-[120px] md:min-w-[160px] transition-all shadow-lg",
      {
        "border-poker-gold ring-2 ring-poker-gold": isCurrent,
        "border-poker-gold/30": !isCurrent,
        "opacity-40": player.status === 'folded',
      }
    )}>
      <div className="flex justify-between items-center mb-1">
        <div className="text-poker-gold font-bold truncate text-sm md:text-base">{player.name}</div>
        {player.position && <Badge variant="secondary" className="scale-90 md:scale-100">{player.position.toUpperCase()}</Badge>}
      </div>
      
      <div className="text-white font-mono text-base md:text-lg mb-2">${player.stack.toLocaleString()}</div>
      
      <div className="flex gap-1">
        <PlayingCard card={player.cards?.[0] || null} revealed={isCurrent || player.status === 'all-in'} className="w-7 h-10 md:w-8 md:h-12" />
        <PlayingCard card={player.cards?.[1] || null} revealed={isCurrent || player.status === 'all-in'} className="w-7 h-10 md:w-8 md:h-12" />
      </div>
    </div>

    {player.bet > 0 && (
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/60 px-2 md:px-3 py-1 rounded-full border border-poker-gold/50">
        <span className="text-poker-gold font-mono text-xs md:text-sm">${player.bet}</span>
      </div>
    )}
  </div>
);

// --- Main Component ---

export default function PokerTable() {
  const { state } = usePoker();

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-[2/1] bg-green-800 rounded-full border-8 border-poker-blue/50 p-4">
      {/* Community Cards */}
      <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center gap-1 md:gap-2">
        {state.communityCards.map((card, index) => (
          <PlayingCard key={index} card={card} className="w-10 h-16 md:w-16 md:h-24" />
        ))}
      </div>
      
      {/* Player Seats */}
      {state.players.map((player, index) => (
        <PlayerSeat 
          key={player.id} 
          player={player} 
          positionClass={playerPositions[index]}
          isCurrent={player.id === state.currentPlayer}
        />
      ))}
      
      {/* Pot Display */}
      <div className="absolute bottom-1/2 translate-y-[150%] left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full border border-poker-gold/30">
        <div className="text-poker-gold font-bold text-base md:text-lg">
          Pot: ${state.pot.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
