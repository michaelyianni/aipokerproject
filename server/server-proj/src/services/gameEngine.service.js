import Card from "../models/Card.js";
import CommunityCards from "../models/CommunityCards.js";
import TableStateRepository from "../repositories/tableState.repository.js";
import FullHand from "../models/FullHand.js";
import ActionChecker from "../utils/actionChecker.util.js";
import { evaluateHand, compareHands } from "../utils/handEvaluator.util.js";
import { GAME_ACTIONS } from "../constants/gameActions.js";
import { PokerStreets } from "../constants/pokerStreets.js";
import { table } from "console";

export default class GameEngineService {
    constructor(players = []) {
        this.tableStateRepository = new TableStateRepository(players);

        this.tableStateRepository.initialiseTable();

        // Additional game state initialization can go here


        // Start game loop
        this.startGame();
    }

    // Main game loop logic
    startGame() {

        // Deal hole cards to players
        this.tableStateRepository.dealCardsToPlayers();

        // // Advance player, bet small blind
        // this.tableStateRepository.advanceToNextActivePlayer();
        // this.tableStateRepository.playerBet(this.tableStateRepository.getCurrentTurnPlayerId(), this.tableStateRepository.smallBlindAmount);

        // // Advance player, bet big blind
        // this.tableStateRepository.advanceToNextActivePlayer();
        // this.tableStateRepository.playerBet(this.tableStateRepository.getCurrentTurnPlayerId(), this.tableStateRepository.bigBlindAmount);
        // this.tableStateRepository.advanceToNextActivePlayer();

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
                // this.tableStateRepository.recalculatePots();
                break;

            case GAME_ACTIONS.CALL:
                let callAmount = this.tableStateRepository.getCurrentBet() - player.currentBet;
                this.tableStateRepository.playerBet(playerId, callAmount);
                // this.tableStateRepository.recalculatePots();
                break;
            case GAME_ACTIONS.BET:
                this.tableStateRepository.playerBet(playerId, amount);
                // this.tableStateRepository.recalculatePots();
                this.tableStateRepository.setLastRaiser(playerId);
                break;
            case GAME_ACTIONS.RAISE:
                let raiseAmount = this.tableStateRepository.getCurrentBet() + amount - player.currentBet;
                this.tableStateRepository.playerBet(playerId, raiseAmount);
                // this.tableStateRepository.recalculatePots();
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
            this.endHandAndPrepareNext();
            return;
        }

        // 2) All-in scenario
        // Handle All-ins here
        // if (canActIds.length === 0) {
        // this.runoutBoardToRiver();
        // this.advanceToShowdown();
        // this.determineWinners();
        // this.endHandAndPrepareNext();
        // return;
        // }
        const canActIds = this.tableStateRepository.getCanActPlayerIds();
        const allInIds = this.tableStateRepository.getAllInPlayerIds();

        if (canActIds.length === 1 && allInIds.length >= 1) {

            this.runOutBoardToRiver();
            this.determineWinners();
            this.endHandAndPrepareNext();
            return;
        }

        if (canActIds.length === 0) {
            // Everyone remaining is all-in, run out board to river
            this.runOutBoardToRiver();

            this.determineWinners();

            this.endHandAndPrepareNext();
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
                this.endHandAndPrepareNext();
                return;
            }

            this.setTurnToNextActivePlayer(this.tableStateRepository.getDealer());
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

                // console.log(`Betting round not complete: player ${playerId} has not matched current bet`);

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
                    // console.log(`Betting round not complete: player ${playerId} has not acted this street`);
                    return false;
                }
            }
            return true;
        }

        // There was aggression: round ends when action returns to last raiser

        // console.log('Checking if betting round complete by last raiser return. lastRaiserId:', lastRaiserId, 'currentTurnId:', currentTurnId);

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

    setTurnToNextActivePlayer(playerId) {
        var activePlayerIds = this.tableStateRepository.getActivePlayerIds();

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

            console.log('Turn: ', playerId, '->', nextPlayerId);

            this.tableStateRepository.setCurrentTurnPlayer(nextPlayerId);



            return;
        }


        // Everyone all-in
        this.tableStateRepository.setCurrentTurnPlayer(null);

    }


    endHandAndPrepareNext() {

        this.tableStateRepository.resetForNewHand();

        // Rotate dealer
        let playerOrder = this.tableStateRepository.playerOrder;
        if (playerOrder.length === 0) {
            throw new Error('No players to assign dealer');
        }
        let currentDealerIndex = playerOrder.indexOf(this.tableStateRepository.getDealer());

        console.log('Current dealer id:', this.tableStateRepository.getDealer());

        let nextDealerIndex = (currentDealerIndex + 1) % playerOrder.length;

        console.log('Next dealer id:', playerOrder[nextDealerIndex]);

        this.tableStateRepository.setDealer(playerOrder[nextDealerIndex]);

        this.tableStateRepository.setBlindPlayers();

        this.startGame();
    }


    awardAllPotsToSingleWinner(winnerId) {
        const pots = this.tableStateRepository.pots; // ideally: getPots()

        const total = (pots ?? []).reduce((sum, p) => sum + (p.amount ?? p.total ?? 0), 0);

        if (total <= 0) return; // nothing to award

        const winner = this.tableStateRepository.getPlayer(winnerId);
        winner.addChips(total);
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
        // let activePlayerIds = this.tableStateRepository.getActivePlayerIds();
        // let communityCards = this.tableStateRepository.getCommunityCards();

        // if( communityCards.getCards().length < 5 ) {
        //     throw new Error('Cannot determine winners before river is dealt');
        // }
        // if (activePlayerIds.length === 0) {
        //     throw new Error('No active players to determine winners from');
        // }

        // let playerHands = activePlayerIds.map(playerId => {
        //     let player = this.tableStateRepository.getPlayer(playerId);
        //     let fullHand = new FullHand(player, player.getHand(), communityCards);
        //     return fullHand;
        // });

        // let bestHands = compareHands(playerHands);

        // let winnerIds = bestHands.map(fullHand => fullHand.player.id);

        // this.awardPlayers(winnerIds);

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

        // Optional: log payouts for debugging
        console.log("Showdown payouts:", payouts);
    }


    runOutBoardToRiver() {
        let currentStreet = this.tableStateRepository.getCurrentStreet();
        while (currentStreet !== PokerStreets.SHOWDOWN) {
            this.advanceStreet();
            currentStreet = this.tableStateRepository.getCurrentStreet();
        }
    }
}



