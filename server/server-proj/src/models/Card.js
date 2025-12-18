class Card {
    constructor(rank, suit) {
        
        if (!this.checkValidity()) {
            throw new Error('Invalid card rank or suit');
        }
        
        this.rank = rank;
        this.suit = suit;
    }


    checkValidity() {        
        const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const validSuits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        return validRanks.includes(this.rank) && validSuits.includes(this.suit);
    }
}