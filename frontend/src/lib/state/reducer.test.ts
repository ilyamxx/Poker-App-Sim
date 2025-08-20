import { pokerReducer } from './reducer';
import { createInitialState } from './initialState';
import { Player, PokerState, Action } from '@/types/pokerTypes';

// --- Test Setup: Mock Data Factories ---

const createMockPlayer = (overrides: Partial<Player>): Player => ({
  id: 'player-1', name: 'Player 1', stack: 1000, cards: ['As', 'Ks'], position: 'utg',
  status: 'active', bet: 0, hasActed: false, lastAction: null, ...overrides,
});

const createTestState = (players: Player[], currentPlayerId: string, overrides: Partial<PokerState> = {}): PokerState => ({
  ...createInitialState(),
  players,
  initialPlayersState: JSON.parse(JSON.stringify(players)),
  currentPlayer: currentPlayerId,
  gameStage: 'preflop',
  deck: ['Ad', 'Kd', 'Qd', 'Jd', 'Td', '9d', '8d', '7d'],
  ...overrides,
});

// Helper to guarantee immutability in tests
const deepFreeze = <T extends object>(obj: T): T => {
  Object.keys(obj).forEach(prop => {
    const value = (obj as Record<string, unknown>)[prop];
    if (value && typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
};

// --- Test Suite ---

describe('Poker Reducer Integration Tests', () => {

  it('should not mutate the input state object', () => {
    const players = [createMockPlayer({ id: 'p1', bet: 0, stack: 500 })];
    const initialState = createTestState(players, 'p1', { currentBet: 100, pot: 150 });
    
    deepFreeze(initialState);
    
    const action: Action = { type: 'HANDLE_CALL_CHECK', payload: { playerId: 'p1' } };
    expect(() => pokerReducer(initialState, action)).not.toThrow();
  });

  describe('START_NEW_HAND Action', () => {
    it('should correctly set up a new hand', () => {
      const initialState = createInitialState();
      const action: Action = { type: 'START_NEW_HAND', payload: { initialStackSize: 2000, stakes: { smallBlind: 20, bigBlind: 40 } } };
      const newState = pokerReducer(initialState, action);
      expect(newState.players.length).toBe(6);
      expect(newState.gameStage).toBe('preflop');
      expect(newState.pot).toBe(60);
    });
  });

  describe('Player Actions', () => {
    it('HANDLE_FOLD moves to showdown when only one player is left (fold-to-win)', () => {
      const players = [
        createMockPlayer({ id: 'p1', name: 'P1' }),
        createMockPlayer({ id: 'p2', name: 'P2' }),
      ];
      const initialState = createTestState(players, 'p2', { pot: 200 });
      const action: Action = { type: 'HANDLE_FOLD', payload: { playerId: 'p2' } };
      const newState = pokerReducer(initialState, action);
      expect(newState.gameStage).toBe('showdown');
      const log = newState.logs.map(l => l.message).join(' | ');
      expect(log).toContain('P2 folds');
      expect(log).toContain('P1 wins the pot of 200');
    });

    it('HANDLE_BET_RAISE reopens action and resets hasActed for other players', () => {
        const players = [
          createMockPlayer({ id: 'p1', name: 'P1', hasActed: true, bet: 20 }),
          createMockPlayer({ id: 'p2', name: 'P2', hasActed: true, bet: 20 }),
          createMockPlayer({ id: 'p3', name: 'P3', hasActed: false, bet: 20 }),
        ];
        const initialState = createTestState(players, 'p3', { currentBet: 20, lastRaiseAmount: 20 });
        const action: Action = { type: 'HANDLE_BET_RAISE', payload: { playerId: 'p3', amount: 80 } };
        const newState = pokerReducer(initialState, action);
        expect(newState.currentBet).toBe(80);
        expect(newState.lastRaiserId).toBe('p3');
        expect(newState.players.find(p => p.id === 'p1')?.hasActed).toBe(false);
        expect(newState.players.find(p => p.id === 'p2')?.hasActed).toBe(false);
        expect(newState.players.find(p => p.id === 'p3')?.hasActed).toBe(true);
      });

    it('HANDLE_BET_RAISE below the minimum valid raise should be a no-op', () => {
        const players = [createMockPlayer({ id: 'p1', bet: 100, stack: 500 })];
        const initialState = createTestState(players, 'p1', { currentBet: 100, lastRaiseAmount: 40 });
        const action: Action = { type: 'HANDLE_BET_RAISE', payload: { playerId: 'p1', amount: 120 } };
        const newState = pokerReducer(initialState, action);
        expect(newState).toEqual(initialState);
    });

    it('HANDLE_ALL_IN that is a raise should reopen action', () => {
        const players = [
          createMockPlayer({ id: 'p1', stack: 120, bet: 20 }),
          createMockPlayer({ id: 'p2', hasActed: true, bet: 100 }),
        ];
        const initialState = createTestState(players, 'p1', { currentBet: 100 });
        const action: Action = { type: 'HANDLE_ALL_IN', payload: { playerId: 'p1' } };
        const newState = pokerReducer(initialState, action);
        expect(newState.currentBet).toBe(140); // 120 stack + 20 bet
        expect(newState.lastRaiserId).toBe('p1');
        expect(newState.players.find(p => p.id === 'p2')?.hasActed).toBe(false);
      });
  });

  describe('Game Flow Actions', () => {
    it('ADVANCE_GAME_STAGE should reset bets and player action status', () => {
      const players = [
        createMockPlayer({ id: 'p1', bet: 40, hasActed: true }),
        createMockPlayer({ id: 'p2', bet: 40, hasActed: true }),
      ];
      const initialState = createTestState(players, 'p2', { gameStage: 'preflop', currentBet: 40 });
      const action: Action = { type: 'ADVANCE_GAME_STAGE' };
      const newState = pokerReducer(initialState, action);
      expect(newState.gameStage).toBe('flop');
      expect(newState.communityCards.length).toBe(3);
      expect(newState.currentBet).toBe(0);
      expect(newState.lastRaiserId).toBeNull();
      expect(newState.players.every(p => p.bet === 0)).toBe(true);
      expect(newState.players.every(p => p.hasActed === false)).toBe(true);
    });
  });
});
