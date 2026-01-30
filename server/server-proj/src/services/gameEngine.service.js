import Card from "../models/Card.js";
import CommunityCards from "../models/CommunityCards.js";
import TableStateRepository from "../repositories/tableState.repository.js";
import FullHand from "../models/FullHand.js";
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

        // Advance player, bet small blind
        this.tableStateRepository.advanceToNextActivePlayer();
        this.tableStateRepository.playerBet(this.tableStateRepository.getCurrentTurnPlayerId(), this.tableStateRepository.smallBlindAmount);

        // Advance player, bet big blind
        this.tableStateRepository.advanceToNextActivePlayer();
        this.tableStateRepository.playerBet(this.tableStateRepository.getCurrentTurnPlayerId(), this.tableStateRepository.bigBlindAmount);
        this.tableStateRepository.advanceToNextActivePlayer();

        // Awaiting player actions
    }


    playerAction(playerId, action, amount = 0) {
        
        // Validate action
        // if (!ActionChecker.isValidAction(playerId, action, amount, this.tableStateRepository)) {
        //     throw new Error('Invalid action');
        // } 
        
        // Handle player actions: fold, call, raise, check
        let player = this.tableStateRepository.getPlayer(playerId);

        switch(action) {
            case GAME_ACTIONS.FOLD:
                player.fold();
                this.tableStateRepository.removeActivePlayer(playerId);
                break;
            
            case GAME_ACTIONS.CALL:
                let callAmount = this.tableStateRepository.getCurrentBet() - player.currentBet;
                this.tableStateRepository.playerBet(playerId, callAmount);
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

    postActionUpdates() {

        // Advance turn to next active player
        this.setTurnToNextActivePlayer(this.tableStateRepository.getCurrentTurnPlayerId());

        // 1) Hand ends if only one player remains
        if( this.tableStateRepository.getActivePlayerIds().length === 1) {
            // All players have folded except one, end round

            this.tableStateRepository.collectPotAndResetBetsAndFlags();

            this.awardPlayers( [ this.tableStateRepository.getActivePlayerIds()[0] ] );

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

        // 3) If betting round complete, advance street
        if (this.isBettingRoundComplete()) {
            
            this.tableStateRepository.collectPotAndResetBetsAndFlags();
    
            this.advanceStreet();

            // If river completed, determine winners
            if (this.tableStateRepository.getCurrentStreet() === PokerStreets.SHOWDOWN) {
                this.determineWinners();
                this.endHandAndPrepareNext();
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



        this.tableStateRepository.collectPotAndResetBetsAndFlags();

        this.tableStateRepository.resetCurrentBet();

        this.tableStateRepository.setLastRaiser(null);
    }

    setTurnToNextActivePlayer(playerId) {
        var activePlayerIds = this.tableStateRepository.getActivePlayerIds();
        var playerIds = this.tableStateRepository.playerOrder;

        // Get player index in player order
        let playerIndex = playerIds.indexOf(playerId);

        let currentIndex = (playerIndex + 1) % this.tableStateRepository.playerOrder.length;
        
        // while current player is not active, advance
        while (!activePlayerIds.includes(playerIds[currentIndex])) {
            currentIndex = (currentIndex + 1) % playerIds.length;
        }

        let firstToActId = playerIds[currentIndex];
        console.log('Turn: ', playerId, '->', firstToActId);

        this.tableStateRepository.setCurrentTurnPlayer(firstToActId);

    }


    endHandAndPrepareNext() {

    }

    awardPlayers(winnerIds) {
        let potAmount = this.tableStateRepository.pot.getTotal();
        let splitAmount = Math.floor(potAmount / winnerIds.length);

        for (let winnerId of winnerIds) {
            let winner = this.tableStateRepository.getPlayer(winnerId);
            winner.addChips(splitAmount);
        }
    }

    determineWinners() {
        let activePlayerIds = this.tableStateRepository.getActivePlayerIds();
        let communityCards = this.tableStateRepository.getCommunityCards();

        if( communityCards.getCards().length < 5 ) {
            throw new Error('Cannot determine winners before river is dealt');
        }
        if (activePlayerIds.length === 0) {
            throw new Error('No active players to determine winners from');
        }

        let playerHands = activePlayerIds.map(playerId => {
            let player = this.tableStateRepository.getPlayer(playerId);
            let fullHand = new FullHand(player, player.getHand(), communityCards);
            return fullHand;
        });

        let bestHands = compareHands(playerHands);

        let winnerIds = bestHands.map(fullHand => fullHand.player.id);

        this.awardPlayers(winnerIds);
    }

        
}



