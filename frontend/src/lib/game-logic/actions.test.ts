import { handleFold, handleCallCheck, handleBetRaise, handleAllIn } from './actions';
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

const createMockState = (players: Player[], currentPlayerId: string, overrides: Partial<PokerState> = {}): PokerState => ({
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

describe('Game Logic: Player Actions', () => {

  describe('handleFold', () => {
    it('should mark the current player as folded and set hasActed to true', () => {
      const players = [createMockPlayer({ id: 'p1' }), createMockPlayer({ id: 'p2' })];
      const initialState = createMockState(players, 'p1');
      const newState = handleFold(initialState);
      const foldedPlayer = newState.players.find(p => p.id === 'p1');
      expect(foldedPlayer?.status).toBe('folded');
      expect(foldedPlayer?.hasActed).toBe(true);
      expect(foldedPlayer?.lastAction).toBe('fold');
    });
  });

  describe('handleCallCheck', () => {
    it('should perform a call, updating player stack, bet, and pot', () => {
      const players = [createMockPlayer({ id: 'p1', stack: 500, bet: 0 })];
      const initialState = createMockState(players, 'p1', { currentBet: 100, pot: 150 });
      const newState = handleCallCheck(initialState);
      const callingPlayer = newState.players[0];
      expect(callingPlayer.stack).toBe(400);
      expect(callingPlayer.bet).toBe(100);
      expect(callingPlayer.lastAction).toBe('call');
      expect(newState.pot).toBe(250);
    });

    it('should perform a check, leaving stack and pot unchanged', () => {
      const players = [createMockPlayer({ id: 'p1', stack: 500, bet: 100 })];
      const initialState = createMockState(players, 'p1', { currentBet: 100, pot: 150 });
      const newState = handleCallCheck(initialState);
      const checkingPlayer = newState.players[0];
      expect(checkingPlayer.stack).toBe(500);
      expect(checkingPlayer.bet).toBe(100);
      expect(checkingPlayer.lastAction).toBe('check');
      expect(newState.pot).toBe(150);
    });

    it('should handle a call that results in an all-in', () => {
      const players = [createMockPlayer({ id: 'p1', stack: 50, bet: 0 })];
      const initialState = createMockState(players, 'p1', { currentBet: 100, pot: 150 });
      const newState = handleCallCheck(initialState);
      const allInPlayer = newState.players[0];
      expect(allInPlayer.stack).toBe(0);
      expect(allInPlayer.bet).toBe(50);
      expect(allInPlayer.status).toBe('all-in');
      expect(newState.pot).toBe(200);
    });
  });

  describe('handleBetRaise', () => {
    it('should perform a bet, updating state and resetting other players hasActed', () => {
      const players = [
        createMockPlayer({ id: 'p1', stack: 500, bet: 0 }),
        createMockPlayer({ id: 'p2', status: 'active', hasActed: true })
      ];
      const initialState = createMockState(players, 'p1', { currentBet: 0, pot: 30 });
      const newState = handleBetRaise(initialState, 100);
      const bettingPlayer = newState.players.find(p => p.id === 'p1');
      const otherPlayer = newState.players.find(p => p.id === 'p2');
      expect(bettingPlayer?.stack).toBe(400);
      expect(bettingPlayer?.bet).toBe(100);
      expect(newState.pot).toBe(130);
      expect(otherPlayer?.hasActed).toBe(false);
    });

    it('should perform a raise correctly', () => {
      const players = [createMockPlayer({ id: 'p1', stack: 500, bet: 20 })];
      const initialState = createMockState(players, 'p1', { currentBet: 20, pot: 50 });
      const newState = handleBetRaise(initialState, 80);
      const raisingPlayer = newState.players[0];
      expect(raisingPlayer.stack).toBe(440);
      expect(raisingPlayer.bet).toBe(80);
      expect(newState.pot).toBe(110);
    });

    it('should not change state if bet amount is less than current bet', () => {
      const players = [createMockPlayer({ id: 'p1', stack: 500, bet: 50 })];
      const initialState = createMockState(players, 'p1', { currentBet: 50, pot: 100 });
      const newState = handleBetRaise(initialState, 40);
      expect(newState).toEqual(initialState);
    });

    it('should not change state if raise amount is less than the minimum legal raise', () => {
        const players = [createMockPlayer({ id: 'p1', stack: 500, bet: 100 })];
        const initialState = createMockState(players, 'p1', { currentBet: 100, lastRaiseAmount: 40 });
        const newState = handleBetRaise(initialState, 120);
        expect(newState).toEqual(initialState);
      });
  });

  describe('handleAllIn', () => {
    it('should handle an all-in that is effectively a call', () => {
      const players = [createMockPlayer({ id: 'p1', stack: 50, bet: 0 })];
      const initialState = createMockState(players, 'p1', { currentBet: 100 });
      const newState = handleAllIn(initialState);
      const player = newState.players[0];
      expect(player.stack).toBe(0);
      expect(player.bet).toBe(50);
      expect(newState.pot).toBe(100);
    });

    it('should handle an all-in that is a raise', () => {
      const players = [
        createMockPlayer({ id: 'p1', stack: 200, bet: 0 }),
        createMockPlayer({ id: 'p2', hasActed: true })
      ];
      const initialState = createMockState(players, 'p1', { currentBet: 100 });
      const newState = handleAllIn(initialState);
      const player = newState.players.find(p => p.id === 'p1');
      const otherPlayer = newState.players.find(p => p.id === 'p2');
      expect(player?.stack).toBe(0);
      expect(player?.bet).toBe(200);
      expect(newState.currentBet).toBe(200);
      expect(otherPlayer?.hasActed).toBe(false);
    });
  });
});
