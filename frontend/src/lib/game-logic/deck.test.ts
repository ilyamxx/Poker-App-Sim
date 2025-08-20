import { createDeck, shuffleDeck, dealCards } from './deck';

describe('Game Logic: Deck', () => {
  it('should create a standard 52-card deck', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
    const uniqueCards = new Set(deck);
    expect(uniqueCards.size).toBe(52);
  });

  it('should shuffle the deck into a different order', () => {
    const originalDeck = createDeck();
    const shuffledDeck = shuffleDeck([...originalDeck]);
    expect(shuffledDeck.length).toBe(52);
    expect(shuffledDeck).not.toEqual(originalDeck);
    expect(new Set(shuffledDeck)).toEqual(new Set(originalDeck));
  });

  it('should deal a specified number of cards from the deck', () => {
    const deck = createDeck();
    const deckCopy = [...deck];
    
    const dealtCards = dealCards(deckCopy, 2);
    expect(dealtCards.length).toBe(2);
    expect(dealtCards).toEqual([deck[0], deck[1]]);
    expect(deckCopy.length).toBe(50);
  });
});
