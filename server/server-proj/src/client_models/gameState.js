import TableStateRepository from "../repositories/tableState.repository";

export default class GameState {
    constructor(tableStateRepository) {
        this.communityCards = tableStateRepository.communityCards;
        
        this.populatePlayerStates(tableStateRepository);

        this.playerOrder = tableStateRepository.playerOrder;
        this.currentTurnPlayerId = tableStateRepository.getCurrentTurnPlayerId();
        
        this.pots = tableStateRepository.pots;
        this.currentBet = tableStateRepository.currentBet;
        

        this.smallBlindId = tableStateRepository.smallBlindId;
        this.bigBlindId = tableStateRepository.bigBlindId;
        this.dealerId = tableStateRepository.dealerId;
    }

    populatePlayerStates(tableStateRepository) {
        this.players = {};

        for (let playerId in tableStateRepository.players) {
            this.players[playerId] = new PlayerState(tableStateRepository.players[playerId]);
        }
    }
}