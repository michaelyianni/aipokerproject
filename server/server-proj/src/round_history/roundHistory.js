import PlayerInfo from "./playerInfo.js";
import ActionRecordGenerator from "./action_record/actionRecordGenerator.js";

export default class RoundHistory {

  constructor() {
    this.smallBlindAmount = 0;
    this.bigBlindAmount = 0;
    this.playerInfo = {};
    this.streetRecords = []; 
    this.potsBeforeAward = [];
    this.winners = [];  // playerIds, amountWon, reason 
    this.shownHoleCards = {}; // playerId -> hole cards shown at showdown
  }

  addPlayerInfo(playerId, holeCards, seatPosition, blindPosition, stackSize) {
    this.playerInfo[playerId] = new PlayerInfo(holeCards, seatPosition, blindPosition, stackSize);
  }

  addPostBlindAction(playerId, blindType, amountAddedToPot, betTo = 0, isAllIn = false) {
    if (this.streetRecords.length === 0) {
      throw new Error('No street record available to add player action.');
    }
    
    this.streetRecords[this.streetRecords.length - 1].addPlayerAction(ActionRecordGenerator.createPostBlindAction(playerId, blindType, amountAddedToPot, betTo, isAllIn));
  }

  addActionRecord(playerId, action, amountAddedToPot = 0, raiseTo = 0, isAllIn = false) {
    if (this.streetRecords.length === 0) {
      throw new Error('No street record available to add player action.');
    }
    this.streetRecords[this.streetRecords.length - 1].addPlayerAction(ActionRecordGenerator.createPlayerAction(playerId, action, amountAddedToPot, raiseTo, isAllIn));
  }

  addStreetRecord(street, communityCardsStr, pots) {
    this.streetRecords.push(ActionRecordGenerator.createStreetRecord(street, communityCardsStr, pots));
  }

  setWinners(winners) {
    this.winners = winners; // Array of objects: {playerId, amountWon, reason}
  }

  setPotsAtEndOfHand(pots) {
    this.potsBeforeAward = pots; // Array of pot objects, each with amount and eligiblePlayerIds
  }

  setShownHoleCards(playerId, holeCards) {
    this.shownHoleCards[playerId] = holeCards; // Array of card strings
  }


}