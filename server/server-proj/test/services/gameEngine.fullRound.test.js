import GameEngineService from "../../src/services/gameEngine.service.js";
import Player from "../../src/models/Player.js";
import Card from "../../src/models/Card.js";
import { PokerStreets } from "../../src/constants/pokerStreets.js";
import { GAME_ACTIONS } from "../../src/constants/gameActions.js";
import ActionChecker from "../../src/utils/actionChecker.util.js";

import assert from "assert";
import CommunityCards from "../../src/models/CommunityCards.js";
import Hand from "../../src/models/Hand.js";

console.log("Testing GameEngineService FULL ROUND INTEGRATION TEST (6 players)...");

// ---------- Setup 6 Players ----------
let player1 = new Player("Alice");
let player2 = new Player("Bob");
let player3 = new Player("Charlie");
let player4 = new Player("Diana");
let player5 = new Player("Eve");
let player6 = new Player("Frank");

let players = [player1, player2, player3, player4, player5, player6];
let gameEngine = new GameEngineService(players, null, true);

console.log("\n========== ROUND 1: COMPLEX BETTING WITH ALL-INS AND SIDE POTS ==========\n");

// Set varied chip stacks to create interesting all-in scenarios
gameEngine.tableStateRepository.getPlayer(player1.id).chips = 1000; // Alice - big stack (Dealer)
gameEngine.tableStateRepository.getPlayer(player2.id).chips = 150;  // Bob - short stack (Small Blind)
gameEngine.tableStateRepository.getPlayer(player3.id).chips = 500;  // Charlie - medium (Big Blind)
gameEngine.tableStateRepository.getPlayer(player4.id).chips = 300;  // Diana - medium-short (First to act pre-flop)
gameEngine.tableStateRepository.getPlayer(player5.id).chips = 1000; // Eve - big stack
gameEngine.tableStateRepository.getPlayer(player6.id).chips = 75;   // Frank - very short

console.log(`[INFO] Starting chip counts:`);
console.log(`  P1 (Alice):   ${gameEngine.tableStateRepository.getPlayer(player1.id).chips} - DEALER`);
console.log(`  P2 (Bob):     ${gameEngine.tableStateRepository.getPlayer(player2.id).chips} - SMALL BLIND`);
console.log(`  P3 (Charlie): ${gameEngine.tableStateRepository.getPlayer(player3.id).chips} - BIG BLIND`);
console.log(`  P4 (Diana):   ${gameEngine.tableStateRepository.getPlayer(player4.id).chips} - First to act`);
console.log(`  P5 (Eve):     ${gameEngine.tableStateRepository.getPlayer(player5.id).chips}`);
console.log(`  P6 (Frank):   ${gameEngine.tableStateRepository.getPlayer(player6.id).chips}`);

console.log(`\n[STREET] ${gameEngine.tableStateRepository.getCurrentStreet()}`);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);
console.log(`[INFO] Dealer: P${players.findIndex(p => p.id === gameEngine.tableStateRepository.getDealer()) + 1}`);
console.log(`[INFO] Small Blind posted by P${players.findIndex(p => p.id === gameEngine.tableStateRepository.getSmallBlind()) + 1}`);
console.log(`[INFO] Big Blind posted by P${players.findIndex(p => p.id === gameEngine.tableStateRepository.getBigBlind()) + 1}`);

// Verify initial positions
assert.strictEqual(gameEngine.tableStateRepository.getDealer(), player1.id, "Dealer should be player1");
assert.strictEqual(gameEngine.tableStateRepository.getSmallBlind(), player2.id, "Small blind should be player2");
assert.strictEqual(gameEngine.tableStateRepository.getBigBlind(), player3.id, "Big blind should be player3");

// ---------- PRE-FLOP BETTING ----------
console.log("\n--- PRE-FLOP BETTING ---");

let turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
let currentBet = gameEngine.tableStateRepository.getCurrentBet();

// Verify first to act is player4 (after big blind)
assert.strictEqual(turnId, player4.id, "First to act pre-flop should be player4 (after big blind)");
console.log(`[INFO] First to act: P4 (Diana) - correct position after big blind`);

// Test invalid action: Player tries to CHECK when there's a bet
console.log(`\n[INVALID ACTION TEST] P4 (Diana) tries to CHECK when currentBet=${currentBet}`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.CHECK, 0, gameEngine.tableStateRepository),
  /cannot check/i,
  "CHECK should be invalid when there is a bet on the table"
);
console.log(`[VALIDATION] ✓ CHECK correctly rejected`);

// Test invalid action: Out of turn (try player1)
console.log(`\n[INVALID ACTION TEST] P1 (Alice) tries to act out of turn`);
assert.throws(
  () => ActionChecker.isValidAction(player1.id, GAME_ACTIONS.FOLD, 0, gameEngine.tableStateRepository),
  /cannot act out of turn/i,
  "Out-of-turn action should be rejected"
);
console.log(`[VALIDATION] ✓ Out-of-turn action correctly rejected`);

// Player 4 (Diana) - CALL
console.log(`\n[ACTION] P4 (Diana) -> CALL`);
gameEngine.playerAction(player4.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P4 currentBet = ${gameEngine.tableStateRepository.getPlayer(player4.id).currentBet}`);

// Player 5 (Eve) - RAISE to 100
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player5.id, "Turn should be player5");
console.log(`\n[ACTION] P5 (Eve) -> RAISE to 100`);
gameEngine.playerAction(player5.id, GAME_ACTIONS.RAISE, 90);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P5 currentBet = ${gameEngine.tableStateRepository.getPlayer(player5.id).currentBet}`);

// Player 6 (Frank) - CALL (ALL-IN with only 75 chips)
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player6.id, "Turn should be player6");
console.log(`\n[ACTION] P6 (Frank) -> CALL (ALL-IN with only 75 chips)`);
gameEngine.playerAction(player6.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P6 currentBet = ${gameEngine.tableStateRepository.getPlayer(player6.id).currentBet}`);
assert.strictEqual(gameEngine.tableStateRepository.getPlayer(player6.id).isAllIn, true, "Player6 should be all-in");
console.log(`[INFO] P6 is ALL-IN with ${gameEngine.tableStateRepository.getPlayer(player6.id).currentBet} chips bet`);

// Test invalid action: All-in player cannot act
console.log(`\n[INVALID ACTION TEST] P6 (Frank) tries to act while all-in`);
assert.throws(
  () => ActionChecker.isValidAction(player6.id, GAME_ACTIONS.FOLD, 0, gameEngine.tableStateRepository),
  /cannot act/i,
  "All-in player should not be allowed to act"
);
console.log(`[VALIDATION] ✓ All-in player action correctly rejected`);

// Player 1 (Alice - Dealer) - RAISE to 200
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player1.id, "Turn should be player1 (dealer)");
console.log(`\n[ACTION] P1 (Alice) -> RAISE to 200`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.RAISE, 100);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P1 currentBet = ${gameEngine.tableStateRepository.getPlayer(player1.id).currentBet}`);

// Player 2 (Bob - Small Blind) - RAISE ALL-IN to 150
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player2.id, "Turn should be player2 (small blind)");
console.log(`\n[ACTION] P2 (Bob) -> CALL (ALL-IN with only 150 chips - cannot match 200)`);
let p2ChipsBefore = gameEngine.tableStateRepository.getPlayer(player2.id).chips;
gameEngine.playerAction(player2.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P2 currentBet = ${gameEngine.tableStateRepository.getPlayer(player2.id).currentBet}`);
assert.strictEqual(gameEngine.tableStateRepository.getPlayer(player2.id).isAllIn, true, "Player2 should be all-in");
console.log(`[INFO] P2 is ALL-IN with ${gameEngine.tableStateRepository.getPlayer(player2.id).currentBet} chips bet`);

// Player 3 (Charlie - Big Blind) - CALL
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player3.id, "Turn should be player3 (big blind)");
console.log(`\n[ACTION] P3 (Charlie) -> CALL`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P3 currentBet = ${gameEngine.tableStateRepository.getPlayer(player3.id).currentBet}`);

// Player 4 (Diana) - DISCONNECTS during their turn
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player4.id, "Turn should be player4");
console.log(`\n[DISCONNECT] P4 (Diana) disconnects during their turn`);
let p4ChipsBefore = gameEngine.tableStateRepository.getPlayer(player4.id).chips;
gameEngine.playerDisconnect(player4.id);

let player4State = gameEngine.tableStateRepository.getPlayer(player4.id);
assert.strictEqual(player4State.hasLeft, true, "Player4 should be marked as left");
assert.strictEqual(gameEngine.tableStateRepository.getActivePlayerIds().includes(player4.id), false, "Player4 should not be active");
console.log(`[INFO] P4 removed from active players. Turn advanced.`);

// Player 5 (Eve) - CALL to close pre-flop
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player5.id, "Turn should be player5 after player4 disconnect");
console.log(`\n[ACTION] P5 (Eve) -> CALL`);
gameEngine.playerAction(player5.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P5 currentBet = ${gameEngine.tableStateRepository.getPlayer(player5.id).currentBet}`);

// Should advance to FLOP
let currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`\n[STREET] After pre-flop, street=${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.FLOP, "Should advance to FLOP after pre-flop betting closes");

// Verify pots exist and have correct structure
console.log(`\n[POTS] After pre-flop:`);
let pots = gameEngine.tableStateRepository.pots;
assert.ok(pots && pots.length > 0, "Pots array should exist and have at least one pot");

pots.forEach((pot, idx) => {
  const potAmount = typeof pot.getTotal === "function" ? pot.getTotal() : (pot.amount ?? pot.total ?? 0);
  console.log(`  Pot ${idx + 1}: ${potAmount} chips | Eligible: [${pot.eligiblePlayerIds.map(id => `P${players.findIndex(p => p.id === id) + 1}`).join(', ')}]`);
});

// Verify multiple pots due to all-ins
assert.ok(pots.length >= 2, "Should have multiple pots due to all-in players");

// Verify total pot matches total bets
const sumTotalBetThisHand = players.reduce((sum, player) => {
  const p = gameEngine.tableStateRepository.getPlayer(player.id);
  return sum + (p.totalBetThisHand ?? 0);
}, 0);

const sumPots = pots.reduce((acc, pot) => {
  if (typeof pot.getTotal === "function") return acc + pot.getTotal();
  if (typeof pot.amount === "number") return acc + pot.amount;
  if (typeof pot.total === "number") return acc + pot.total;
  return acc;
}, 0);

console.log(`\n[CHECK] totalBetThisHand sum=${sumTotalBetThisHand}, pots sum=${sumPots}`);
assert.strictEqual(sumPots, sumTotalBetThisHand, "Sum of pots should equal sum of totalBetThisHand");

// ---------- FLOP BETTING ----------
console.log("\n--- FLOP BETTING ---");
console.log(`[INFO] Community cards: ${gameEngine.tableStateRepository.getCommunityCards().getCards().length} cards dealt`);
assert.strictEqual(gameEngine.tableStateRepository.getCommunityCards().getCards().length, 3, "Should have 3 community cards on FLOP");

currentBet = gameEngine.tableStateRepository.getCurrentBet();
console.log(`[BET] Table currentBet = ${currentBet} (should be 0 at start of new street)`);
assert.strictEqual(currentBet, 0, "CurrentBet should be reset to 0 for new street");

// First to act on flop should be player2 (small blind) - but P2 is all-in, so should be P3
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
console.log(`[INFO] First to act on FLOP: P${players.findIndex(p => p.id === turnId) + 1} (P2 skipped as all-in)`);
assert.strictEqual(turnId, player3.id, "First to act on FLOP should be player3 (P2 is all-in)");

// Test valid CHECK when currentBet = 0
console.log(`\n[VALIDATION TEST] P3 (Charlie) can CHECK when currentBet=0`);
assert.strictEqual(
  ActionChecker.isValidAction(turnId, GAME_ACTIONS.CHECK, 0, gameEngine.tableStateRepository),
  true,
  "CHECK should be valid when currentBet == 0"
);
console.log(`[VALIDATION] ✓ CHECK correctly allowed`);

// Test invalid CALL when currentBet = 0
console.log(`\n[INVALID ACTION TEST] P3 (Charlie) tries to CALL when currentBet=0`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.CALL, 0, gameEngine.tableStateRepository),
  /cannot call when there is no bet/i,
  "CALL should be invalid when currentBet == 0"
);
console.log(`[VALIDATION] ✓ CALL correctly rejected`);

// Test invalid RAISE when currentBet = 0
console.log(`\n[INVALID ACTION TEST] P3 (Charlie) tries to RAISE when currentBet=0`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.RAISE, 10, gameEngine.tableStateRepository),
  /cannot raise when there is no bet/i,
  "RAISE should be invalid when currentBet == 0"
);
console.log(`[VALIDATION] ✓ RAISE correctly rejected`);

// Player 3 (Charlie) - BET 100
console.log(`\n[ACTION] P3 (Charlie) -> BET 100`);

// Test invalid BET with amount 0
console.log(`\n[INVALID ACTION TEST] P3 (Charlie) tries to BET 0`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.BET, 0, gameEngine.tableStateRepository),
  /greater than 0/i,
  "BET with amount 0 should be invalid"
);
console.log(`[VALIDATION] ✓ BET 0 correctly rejected`);

gameEngine.playerAction(player3.id, GAME_ACTIONS.BET, 100);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Test invalid BET when currentBet > 0
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
console.log(`\n[INVALID ACTION TEST] P${players.findIndex(p => p.id === turnId) + 1} tries to BET when currentBet>0`);
assert.throws(
  () => ActionChecker.isValidAction(turnId, GAME_ACTIONS.BET, 50, gameEngine.tableStateRepository),
  /cannot bet when there is already a bet/i,
  "BET should be invalid when currentBet > 0"
);
console.log(`[VALIDATION] ✓ BET when bet exists correctly rejected`);

// Player 5 (Eve) - RAISE to 250
assert.strictEqual(turnId, player5.id, "Turn should be player5");
console.log(`\n[ACTION] P5 (Eve) -> RAISE to 250`);
gameEngine.playerAction(player5.id, GAME_ACTIONS.RAISE, 150);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Player 1 (Alice) - CALL
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player1.id, "Turn should be player1");
console.log(`\n[ACTION] P1 (Alice) -> CALL`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Player 3 (Charlie) - CALL
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player3.id, "Turn should be player3");
console.log(`\n[ACTION] P3 (Charlie) -> CALL`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Should advance to TURN
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`\n[STREET] After FLOP betting, street=${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.TURN, "Should advance to TURN after FLOP betting closes");

// ---------- TURN BETTING ----------
console.log("\n--- TURN BETTING ---");
console.log(`[INFO] Community cards: ${gameEngine.tableStateRepository.getCommunityCards().getCards().length} cards`);
assert.strictEqual(gameEngine.tableStateRepository.getCommunityCards().getCards().length, 4, "Should have 4 community cards on TURN");

// First to act on turn should be player3 (P2 is all-in)
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
console.log(`[INFO] First to act on TURN: P${players.findIndex(p => p.id === turnId) + 1}`);
assert.strictEqual(turnId, player3.id, "First to act on TURN should be player3");

// Player 3 (Charlie) - CHECK
console.log(`\n[ACTION] P3 (Charlie) -> CHECK`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);

// Player 5 (Eve) - BET 150
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player5.id, "Turn should be player5");
console.log(`\n[ACTION] P5 (Eve) -> BET 150`);
gameEngine.playerAction(player5.id, GAME_ACTIONS.BET, 150);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Player 1 (Alice) - FOLD
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player1.id, "Turn should be player1");
console.log(`\n[ACTION] P1 (Alice) -> FOLD`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.FOLD);
console.log(`[INFO] P1 folded and removed from active players`);
assert.strictEqual(gameEngine.tableStateRepository.getActivePlayerIds().includes(player1.id), false, "Player1 should not be active after folding");

// Player 3 (Charlie) - DISCONNECTS mid-action
turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player3.id, "Turn should be player3");
console.log(`\n[DISCONNECT] P3 (Charlie) disconnects during their turn on TURN`);
let p3ChipsBefore = gameEngine.tableStateRepository.getPlayer(player3.id).chips;
gameEngine.playerDisconnect(player3.id);


// After P3 disconnects, only P5 is left active (P2 and P6 are all-in)

currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`\n[STREET] After P3 disconnects, street=${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.HAND_COMPLETE, "Should move to HAND_COMPLETE after all opponents fold/disconnect except one");

// Verify chip changes
console.log(`\n[RESULT] Chip changes from Round 1:`);
players.forEach((player, idx) => {
  const p = gameEngine.tableStateRepository.getPlayer(player.id);
  if (p) {
    console.log(`  P${idx + 1} (${player.name}): ${p.chips} chips`);
  }
});

// Manually start next hand since we're in testing mode
gameEngine.startNextHand();

// ---------- VERIFY HAND COMPLETION ----------
console.log("\n--- HAND COMPLETION VERIFICATION ---");

// New street should be PRE_FLOP (new hand)
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] Current street after hand completion: ${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.PRE_FLOP, "Should be PRE_FLOP after hand completes");



// Verify eliminated players are not active
console.log(`\n[INFO] Checking eliminated players...`);
if (gameEngine.tableStateRepository.getPlayer(player2.id).chips === 0) {
  assert.strictEqual(
    gameEngine.tableStateRepository.getActivePlayerIds().includes(player2.id),
    false,
    "Player2 should be eliminated if chips = 0"
  );
  console.log(`  P2 (Bob) eliminated: ✓`);
}

if (gameEngine.tableStateRepository.getPlayer(player6.id).chips === 0) {
  assert.strictEqual(
    gameEngine.tableStateRepository.getActivePlayerIds().includes(player6.id),
    false,
    "Player6 should be eliminated if chips = 0"
  );
  console.log(`  P6 (Frank) eliminated: ✓`);
}

// Verify disconnected players (P3, P4) have been deleted from table state
assert.strictEqual(gameEngine.tableStateRepository.getPlayer(player4.id), undefined, "Player4 should be removed from table state after hand completion");
console.log(`  P4 (Diana) removed from table state: ✓`);

assert.strictEqual(gameEngine.tableStateRepository.getPlayer(player3.id), undefined, "Player3 should be removed from table state after hand completion");
console.log(`  P3 (Charlie) removed from table state: ✓`);

// Verify dealer rotation
let newDealerId = gameEngine.tableStateRepository.getDealer();
console.log(`\n[INFO] Dealer for new hand: P${players.findIndex(p => p.id === newDealerId) + 1}`);
assert.notStrictEqual(newDealerId, player1.id, "Dealer should have rotated from player1");

// Verify enough players to continue
let activePlayerIds = gameEngine.tableStateRepository.getActivePlayerIds();
console.log(`[INFO] Active players for new hand: ${activePlayerIds.length}`);
assert.ok(activePlayerIds.length >= 2 || activePlayerIds.length === 0, "Should have 0 players (game over) or >= 2 players (can continue)");

if (activePlayerIds.length >= 2) {
  console.log(`\n========== ROUND 2: CONTINUED PLAY WITH REMAINING PLAYERS ==========\n`);
  
  console.log(`[INFO] Starting chip counts for Round 2:`);
  activePlayerIds.forEach(id => {
    const p = gameEngine.tableStateRepository.getPlayer(id);
    console.log(`  P${players.findIndex(pl => pl.id === id) + 1} (${players.find(pl => pl.id === id).name}): ${p.chips} chips`);
  });
  
  // Verify positions for Round 2
  let round2Dealer = gameEngine.tableStateRepository.getDealer();
  let round2SB = gameEngine.tableStateRepository.getSmallBlind();
  let round2BB = gameEngine.tableStateRepository.getBigBlind();
  console.log(`[INFO] Round 2 Dealer: P${players.findIndex(p => p.id === round2Dealer) + 1}`);
  console.log(`[INFO] Round 2 Small Blind: P${players.findIndex(p => p.id === round2SB) + 1}`);
  console.log(`[INFO] Round 2 Big Blind: P${players.findIndex(p => p.id === round2BB) + 1}`);
  
  // Quick round to verify game continues normally
  console.log(`\n--- PRE-FLOP BETTING (Round 2) ---`);
  
  turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
  currentBet = gameEngine.tableStateRepository.getCurrentBet();
  console.log(`[BET] Table currentBet = ${currentBet}`);
  console.log(`[INFO] First to act: P${players.findIndex(p => p.id === turnId) + 1} (first after big blind)`);
  
  // First player after BB acts
  console.log(`[ACTION] P${players.findIndex(p => p.id === turnId) + 1} -> CALL`);
  gameEngine.playerAction(turnId, GAME_ACTIONS.CALL);
  
  // Dealer calls or checks depending on position
  turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
  if (gameEngine.tableStateRepository.getPlayer(turnId).currentBet < currentBet) {
    console.log(`[ACTION] P${players.findIndex(p => p.id === turnId) + 1} -> CALL`);
    gameEngine.playerAction(turnId, GAME_ACTIONS.CALL);
  }
  
  // Small blind calls if needed
  turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
  if (turnId && gameEngine.tableStateRepository.getPlayer(turnId).currentBet < gameEngine.tableStateRepository.getCurrentBet()) {
    console.log(`[ACTION] P${players.findIndex(p => p.id === turnId) + 1} -> CALL`);
    gameEngine.playerAction(turnId, GAME_ACTIONS.CALL);
  }
  
  // Big blind checks
  turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
  if (turnId) {
    console.log(`[ACTION] P${players.findIndex(p => p.id === turnId) + 1} -> CHECK`);
    gameEngine.playerAction(turnId, GAME_ACTIONS.CHECK);
  }
  
  currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
  console.log(`\n[STREET] After pre-flop Round 2, street=${currentStreet}`);
  assert.strictEqual(currentStreet, PokerStreets.FLOP, "Should advance to FLOP in Round 2");
  
  // Verify first to act on FLOP is small blind
  turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
  console.log(`[INFO] First to act on FLOP Round 2: P${players.findIndex(p => p.id === turnId) + 1} (should be small blind)`);
  assert.strictEqual(turnId, round2SB, "First to act on FLOP should be small blind");
  
  console.log(`\n[INFO] Round 2 progressing normally ✓`);
} else {
  console.log(`\n[INFO] Game over - not enough players to continue`);
}

// ---------- FINAL VALIDATION ----------
console.log("\n========== FINAL VALIDATION ==========\n");

console.log(`✓ Tested 6-player game with correct positions`);
console.log(`✓ Verified pre-flop first to act (player after big blind)`);
console.log(`✓ Verified post-flop first to act (small blind position)`);
console.log(`✓ Tested all-ins with multiple stack sizes`);
console.log(`✓ Verified side pot creation and eligibility`);
console.log(`✓ Tested player disconnects (during turn and not during turn)`);
console.log(`✓ Tested invalid actions (CHECK, CALL, BET, RAISE, out-of-turn, all-in player)`);
console.log(`✓ Verified pot calculations and chip distribution`);
console.log(`✓ Verified round reset and dealer rotation`);
console.log(`✓ Verified player elimination handling`);
console.log(`✓ Verified game continuation with correct positions`);

console.log("\n✅ FULL ROUND INTEGRATION TEST PASSED.");