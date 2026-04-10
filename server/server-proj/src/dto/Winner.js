export default class Winner {
    constructor(playerId, amount, reason) {
        this.playerId = playerId;
        this.amount = amount;
        this.reason = reason; // e.g. "best hand" or "last player standing"
    }
}