import { Card } from './card.js';

export class Deck {
  constructor() {
    this.cards = Deck._makeFullDeck();
  }

  static _makeFullDeck() {
    const suits = ['♠','♥','♦','♣'];
    const ranks = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
    const res = [];
    let id = 0;
    
    ranks.forEach((rank, i) => {
      suits.forEach(s => {
        res.push(new Card(s, rank, 3 + i, `${id++}`));
      });
    });
    
    res.push(new Card('', 'Joker', 16, `${id++}`));
    res.push(new Card('', 'JOKER', 17, `${id++}`));
    
    return res;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  dealWithHiddenCards() {
    this.shuffle();
    
    const hiddenCounts = [10, 12, 14, 16, 18, 20];
    const hiddenCount = hiddenCounts[Math.floor(Math.random() * hiddenCounts.length)];
    
    const hidden = [];
    const pickIndices = new Set();
    while (pickIndices.size < hiddenCount) {
      pickIndices.add(Math.floor(Math.random() * this.cards.length));
    }
    
    const newDeck = [];
    this.cards.forEach((c, idx) => {
      if (pickIndices.has(idx)) {
        hidden.push(c);
      } else {
        newDeck.push(c);
      }
    });
    
    this.cards = newDeck;
    
    const remainingCount = this.cards.length;
    const cardsPerPlayer = Math.floor(remainingCount / 2);
    const p1 = this.cards.slice(0, cardsPerPlayer);
    const p2 = this.cards.slice(cardsPerPlayer, cardsPerPlayer * 2);
    
    return { playerCards: p1, aiCards: p2, hiddenCards: hidden, hiddenCount };
  }
}

