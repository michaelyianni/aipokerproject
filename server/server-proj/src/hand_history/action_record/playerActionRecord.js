export default class PlayerActionRecord {

    constructor(playerId, action, amountAddedToPot = 0,  toCallBefore = 0, streetContributionAfter = 0, tableCurrentBetAfter = 0, isAllIn = false) {
        this.playerId = playerId;
        this.action = action;
        this.amountAddedToPot = amountAddedToPot;
        this.toCallBefore = toCallBefore;
        this.streetContributionAfter = streetContributionAfter;
        this.tableCurrentBetAfter = tableCurrentBetAfter;
        this.isAllIn = isAllIn;
    }


}