/**
 * @file This component renders the set of action buttons (Fold, Check, Bet, etc.)
 * for the current player and handles the bet/raise amount slider.
 */
"use client";

import { Button } from '@/components/ui/button';
import { usePoker } from '@/context/PokerContext';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { canFold, canCheck, canCall, canBet, canRaise, canAllIn, getMinRaiseAmount } from '@/lib/game-logic/rules';
import { Action } from '@/types/pokerTypes';

export default function ActionControls() {
  const { state, dispatch } = usePoker();
  const [betAmount, setBetAmount] = useState<number>(state.stakes.bigBlind * 2);

  const isGameActive = state.gameStage !== 'pregame';
  const currentPlayer = state.players.find(p => p.id === state.currentPlayer);

  const possibleActions = useMemo(() => {
    if (!currentPlayer) {
      return { fold: false, check: false, call: false, bet: false, raise: false, allIn: false };
    }
    return {
      fold: canFold(),
      check: canCheck(currentPlayer, state),
      call: canCall(currentPlayer, state),
      bet: canBet(state),
      raise: canRaise(currentPlayer, state),
      allIn: canAllIn(currentPlayer),
    };
  }, [currentPlayer, state]);

  useEffect(() => {
    if (possibleActions.raise) {
      const minRaise = getMinRaiseAmount(state);
      setBetAmount(minRaise);
    } else if (possibleActions.bet) {
      setBetAmount(state.stakes.bigBlind);
    }
  }, [state.currentPlayer, possibleActions, state]);

  const handleBetChange = (value: number) => {
    if (!currentPlayer) return;
    
    let minBet = state.stakes.bigBlind;
    if (possibleActions.raise) {
      minBet = getMinRaiseAmount(state);
    }

    const newAmount = betAmount + value;
    const maxBet = currentPlayer.stack + currentPlayer.bet;
    const constrainedAmount = Math.max(minBet, Math.min(newAmount, maxBet));
    const roundedAmount = Math.ceil(constrainedAmount / state.stakes.bigBlind) * state.stakes.bigBlind;
    setBetAmount(roundedAmount);
  };

  const handleAction = (actionType: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in') => {
    if (!currentPlayer || !isGameActive) return;

    if ((actionType === 'bet' || actionType === 'raise') && betAmount > currentPlayer.stack + currentPlayer.bet) {
      return;
    }

    let action: Action | null = null;
    switch (actionType) {
      case 'fold':
        action = { type: 'HANDLE_FOLD', payload: { playerId: currentPlayer.id } };
        break;
      case 'check':
      case 'call':
        action = { type: 'HANDLE_CALL_CHECK', payload: { playerId: currentPlayer.id } };
        break;
      case 'bet':
      case 'raise':
        action = { type: 'HANDLE_BET_RAISE', payload: { playerId: currentPlayer.id, amount: betAmount } };
        break;
      case 'all-in':
        action = { type: 'HANDLE_ALL_IN', payload: { playerId: currentPlayer.id } };
        break;
    }

    if (action) {
      dispatch(action);
    }
  };

  return (
    <div className="p-4 bg-poker-blue/80 rounded-lg border border-poker-gold/30 shadow-lg">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <Button onClick={() => handleAction('fold')} disabled={!isGameActive || !possibleActions.fold} variant="destructive" className="h-12 font-bold capitalize">Fold</Button>
        <Button onClick={() => handleAction('check')} disabled={!isGameActive || !possibleActions.check} variant="secondary" className="h-12 font-bold capitalize">Check</Button>
        <Button onClick={() => handleAction('call')} disabled={!isGameActive || !possibleActions.call} className={cn("h-12 font-bold capitalize", possibleActions.call ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-gray-700 opacity-50 text-gray-400")}>Call</Button>
        <Button onClick={() => handleAction('bet')} disabled={!isGameActive || !possibleActions.bet} className={cn("h-12 font-bold capitalize", possibleActions.bet ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-gray-700 opacity-50 text-gray-400")}>Bet</Button>
        <Button onClick={() => handleAction('raise')} disabled={!isGameActive || !possibleActions.raise} className={cn("h-12 font-bold capitalize", possibleActions.raise ? "bg-green-600 text-white hover:bg-green-500" : "bg-gray-700 opacity-50 text-gray-400")}>Raise</Button>
        <Button onClick={() => handleAction('all-in')} disabled={!isGameActive || !possibleActions.allIn} className={cn("h-12 font-bold capitalize", possibleActions.allIn ? "bg-purple-700 text-white hover:bg-purple-600" : "bg-gray-700 opacity-50 text-gray-400")}>All-in</Button>
      </div>
      
      <div className="flex items-center justify-center">
        <Button 
          variant="outline"
          className="bg-gray-700 text-white border-poker-gold/30 hover:bg-gray-600 w-12 h-12 text-lg"
          onClick={() => handleBetChange(-state.stakes.bigBlind)}
          disabled={!isGameActive}
        >
          -
        </Button>
        
        <div className="mx-4 text-center flex-1 max-w-xs">
          <div className="text-2xl font-bold text-poker-gold">${betAmount.toLocaleString()}</div>
          <div className="text-sm text-gray-300">
            {(betAmount / state.stakes.bigBlind).toFixed(1)} BB
          </div>
        </div>
        
        <Button 
          variant="outline"
          className="bg-gray-700 text-white border-poker-gold/30 hover:bg-gray-600 w-12 h-12 text-lg"
          onClick={() => handleBetChange(state.stakes.bigBlind)}
          disabled={!isGameActive}
        >
          +
        </Button>
      </div>
    </div>
  );
}
