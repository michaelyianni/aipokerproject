import TableStateRepository from "../repositories/tableState.repository.js";
import { GAME_ACTIONS } from "../constants/gameActions.js";

export default class ActionChecker {
    static isValidAction(playerId, action, amount = 0, tableStateRepository) {
        let player = tableStateRepository.getPlayer(playerId);

        switch(action) {
            case GAME_ACTIONS.FOLD:
                return true; // Player can always fold
            case GAME_ACTIONS.CHECK:
                // Validate check


        }
    }

    static validateCheck(player, tableStateRepository) {
        let currentBet = tableStateRepository.getCurrentBet();

        if (player.currentBet < currentBet) {
            throw new Error('Cannot check when there is a higher current bet');
        }

        return true;
    }
}
