import { Deck } from './deck.js';
import { Player } from './player.js';
import { detectCombination, beats } from './combination.js';

export class Game {
  constructor() {
    this.player = null;
    this.ai = null;
    this.hiddenCards = [];
    this.hiddenCount = 6;
    this.lastPlay = [];
    this.lastPlayer = null;
    this.winner = null;
    this.gameId = null;
  }

  newGame() {
    const deck = new Deck();
    const deal = deck.dealWithHiddenCards();
    
    this.player = new Player('player', deal.playerCards);
    this.ai = new Player('ai', deal.aiCards);
    this.hiddenCards = deal.hiddenCards;
    this.hiddenCount = deal.hiddenCount;
    this.lastPlay = [];
    this.lastPlayer = null;
    this.winner = null;
    this.gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.player.hand.sort((a, b) => a.value - b.value);
    this.ai.hand.sort((a, b) => a.value - b.value);
    
    return {
      gameId: this.gameId,
      playerHand: this.player.hand.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value })),
      aiHandSize: this.ai.hand.length,
      lastPlay: [],
      lastPlayer: null,
      winner: null,
      hiddenCount: this.hiddenCount
    };
  }

  playMove(playerId, cardIds) {
    if (this.winner) {
      throw new Error('Game is already over');
    }

    const player = playerId === 'player' ? this.player : this.ai;
    if (!player) {
      throw new Error('Invalid player');
    }

    const cardsToPlay = cardIds
      .map(id => player.hand.find(c => c.id === id))
      .filter(c => c !== undefined);

    if (cardsToPlay.length !== cardIds.length) {
      throw new Error('Some cards not found in hand');
    }

    const combo = detectCombination(cardsToPlay);
    if (!combo) {
      throw new Error('Invalid combination');
    }

    if (this.lastPlay.length > 0 && this.lastPlayer !== playerId) {
      if (!beats(cardsToPlay, this.lastPlay)) {
        throw new Error('Play must beat the last combination or pass');
      }
    }

    player.removeCards(cardsToPlay);
    
    this.lastPlay = cardsToPlay;
    this.lastPlayer = playerId;

    if (player.hand.length === 0) {
      this.winner = playerId;
    }

    return this.getState();
  }

  pass(playerId) {
    if (this.winner) {
      throw new Error('Game is already over');
    }

    if (this.lastPlay.length === 0) {
      throw new Error('Cannot pass when starting - must play a card');
    }

    if (this.lastPlayer === playerId) {
      this.lastPlay = [];
      this.lastPlayer = null;
    }

    return this.getState();
  }

  getState() {
    return {
      gameId: this.gameId,
      playerHand: this.player.hand.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value })),
      aiHandSize: this.ai.hand.length,
      lastPlay: this.lastPlay.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value })),
      lastPlayer: this.lastPlayer,
      winner: this.winner,
      playerHandSize: this.player.hand.length,
      hiddenCount: this.hiddenCount
    };
  }
}

