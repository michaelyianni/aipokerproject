import Hand from "./Hand.js";

export default class Player {
    constructor(name, initialChips = 1000) {
        this.name = name;
        this.hand = new Hand();
        this.chips = 0;
        this.currentBet = 0;
        this.hasFolded = false;
        this.isTurn = false;

        this.addChips(initialChips);
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

        this.setTurn(false);

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

        if (!this.isTurn) {
            throw new Error('Cannot place a bet when it is not your turn');
        }
    }

    fold() {
        this.hasFolded = true;

        this.setTurn(false);
    }

    receiveCard(card) {
        this.hand.addCard(card);
    }

    resetForNewRound() {
        this.hand.clear();
        this.currentBet = 0;
        this.hasFolded = false;
        this.isTurn = false;
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

    getTurnStatus() {
        return this.isTurn;
    }

    setTurn(isTurn) {
        this.isTurn = isTurn;
    }

}

