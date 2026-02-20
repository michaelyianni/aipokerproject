export default class Winner {
    constructor(playerId, amount, reason) {
        this.playerId = playerId;
        this.amount = amount;
        this.reason = reason; // e.g. "best hand", "last player standing", "split pot", etc
    }
}