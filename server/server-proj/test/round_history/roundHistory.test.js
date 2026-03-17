import RoundHistory from "../../src/round_history/roundHistory.js";
import Player from "../../src/models/Player.js";
import GameEngineService from "../../src/services/gameEngine.service.js";

import assert from "assert";

console.log("Running RoundHistory tests...");


// ─── 2-player setup ──────────────────────────────────────────────────────────

let player1 = new Player("Alice");
let player2 = new Player("Bob");
let players = [player1, player2];

let gameEngine = new GameEngineService(players, null, true);
let roundHistory = gameEngine.tableStateRepository.roundHistory;

// Blind amounts
assert.strictEqual(roundHistory.smallBlindAmount, 5, "Small blind amount should be 5");
assert.strictEqual(roundHistory.bigBlindAmount, 10, "Big blind amount should be 10");

// Player info
assert.strictEqual(Object.keys(roundHistory.playerInfo).length, 2, "Should have player info for both players");
assert.strictEqual(roundHistory.playerInfo[player1.id].seatPosition, "BTN", "Player 1 should be in BTN position");
assert.strictEqual(roundHistory.playerInfo[player2.id].seatPosition, "BB", "Player 2 should be in BB position");


// ─── 6-player setup ──────────────────────────────────────────────────────────

player1 = new Player("Alice");
player2 = new Player("Bob");
let player3 = new Player("Charlie");
let player4 = new Player("David");
let player5 = new Player("Eve");
let player6 = new Player("Frank");
players = [player1, player2, player3, player4, player5, player6];

gameEngine = new GameEngineService(players, null, true);
roundHistory = gameEngine.tableStateRepository.roundHistory;

// Blind amounts
assert.strictEqual(roundHistory.smallBlindAmount, 5, "Small blind amount should be 5");
assert.strictEqual(roundHistory.bigBlindAmount, 10, "Big blind amount should be 10");

// Seat positions
assert.strictEqual(Object.keys(roundHistory.playerInfo).length, 6, "Should have player info for all 6 players");
assert.strictEqual(roundHistory.playerInfo[player1.id].seatPosition, "BTN", "Player 1 should be in BTN position");
assert.strictEqual(roundHistory.playerInfo[player2.id].seatPosition, "SB", "Player 2 should be in SB position");
assert.strictEqual(roundHistory.playerInfo[player3.id].seatPosition, "BB", "Player 3 should be in BB position");
assert.strictEqual(roundHistory.playerInfo[player4.id].seatPosition, "UTG", "Player 4 should be in UTG position");
assert.strictEqual(roundHistory.playerInfo[player5.id].seatPosition, "MP", "Player 5 should be in MP position");
assert.strictEqual(roundHistory.playerInfo[player6.id].seatPosition, "CO", "Player 6 should be in CO position");

// Blind positions
assert.strictEqual(roundHistory.playerInfo[player1.id].blindPosition, null, "Player 1 should not have a blind position");
assert.strictEqual(roundHistory.playerInfo[player2.id].blindPosition, "small_blind", "Player 2 should be small blind");
assert.strictEqual(roundHistory.playerInfo[player3.id].blindPosition, "big_blind", "Player 3 should be big blind");
assert.strictEqual(roundHistory.playerInfo[player4.id].blindPosition, null, "Player 4 should not have a blind position");
assert.strictEqual(roundHistory.playerInfo[player5.id].blindPosition, null, "Player 5 should not have a blind position");
assert.strictEqual(roundHistory.playerInfo[player6.id].blindPosition, null, "Player 6 should not have a blind position");


// ─── Pre-flop action recording ───────────────────────────────────────────────

// index 0 = POST_SB (player2), index 1 = POST_BB (player3), then player actions start at index 2

gameEngine.playerAction(player4.id, "RAISE", 20); // raiseBy=20 → new table bet = 30; player4 adds 30 (had 0 in)
gameEngine.playerAction(player5.id, "RAISE", 20); // raiseBy=20 → new table bet = 50; player5 adds 50 (had 0 in)
gameEngine.playerAction(player6.id, "FOLD");
gameEngine.playerAction(player1.id, "CALL");       // calls 50 (had 0 in) → adds 50
gameEngine.playerAction(player2.id, "CALL");       // calls 50 (had 5 in) → adds 45
gameEngine.playerAction(player3.id, "CALL");       // calls 50 (had 10 in) → adds 40

assert.strictEqual(roundHistory.streetRecords[0].playerActions.length, 8,
    "Should have 8 action records (2 blind posts + 6 player actions)");

// ── index 2: player4 RAISE (raiseBy 20, table was 10, player4 had 0 in → adds 30) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].playerId, player4.id, "Action[2] should be from player 4");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].action, "RAISE", "Action[2] should be RAISE");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].amountAddedToPot, 30, "Action[2] amountAddedToPot should be 30");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].toCallBefore, 10, "Action[2] toCallBefore should be 10 (facing BB)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].streetContributionAfter, 30, "Action[2] streetContributionAfter should be 30");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].tableCurrentBetAfter, 30, "Action[2] tableCurrentBetAfter should be 30");

// ── index 3: player5 RAISE (raiseBy 20, table was 30, player5 had 0 in → adds 50) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].playerId, player5.id, "Action[3] should be from player 5");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].action, "RAISE", "Action[3] should be RAISE");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].amountAddedToPot, 50, "Action[3] amountAddedToPot should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].toCallBefore, 30, "Action[3] toCallBefore should be 30 (facing player4's raise)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].streetContributionAfter, 50, "Action[3] streetContributionAfter should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].tableCurrentBetAfter, 50, "Action[3] tableCurrentBetAfter should be 50");

// ── index 4: player6 FOLD ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].playerId, player6.id, "Action[4] should be from player 6");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].action, "FOLD", "Action[4] should be FOLD");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].amountAddedToPot, 0, "Action[4] amountAddedToPot should be 0 (fold)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].toCallBefore, 50, "Action[4] toCallBefore should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].streetContributionAfter, 0, "Action[4] streetContributionAfter should be 0 (never contributed)");

// ── index 5: player1 CALL (had 0 in, calls 50) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].playerId, player1.id, "Action[5] should be from player 1");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].action, "CALL", "Action[5] should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].amountAddedToPot, 50, "Action[5] amountAddedToPot should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].toCallBefore, 50, "Action[5] toCallBefore should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].streetContributionAfter, 50, "Action[5] streetContributionAfter should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[5].tableCurrentBetAfter, 50, "Action[5] tableCurrentBetAfter should be 50 (unchanged by call)");

// ── index 6: player2 CALL (had 5 in from SB, calls 45 more) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].playerId, player2.id, "Action[6] should be from player 2");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].action, "CALL", "Action[6] should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].amountAddedToPot, 45, "Action[6] amountAddedToPot should be 45 (SB already put in 5)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].toCallBefore, 45, "Action[6] toCallBefore should be 45");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].streetContributionAfter, 50, "Action[6] streetContributionAfter should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[6].tableCurrentBetAfter, 50, "Action[6] tableCurrentBetAfter should be 50 (unchanged by call)");

// ── index 7: player3 CALL (had 10 in from BB, calls 40 more) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].playerId, player3.id, "Action[7] should be from player 3");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].action, "CALL", "Action[7] should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].amountAddedToPot, 40, "Action[7] amountAddedToPot should be 40 (BB already put in 10)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].toCallBefore, 40, "Action[7] toCallBefore should be 40");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].streetContributionAfter, 50, "Action[7] streetContributionAfter should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[7].tableCurrentBetAfter, 50, "Action[7] tableCurrentBetAfter should be 50 (unchanged by call)");


// ─── Complete pre-flop (player4 calls the re-raise) ──────────────────────────

// player4 raised to 30, player5 re-raised to 50; player4 had 30 in → calls 20 more
gameEngine.playerAction(player4.id, "CALL");

// ── index 8: player4 CALL (had 30 in, calls 20 more to match 50) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].playerId, player4.id, "Action[8] should be from player 4");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].action, "CALL", "Action[8] should be CALL");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].amountAddedToPot, 20, "Action[8] amountAddedToPot should be 20 (player4 had 30 in already)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].toCallBefore, 20, "Action[8] toCallBefore should be 20");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].streetContributionAfter, 50, "Action[8] streetContributionAfter should be 50");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[8].tableCurrentBetAfter, 50, "Action[8] tableCurrentBetAfter should be 50 (unchanged by call)");

// ─── Flop street record ───────────────────────────────────────────────────────

assert.strictEqual(roundHistory.streetRecords.length, 2, "Should have 2 street records after flop starts");
assert.strictEqual(roundHistory.streetRecords[1].streetName, "flop", "Second street record should be for the flop");
assert.strictEqual(roundHistory.streetRecords[1].playerActions.length, 0, "Should have no player actions recorded for the flop yet");


// ─── Flop actions ────────────────────────────────────────────────────────────

// player2 BET 40 (table bet was 0 → now 40, player2 adds 40)
// remaining players act; player3, player5, player1 fold; player4 calls
gameEngine.playerAction(player2.id, "BET", 40);
gameEngine.playerAction(player3.id, "FOLD");
gameEngine.playerAction(player4.id, "CALL");
gameEngine.playerAction(player5.id, "FOLD");
gameEngine.playerAction(player1.id, "FOLD");

// ── flop index 0: player2 BET 40 ──
assert.strictEqual(roundHistory.streetRecords[1].playerActions[0].playerId, player2.id, "Flop action[0] should be from player 2");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[0].action, "BET", "Flop action[0] should be BET");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[0].amountAddedToPot, 40, "Flop action[0] amountAddedToPot should be 40");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[0].toCallBefore, 0, "Flop action[0] toCallBefore should be 0 (no prior bet)");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[0].streetContributionAfter, 40, "Flop action[0] streetContributionAfter should be 40");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[0].tableCurrentBetAfter, 40, "Flop action[0] tableCurrentBetAfter should be 40");

// ── flop index 1: player3 FOLD ──
assert.strictEqual(roundHistory.streetRecords[1].playerActions[1].playerId, player3.id, "Flop action[1] should be from player 3");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[1].action, "FOLD", "Flop action[1] should be FOLD");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[1].toCallBefore, 40, "Flop action[1] toCallBefore should be 40");

// ── flop index 2: player4 CALL (adds 40) ──
assert.strictEqual(roundHistory.streetRecords[1].playerActions[2].playerId, player4.id, "Flop action[2] should be from player 4");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[2].action, "CALL", "Flop action[2] should be CALL");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[2].amountAddedToPot, 40, "Flop action[2] amountAddedToPot should be 40");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[2].toCallBefore, 40, "Flop action[2] toCallBefore should be 40");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[2].streetContributionAfter, 40, "Flop action[2] streetContributionAfter should be 40");

// ── flop index 3: player5 FOLD ──
assert.strictEqual(roundHistory.streetRecords[1].playerActions[3].playerId, player5.id, "Flop action[3] should be from player 5");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[3].action, "FOLD", "Flop action[3] should be FOLD");

// ── flop index 4: player1 FOLD ──
assert.strictEqual(roundHistory.streetRecords[1].playerActions[4].playerId, player1.id, "Flop action[4] should be from player 1");
assert.strictEqual(roundHistory.streetRecords[1].playerActions[4].action, "FOLD", "Flop action[4] should be FOLD");


// ─── Turn actions ─────────────────────────────────────────────────────────────

// After flop completes with player2 and player4 remaining
// player2 BET 100 (table bet was 0 → now 100), player4 CALL (adds 100)
gameEngine.playerAction(player2.id, "BET", 100);
gameEngine.playerAction(player4.id, "CALL");

assert.strictEqual(roundHistory.streetRecords[2].streetName, "turn", "Third street record should be for the turn");

// ── turn index 0: player2 BET 100 ──
assert.strictEqual(roundHistory.streetRecords[2].playerActions[0].playerId, player2.id, "Turn action[0] should be from player 2");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[0].action, "BET", "Turn action[0] should be BET");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[0].amountAddedToPot, 100, "Turn action[0] amountAddedToPot should be 100");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[0].toCallBefore, 0, "Turn action[0] toCallBefore should be 0 (no prior bet)");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[0].streetContributionAfter, 100, "Turn action[0] streetContributionAfter should be 100");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[0].tableCurrentBetAfter, 100, "Turn action[0] tableCurrentBetAfter should be 100");

// ── turn index 1: player4 CALL (adds 100) ──
assert.strictEqual(roundHistory.streetRecords[2].playerActions[1].playerId, player4.id, "Turn action[1] should be from player 4");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[1].action, "CALL", "Turn action[1] should be CALL");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[1].amountAddedToPot, 100, "Turn action[1] amountAddedToPot should be 100");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[1].toCallBefore, 100, "Turn action[1] toCallBefore should be 100");
assert.strictEqual(roundHistory.streetRecords[2].playerActions[1].streetContributionAfter, 100, "Turn action[1] streetContributionAfter should be 100");


// ─── River actions ────────────────────────────────────────────────────────────

gameEngine.playerAction(player2.id, "CHECK");
gameEngine.playerAction(player4.id, "CHECK");

assert.strictEqual(roundHistory.streetRecords[3].streetName, "river", "Fourth street record should be for the river");

// ── river index 0: player2 CHECK ──
assert.strictEqual(roundHistory.streetRecords[3].playerActions[0].playerId, player2.id, "River action[0] should be from player 2");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[0].action, "CHECK", "River action[0] should be CHECK");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[0].amountAddedToPot, 0, "River action[0] amountAddedToPot should be 0");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[0].toCallBefore, 0, "River action[0] toCallBefore should be 0");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[0].streetContributionAfter, 0, "River action[0] streetContributionAfter should be 0");

// ── river index 1: player4 CHECK ──
assert.strictEqual(roundHistory.streetRecords[3].playerActions[1].playerId, player4.id, "River action[1] should be from player 4");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[1].action, "CHECK", "River action[1] should be CHECK");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[1].amountAddedToPot, 0, "River action[1] amountAddedToPot should be 0");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[1].toCallBefore, 0, "River action[1] toCallBefore should be 0");
assert.strictEqual(roundHistory.streetRecords[3].playerActions[1].streetContributionAfter, 0, "River action[1] streetContributionAfter should be 0");

// console.log(JSON.stringify(roundHistory, null, 2));

// ─── 3-player setup - ALL-IN scenario ──────────────────────────────────────────────────────────

player1 = new Player("Alice");
player2 = new Player("Bob");
player3 = new Player("Charlie");
players = [player1, player2, player3];

player1.chips = 500;
player2.chips = 200;
player3.chips = 1000;

gameEngine = new GameEngineService(players, null, true);
roundHistory = gameEngine.tableStateRepository.roundHistory;



gameEngine.playerAction(player1.id, "ALL-IN"); // raise all-in: 500 > table bet of 10
gameEngine.playerAction(player2.id, "ALL-IN"); // short-stack call all-in: 200 total < 500
gameEngine.playerAction(player3.id, "FOLD");   // fold facing 490 to call

console.log(JSON.stringify(roundHistory, null, 2));

// ── Verify blind posts are still recorded ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[0].playerId, player2.id, "Blind[0] should be player2 POST_SB");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[0].action, "POST_SB", "Blind[0] should be POST_SB");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[0].amountAddedToPot, 5, "Blind[0] amountAddedToPot should be 5");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[0].streetContributionAfter, 5, "Blind[0] streetContributionAfter should be 5");

assert.strictEqual(roundHistory.streetRecords[0].playerActions[1].playerId, player3.id, "Blind[1] should be player3 POST_BB");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[1].action, "POST_BB", "Blind[1] should be POST_BB");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[1].amountAddedToPot, 10, "Blind[1] amountAddedToPot should be 10");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[1].streetContributionAfter, 10, "Blind[1] streetContributionAfter should be 10");

// ── index 2: player1 ALL_IN recorded as RAISE (500 > table bet of 10) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].playerId, player1.id, "Action[2] should be player1");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].action, "RAISE", "Action[2] should be recorded as RAISE (all-in exceeds current bet)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].amountAddedToPot, 500, "Action[2] amountAddedToPot should be 500 (full stack)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].toCallBefore, 10, "Action[2] toCallBefore should be 10 (facing BB)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].streetContributionAfter, 500, "Action[2] streetContributionAfter should be 500");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].tableCurrentBetAfter, 500, "Action[2] tableCurrentBetAfter should be 500 (new bet level)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[2].isAllIn, true, "Action[2] isAllIn should be true");

// ── index 3: player2 ALL-IN recorded as CALL (200 total < 500 table bet → short-stack) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].playerId, player2.id, "Action[3] should be player2");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].action, "CALL", "Action[3] should be recorded as CALL (all-in is less than current bet)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].amountAddedToPot, 195, "Action[3] amountAddedToPot should be 195 (200 total - 5 already posted)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].toCallBefore, 495, "Action[3] toCallBefore should be 495 (500 - 5 already in)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].streetContributionAfter, 200, "Action[3] streetContributionAfter should be 200 (total in this street)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].tableCurrentBetAfter, 500, "Action[3] tableCurrentBetAfter should be 500 (short-stack call doesn't change table bet)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[3].isAllIn, true, "Action[3] isAllIn should be true");

// ── index 4: player3 FOLD (had 10 in from BB, facing 490 to call) ──
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].playerId, player3.id, "Action[4] should be player3");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].action, "FOLD", "Action[4] should be FOLD");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].amountAddedToPot, 0, "Action[4] amountAddedToPot should be 0 (fold adds nothing)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].toCallBefore, 490, "Action[4] toCallBefore should be 490 (500 - 10 already posted as BB)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].streetContributionAfter, 10, "Action[4] streetContributionAfter should be 10 (BB post stays, fold doesn't reset it)");
assert.strictEqual(roundHistory.streetRecords[0].playerActions[4].isAllIn, false, "Action[4] isAllIn should be false");

// ── Pot/winner verification ──
// player1 contributed 500, player2 contributed 200, player3 contributed 10 (folded)
// Main pot: 200 * 3 players (capped by short stack) = not quite - let's be precise:
//   player2 is all-in for 200 total
//   player1 put in 500 but can only win 200 from each opponent
//   Main pot (all 3 eligible): 200 (p1 portion) + 200 (p2) + 10 (p3) = 410
//     → but p3 folded so p3's 10 goes into main pot won by p1 or p2
//   Side pot (only p1 eligible): remaining 300 from p1 (500 - 200)
//     → player3 folded so side pot = 300 (player1 wins uncontested)
//
// Expect 2 pots:
assert.strictEqual(roundHistory.potsBeforeAward.length, 2, "Should have 2 pots (main pot + side pot) after all-in");

// Main pot: player2's max (200) * 2 active players + player3's 10 (folded, contributed to main)
assert.strictEqual(roundHistory.potsBeforeAward[0].amount, 410, "Main pot should be 410");
assert.deepStrictEqual(roundHistory.potsBeforeAward[0].eligiblePlayerIds.sort(), [player1.id, player2.id].sort(), "Main pot eligible players should be player1 and player2");

// Side pot: remaining from player1 only (uncontested since player3 folded)
assert.strictEqual(roundHistory.potsBeforeAward[1].amount, 300, "Side pot should be 300 (player1's excess over short stack)");
assert.deepStrictEqual(roundHistory.potsBeforeAward[1].eligiblePlayerIds, [player1.id], "Side pot should only be eligible to player1");




console.log("All RoundHistory tests passed!");