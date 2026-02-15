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
        this.pots = [];
        // this.pot = new Pot();

        this.currentStreetIndex = 0;
        this.currentBet = 0;
        this.activePlayerIds = [];
        this.currentTurnPlayerId = null;
        this.lastRaiserId = null;

        this.smallBlindAmount = 5;
        this.bigBlindAmount = 10;

        this.dealerId = null;
        this.bigBlindId = null;
        this.smallBlindId = null;
    }

    initialiseTable(initialChips = 1000) {

        this.initialiseChipsForPlayers(initialChips);
        
        this.resetForNewHand();

        // Initialise dealer
        let playerIds = Object.keys(this.players);
        if (playerIds.length === 0) {
            throw new Error('No players to assign dealer');
        }
        
        this.setDealer(playerIds[0]);

       
    }


    // Dealer
    setDealer(playerId) {
        if (!this.players[playerId]) {
            throw new Error('Player does not exist to set as dealer');
        }
        this.dealerId = playerId;
    }

    setSmallBlind(playerId) {
        this.smallBlindId = playerId;
    }

    setBigBlind(playerId) {
        this.bigBlindId = playerId;
    }


    getDealer() {
        return this.dealerId;
    }

    getSmallBlind() {
        return this.smallBlindId;
    }

    getBigBlind() {
        return this.bigBlindId;
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

        const betAmount = Math.min(amount, player.chips);

        console.log(`Player ${playerId} is betting ${betAmount} chips (attempted bet: ${amount}, player chips: ${player.chips})`);

        if (betAmount === player.chips) {
            // Player is going all-in
            player.isAllIn = true;
        }

        player.placeBet(betAmount);

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

        this.resetPlayerBetsAndFlags();


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

    getCanActPlayerIds() {
        return this.activePlayerIds.filter(playerId => {
            const player = this.getPlayer(playerId);
            return !player.hasFolded && !player.isAllIn;
        });
    }

    getAllInPlayerIds() {
        return this.activePlayerIds.filter(id => this.getPlayer(id).isAllIn);
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
        // this.activePlayerIds = this.playerOrder;

        // Add players with chips > 0 to active players list in seating order
        this.activePlayerIds = [];
        for (let playerId of this.playerOrder) {
            let player = this.getPlayer(playerId);
            if (player && player.chips > 0) {
                this.activePlayerIds.push(playerId);
            }
        }
    }

    markPlayerAsLeft(playerId) {
        let player = this.getPlayer(playerId);
        if (player) {
            player.leave();
            this.removeActivePlayer(playerId);
        }
    }

    // Deck and Pot

    getDeck() {
        return this.deck;
    }

    getPots() {
        return this.pots;
    }

    recalculatePots() {
        const allPlayerIds = Object.keys(this.players);

        // Generates list of contributors with their total bet this hand, sorted by bet amount ascending
        const contribs = allPlayerIds
            .map(id => {
                const p = this.getPlayer(id);
                return { id, amount: p.totalBetThisHand };
            })
            .filter(x => x.amount > 0)
            .sort((a, b) => a.amount - b.amount);

        if (contribs.length === 0) {
            this.pots = [];
            return;
        }

        // Generates list of potentially eligbile players (active players)
        const isEligible = (id) => this.activePlayerIds.includes(id);

        let pots = [];
        let prev = 0;

        // Iterate through contributors from smallest to largest bet, creating pots for each unique bet level
        let remainingContributorIds = contribs.map(c => c.id);

        for (const c of contribs) {
            const level = c.amount;
            const slice = level - prev;

            if (slice > 0) {
                const contributorsCount = remainingContributorIds.length;
                const potAmount = slice * contributorsCount;    // Pot amount is the difference in bet level multiplied by the number of contributors at or above this level

                // Eligible players for this pot are those who have contributed at or above this level and are still active

                const eligiblePlayerIds = remainingContributorIds.filter(isEligible);

                const pot = new Pot(potAmount, eligiblePlayerIds);

                // merge adjacent identical-eligibility pots
                const last = pots[pots.length - 1];
                if (last && this.sameEligible(last.eligiblePlayerIds, pot.eligiblePlayerIds)) {
                    last.addChips(pot.amount);
                } else {
                    pots.push(pot);
                }

                prev = level;
            }

            remainingContributorIds = remainingContributorIds.filter(pid => pid !== c.id);
        }

        this.pots = pots;
    }

    sameEligible(a, b) {
        if (a.length !== b.length) return false;
        const aa = [...a].sort();
        const bb = [...b].sort();
        for (let i = 0; i < aa.length; i++) {
            if (aa[i] !== bb[i]) return false;
        }
        return true;
    }



    resetPlayerBetsAndFlags() {

        for (let playerId in this.players) {
            let player = this.getPlayer(playerId);
            player.currentBet = 0;
            player.hasActedThisStreet = false;
        }

        this.currentBet = 0;
    }


    // Reset Table State for New Round

    resetForNewHand() {
        this.communityCards.clear();
        this.deck.resetAndShuffle();
        this.pots = [];
        this.#resetStreet();
        this.resetCurrentBet();
        this.#resetPlayers();
        this.#resetActivePlayers();
    }

}