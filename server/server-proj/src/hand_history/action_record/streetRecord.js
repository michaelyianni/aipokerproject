export default class StreetRecord {

    constructor(streetName, communityCardsStr, pots) {
        this.streetName = streetName;
        this.communityCards = communityCardsStr;
        this.potsAtStart = pots; // Array of pot objects, each with amount and eligiblePlayerIds

        this.playerActions = []; // To be filled with PlayerActionRecords for this street
    }

    addPlayerAction(playerActionRecord) {

        this.playerActions.push(playerActionRecord);
    }

}