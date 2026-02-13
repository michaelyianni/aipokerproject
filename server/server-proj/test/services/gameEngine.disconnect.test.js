import GameEngineService from "../../src/services/gameEngine.service.js";
import Player from "../../src/models/Player.js";
import Card from "../../src/models/Card.js";
import { PokerStreets } from "../../src/constants/pokerStreets.js";
import { GAME_ACTIONS } from "../../src/constants/gameActions.js";

import assert from "assert";
import CommunityCards from "../../src/models/CommunityCards.js";
import Hand from "../../src/models/Hand.js";

console.log("Testing GameEngineService PLAYER DISCONNECT...");

// ---------- Test 1: Player disconnects during pre-flop (not their turn) ----------
console.log("\n[TEST 1] Player disconnects during pre-flop (not their turn)");

let player1 = new Player("Alice");
let player2 = new Player("Bob");
let player3 = new Player("Charlie");
let players = [player1, player2, player3];

let gameEngine = new GameEngineService(players);

console.log(`[STREET] Initial street: ${gameEngine.tableStateRepository.getCurrentStreet()}`);
console.log(`[INFO] Blinds posted. Street=${gameEngine.tableStateRepository.getCurrentStreet()} currentBet=${gameEngine.tableStateRepository.getCurrentBet()}`);
console.log(`[INFO] P1 chips=${gameEngine.tableStateRepository.getPlayer(player1.id).chips} currentBet=${gameEngine.tableStateRepository.getPlayer(player1.id).currentBet}`);
console.log(`[INFO] P2 chips=${gameEngine.tableStateRepository.getPlayer(player2.id).chips} currentBet=${gameEngine.tableStateRepository.getPlayer(player2.id).currentBet}`);
console.log(`[INFO] P3 chips=${gameEngine.tableStateRepository.getPlayer(player3.id).chips} currentBet=${gameEngine.tableStateRepository.getPlayer(player3.id).currentBet}`);

// Current turn should be dealer (player1)
let currentTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(currentTurnId, player1.id, "Turn should be player1 at start");

// Player 3 disconnects (not their turn)
console.log(`[DISCONNECT] P3 (Charlie) disconnects`);
gameEngine.playerDisconnect(player3.id);

// Verify player3 is marked as left
let player3State = gameEngine.tableStateRepository.getPlayer(player3.id);
assert.strictEqual(player3State.hasLeft, true, "Player3 should be marked as left");

// Verify player3 is removed from active players
let activePlayerIds = gameEngine.tableStateRepository.getActivePlayerIds();
assert.strictEqual(activePlayerIds.includes(player3.id), false, "Player3 should not be in active players");

// Turn should still be player1 (since it wasn't player3's turn)
currentTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(currentTurnId, player1.id, "Turn should still be player1");

// Continue game with remaining players
console.log(`[ACTION] P1 (Alice) -> CALL`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CALL);
console.log(`[BET] After P1 CALL | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

console.log(`[ACTION] P2 (Bob) -> CALL`);
gameEngine.playerAction(player2.id, GAME_ACTIONS.CALL);
console.log(`[BET] After P2 CALL | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Should advance to FLOP
let currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] After pre-flop, street=${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.FLOP, "Should advance to FLOP with 2 remaining players");

console.log("✅ Test 1 passed: Player disconnect (not their turn) handled correctly");


// ---------- Test 2: Player disconnects during their turn ----------
console.log("\n[TEST 2] Player disconnects during their turn");

player1 = new Player("Alice");
player2 = new Player("Bob");
player3 = new Player("Charlie");
players = [player1, player2, player3];

gameEngine = new GameEngineService(players);

console.log(`[STREET] Initial street: ${gameEngine.tableStateRepository.getCurrentStreet()}`);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Current turn should be dealer (player1)
currentTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(currentTurnId, player1.id, "Turn should be player1 at start");

// Player 1 disconnects on their turn
console.log(`[DISCONNECT] P1 (Alice) disconnects on their turn`);
let p1ChipsBefore = gameEngine.tableStateRepository.getPlayer(player1.id).chips;

gameEngine.playerDisconnect(player1.id);

// Verify player1 is marked as left
let player1State = gameEngine.tableStateRepository.getPlayer(player1.id);
assert.strictEqual(player1State.hasLeft, true, "Player1 should be marked as left");

// Turn should advance to next active player (player2)
currentTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(currentTurnId, player2.id, "Turn should advance to player2");

// Player1's blinds/bets should remain in pot (they lose their invested chips)
let p1ChipsAfter = gameEngine.tableStateRepository.getPlayer(player1.id).chips;
console.log(`[INFO] P1 chips before disconnect: ${p1ChipsBefore}, after: ${p1ChipsAfter}`);
assert.ok(p1ChipsAfter <= p1ChipsBefore, "Player1 should not gain chips after disconnect");

console.log("✅ Test 2 passed: Player disconnect on their turn handled correctly");


// ---------- Test 3: Player disconnects, leaving only 1 player ----------
console.log("\n[TEST 3] Two players disconnect, leaving only 1 player");

player1 = new Player("Alice");
player2 = new Player("Bob");
player3 = new Player("Charlie");
players = [player1, player2, player3];

gameEngine = new GameEngineService(players);

console.log(`[STREET] Initial street: ${gameEngine.tableStateRepository.getCurrentStreet()}`);

let p2ChipsBefore = gameEngine.tableStateRepository.getPlayer(player2.id).chips;

// Player 1 and player 3 disconnect
console.log(`[DISCONNECT] P1 (Alice) disconnects`);
gameEngine.playerDisconnect(player1.id);

console.log(`[DISCONNECT] P3 (Charlie) disconnects`);
gameEngine.playerDisconnect(player3.id);

// Should only have player2 remaining
activePlayerIds = gameEngine.tableStateRepository.getActivePlayerIds();
assert.strictEqual(activePlayerIds.length, 1, "Should have exactly 1 active player");
assert.strictEqual(activePlayerIds[0], player2.id, "Remaining player should be player2");

// Player2 should have won all pots (including blinds from disconnected players)
let p2ChipsAfter = gameEngine.tableStateRepository.getPlayer(player2.id).chips;
console.log(`[RESULT] P2 chips before: ${p2ChipsBefore}, after: ${p2ChipsAfter}`);
assert.ok(p2ChipsAfter > p2ChipsBefore, "Player2 should have won pots after others disconnected");

// New hand should have started with PRE_FLOP
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] After disconnects, street=${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.PRE_FLOP, "Should reset to PRE_FLOP for new hand");

console.log("✅ Test 3 passed: Multiple disconnects leaving 1 player handled correctly");


// ---------- Test 4: Player disconnects mid-hand (on FLOP) ----------
console.log("\n[TEST 4] Player disconnects mid-hand on FLOP");

player1 = new Player("Alice");
player2 = new Player("Bob");
player3 = new Player("Charlie");
players = [player1, player2, player3];

gameEngine = new GameEngineService(players);

// Play through pre-flop
console.log(`[ACTION] P1 (Alice) -> CALL`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CALL);

console.log(`[ACTION] P2 (Bob) -> CALL`);
gameEngine.playerAction(player2.id, GAME_ACTIONS.CALL);

console.log(`[ACTION] P3 (Charlie) -> CHECK`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);

currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] Now on ${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.FLOP, "Should be on FLOP");

// Player2 bets
console.log(`[ACTION] P2 (Bob) -> BET 20`);
gameEngine.playerAction(player2.id, GAME_ACTIONS.BET, 20);
console.log(`[BET] After P2 BET | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Player3 disconnects before acting
console.log(`[DISCONNECT] P3 (Charlie) disconnects on FLOP`);
let p3ChipsBefore = gameEngine.tableStateRepository.getPlayer(player3.id).chips;

gameEngine.playerDisconnect(player3.id);

// Verify player3 is marked as left and removed from active
player3State = gameEngine.tableStateRepository.getPlayer(player3.id);
assert.strictEqual(player3State.hasLeft, true, "Player3 should be marked as left");

activePlayerIds = gameEngine.tableStateRepository.getActivePlayerIds();
assert.strictEqual(activePlayerIds.includes(player3.id), false, "Player3 should not be active");
assert.strictEqual(activePlayerIds.length, 2, "Should have 2 active players remaining");

// Turn should advance to player1
currentTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(currentTurnId, player1.id, "Turn should be player1 after player3 disconnect");

console.log("✅ Test 4 passed: Mid-hand disconnect on FLOP handled correctly");


// ---------- Test 5: Player disconnects after going all-in ----------
console.log("\n[TEST 5] Player disconnects after going all-in");

player1 = new Player("Alice");
player2 = new Player("Bob");
player3 = new Player("Charlie");
players = [player1, player2, player3];

gameEngine = new GameEngineService(players);

// Set player2 to have low chips
gameEngine.tableStateRepository.getPlayer(player2.id).chips = 50;

console.log(`[INFO] P2 chips set to: ${gameEngine.tableStateRepository.getPlayer(player2.id).chips}`);

// Player1 raises big
console.log(`[ACTION] P1 (Alice) -> RAISE to 100`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.RAISE, 90);

// Player2 calls (should go all-in)
console.log(`[ACTION] P2 (Bob) -> CALL (all-in)`);
gameEngine.playerAction(player2.id, GAME_ACTIONS.CALL);

let player2State = gameEngine.tableStateRepository.getPlayer(player2.id);
console.log(`[INFO] P2 isAllIn: ${player2State.isAllIn}, chips: ${player2State.chips}`);
assert.strictEqual(player2State.isAllIn, true, "Player2 should be all-in");

// Player3 calls
console.log(`[ACTION] P3 (Charlie) -> CALL`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CALL);

currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] After pre-flop, street=${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.FLOP, "Should advance to FLOP");

// Player2 disconnects while all-in
console.log(`[DISCONNECT] P2 (Bob) disconnects while all-in`);
gameEngine.playerDisconnect(player2.id);

// Player2 should still be marked as all-in and left
player2State = gameEngine.tableStateRepository.getPlayer(player2.id);
assert.strictEqual(player2State.isAllIn, true, "Player2 should still be all-in");
assert.strictEqual(player2State.hasLeft, true, "Player2 should be marked as left");

// Player2 should not be in active players
activePlayerIds = gameEngine.tableStateRepository.getActivePlayerIds();
assert.strictEqual(activePlayerIds.includes(player2.id), false, "Player2 should not be active after disconnect");

console.log("✅ Test 5 passed: All-in player disconnect handled correctly");


// ---------- Test 6: Invalid disconnect (player not in game) ----------
console.log("\n[TEST 6] Invalid disconnect - player not in game");

player1 = new Player("Alice");
player2 = new Player("Bob");
player3 = new Player("Charlie");
players = [player1, player2, player3];

gameEngine = new GameEngineService(players);

let fakePlayer = new Player("FakePlayer");

console.log(`[DISCONNECT] Attempting to disconnect non-existent player`);

let errorThrown = false;
try {
    gameEngine.playerDisconnect(fakePlayer.id);
} catch (error) {
    console.log(`[ERROR] Expected error caught: ${error.message}`);
    errorThrown = true;
    assert.ok(error.message.includes('not found'), "Error message should indicate player not found");
}

assert.strictEqual(errorThrown, true, "Should throw error for non-existent player");

console.log("✅ Test 6 passed: Invalid disconnect properly rejected");


console.log("\n✅ ALL PLAYER DISCONNECT tests passed.");