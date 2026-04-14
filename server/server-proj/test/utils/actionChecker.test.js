import GameEngineService from "../../src/services/gameEngine.service.js";
import Player from "../../src/models/Player.js";
import ActionChecker from "../../src/utils/actionChecker.util.js";
import { GAME_ACTIONS } from "../../src/constants/gameActions.js";

import assert from "assert";

console.log("Testing ActionChecker (player action validation)...");

let player1 = new Player("Alice");
let player2 = new Player("Bob");
let player3 = new Player("Charlie");
let players = [player1, player2, player3];

// GameEngineService initialises table + starts game (posts blinds, sets turn, etc.)
let gameEngine = new GameEngineService(players);
let repo = gameEngine.tableStateRepository;

console.log(`[INFO] Turn at start: ${repo.getCurrentTurnPlayerId()}`);
console.log(`[INFO] CurrentBet at start: ${repo.getCurrentBet()}`);
console.log(`[INFO] CanActPlayerIds at start: ${repo.getCanActPlayerIds()}`);

let turnId = repo.getCurrentTurnPlayerId();
let currentBet = repo.getCurrentBet();

// 1) Out-of-turn should be rejected
console.log("\n[TEST] Out-of-turn action should throw");
let notTurnId = (turnId === player1.id) ? player2.id : player1.id;

assert.throws(
  () => ActionChecker.isValidAction(notTurnId, GAME_ACTIONS.FOLD, 0, repo),
  /cannot act out of turn/i,
  "Out-of-turn FOLD should throw"
);

// 2) If player cannot act (e.g. all-in), should be rejected 
console.log("\n[TEST] Player not in canAct should throw (simulate all-in by setting isAllIn)");
{
  // Make current turn player all-in, and ensure canAct excludes them
  const p = repo.getPlayer(turnId);
  p.isAllIn = true;

  assert.throws(
    () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.FOLD, 0, repo),
    /cannot act\./i,
    "All-in player should not be allowed to act"
  );

  // Undo so other tests can proceed normally
  p.isAllIn = false;
}

// Refresh
turnId = repo.getCurrentTurnPlayerId();
currentBet = repo.getCurrentBet();

// 3) CHECK validation
console.log("\n[TEST] CHECK validation");

// If currentBet > 0, CHECK must be rejected
console.log(`[INFO] currentBet is ${currentBet} (likely BB). CHECK should be invalid if > 0`);
if (currentBet > 0) {
  assert.throws(
    () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.CHECK, 0, repo),
    /cannot check/i,
    "CHECK should be invalid when there is a bet on the table"
  );
}

// When currentBet == 0, CHECK should be allowed.
// Finish preflop and get to a fresh street.
console.log("\n[INFO] Advancing to a street with currentBet=0 (finish preflop with calls)");

// Current turn is some player (often dealer per your engine). We just make legal actions to close the street.
turnId = repo.getCurrentTurnPlayerId();
currentBet = repo.getCurrentBet();


turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] Current turn -> RAISE 10");
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.RAISE, 10, repo),
  true,
  "RAISE should be valid when there is a bet on the table and raise amount > 0"
);
gameEngine.playerAction(turnId, GAME_ACTIONS.RAISE, 10);

// Next two players CALL to close preflop
turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] Next turn -> CALL");
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, repo),
  true,
  "CALL should be valid when player has not matched current bet"
);
gameEngine.playerAction(turnId, GAME_ACTIONS.CALL);

turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] Next turn -> CALL");
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, repo),
  true,
  "CALL should be valid when player has not matched current bet"
);
gameEngine.playerAction(turnId, GAME_ACTIONS.CALL);

// We should now be on FLOP with currentBet reset to 0
currentBet = repo.getCurrentBet();
console.log(`[INFO] Street is now ${repo.getCurrentStreet()} | currentBet=${currentBet}`);
assert.strictEqual(currentBet, 0, "After street transition, currentBet should be reset to 0");

turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] CHECK on new street (currentBet=0) should be valid");
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.CHECK, 0, repo),
  true,
  "CHECK should be valid when currentBet == 0"
);

// 4) CALL validation
console.log("\n[TEST] CALL validation");

// When currentBet == 0, CALL must be rejected
console.log(`[ACTION] CALL with currentBet=0 should be invalid`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, repo),
  /cannot call when there is no bet/i,
  "CALL should be invalid when currentBet == 0"
);

// Create a bet on the flop: current player BET 50 (valid when currentBet==0)
console.log(`[ACTION] BET 50 should be valid when currentBet==0`);
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.BET, 50, repo),
  true,
  "BET should be valid when currentBet == 0 and amount > 0"
);
gameEngine.playerAction(turnId, GAME_ACTIONS.BET, 50);

currentBet = repo.getCurrentBet();
console.log(`[INFO] After BET, currentBet=${currentBet}`);
assert.strictEqual(currentBet > 0, true, "After BET, currentBet should be > 0");

// Next player: CALL should be valid if they haven't matched currentBet
turnId = repo.getCurrentTurnPlayerId();
console.log(`[ACTION] CALL should be valid when currentBet>0 and player hasn't matched`);
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, repo),
  true,
  "CALL should be valid when player has not matched current bet"
);

// CALL should be invalid if player already matched current bet.

{
  const p = repo.getPlayer(turnId);
  const original = p.currentBet;
  p.currentBet = repo.getCurrentBet();

  console.log("[ACTION] CALL when already matched should be invalid");
  assert.throws(
    () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, repo),
    /already matched/i,
    "CALL should be invalid when playerCurrentBet === currentBet"
  );

  // restore
  p.currentBet = original;
}

// 5) BET validation
console.log("\n[TEST] BET validation");

// BET amount <= 0 should throw
turnId = repo.getCurrentTurnPlayerId();
console.log(`[ACTION] BET 0 should be invalid`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.BET, 0, repo),
  /greater than 0/i,
  "BET with amount 0 should be invalid"
);

// BET when currentBet > 0 should throw (table currently has a bet outstanding)
console.log(`[INFO] currentBet is ${repo.getCurrentBet()} (should be > 0). BET should be invalid now`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.BET, 10, repo),
  /cannot bet when there is already a bet/i,
  "BET should be invalid when currentBet > 0"
);

// 6) RAISE validation
console.log("\n[TEST] RAISE validation");

// RAISE amount <= 0 should throw
console.log("[ACTION] RAISE 0 should be invalid");
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.RAISE, 0, repo),
  /greater than 0/i,
  "RAISE with amount 0 should be invalid"
);

// RAISE when currentBet == 0 should throw
// Finish street
console.log("\n[INFO] Closing current betting round so we can test raise when currentBet=0");

// Let current turn player CALL (valid)
turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] P(turn) -> CALL to match bet");
assert.strictEqual(ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, repo), true);
gameEngine.playerAction(turnId, GAME_ACTIONS.CALL);

// Next player CALL to close
turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] Next -> CALL to match bet");
assert.strictEqual(ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, repo), true);
gameEngine.playerAction(turnId, GAME_ACTIONS.CALL);

// Now street should have advanced and currentBet reset to 0
console.log(`[INFO] Street=${repo.getCurrentStreet()} currentBet=${repo.getCurrentBet()}`);
assert.strictEqual(repo.getCurrentBet(), 0, "After betting closes, currentBet should reset to 0");

// RAISE should be invalid (no bet on table)
turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] RAISE when currentBet=0 should be invalid");
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.RAISE, 10, repo),
  /cannot raise when there is no bet/i,
  "RAISE should be invalid when currentBet == 0"
);

// RAISE more than total chips should throw
// First, create a bet so raising is permitted: BET 10 by current player
console.log("[ACTION] BET 10 to create a bet on table");
assert.strictEqual(ActionChecker.isValidAction(turnId, GAME_ACTIONS.BET, 10, repo), true);
gameEngine.playerAction(turnId, GAME_ACTIONS.BET, 10);

turnId = repo.getCurrentTurnPlayerId();
const p = repo.getPlayer(turnId);
const tableBetNow = repo.getCurrentBet();
console.log(`[INFO] For over-raise test: playerChips=${p.chips} playerCurrentBet=${p.currentBet} tableCurrentBet=${tableBetNow}`);


// A valid raise within chips should be allowed
const safeRaise = Math.max(1, (p.chips + p.currentBet) - tableBetNow - 1);
console.log(`[ACTION] RAISE within chips should be valid (raise=${safeRaise})`);
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.RAISE, safeRaise, repo),
  true,
  "RAISE should be valid if totalBet is within player's total chips"
);

// 7) FOLD always allowed (when in turn + canAct)
console.log("\n[TEST] FOLD validation (always allowed if in turn and canAct)");
turnId = repo.getCurrentTurnPlayerId();
console.log("[ACTION] FOLD should be valid");
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.FOLD, 0, repo),
  true,
  "FOLD should always be valid for acting player"
);

console.log("\nActionChecker validation tests passed.");
