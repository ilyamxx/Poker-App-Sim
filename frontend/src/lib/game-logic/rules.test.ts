import { canFold, canCheck, canCall, canBet, canAllIn, canRaise, getMinRaiseAmount } from './rules';
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

const createMockState = (overrides: Partial<PokerState>): PokerState => ({
  handId: 'test-hand',
  players: [],
  initialPlayersState: [],
  deck: [],
  currentPlayer: 'player-1',
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

describe('Game Logic: Player Action Rules', () => {
  describe('canFold', () => {
    it('should always return true for an active player', () => {
      const player = createMockPlayer({});
      const state = createMockState({});
      expect(canFold()).toBe(true);
    });
  });

  describe('canCheck', () => {
    it('should return true when the player\'s bet matches the current bet', () => {
      const player = createMockPlayer({ bet: 20 });
      const state = createMockState({ currentBet: 20 });
      expect(canCheck(player, state)).toBe(true);
    });

    it('should return false when the player\'s bet is less than the current bet', () => {
      const player = createMockPlayer({ bet: 10 });
      const state = createMockState({ currentBet: 20 });
      expect(canCheck(player, state)).toBe(false);
    });
  });

  describe('canCall', () => {
    it('should return true when there is a bet to call and the player has a stack', () => {
      const player = createMockPlayer({ bet: 0, stack: 100 });
      const state = createMockState({ currentBet: 20 });
      expect(canCall(player, state)).toBe(true);
    });

    it('should return false when the player\'s bet matches the current bet', () => {
      const player = createMockPlayer({ bet: 20 });
      const state = createMockState({ currentBet: 20 });
      expect(canCall(player, state)).toBe(false);
    });

    it('should return false when the player has no stack', () => {
      const player = createMockPlayer({ bet: 0, stack: 0 });
      const state = createMockState({ currentBet: 20 });
      expect(canCall(player, state)).toBe(false);
    });
  });

  describe('canBet', () => {
    it('should return true when the current bet is 0', () => {
      const state = createMockState({ currentBet: 0 });
      expect(canBet(state)).toBe(true);
    });

    it('should return false when there is already a bet', () => {
      const state = createMockState({ currentBet: 20 });
      expect(canBet(state)).toBe(false);
    });
  });

  describe('canRaise', () => {
    it('should return true when the player can make a legal min-raise', () => {
      const player = createMockPlayer({ bet: 20, stack: 1000 });
      const state = createMockState({ currentBet: 40, lastRaiseAmount: 20 });
      expect(canRaise(player, state)).toBe(true);
    });

    it('should return false when there is no bet to raise', () => {
      const state = createMockState({ currentBet: 0 });
      const player = createMockPlayer({});
      expect(canRaise(player, state)).toBe(false);
    });

    it('should return false when the player does not have enough stack to make a min-raise', () => {
      const player = createMockPlayer({ bet: 20, stack: 30 });
      const state = createMockState({ currentBet: 40, lastRaiseAmount: 20 });
      expect(canRaise(player, state)).toBe(false);
    });
  });

  describe('canAllIn', () => {
    it('should return true when the player has a stack greater than 0', () => {
      const player = createMockPlayer({ stack: 100 });
      expect(canAllIn(player)).toBe(true);
    });

    it('should return false when the player has no stack', () => {
      const player = createMockPlayer({ stack: 0 });
      expect(canAllIn(player)).toBe(false);
    });
  });

  describe('getMinRaiseAmount', () => {
    it('should calculate the min raise based on the last raise amount', () => {
        const state = createMockState({ currentBet: 100, lastRaiseAmount: 40 });
        expect(getMinRaiseAmount(state)).toBe(140);
    });

    it('should calculate the min raise based on the big blind if no prior raise', () => {
        const state = createMockState({ currentBet: 20, lastRaiseAmount: 0, stakes: { bigBlind: 20, smallBlind: 10 } });
        expect(getMinRaiseAmount(state)).toBe(40);
    });
  });
});
