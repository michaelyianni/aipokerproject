import Card from "../models/Card.js";
import Hand from "../models/Hand.js";
import Player from "../models/Player.js";
import CommunityCards from "../models/CommunityCards.js";

export default class FullHand {
    constructor(player, hand, communityCards) {
        if (!(player instanceof Player)) {
            throw new Error('player must be an instance of Player');
        }

        if (!(hand instanceof Hand)) {
            throw new Error('hand must be an instance of Hand');
        }

        if (!(communityCards instanceof CommunityCards)) {
            throw new Error('communityCards must be an instance of CommunityCards');
        }

        this.player = player;
        this.cards = hand.getCards().concat(communityCards.getCards());
    }

    convertCardsToStringArray() {
        return this.cards.map(card => `${card.rank}${card.suit.charAt(0).toLowerCase()}`);
    }

    getPlayer() {
        return this.player;
    }

}