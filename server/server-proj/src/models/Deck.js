import Card from './Card.js';
import { CardRules } from '../constants/cardRules.js';

export default class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    initializeDeck() {
        const ranks = CardRules.ranks;
        const suits = CardRules.suits;


        // TODO - Implement Fisher-Yates shuffle algorithm

        for (let rank of ranks) {
            for (let suit of suits) {
                this.cards.push(new Card(rank, suit));
            }
        }
    }

    resetAndShuffle() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    shuffle() {
        
        
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }


    }

    dealCard() {
        return this.cards.pop();
    }
}