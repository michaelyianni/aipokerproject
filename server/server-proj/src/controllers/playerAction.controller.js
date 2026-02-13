import { GAME_ACTIONS } from '../constants/gameActions.js';
import GameEngineService from '../services/gameEngine.service.js';

export default class PlayerActionController {
    constructor(lobbyRepository, gameEngineService) {
        this.lobbyRepository = lobbyRepository;
        this.gameEngineService = gameEngineService;
    }

    performAction(playerId, action, amount) {
        // Validate game has started
        if (!this.lobbyRepository.isGameStarted) {
            throw new Error('Game has not started yet');
        }
        // Validate player is in the game
        const player = this.lobbyRepository.getPlayer(playerId);
        if (!player) {
            throw new Error('Player not found in lobby');
        }
        // Validate action is a valid game action
        if (!Object.values(GAME_ACTIONS).includes(action)) {
            throw new Error('Invalid game action: ' + action);
        }
        // Validate amount is a positive number for bet/raise actions
        if ((action === GAME_ACTIONS.BET || action === GAME_ACTIONS.RAISE) && (typeof amount !== 'number' || amount <= 0)) {
            throw new Error('Invalid amount for action ' + action + ': ' + amount);
        }

        this.gameEngineService.playerAction(playerId, action, amount);

    }

    playerDisconnect(playerId) {
        // Validate player is in the game
        const player = this.lobbyRepository.getPlayer(playerId);
        if (!player) {
            throw new Error('Player ' + playerId + ' not found in lobby');
        }

        this.gameEngineService.playerDisconnect(playerId);
        // Check if only one player left - if so, end the game and reset lobby
        // If game is ongoing, mark player as disconnected and skip their turns until they reconnect or game ends
        // If player was host, assign new host (could be first player to the left in seating order, or first to join lobby, etc)
                        
    }


}