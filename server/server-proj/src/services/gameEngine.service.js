import Card from "../models/Card.js";
import CommunityCards from "../models/CommunityCards.js";
import TableStateRepository from "../repositories/tableState.repository.js";
import FullHand from "../dto/FullHand.js";
import ActionChecker from "../utils/actionChecker.util.js";
import GameState from "../client_models/gameState.js";
import { compareHands } from "../utils/handEvaluator.util.js";
import { GAME_ACTIONS } from "../constants/gameActions.js";
import { PokerStreets } from "../constants/pokerStreets.js";
import Winner from "../dto/Winner.js";

export default class GameEngineService {
    constructor(players = [], onStateChangeCallback = null, testingMode = false) {
        
        if (testingMode) {
            console.log('[GameEngine] Initializing in testing mode');
        }
        
        this.tableStateRepository = new TableStateRepository(players);

        this.onStateChangeCallback = onStateChangeCallback;
        this.testingMode = testingMode;
        this.gameInProgress = true;

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

        // Store initial game state round history information
        this.tableStateRepository.initialiseHandHistory();

        // Post blinds
        this.tableStateRepository.postBlinds();

        // Get small and big blind players
        const smallBlindPlayer = this.tableStateRepository.getPlayer(this.tableStateRepository.getSmallBlind());
        const bigBlindPlayer = this.tableStateRepository.getPlayer(this.tableStateRepository.getBigBlind());

        // Record posting of blinds as actions in round history
        this.tableStateRepository.handHistory.addPostBlindAction(smallBlindPlayer.id, "POST_SB", smallBlindPlayer.getCurrentBet(), 0, smallBlindPlayer.getCurrentBet(), smallBlindPlayer.getCurrentBet(), smallBlindPlayer.isAllIn);
        this.tableStateRepository.handHistory.addPostBlindAction(bigBlindPlayer.id, "POST_BB", bigBlindPlayer.getCurrentBet(), 0, bigBlindPlayer.getCurrentBet(), bigBlindPlayer.getCurrentBet(), bigBlindPlayer.isAllIn);

        // Set turn to player left of big blind to start action
        this.setTurnToNextActivePlayer(this.tableStateRepository.getBigBlind());

        // Awaiting player actions
    }


    playerAction(playerId, action, amount = 0) {

        if (!this.gameInProgress) {
            throw new Error('Game is not in progress');
        }

        // Validate action
        if (!ActionChecker.isValidAction(playerId, action, amount, this.tableStateRepository)) {
            throw new Error('Invalid action');
        }

        // Handle player actions: fold, call, raise, check
        let player = this.tableStateRepository.getPlayer(playerId);

        let toCallBefore = Math.max(0, this.tableStateRepository.getCurrentBet() - player.getCurrentBet());
        let prevCurrentBet = player.getCurrentBet();

        switch (action) {
            case GAME_ACTIONS.FOLD:
                player.fold();
                this.tableStateRepository.handHistory.addActionRecord(playerId, action, 0, toCallBefore, player.getCurrentBet(), this.tableStateRepository.getCurrentBet(), player.isAllIn);
                this.tableStateRepository.removeActivePlayer(playerId);
                break;
            case GAME_ACTIONS.CALL:
                this.tableStateRepository.playerBet(playerId, toCallBefore);
                this.tableStateRepository.handHistory.addActionRecord(playerId, action, player.getCurrentBet() - prevCurrentBet, toCallBefore, player.getCurrentBet(), this.tableStateRepository.getCurrentBet(), player.isAllIn);
                break;
            case GAME_ACTIONS.BET:
                this.tableStateRepository.playerBet(playerId, amount);
                this.tableStateRepository.handHistory.addActionRecord(playerId, action, amount, toCallBefore, player.getCurrentBet(), this.tableStateRepository.getCurrentBet(), player.isAllIn);
                break;
            case GAME_ACTIONS.RAISE:
                let raiseAmount = this.tableStateRepository.getCurrentBet() + amount - player.getCurrentBet();
                this.tableStateRepository.playerBet(playerId, raiseAmount);
                this.tableStateRepository.handHistory.addActionRecord(playerId, action, raiseAmount, toCallBefore, player.getCurrentBet(), this.tableStateRepository.getCurrentBet(), player.isAllIn); 
                break;
            case GAME_ACTIONS.ALL_IN:
                let allInAmount = player.chips;
                let tableBetBeforeAction = this.tableStateRepository.getCurrentBet();

                this.tableStateRepository.playerBet(playerId, allInAmount);
                player.isAllIn = true;

                if (player.getCurrentBet() > tableBetBeforeAction) {
                    this.tableStateRepository.handHistory.addActionRecord(playerId, GAME_ACTIONS.RAISE, allInAmount, toCallBefore, player.getCurrentBet(), this.tableStateRepository.getCurrentBet(), player.isAllIn); // Record as raise if all-in amount exceeds current bet
                }
                else {
                    this.tableStateRepository.handHistory.addActionRecord(playerId, GAME_ACTIONS.CALL, allInAmount, toCallBefore, player.getCurrentBet(), this.tableStateRepository.getCurrentBet(), player.isAllIn);
                }
                break;
            case GAME_ACTIONS.CHECK:
                // No chips are bet when checking
                this.tableStateRepository.handHistory.addActionRecord(playerId, action, 0, toCallBefore, player.getCurrentBet(), this.tableStateRepository.getCurrentBet(), player.isAllIn);
                break;
            default:
                throw new Error('Invalid action');
        }

        player.hasActedThisStreet = true;

        // Post-action updates
        return this.postActionUpdates();
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


        // Check if only one player left connected - if so, game over
        if (this.tableStateRepository.getConnectedPlayerIds().length === 1) {
            console.log('Only one player left connected. Game over.');
            this.gameInProgress = false;

            this.tableStateRepository.recalculatePots();

            const remainingPlayerId = this.tableStateRepository.getConnectedPlayerIds()[0];
            this.awardAllPotsToSingleWinner(remainingPlayerId);

            return this.endHand();


        }


        // Check if only one player left in the hand - if so, end the game and reset lobby
        if (this.tableStateRepository.getActivePlayerIds().length === 1) {
            // Only one other player left, end round and award pots to them
            this.tableStateRepository.recalculatePots();

            const remainingPlayerId = this.tableStateRepository.getActivePlayerIds()[0];
            this.awardAllPotsToSingleWinner(remainingPlayerId);
            return this.endHand();
        }

        // If its that player's turn, advance turn to next active player
        if (this.tableStateRepository.getCurrentTurnPlayerId() === playerId) {
            return this.postActionUpdates();
        }


        return Promise.resolve();

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
            return this.endHand();
        }

        // 2) All-in scenario
        const canActIds = this.tableStateRepository.getCanActPlayerIds();
        const allInIds = this.tableStateRepository.getAllInPlayerIds();

        const canActPlayer = this.tableStateRepository.getPlayer(canActIds[0]);

        if (canActIds.length === 1 && allInIds.length >= 1 && canActPlayer.currentBet >= this.tableStateRepository.getCurrentBet()) { // Check if the one player who can act has matched the bet
            this.runOutBoardToShowdown();
            this.determineWinners();
            return this.endHand();
        
        }

        if (canActIds.length === 0) {
            // Everyone remaining is all-in, run out board to river
            this.runOutBoardToShowdown();

            this.determineWinners();

            return this.endHand();
        }


        // 3) If betting round complete, advance street
        if (this.isBettingRoundComplete()) {

            this.advanceStreet();

            // If river completed, determine winners
            if (this.tableStateRepository.getCurrentStreet() === PokerStreets.SHOWDOWN) {
                this.determineWinners();
                return this.endHand();
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
        const canActIds = this.tableStateRepository.getCanActPlayerIds(); // not folded
        const currentBet = this.tableStateRepository.getCurrentBet();

        // 1) Check that everyone who can act is matched
        for (const playerId of canActIds) {
            const p = this.tableStateRepository.getPlayer(playerId);

            if (p.currentBet < currentBet) {

                console.log(`Betting round not complete: player ${playerId} has not matched current bet`);

                return false;

            }
        }

        // 2) Check that every player has acted (checked)

        for (const playerId of canActIds) {
            const p = this.tableStateRepository.getPlayer(playerId);
 
            if (!p.hasActedThisStreet) {
                console.log(`Betting round not complete: player ${playerId} has not acted this street`);
                return false;
            }
        }

        return true;
    }

    advanceStreet() {
        this.tableStateRepository.recalculatePots();

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

        // Round history street action record
        this.tableStateRepository.handHistory.addStreetRecord(currentStreet, this.tableStateRepository.getCommunityCards().convertToStringArray(), this.tableStateRepository.getPots());
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

        // Add pots to round history for record keeping
        this.tableStateRepository.handHistory.setPotsAtEndOfHand(this.tableStateRepository.getPots());

        this.tableStateRepository.setStreet(PokerStreets.HAND_COMPLETE); // move to hand complete street for game state clarity

        this.emitHandResults();

        // Return a Promise that resolves after 5 seconds
        if (!this.testingMode) {
            return new Promise((resolve) => {
                this.handCompleteTimeout = setTimeout(() => {
                    this.startNextHand();
                    resolve();
                }, 5000);
            });
        }

        return Promise.resolve(); // For testing mode, resolve immediately

        // In testing, manually call startNextHand() from test after asserting hand results, to have more control over timing

    }

    startNextHand() {
        this.tableStateRepository.resetForNewHand();

        // Check if enough players to continue
        if (this.tableStateRepository.getActivePlayerIds().length < 2) {
            console.log('Not enough players to continue. Game over.');
            this.gameInProgress = false;
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
        const activeIds = this.tableStateRepository.activePlayerIds;

        var smallBlindPlayerId;
        var bigBlindPlayerId;

        if (activeIds.length == 2) {
            // In 2 player game, dealer is small blind and other player is big blind
            smallBlindPlayerId = dealerId;
            bigBlindPlayerId = activeIds.find(id => id !== dealerId);


        }
        else {
            // In 3+ player game, player to left of dealer is small blind and next player is big blind

            smallBlindPlayerId = this.findNextActivePlayer(dealerId);
            bigBlindPlayerId = this.findNextActivePlayer(smallBlindPlayerId);
        }

        this.tableStateRepository.setSmallBlind(smallBlindPlayerId);
        this.tableStateRepository.setBigBlind(bigBlindPlayerId);

        
    }

    awardAllPotsToSingleWinner(winnerId) {

        const pots = this.tableStateRepository.getPots();

        let totalWinnings = 0;

        console.log(`Awarding all pots to single winner ${winnerId}. Pots:`, pots);

        pots.forEach(pot => {


            if (!pot.eligiblePlayerIds.includes(winnerId)) {
                // Can happen if last player left was all-in with side pot they weren't eligible for (eligible player disconnected) 
                console.log(`Winner ${winnerId} is not eligible for pot of amount ${pot.amount} with eligible players ${pot.eligiblePlayerIds}. Skipping this pot.`);
                return;
            }


            totalWinnings += pot.amount;
            this.tableStateRepository.playerCollectWinnings(winnerId, pot);
        });


        // Store hand results
        const winner = new Winner(winnerId, totalWinnings, "last player standing");

        this.tableStateRepository.setHandResults([winner]);
    }


    awardPots(pots, communityCards) {
        // payouts aggregated across pots
        const payouts = {}; // { playerId: chipsWon }

        for (const pot of pots) {
            const eligibleIds = pot.eligiblePlayerIds;

            // If everyone eligible folded somehow (shouldn't happen)
            if (!eligibleIds || eligibleIds.length === 0) continue;

            // Build FullHands for eligible players only
            const hands = eligibleIds.map(playerId => {
                const player = this.tableStateRepository.getPlayer(playerId);
                return new FullHand(player, player.getHand(), communityCards);
            });

            // Determine best among this eligible set
            const bestHands = compareHands(hands); // returns array of FullHands (tie -> multiple)

            const winnerIds = bestHands.map(h => h.player.id);

            // Split this pot among winners
            const baseShare = Math.floor(pot.amount / winnerIds.length);
            let remainder = pot.amount - baseShare * winnerIds.length;

            // Give everyone base share
            for (const id of winnerIds) {
                payouts[id] = (payouts[id] ?? 0) + baseShare;
            }

            // Distribute remainder chips (house rule / poker room rule)
            // Give odd chips to winners in seat order starting left of dealer.
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

        return payouts;
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

        // Store shown hole cards for round history
        for (const playerId of activePlayerIds) {
            const player = this.tableStateRepository.getPlayer(playerId);
            this.tableStateRepository.handHistory.setShownHoleCards(playerId, player.getHand().convertToStringArray());
        }

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

    emitHandResults() {
        if (typeof this.onStateChangeCallback === 'function') {
            try {
                this.onStateChangeCallback();
            } catch (err) {
                console.error('[GameEngine] Error in onStateChange callback:', err);
            }
        }
    }

}


