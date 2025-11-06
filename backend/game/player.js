export class Player {
  constructor(name, hand = []) {
    this.name = name;
    this.hand = hand;
  }

  removeCards(cardsToRemove) {
    const ids = new Set(cardsToRemove.map(c => c.id));
    this.hand = this.hand.filter(c => !ids.has(c.id));
  }
}

