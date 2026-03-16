export default class PlayerActionRecord {

    constructor(playerId, action, amountAddedToPot = 0, betTo = 0, isAllIn = false) {
        this.playerId = playerId;
        this.action = action;
        this.amountAddedToPot = amountAddedToPot;
        this.betTo = betTo;
        this.isAllIn = isAllIn;
    }


}