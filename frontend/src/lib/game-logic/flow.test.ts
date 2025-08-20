import { getNextPlayerId, isRoundOver } from './flow';
import { PokerState, Player } from '@/types/pokerTypes';

const createMockPlayer = (overrides: Partial<Player>): Player => ({
  id: 'player-1',
  name: 'Player 1',
  stack: 1000,
  cards: ['As', 'Ks'],
  position: 'utg',
  status: 'active',
  bet: 0,
  hasActed: false,
  lastAction: null,
  ...overrides,
});

const createMockState = (players: Player[], currentPlayerId: string | null, overrides: Partial<PokerState> = {}): PokerState => ({
  handId: 'test-hand',
  players,
  initialPlayersState: JSON.parse(JSON.stringify(players)),
  deck: [],
  currentPlayer: currentPlayerId,
  pot: 50,
  communityCards: [],
  currentBet: 20,
  lastRaiserId: 'player-bb',
  lastRaiseAmount: 20,
  gameStage: 'preflop',
  handHistory: [],
  logs: [],
  actionHistory: [],
  stakes: { smallBlind: 10, bigBlind: 20 },
  initialStackSize: 1000,
  ...overrides,
});


describe('Game Logic: Flow', () => {

  describe('getNextPlayerId', () => {
    it('should return the next active player in order', () => {
      const players = [
        createMockPlayer({ id: 'p1' }),
        createMockPlayer({ id: 'p2' }),
        createMockPlayer({ id: 'p3' }),
      ];
      const state = createMockState(players, 'p1');
      expect(getNextPlayerId(state)).toBe('p2');
    });

    it('should skip a folded player', () => {
      const players = [
        createMockPlayer({ id: 'p1' }),
        createMockPlayer({ id: 'p2', status: 'folded' }),
        createMockPlayer({ id: 'p3' }),
      ];
      const state = createMockState(players, 'p1');
      expect(getNextPlayerId(state)).toBe('p3');
    });

    it('should skip a player with no stack (all-in)', () => {
      const players = [
        createMockPlayer({ id: 'p1' }),
        createMockPlayer({ id: 'p2', stack: 0 }),
        createMockPlayer({ id: 'p3' }),
      ];
      const state = createMockState(players, 'p1');
      expect(getNextPlayerId(state)).toBe('p3');
    });

    it('should wrap around to the first player in the array', () => {
      const players = [
        createMockPlayer({ id: 'p1' }),
        createMockPlayer({ id: 'p2' }),
        createMockPlayer({ id: 'p3' }),
      ];
      const state = createMockState(players, 'p3');
      expect(getNextPlayerId(state)).toBe('p1');
    });

    it('should return null if no active players with stacks are left', () => {
      const players = [
        createMockPlayer({ id: 'p1', status: 'folded' }),
        createMockPlayer({ id: 'p2', stack: 0 }),
      ];
      const state = createMockState(players, 'p1');
      expect(getNextPlayerId(state)).toBeNull();
    });
  });

  describe('isRoundOver', () => {
    it('should return true when only one player is not folded', () => {
      const players = [
        createMockPlayer({ id: 'p1', hasActed: true }), 
        createMockPlayer({ id: 'p2', status: 'folded' }),
        createMockPlayer({ id: 'p3', status: 'folded' }),
      ];
      const state = createMockState(players, 'p1');
      expect(isRoundOver(state)).toBe(true);
    });

    it('should return true when all active players have acted and bet amounts are equal', () => {
      const players = [
        createMockPlayer({ id: 'p1', status: 'active', bet: 50, hasActed: true }),
        createMockPlayer({ id: 'p2', status: 'folded' }),
        createMockPlayer({ id: 'p3', status: 'active', bet: 50, hasActed: true }),
      ];
      const state = createMockState(players, 'p3', { currentBet: 50 });
      expect(isRoundOver(state)).toBe(true);
    });

    it('should return true when one active player remains against multiple all-in players', () => {
      const players = [
        createMockPlayer({ id: 'p1', status: 'all-in', bet: 100, hasActed: true }),
        createMockPlayer({ id: 'p2', status: 'all-in', bet: 100, hasActed: true }),
        createMockPlayer({ id: 'p3', status: 'active', bet: 100, hasActed: true }), // The only one who can still act
      ];
      const state = createMockState(players, 'p3', { currentBet: 100 });
      expect(isRoundOver(state)).toBe(true);
    });

    it('should return false if an active player has not yet acted', () => {
      const players = [
        createMockPlayer({ id: 'p1', status: 'active', bet: 50, hasActed: true }),
        createMockPlayer({ id: 'p2', status: 'active', bet: 20, hasActed: false }),
      ];
      const state = createMockState(players, 'p2', { currentBet: 50 });
      expect(isRoundOver(state)).toBe(false);
    });

    it('should return false if bets are not settled, even if all have acted', () => {
      const players = [
        createMockPlayer({ id: 'p1', status: 'active', bet: 20, hasActed: true }),
        createMockPlayer({ id: 'p2', status: 'active', bet: 80, hasActed: true }),
      ];
      const state = createMockState(players, 'p1', { currentBet: 80 });
      expect(isRoundOver(state)).toBe(false);
    });

    it('should return false for the "big blind option" scenario', () => {
      const players = [
        createMockPlayer({ id: 'p1', status: 'folded' }),
        createMockPlayer({ id: 'p2', status: 'folded' }),
        createMockPlayer({ id: 'p3', status: 'active', bet: 20, hasActed: false }), // BB
      ];
      const state = createMockState(players, 'p3', { currentBet: 20 });
      expect(isRoundOver(state)).toBe(false);
    });
  });
});
