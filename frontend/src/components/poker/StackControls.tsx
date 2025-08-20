/**
 * @file This component provides the UI for setting the initial stack size
 * and for starting or resetting the game.
 */
"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePoker } from '@/context/PokerContext';
import { useState } from 'react';
import { Action } from '@/types/pokerTypes';

export default function StackControls() {
  const { state, dispatch } = usePoker();
  const [stackSize, setStackSize] = useState<number>(state.initialStackSize);
  
  const isGameStarted = state.players.length > 0;

  /**
   * Dispatches the action to set up a new hand with the specified stack size.
   */
  const handleStartGame = () => {
    const action: Action = { 
      type: 'START_NEW_HAND', 
      payload: { 
        initialStackSize: stackSize,
        stakes: state.stakes 
      } 
    };
    dispatch(action);
  };

  /**
   * Dispatches the action to reset the game to its pre-game state.
   */
  const handleResetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="mb-4 p-4 bg-poker-blue/80 backdrop-blur-sm rounded-xl shadow-xl border-2 border-poker-gold/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center w-full md:w-auto">
          {/* FIX: Changed label for better clarity */}
          <span className="text-poker-gold mr-2 whitespace-nowrap">Starting Stack:</span>
          <Input
            type="number"
            value={stackSize}
            onChange={(e) => setStackSize(Number(e.target.value))}
            className="w-28 mr-2"
            disabled={isGameStarted}
            step="100"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {isGameStarted ? (
            <Button 
              variant="destructive"
              className="w-full md:w-auto"
              onClick={handleResetGame}
            >
              Reset Game
            </Button>
          ) : (
            <Button 
              variant="default" 
              className="w-full md:w-auto bg-poker-gold text-black hover:bg-yellow-500"
              onClick={handleStartGame}
            >
              Start Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
