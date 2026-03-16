import { GAME_ACTIONS } from "../../constants/gameActions.js";
import Pot from "../../models/Pot.js";
import PlayerActionRecord from "./playerActionRecord.js";
import StreetRecord from "./streetRecord.js";

export default class ActionRecordGenerator {

static createPostBlindAction(playerId, blindType, amount) {
    if (!["small_blind", "big_blind"].includes(blindType)) {
        throw new Error('Invalid blind type for post-blind action: ' + blindType);
    }

    return new PlayerActionRecord(playerId, blindType, amount);
}

    static createPlayerAction(playerId, action, amountAddedToPot = 0, betTo = 0, isAllIn = false) {
        if (!Object.values(GAME_ACTIONS).includes(action)) {
            throw new Error('Invalid action: ' + action);
        }

        return new PlayerActionRecord(playerId, action, amountAddedToPot, betTo, isAllIn);
    }

    static createStreetRecord(street, communityCardsStr, pots) {


        return new StreetRecord(street, communityCardsStr, pots);
    }
}