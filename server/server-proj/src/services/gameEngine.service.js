import Card from "../models/Card.js";
import TableStateRepository from "../repositories/tableState.repository.js";
import FullHand from "../models/FullHand.js";
import { evaluateHand, compareHands } from "../utils/handEvaluator.util.js";

export default class GameEngineService {
    constructor(players = {}) {
        this.tableStateRepository = new TableStateRepository(players);

        this.tableStateRepository.initialiseTable();
    }

}



