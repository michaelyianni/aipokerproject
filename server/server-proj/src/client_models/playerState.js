import Player from "./Player.js";

export default class PlayerState {
    constructor(player) {
        this.id = player.id;
        this.name = player.name;
        this.chips = player.chips;
        this.currentBet = player.currentBet;
        this.totalBetThisHand = player.totalBetThisHand;
        this.hasFolded = player.hasFolded;
        this.isAllIn = player.isAllIn;
    }
}