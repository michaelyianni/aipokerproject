import RoundHistory from "../../src/round_history/roundHistory.js";
import Player from "../../src/models/Player.js";
import GameEngineService from "../../src/services/gameEngine.service.js";

import assert from "assert";

console.log("Running RoundHistory tests...");


// Test for 2 players
let player1 = new Player("Alice");
let player2 = new Player("Bob");
let players = [player1, player2];

let gameEngine = new GameEngineService(players, null, true); // pass testingMode

let roundHistory = gameEngine.tableStateRepository.roundHistory;

// console.log("Initial round history state after game start:");
// console.log(JSON.stringify(roundHistory, null, 2));

// Test initial round history state after game start
assert.strictEqual(roundHistory.smallBlindAmount, 5, "Small blind amount should be 5");
assert.strictEqual(roundHistory.bigBlindAmount, 10, "Big blind amount should be 10");
assert.strictEqual(Object.keys(roundHistory.playerInfo).length, 2, "Should have player info for both players");
assert.strictEqual(roundHistory.playerInfo[player1.id].seatPosition, "BTN", "Player 1 should be in BTN position");
assert.strictEqual(roundHistory.playerInfo[player2.id].seatPosition, "SB", "Player 2 should be in SB position");

// Test for 6 players
player1 = new Player("Alice");
player2 = new Player("Bob");
let player3 = new Player("Charlie");
let player4 = new Player("David");
let player5 = new Player("Eve");
let player6 = new Player("Frank");
players = [player1, player2, player3, player4, player5, player6];

gameEngine = new GameEngineService(players, null, true); // pass testingMode=true to skip auto-advance delay after hand complete

roundHistory = gameEngine.tableStateRepository.roundHistory;

// console.log("Initial round history state after game start:");
// console.log(JSON.stringify(roundHistory, null, 2));

// Test initial round history state after game start
assert.strictEqual(roundHistory.smallBlindAmount, 5, "Small blind amount should be 5");
assert.strictEqual(roundHistory.bigBlindAmount, 10, "Big blind amount should be 10");
assert.strictEqual(Object.keys(roundHistory.playerInfo).length, 6, "Should have player info for all 6 players");
assert.strictEqual(roundHistory.playerInfo[player1.id].seatPosition, "BTN", "Player 1 should be in BTN position");
assert.strictEqual(roundHistory.playerInfo[player2.id].seatPosition, "SB", "Player 2 should be in SB position");
assert.strictEqual(roundHistory.playerInfo[player3.id].seatPosition, "BB", "Player 3 should be in BB position");
assert.strictEqual(roundHistory.playerInfo[player4.id].seatPosition, "UTG", "Player 4 should be in UTG position");
assert.strictEqual(roundHistory.playerInfo[player5.id].seatPosition, "MP", "Player 5 should be in MP position");
assert.strictEqual(roundHistory.playerInfo[player6.id].seatPosition, "CO", "Player 6 should be in CO position");

assert.strictEqual(roundHistory.playerInfo[player1.id].blindPosition, null, "Player 1 should not have a blind position");
assert.strictEqual(roundHistory.playerInfo[player2.id].blindPosition, "small_blind", "Player 2 should be small blind");
assert.strictEqual(roundHistory.playerInfo[player3.id].blindPosition, "big_blind", "Player 3 should be big blind");
assert.strictEqual(roundHistory.playerInfo[player4.id].blindPosition, null, "Player 4 should not have a blind position");
assert.strictEqual(roundHistory.playerInfo[player5.id].blindPosition, null, "Player 5 should not have a blind position");
assert.strictEqual(roundHistory.playerInfo[player6.id].blindPosition, null, "Player 6 should not have a blind position");


// Test action history recording
gameEngine.playerAction(player4.id, "RAISE", 20); // Raise to 30 total (20 raise on top of big blind 10)
gameEngine.playerAction(player5.id, "RAISE", 20); // Raise to 50 total (20 raise on top of previous raise to 30)
gameEngine.playerAction(player6.id, "FOLD");
gameEngine.playerAction(player1.id, "CALL");
gameEngine.playerAction(player2.id, "CALL");
gameEngine.playerAction(player3.id, "CALL");


// console.log("Round history state after 6 pre-flop actions:");
// console.log(JSON.stringify(roundHistory, null, 2));

assert.strictEqual(roundHistory.streetRecords[0].playerActions.length, 8, "Should have 8 action records in history"); // Including 2 post-blind actions and 6 pre-flop actions

assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].playerId, player4.id, "First action should be from player 4");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].action, "RAISE", "First action should be RAISE");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].amountAddedToPot, 30, "First action should have added 20 to the pot");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].betTo, 30, "First action amount should be 30");

assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].playerId, player5.id, "Second action should be from player 5");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].action, "RAISE", "Second action should be RAISE");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].amountAddedToPot, 50, "Second action should have added 20 to the pot");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].betTo, 50, "Second action amount should be 50");

assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].playerId, player6.id, "Third action should be from player 6");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].action, "FOLD", "Third action should be FOLD");

assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].playerId, player1.id, "Fourth action should be from player 1");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].action, "CALL", "Fourth action should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].amountAddedToPot, 50, "Fourth action should have added 20 to the pot");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].betTo, 50, "Fourth action amount should be 50");

assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].playerId, player2.id, "Fifth action should be from player 2");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].action, "CALL", "Fifth action should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].amountAddedToPot, 45, "Fifth action should have added 20 to the pot");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].betTo, 50, "Fifth action amount should be 50");

assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].playerId, player3.id, "Sixth action should be from player 3");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].action, "CALL", "Sixth action should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].amountAddedToPot, 40, "Sixth action should have added 20 to the pot");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].betTo, 50, "Sixth action amount should be 50");


// Test street record creation
gameEngine.playerAction(player4.id, "CALL");

// console.log("Round history state after big blind calls to complete pre-flop:");
// console.log(JSON.stringify(roundHistory, null, 2));

// Test player action data
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].playerId, player4.id, "Seventh action should be from player 4");  
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].action, "CALL", "Seventh action should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].amountAddedToPot, 20, "Seventh action should have added 20 to the pot");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].betTo, 50, "Seventh action amount should be 50");

// Test flop street record creation
assert.strictEqual(roundHistory.streetRecords.length, 2, "Should have 2 street records after flop starts");
assert.strictEqual(roundHistory.streetRecords[1].streetName, "flop", "Second street record should be for the flop");
assert.strictEqual(roundHistory.streetRecords[1].playerActions.length, 0, "Should have no player actions recorded for the flop yet");



// Flop - player 2 bets, player 3 folds, player 4 calls, player 5 folds, player 1 folds (for testing purposes, we will just have player 1 fold here instead of calling to keep the test simpler and focus on the action recording - we will test more complex action sequences in later tests)
gameEngine.playerAction(player2.id, "BET", 40);
gameEngine.playerAction(player3.id, "FOLD");
gameEngine.playerAction(player4.id, "CALL");
gameEngine.playerAction(player5.id, "FOLD");
gameEngine.playerAction(player1.id, "FOLD");

// console.log("Round history state after flop actions:");
// console.log(JSON.stringify(roundHistory, null, 2));

// Turn - check until end of round
gameEngine.playerAction(player2.id, "BET", 100);
gameEngine.playerAction(player4.id, "CALL");

// River - check until end of round
gameEngine.playerAction(player2.id, "CHECK");
gameEngine.playerAction(player4.id, "CHECK");

console.log("Round history state after turn and river actions:");
console.log(JSON.stringify(roundHistory, null, 2));


