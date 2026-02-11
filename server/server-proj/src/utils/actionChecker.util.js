import TableStateRepository from "../repositories/tableState.repository.js";
import { GAME_ACTIONS } from "../constants/gameActions.js";

export default class ActionChecker {
    static isValidAction(playerId, action, amount = 0, tableStateRepository) {
        let player = tableStateRepository.getPlayer(playerId);

        if (tableStateRepository.getCurrentTurnPlayerId() !== playerId) {
            throw new Error('Player '+ playerId + ' cannot act out of turn. Current turn ID: ' + tableStateRepository.getCurrentTurnPlayerId());
        }

        if (tableStateRepository.getCanActPlayerIds().includes(playerId) === false) {
            throw new Error('Player ' + playerId + ' cannot act. CanActPlayerIds: ' + tableStateRepository.getCanActPlayerIds());
        }

        // Validate action type and amount

        switch(action) {
            case GAME_ACTIONS.FOLD:
                return true; // Player can always fold
            case GAME_ACTIONS.CHECK:
                // Validate check
                return this.validateCheck(player, tableStateRepository);
            case GAME_ACTIONS.CALL:
                return this.validateCall(player, tableStateRepository);
            case GAME_ACTIONS.BET:
                return this.validateBet(player, amount, tableStateRepository);
            case GAME_ACTIONS.RAISE:
                return this.validateRaise(player, amount, tableStateRepository);
            default:
                throw new Error('Invalid action: ' + action);
        }
    }

    static validateCheck(player, tableStateRepository) {
        let currentBet = tableStateRepository.getCurrentBet();

        if (currentBet > 0) {
            throw new Error('Cannot check when there is a bet on the table. Current bet: ' + currentBet);
        }

        return true;
    }

    static validateCall(player, tableStateRepository) {
        let currentBet = tableStateRepository.getCurrentBet();
        let playerCurrentBet = player.getCurrentBet();

        if (currentBet === 0) {
            throw new Error('Cannot call when there is no bet on the table - should check instead');
        }

        if (playerCurrentBet === currentBet) {
            throw new Error('Player has already matched the current bet');
        }

        return true;
    }

    static validateBet(player, amount, tableStateRepository) {
        if (amount <= 0) {
            throw new Error('Bet amount must be greater than 0');
        }

        let currentBet = tableStateRepository.getCurrentBet();

        if (currentBet > 0) {
            throw new Error('Cannot bet when there is already a bet on the table. Should call or raise instead');
        }

        return true;
    }

    static validateRaise(player, amount, tableStateRepository) {
        if (amount <= 0) {
            throw new Error('Raise amount must be greater than 0');
        }

        let currentBet = tableStateRepository.getCurrentBet();

        if (currentBet === 0) {
            throw new Error('Cannot raise when there is no bet on the table - should bet instead');
        }

        // If bet amount is more than player's chips, they can only raise all-in with their remaining chips

        // Calculate the total bet amount of the raise (current bet + raise amount)
        let totalBet = currentBet + amount;
        if (totalBet > player.chips + player.getCurrentBet()) {
            throw new Error('Cannot raise more than your total chips. Player chips: ' + player.chips + ', current bet: ' + player.getCurrentBet() + ', attempted raise total bet: ' + totalBet);
        }

        return true;
    }
}