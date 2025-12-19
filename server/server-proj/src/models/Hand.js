import Card from './Card.js';

export default class Hand {
    constructor() {
        this.cards = [];
    }

    addCard(card) {
        if (!(card instanceof Card)) {
            throw new Error('Only Card instances can be added to Hand');
        }

        if (this.cards.length >= 2) {
            throw new Error('Hand can only contain 2 cards');
        }

        this.cards.push(card);
    }

    getCards() {
        return this.cards;
    }

    clear() {
        this.cards = [];
    }
}