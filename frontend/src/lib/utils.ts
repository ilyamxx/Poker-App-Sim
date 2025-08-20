import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const suitMap: { [key: string]: string } = {
  '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'
};

/**
 * Transforms a card like 'A♠' into the ASCII string 'As' for backend and logging.
 * This is the single source of truth for card formatting.
 * @param card The card string from the deck (e.g., 'K♥').
 * @returns The formatted card string (e.g., 'Kh').
 */
export function formatCard(card: string): string {
    const rank = card.slice(0, -1);
    const suit = suitMap[card.slice(-1)] || card.slice(-1).toLowerCase();
    // Use 'T' for 10 to match the required format
    const formattedRank = (rank === '10' ? 'T' : rank);
    return formattedRank + suit;
}
