"use client";

import { PokerProvider} from '@/context/PokerContext';
import PokerTable from '@/components/poker/PokerTable';
import StackControls from '@/components/poker/StackControls';
import ActionControls from '@/components/poker/ActionControls';
import GameLog from '@/components/poker/GameLog';
import HandHistory from '@/components/poker/HandHistory';

function PokerGame() {

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-b from-gray-900 via-green-900 to-gray-900 text-white">
      <header className="text-center py-4">
        <h1 className="text-3xl font-bold text-poker-gold tracking-wider">
          Poker Simulator
        </h1>
      </header>
      
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <StackControls />
      </div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 mt-4">
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <GameLog />
        </div>
        <div className="lg:col-span-6 flex flex-col min-h-0">
          {/* REFACTOR: This container now centers the table perfectly */}
          <div className="bg-poker-blue/50 backdrop-blur-sm rounded-xl p-2 md:p-4 shadow-2xl border-2 border-poker-gold/20 flex flex-col justify-center items-center flex-1">
            <PokerTable />
          </div>
          <div className="mt-4">
            <ActionControls />
          </div>
        </div>
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <HandHistory />
        </div>
      </div>
      
      <footer className="py-2 text-center text-poker-gold/60 text-xs bg-gray-900/50 mt-4">
        Poker Simulator © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <PokerProvider>
      <PokerGame />
    </PokerProvider>
  );
}
