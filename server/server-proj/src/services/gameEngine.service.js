import Card from "../models/Card.js";
import CommunityCards from "../models/CommunityCards.js";
import TableStateRepository from "../repositories/tableState.repository.js";
import FullHand from "../models/FullHand.js";
import ActionChecker from "../utils/actionChecker.util.js";
import GameState from "../client_models/gameState.js";
import { compareHands } from "../utils/handEvaluator.util.js";
import { GAME_ACTIONS } from "../constants/gameActions.js";
import { PokerStreets } from "../constants/pokerStreets.js";
import Winner from "../models/Winner.js";

export default class GameEngineService {
    constructor(players = [], onStateChangeCallback = null) {
        this.tableStateRepository = new TableStateRepository(players);

        this.onStateChangeCallback = onStateChangeCallback;

        this.tableStateRepository.initialiseTable();

        // Additional game state initialization can go here
        this.allocateBlinds(this.tableStateRepository.getDealer());

        // Start game loop
        this.startGame();
    }

    // Main game loop logic
    startGame() {

        // Deal hole cards to players
        this.tableStateRepository.dealCardsToPlayers();

        this.setTurnToNextActivePlayer(this.tableStateRepository.getBigBlind());

        // Awaiting player actions
    }


    playerAction(playerId, action, amount = 0) {

        //Validate action
        if (!ActionChecker.isValidAction(playerId, action, amount, this.tableStateRepository)) {
            throw new Error('Invalid action');
        }

        // Handle player actions: fold, call, raise, check
        let player = this.tableStateRepository.getPlayer(playerId);

        switch (action) {
            case GAME_ACTIONS.FOLD:
                player.fold();
                this.tableStateRepository.removeActivePlayer(playerId);
                break;
            case GAME_ACTIONS.CALL:
                let callAmount = this.tableStateRepository.getCurrentBet() - player.currentBet;
                this.tableStateRepository.playerBet(playerId, callAmount);
                break;
            case GAME_ACTIONS.BET:
                this.tableStateRepository.playerBet(playerId, amount);
                this.tableStateRepository.setLastRaiser(playerId);
                break;
            case GAME_ACTIONS.RAISE:
                let raiseAmount = this.tableStateRepository.getCurrentBet() + amount - player.currentBet;
                this.tableStateRepository.playerBet(playerId, raiseAmount);
                this.tableStateRepository.setLastRaiser(playerId);
                break;
            case GAME_ACTIONS.CHECK:
                // No chips are bet when checking
                break;
            default:
                throw new Error('Invalid action');
        }

        player.hasActedThisStreet = true;

        // Post-action updates
        this.postActionUpdates();
    }

    playerDisconnect(playerId) {
        // Validate player is in the game
        const player = this.tableStateRepository.getPlayer(playerId);
        if (!player) {
            throw new Error('Player ' + playerId + ' not found in game');
        }

        // Mark player as disconnected and skip their turns until they reconnect or game ends
        this.tableStateRepository.markPlayerAsLeft(playerId);
        this.tableStateRepository.removeActivePlayer(playerId);

        // Check if only one player left - if so, end the game and reset lobby
        if (this.tableStateRepository.getActivePlayerIds().length === 1) {
            // Only one other player left, end round and award pots to them
            this.tableStateRepository.recalculatePots();

            const remainingPlayerId = this.tableStateRepository.getActivePlayerIds()[0];
            this.awardAllPotsToSingleWinner(remainingPlayerId);
            this.endHand();
            return;
        }

        // If its that player's turn, advance turn to next active player
        if (this.tableStateRepository.getCurrentTurnPlayerId() === playerId) {
            this.postActionUpdates();
        }




    }

    postActionUpdates() {

        // Advance turn to next active player
        this.setTurnToNextActivePlayer(this.tableStateRepository.getCurrentTurnPlayerId());

        // 1) Hand ends if only one player remains
        if (this.tableStateRepository.getActivePlayerIds().length === 1) {
            // All players have folded except one, end round

            this.tableStateRepository.recalculatePots();

            // Award every pot to the last remaining player
            this.awardAllPotsToSingleWinner(this.tableStateRepository.getActivePlayerIds()[0]);

            // End round, prepare for next round
            this.endHand();
            return;
        }

        // 2) All-in scenario
        const canActIds = this.tableStateRepository.getCanActPlayerIds();
        const allInIds = this.tableStateRepository.getAllInPlayerIds();

        if (canActIds.length === 1 && allInIds.length >= 1) {

            this.runOutBoardToShowdown();
            this.determineWinners();
            this.endHand();
            return;
        }

        if (canActIds.length === 0) {
            // Everyone remaining is all-in, run out board to river
            this.runOutBoardToShowdown();

            this.determineWinners();

            this.endHand();
            return;
        }


        // 3) If betting round complete, advance street
        if (this.isBettingRoundComplete()) {

            this.tableStateRepository.recalculatePots();

            this.tableStateRepository.resetPlayerBetsAndFlags();

            this.advanceStreet();

            // If river completed, determine winners
            if (this.tableStateRepository.getCurrentStreet() === PokerStreets.SHOWDOWN) {
                this.determineWinners();
                this.endHand();
                return;
            }

            // if small blind is active, set turn to them, otherwise start with first active player left of dealer
            const smallBlindId = this.tableStateRepository.getSmallBlind();
            if (smallBlindId && this.tableStateRepository.getCanActPlayerIds().includes(smallBlindId)) {
                this.tableStateRepository.setCurrentTurnPlayer(smallBlindId);
            } else {
                this.setTurnToNextActivePlayer(smallBlindId);
            }
            return;
        }


    }

    isBettingRoundComplete() {
        const inHandIds = this.tableStateRepository.getActivePlayerIds(); // not folded
        const currentBet = this.tableStateRepository.getCurrentBet();
        const lastRaiserId = this.tableStateRepository.getLastRaiserId(); // null if no bet this street
        const currentTurnId = this.tableStateRepository.getCurrentTurnPlayerId();

        // 1) Everyone who CAN act is either matched, folded, or all-in
        for (const playerId of inHandIds) {
            const p = this.tableStateRepository.getPlayer(playerId);

            if (p.hasFolded) continue;
            if (p.isAllIn) continue;

            if (p.currentBet < currentBet) {

                console.log(`Betting round not complete: player ${playerId} has not matched current bet`);

                return false;

            }
        }

        // 2) Close-out condition
        if (lastRaiserId == null) {
            // No bet this street: everyone must have acted (checked)
            for (const playerId of inHandIds) {
                const p = this.tableStateRepository.getPlayer(playerId);
                if (p.hasFolded || p.isAllIn) continue;

                if (!p.hasActedThisStreet) {
                    console.log(`Betting round not complete: player ${playerId} has not acted this street`);
                    return false;
                }
            }
            return true;
        }

        // There was aggression: round ends when action returns to last raiser

        console.log('Checking if betting round complete by last raiser return. lastRaiserId:', lastRaiserId, 'currentTurnId:', currentTurnId);

        return currentTurnId === lastRaiserId;
    }

    advanceStreet() {
        this.tableStateRepository.advanceStreet();

        // Deal community cards as per street
        let currentStreet = this.tableStateRepository.getCurrentStreet();
        if (currentStreet === PokerStreets.FLOP) {
            this.tableStateRepository.dealFlop();
        }
        else if (currentStreet === PokerStreets.TURN) {
            this.tableStateRepository.dealTurn();
        }
        else if (currentStreet === PokerStreets.RIVER) {
            this.tableStateRepository.dealRiver();
        }



        this.tableStateRepository.resetPlayerBetsAndFlags();

        this.tableStateRepository.resetCurrentBet();

        this.tableStateRepository.setLastRaiser(null);
    }

    findNextActivePlayer(playerId) {
        var activePlayerIds = this.tableStateRepository.getCanActPlayerIds();

        var order = this.tableStateRepository.playerOrder;

        // Get player index in player order

        let currentIndex = order.indexOf(playerId);

        // while current player is not active, advance
        for (let i = 0; i < order.length; i++) {
            currentIndex = (currentIndex + 1) % order.length;

            const nextPlayerId = order[currentIndex];

            if (!activePlayerIds.includes(nextPlayerId)) {
                continue;
            }

            const p = this.tableStateRepository.getPlayer(nextPlayerId);

            if (p.isAllIn) continue;

            return nextPlayerId;
        }
    }

    setTurnToNextActivePlayer(playerId) {

        const nextPlayerId = this.findNextActivePlayer(playerId);

        if (nextPlayerId) {
            this.tableStateRepository.setCurrentTurnPlayer(nextPlayerId);
        } else {
            // No active players found (everyone else folded or all-in), set to null
            this.tableStateRepository.setCurrentTurnPlayer(null);
        }

    }


    endHand() {



        this.tableStateRepository.setStreet(PokerStreets.HAND_COMPLETE); // move to hand complete street for game state clarity

        this.emitStateChange();

        // Auto-advance to next hand after 5 seconds
        this.handCompleteTimeout = setTimeout(() => {
            this.startNextHand();
        }, 5000); // 5 second delay - adjust as needed

    }

    startNextHand() {
        this.tableStateRepository.resetForNewHand();

        // Check if enough players to continue
        if (this.tableStateRepository.getActivePlayerIds().length < 2) {
            console.log('Not enough players to continue. Game over.');
            return;
        }

        var dealerId = this.allocateDealerButton();
        this.allocateBlinds(dealerId);
        this.startGame();
    }

    allocateDealerButton() {
        // Rotate dealer
        let playerOrder = this.tableStateRepository.playerOrder;

        let currentDealerIndex = playerOrder.indexOf(this.tableStateRepository.getDealer());

        console.log('Current dealer id:', this.tableStateRepository.getDealer());

        const nextDealerId = this.findNextActivePlayer(playerOrder[currentDealerIndex]);

        if (!nextDealerId) {
            throw new Error('No active players to assign dealer for next hand');
        }

        console.log('Next dealer id:', nextDealerId);

        this.tableStateRepository.setDealer(nextDealerId);

        return nextDealerId;
    }

    allocateBlinds(dealerId) {
        const playerIds = this.tableStateRepository.playerOrder;

        var smallBlindPlayerId;
        var bigBlindPlayerId;

        if (this.tableStateRepository.getActivePlayerIds().length == 2) {
            // In 2 player game, dealer is small blind and other player is big blind
            smallBlindPlayerId = dealerId;
            bigBlindPlayerId = playerIds.find(id => id !== dealerId);


        }
        else {
            // In 3+ player game, player to left of dealer is small blind and next player is big blind

            smallBlindPlayerId = this.findNextActivePlayer(dealerId);
            bigBlindPlayerId = this.findNextActivePlayer(smallBlindPlayerId);
        }

        this.tableStateRepository.setSmallBlind(smallBlindPlayerId);
        this.tableStateRepository.setBigBlind(bigBlindPlayerId);

        this.tableStateRepository.playerBet(smallBlindPlayerId, this.tableStateRepository.smallBlindAmount);
        this.tableStateRepository.playerBet(bigBlindPlayerId, this.tableStateRepository.bigBlindAmount);
    }

    awardAllPotsToSingleWinner(winnerId) {
        const pots = this.tableStateRepository.getPots();

        pots.forEach(pot => {
            totalWinnings += pot.amount;
            this.tableStateRepository.playerCollectWinnings(winnerId, pot);
        });


        // Store hand results
        const winner = new Winner(winnerId, totalWinnings, null, "last player standing");

        this.tableStateRepository.setHandResults([winner]);
    }


    awardPots(pots, communityCards) {
        // payouts aggregated across pots
        const payouts = {}; // { playerId: chipsWon }

        for (const pot of pots) {
            const eligibleIds = pot.eligiblePlayerIds;

            // If everyone eligible folded somehow (shouldn't happen if you maintain activeIds properly)
            if (!eligibleIds || eligibleIds.length === 0) continue;

            // Build FullHands for eligible players only
            const hands = eligibleIds.map(playerId => {
                const player = this.tableStateRepository.getPlayer(playerId);
                return new FullHand(player, player.getHand(), communityCards);
            });

            // Determine best among this eligible set
            const bestHands = compareHands(hands); // should return array of FullHands (tie -> multiple)

            const winnerIds = bestHands.map(h => h.player.id);

            // Split this pot among winners
            const baseShare = Math.floor(pot.amount / winnerIds.length);
            let remainder = pot.amount - baseShare * winnerIds.length;

            // Give everyone base share
            for (const id of winnerIds) {
                payouts[id] = (payouts[id] ?? 0) + baseShare;
            }

            // Distribute remainder chips (house rule / poker room rule)
            // Common: give odd chips to winners in seat order starting left of dealer.
            // Minimal deterministic approach: use your playerOrder rotation from dealer.
            if (remainder > 0) {
                const orderedWinners = this.orderBySeatFromDealer(winnerIds);
                for (let i = 0; i < remainder; i++) {
                    const id = orderedWinners[i % orderedWinners.length];
                    payouts[id] = (payouts[id] ?? 0) + 1;
                }
            }
        }

        // Apply payouts
        for (const [playerId, amount] of Object.entries(payouts)) {
            this.tableStateRepository.getPlayer(playerId).addChips(amount);
        }

        return payouts; // handy for logging / broadcasting
    }

    orderBySeatFromDealer(playerIds) {
        const order = this.tableStateRepository.playerOrder;
        const dealerId = this.tableStateRepository.getDealer();

        const dealerIndex = order.indexOf(dealerId);
        if (dealerIndex === -1) return playerIds; // fallback

        // Build seat order starting left of dealer
        const seatOrder = [];
        for (let i = 1; i <= order.length; i++) {
            seatOrder.push(order[(dealerIndex + i) % order.length]);
        }

        // Filter seat order down to these players
        return seatOrder.filter(id => playerIds.includes(id));
    }



    determineWinners() {

        this.tableStateRepository.recalculatePots();

        const activePlayerIds = this.tableStateRepository.getActivePlayerIds();
        const communityCards = this.tableStateRepository.getCommunityCards();

        if (communityCards.getCards().length < 5) {
            throw new Error("Cannot determine winners before river is dealt");
        }
        if (activePlayerIds.length === 0) {
            throw new Error("No active players to determine winners from");
        }

        const pots = this.tableStateRepository.getPots();

        const payouts = this.awardPots(pots, communityCards);

        // Store hand results for game state
        const winners = Object.entries(payouts).map(([playerId, amount]) => new Winner(playerId, amount, "best hand"));
        this.tableStateRepository.setHandResults(winners);

        // Optional: log payouts for debugging
        console.log("Showdown payouts:", payouts);
    }


    runOutBoardToShowdown() {
        let currentStreet = this.tableStateRepository.getCurrentStreet();
        while (currentStreet !== PokerStreets.SHOWDOWN) {
            this.advanceStreet();
            currentStreet = this.tableStateRepository.getCurrentStreet();
        }
    }

    getGameState() {
        return new GameState(this.tableStateRepository);
    }

    emitStateChange() {
        if (typeof this.onStateChangeCallback === 'function') {
            try {
                this.onStateChangeCallback();
            } catch (err) {
                console.error('[GameEngine] Error in onStateChange callback:', err);
            }
        }
    }

}


