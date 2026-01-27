import { CardRules } from "../constants/cardRules.js";

export default class Card {
    constructor(rank, suit) {

        if (!this.checkValidity(rank, suit)) {
            throw new Error('Invalid card rank or suit');
        }
        
        this.rank = rank;
        this.suit = suit;
    }


    checkValidity(rank, suit) {        
        return CardRules.ranks.includes(rank) && CardRules.suits.includes(suit);
    }
}