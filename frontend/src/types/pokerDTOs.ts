// This file defines the Data Transfer Objects (DTOs) for API communication.

/**
 * Represents the data for a single player sent to the backend.
 * Note the snake_case to match the Python dataclass.
 */
export interface PlayerDTO {
    id: string;
    name: string;
    starting_stack: number;
    cards: string[] | null;
    position: string;
  }
  
  /**
   * Represents the complete payload for creating a new hand history.
   * This must exactly match the backend's `HandCreate` model.
   */
  export interface HandCreateDTO {
    players: PlayerDTO[];
    actions: string[];
    config: {
      sb: number;
      bb: number;
      ante: number;
    };
  }
  