/**
 * @file This module acts as the interface for communicating with the backend's hand history API.
 * It is responsible for all network requests related to saving and fetching hand data.
 */
import { PokerState, HandHistoryEntry } from '@/types/pokerTypes';
import { toHandCreateDTO } from '@/lib/mappers/hand.mapper';

/**
 * Saves a completed hand to the backend by sending a POST request.
 * @param state The final PokerState of the hand to save.
 * @returns The saved hand data from the backend, including calculated winnings, or null if an error occurs.
 */
export async function saveHandHistory(state: PokerState): Promise<HandHistoryEntry | null> {
  const payload = toHandCreateDTO(state);

  try {
    const response = await fetch('http://localhost:8000/api/v1/hands/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData.detail)}`);
    }

    const result: HandHistoryEntry = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to save hand history:", error);
    return null;
  }
}
