import TableStateRepository from "../repositories/tableState.repository.js";
import PlayerState from "./playerState.js";

export default class GameState {
    constructor(tableStateRepository) {
        this.communityCards = tableStateRepository.communityCards.convertToStringArray();
        
        this.populatePlayerStates(tableStateRepository);

        this.playerOrder = tableStateRepository.playerOrder;
        this.currentTurnPlayerId = tableStateRepository.getCurrentTurnPlayerId();
        
        this.pots = tableStateRepository.pots;
        this.currentBet = tableStateRepository.currentBet;
        
        this.currentStreet = tableStateRepository.getCurrentStreet();

        this.smallBlindId = tableStateRepository.smallBlindId;
        this.bigBlindId = tableStateRepository.bigBlindId;
        this.dealerId = tableStateRepository.dealerId;

        this.handResults = tableStateRepository.getHandResults();
    }

    populatePlayerStates(tableStateRepository) {
        this.players = {};

        for (let playerId in tableStateRepository.players) {
            this.players[playerId] = new PlayerState(tableStateRepository.players[playerId]);
        }
    }
}