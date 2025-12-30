import CommunityCards from "../models/CommunityCards.js";
import Deck from "../models/Deck.js";
import Player from "../models/Player.js";
import Pot from "../models/Pot.js";

const street = {
    PRE_FLOP: 'pre-flop',
    FLOP: 'flop',
    TURN: 'turn',
    RIVER: 'river',
    SHOWDOWN: 'showdown'
}

const streetsInOrder = [
    street.PRE_FLOP,
    street.FLOP,
    street.TURN,
    street.RIVER,
    street.SHOWDOWN
];

export default class TableStateRepository {
    constructor(players = {}) {
        this.players = players;
        this.communityCards = new CommunityCards();
        this.deck = new Deck();
        this.pot = new Pot();

        this.currentStreetIndex = 0;
        this.currentBet = 0;
        this.activePlayerIds = [];
        this.activePlayerTurnId = null;

        this.dealerId = null;
    }

    initialiseTable() {
       
        this.resetForNewRound();

        // Initialise dealer
        let playerIds = Object.keys(this.players);
        if (playerIds.length === 0) {
            throw new Error('No players to assign dealer');
        }

        this.setDealer(playerIds[0]);

        this.setActivePlayerTurn(this.dealerId);

        this.initialiseChipsForPlayers();
    }

    // newRound() {
    //     this.resetForNewRound();

    //     // Rotate dealer
    //     let playerIds = Object.keys(this.players);
    //     if (playerIds.length === 0) {
    //         throw new Error('No players to assign dealer');
    //     }
    //     let currentDealerIndex = playerIds.indexOf(this.dealerId);
    //     let nextDealerIndex = (currentDealerIndex + 1) % playerIds.length;
    //     this.dealerId = playerIds[nextDealerIndex];

    //     this.activePlayerTurnId = this.dealerId;
    // }

    // Dealer
    setDealer(playerId) {
        if (!this.players[playerId]) {
            throw new Error('Player does not exist to set as dealer');
        }
        this.dealerId = playerId;
    }

    getDealer() {
        return this.dealerId;
    }


    dealCardsToPlayers() {
        for (let playerId in this.players) {
            let player = this.players[playerId];

            player.receiveCard(this.deck.dealCard());
            player.receiveCard(this.deck.dealCard());
        }
    }

    // Community Cards

    dealFlop() {
        let card1 = this.deck.dealCard();
        let card2 = this.deck.dealCard();
        let card3 = this.deck.dealCard();
        this.communityCards.addFlop(card1, card2, card3);
    }

    dealTurn() {
        let card = this.deck.dealCard();
        this.communityCards.addTurn(card);
    }

    dealRiver() {
        let card = this.deck.dealCard();
        this.communityCards.addRiver(card);
    }

    getCommunityCards() {
        return this.communityCards;
    }


    // Betting

    applyBet(playerId, amount) {
        if (amount < 0) {
            throw new Error('Cannot apply a negative bet');
        }

        const player = this.getPlayer(playerId);

        player.placeBet(amount);
        this.pot.addChips(amount);

        if (player.currentBet > this.currentBet) {
            this.currentBet = player.currentBet;
        }
    }

    // Current Bet

    getCurrentBet() {
        return this.currentBet;
    }

    raiseCurrentBet(amount) {
        if (amount < 0) {
            throw new Error('Cannot raise current bet by a negative amount');
        }
        this.currentBet += amount;
    }

    resetCurrentBet() {
        this.currentBet = 0;
    }

    // Chips

    initialiseChipsForPlayers(initialChips = 1000) {
        for (let playerId in this.players) {
            let player = this.getPlayer(playerId);
            player.addChips(initialChips);
        }
    }

    distributeWinnings(winningsMap) {
        for (let playerId in winningsMap) {
            let amount = winningsMap[playerId]; 
            let player = this.getPlayer(playerId);
            player.addChips(amount);
        }
    }

    // Street

    getCurrentStreet() {
        return streetsInOrder[this.currentStreetIndex];
    }

    advanceStreet() {
        if (this.currentStreetIndex < streetsInOrder.length - 1) {
            this.currentStreetIndex++;
        }
    }

    #resetStreet() {
        this.currentStreetIndex = 0;
    }

    // Players

    getPlayers() {
        return this.players;
    }

    getPlayer(playerId) {
        return this.players[playerId];
    }

    #resetPlayers() {
        
        // Delete left players and reset others
        for (let playerId in this.players) {
            let player = this.getPlayer(playerId);
            if (player.hasLeft) {
                delete this.players[playerId];
            }
            else {
                player.resetForNewRound();
            }
        }
    }


    // Active Players

    getActivePlayerIds() {
        return this.activePlayerIds;
    }

    getActivePlayerTurnId() {
        return this.activePlayerTurnId;
    }

    setActivePlayerTurn(playerId) {
        if (!this.activePlayerIds.includes(playerId)) {
            throw new Error('Player is not active to set turn');
        }
        this.activePlayerTurnId = playerId;
    }

    advanceToNextActivePlayer() {
        if (this.activePlayerIds.length === 0) {
            throw new Error('No active players to advance to');
        }

        let currentIndex = this.activePlayerIds.indexOf(this.activePlayerTurnId);
        let nextIndex = (currentIndex + 1) % this.activePlayerIds.length;
        this.activePlayerTurnId = this.activePlayerIds[nextIndex];
    }

    // COVER CASE THAT CURRENT TURN PLAYER IS REMOVED IN GAME ENGINE
    removeActivePlayer(playerId) {
        this.activePlayerIds = this.activePlayerIds.filter(id => id !== playerId);
    }


    #resetActivePlayers() {
        this.activePlayerIds = Object.keys(this.players);
    }

    // Deck and Pot

    getDeck() {
        return this.deck;
    }

    getPot() {
        return this.pot;
    }




    // Reset Table State for New Round

    resetForNewRound() {
        this.communityCards.clear();
        this.deck.resetAndShuffle();
        this.pot.clear();
        this.#resetStreet();
        this.resetCurrentBet();
        this.#resetPlayers();
        this.#resetActivePlayers();
    }


}