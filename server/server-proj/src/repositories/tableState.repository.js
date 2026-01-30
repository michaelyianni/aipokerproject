import CommunityCards from "../models/CommunityCards.js";
import Deck from "../models/Deck.js";
import Player from "../models/Player.js";
import Pot from "../models/Pot.js";
import { PokerStreets } from "../constants/pokerStreets.js";

const streetsInOrder = [
    PokerStreets.PRE_FLOP,
    PokerStreets.FLOP,
    PokerStreets.TURN,
    PokerStreets.RIVER,
    PokerStreets.SHOWDOWN
];

export default class TableStateRepository {
    constructor(players = []) {
        
        // Create dictionary of players
        this.players = {};
        for (let player of Object.values(players)) {
            this.players[player.id] = player;
        }

        this.playerOrder = players.map(p => p.id);

        this.communityCards = new CommunityCards();
        this.deck = new Deck();
        this.pot = new Pot();

        this.currentStreetIndex = 0;
        this.currentBet = 0;
        this.activePlayerIds = [];
        this.currentTurnPlayerId = null;
        this.lastRaiserId = null;

        this.smallBlindAmount = 5;
        this.bigBlindAmount = 10;

        this.dealerId = null;
    }

    initialiseTable(initialChips = 1000) {
       
        this.resetForNewHand();

        // Initialise dealer
        let playerIds = Object.keys(this.players);
        if (playerIds.length === 0) {
            throw new Error('No players to assign dealer');
        }

        this.setDealer(playerIds[0]);

        this.setCurrentTurnPlayer(this.dealerId);

        this.initialiseChipsForPlayers(initialChips);
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

    playerBet(playerId, amount) {
        if (amount < 0) {
            throw new Error('Cannot apply a negative bet');
        }

        const player = this.getPlayer(playerId);

        player.placeBet(amount);

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

        // Put all player current bets into pot and reset current bet

        this.collectPotAndResetBetsAndFlags();


        this.resetCurrentBet();

        this.setLastRaiser(null);

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

    getCurrentTurnPlayerId() {
        return this.currentTurnPlayerId;
    }

    setCurrentTurnPlayer(playerId) {
        if (!this.activePlayerIds.includes(playerId)) {
            throw new Error('Player is not active to set turn');
        }
        this.currentTurnPlayerId = playerId;
    }

    advanceToNextActivePlayer() {
        if (this.activePlayerIds.length === 0) {
            throw new Error('No active players to advance to');
        }

        let currentIndex = this.activePlayerIds.indexOf(this.currentTurnPlayerId);
        let nextIndex = (currentIndex + 1) % this.activePlayerIds.length;
        this.currentTurnPlayerId = this.activePlayerIds[nextIndex];
    }

    setLastRaiser(playerId) {
        this.lastRaiserId = playerId;
    }

    getLastRaiserId() {
        return this.lastRaiserId;
    }

    // COVER CASE THAT CURRENT TURN PLAYER IS REMOVED IN GAME ENGINE
    removeActivePlayer(playerId) {
        this.activePlayerIds = this.activePlayerIds.filter(id => id !== playerId);
    }


    #resetActivePlayers() {
        this.activePlayerIds = this.playerOrder;
    }

    // Deck and Pot

    getDeck() {
        return this.deck;
    }

    getPot() {
        return this.pot;
    }

    collectPotAndResetBetsAndFlags() {
        
        for (let playerId in this.players) {
            let player = this.getPlayer(playerId);
            let bet = player.getCurrentBet();
            if (bet > 0) {
                this.pot.addChips(bet);
                player.currentBet = 0;
            }
            player.hasActedThisStreet = false;
        }    
    }


    // Reset Table State for New Round

    resetForNewHand() {
        this.communityCards.clear();
        this.deck.resetAndShuffle();
        this.pot.clear();
        this.#resetStreet();
        this.resetCurrentBet();
        this.#resetPlayers();
        this.#resetActivePlayers();
    }


}