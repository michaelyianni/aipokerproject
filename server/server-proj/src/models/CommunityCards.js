import Card from './Card.js';

export default class CommunityCards {
    constructor() {
        this.cards = [];
    }

    addFlop(card1, card2, card3) {
       
        this.validateCard(card1);
        this.validateCard(card2);
        this.validateCard(card3);
        
        if (this.cards.length !== 0) {
            throw new Error('Flop can only be added to an empty community cards');
        }

        this.cards.push(card1, card2, card3);
    }

    addTurn(card) {
        this.validateCard(card);
        if (this.cards.length !== 3) {
            throw new Error('Turn can only be added after the flop');
        }
        this.cards.push(card);
    }

    addRiver(card) {
        this.validateCard(card);
        if (this.cards.length !== 4) {
            throw new Error('River can only be added after the turn');
        }
        this.cards.push(card);
    }

    validateCard(card) {
        if (!(card instanceof Card)) {
            throw new Error('Only Card instances can be added to CommunityCards');
        }
        if (this.cards.includes(card)) {
            throw new Error('Card is already in CommunityCards');
        }
    }

    getCards() {
        return this.cards;
    }

    convertToStringArray() {
        return this.cards.map(card => `${card.rank}${card.suit.charAt(0).toLowerCase()}`);
    }

    clear() {
        this.cards = [];
    }   
}
