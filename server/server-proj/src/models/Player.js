import Hand from "./Hand.js";

export default class Player {

    static nextId = 1;

    // Associate the ID with the player's socket later
    constructor(name) {

        this.id = "id" + Player.nextId++;
        this.name = name;
        this.hand = new Hand();
        this.chips = 0;
        this.currentBet = 0;
        this.totalBet = 0;
        this.hasFolded = false;
        this.hasLeft = false;
        this.isAllIn = false;
        this.hasActedThisStreet = false;
    }

    addChips(amount) {
        if (amount < 0) {
            throw new Error('Cannot add negative chips');
        }
        this.chips += amount;
    }

    placeBet(amount) {

        this.validateBet(amount);

        this.chips -= amount;
        this.currentBet += amount;

        return amount;
    }

    validateBet(amount) {
        if (amount < 0) {
            throw new Error('Cannot place a negative bet');
        }
        if (amount > this.chips) {
            throw new Error('Cannot place a bet greater than your chips');
        }
        if (this.hasFolded) {
            throw new Error('Cannot place a bet when folded');
        }
    }

    fold() {
        this.hasFolded = true;
    }

    leave() {
        this.hasLeft = true;
    }

    

    receiveCard(card) {
        this.hand.addCard(card);
    }

    resetForNewRound() {
        this.hand.clear();
        this.currentBet = 0;
        this.hasFolded = false;
    }

    getHand() {
        return this.hand;
    }

    getChips() {
        return this.chips;
    }

    getCurrentBet() {
        return this.currentBet;
    }

    getName() {
        return this.name;
    }

    getFoldStatus() {
        return this.hasFolded;
    }

}

