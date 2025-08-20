/**
 * @file This component fetches and displays a log of previously completed hands,
 * allowing users to review past game play.
 */
"use client";

import { useEffect } from 'react';
import { usePoker } from '@/context/PokerContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HandHistoryEntry } from '@/types/pokerTypes';

// --- Sub-components for formatting each line of the history entry ---

/** Displays the hand ID. */
const HandId = ({ id }: { id: string }) => (
  <p className="font-bold">Hand #{id}</p>
);

/** Displays the initial stack size and player positions (Dealer, SB, BB). */
const StackAndPositions = ({ hand }: { hand: HandHistoryEntry }) => {
  const initialStack = hand.players[0]?.starting_stack ?? 0;
  const dealer = hand.players.find(p => p.position === 'dealer');
  const sbPlayer = hand.players.find(p => p.position === 'smallblind');
  const bbPlayer = hand.players.find(p => p.position === 'bigblind');

  const parts = [`Stack ${initialStack}`];
  if (dealer) parts.push(`Dealer: ${dealer.name}`);
  if (sbPlayer) parts.push(`${sbPlayer.name} Small blind`);
  if (bbPlayer) parts.push(`${bbPlayer.name} Big blind`);

  return <p>{parts.join('; ')}</p>;
};

/** Displays the hole cards for each player. */
const Hands = ({ players }: { players: HandHistoryEntry['players'] }) => {
  const sortedPlayers = [...players].sort((a, b) => 
    parseInt(a.name.replace('Player ', '')) - parseInt(b.name.replace('Player ', ''))
  );
  const handsString = sortedPlayers.map(p => {
    const formattedCards = Array.isArray(p.cards) ? p.cards.join('') : '??';
    return `${p.name}: ${formattedCards}`;
  }).join('; ');
  return <p>Hands: {handsString}</p>;
};

/** Displays the formatted sequence of actions for the hand. */
const Actions = ({ actions }: { actions: string[] }) => {
  const formatted = actions.join(':').replace(/:(?=[a-zA-Z]{2,})/g, ' ');
  return <p className="break-all">Actions: {formatted}</p>;
};

/** Displays the final winnings for each player. */
const Winnings = ({ hand }: { hand: HandHistoryEntry }) => {
  if (!hand.winnings) return <p>Winnings: N/A</p>;
  
  const sortedPlayers = [...hand.players].sort((a, b) => 
    parseInt(a.name.replace('Player ', '')) - parseInt(b.name.replace('Player ', ''))
  );
  const winningsString = sortedPlayers.map(player => {
    const amount = hand.winnings![player.id] ?? 0;
    return `${player.name}: ${amount}`;
  }).join('; ');
  return <p>Winnings: {winningsString}</p>;
};

// --- Main Component ---

export default function HandHistory() {
  const { state, dispatch } = usePoker();

  /**
   * Effect to fetch the hand history from the backend when the component mounts.
   */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/hands/');
        if (!response.ok) {
          throw new Error('Failed to fetch hand history');
        }
        const data: HandHistoryEntry[] = await response.json();
        dispatch({ type: 'SET_HAND_HISTORY', payload: data });
      } catch (error) {
        console.error("Error fetching hand history:", error);
      }
    };
    fetchHistory();
  }, [dispatch]);

  return (
    <div className="bg-gray-800/70 rounded-lg p-4 h-full border border-poker-gold/10 grid grid-rows-[auto,1fr]">
      <h3 className="text-lg font-bold text-poker-gold mb-3 text-center">Hand History</h3>
      <div className="min-h-0">
        <ScrollArea className="h-full pr-4">
          {state.handHistory.length === 0 ? (
            <div className="text-center text-gray-400 mt-4">No hands completed yet.</div>
          ) : (
            <div className="space-y-4">
              {[...state.handHistory].reverse().map((hand) => (
                <div key={hand.id} className="bg-gray-700/50 p-3 rounded-md text-xs font-mono">
                  <HandId id={hand.id} />
                  <StackAndPositions hand={hand} />
                  <Hands players={hand.players} />
                  <Actions actions={hand.actions} />
                  <Winnings hand={hand} />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
