/**
 * @file This module contains utility functions for creating, shuffling, and dealing a deck of cards.
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Creates a standard 52-card deck.
 * @returns An array of 52 card strings (e.g., 'A♠', 'K♥').
 */
export function createDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

/**
 * Shuffles a deck of cards in place using the Fisher-Yates algorithm.
 * @param deck The deck to be shuffled.
 * @returns The shuffled deck.
 */
export function shuffleDeck(deck: string[]): string[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
  }
  return deck;
}

/**
 * Deals a specified number of cards from the top of the deck.
 * This function mutates the original deck array.
 * @param deck The deck to deal from.
 * @param count The number of cards to deal.
 * @returns An array of the dealt cards.
 */
export function dealCards(deck: string[], count: number): string[] {
  return deck.splice(0, count);
}
