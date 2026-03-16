export default class PlayerInfo {
    constructor(holeCards, seatPosition, blindPosition, stackSize) {
        this.holeCards = holeCards;
        this.seatPosition = seatPosition; // e.g., "BTN", "SB", "BB", "UTG", "CO", etc.
        this.blindPosition = blindPosition; // "small_blind", "big_blind", or null
        this.startingStack = stackSize;
    }
}