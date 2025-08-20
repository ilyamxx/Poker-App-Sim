/**
 * @file This component is responsible for displaying the chronological log of all actions
 * that have occurred during the current hand.
 */
"use client";

import { usePoker } from '@/context/PokerContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

export default function GameLog() {
  const { state } = usePoker();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  /**
   * An effect that automatically scrolls the log to the bottom whenever a new
   * log entry is added, ensuring the latest action is always visible.
   */
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Radix UI's ScrollArea nests the viewport, so we need to query for it.
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [state.logs]);

  return (
    <div className="bg-gray-800/70 rounded-lg p-4 h-full border border-poker-gold/10 grid grid-rows-[auto,1fr]">
      <h3 className="text-lg font-bold text-poker-gold mb-3 text-center">Game Log</h3>
      <div className="min-h-0">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-1 text-sm font-mono text-gray-300">
            {state.logs.map((log, index) => (
              <p key={index}>
                {log.message}
              </p>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
