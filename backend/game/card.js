export class Card {
  constructor(suit, rank, value, id) {
    this.suit = suit;
    this.rank = rank;
    this.value = value;
    this.id = id;
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

