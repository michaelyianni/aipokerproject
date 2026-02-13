import GameEngineService from "../../src/services/gameEngine.service.js";
import Player from "../../src/models/Player.js";
import Card from "../../src/models/Card.js";
import { PokerStreets } from "../../src/constants/pokerStreets.js";
import { GAME_ACTIONS } from "../../src/constants/gameActions.js";

import assert from "assert";
import CommunityCards from "../../src/models/CommunityCards.js";
import Hand from "../../src/models/Hand.js";

console.log("Testing GameEngineService ALL-IN + SIDE POTS...");

// ---------- Setup ----------
let player1 = new Player("Alice");   // will be the final winner
let player2 = new Player("Bob");     // short stack, all-in
let player3 = new Player("Charlie"); // will lose

let players = [player1, player2, player3];
let gameEngine = new GameEngineService(players);

// Force deterministic stacks for the test (overwrite whatever initialiseTable did)
gameEngine.tableStateRepository.getPlayer(player1.id).chips = 1000;
gameEngine.tableStateRepository.getPlayer(player2.id).chips = 60;   // short
gameEngine.tableStateRepository.getPlayer(player3.id).chips = 1000;

// Blinds have already been posted in startGame().
// For clarity, log them:
console.log(`[INFO] Blinds posted. Street=${gameEngine.tableStateRepository.getCurrentStreet()} currentBet=${gameEngine.tableStateRepository.getCurrentBet()}`);
console.log(`[INFO] P1 chips=${gameEngine.tableStateRepository.getPlayer(player1.id).chips} currentBet=${gameEngine.tableStateRepository.getPlayer(player1.id).currentBet}`);
console.log(`[INFO] P2 chips=${gameEngine.tableStateRepository.getPlayer(player2.id).chips} currentBet=${gameEngine.tableStateRepository.getPlayer(player2.id).currentBet}`);
console.log(`[INFO] P3 chips=${gameEngine.tableStateRepository.getPlayer(player3.id).chips} currentBet=${gameEngine.tableStateRepository.getPlayer(player3.id).currentBet}`);

// Assert preflop state
assert.strictEqual(gameEngine.tableStateRepository.getCurrentStreet(), PokerStreets.PRE_FLOP, "Should start PRE_FLOP");

// ---------- Preflop Action: Create all-in and side pot ----------
// Turn should be player1 (dealer) in your engine
let turnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(turnId, player1.id, "Preflop first action should be player1 (dealer)");

// Action plan:
// P1 raises big (to 200 total)
// P2 calls but is capped -> all-in
// P3 calls full
//
// Expected:
// - P2 is all-in
// - Pots contain at least 2 pots (main + side), or 1 pot with merged eligibility depending on your merge logic.
//   The important invariant: total pot == sum of all totalBetThisHand (and/or pot totals).
//

// P1 raise to 200 total: currentBet starts at BB (10), so raise amount = 190
console.log(`[ACTION] P1 (Alice) -> RAISE to 200`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.RAISE, 190);

// P2 call (will be all-in capped)
console.log(`[ACTION] P2 (Bob) -> CALL (should go all-in capped)`);
gameEngine.playerAction(player2.id, GAME_ACTIONS.CALL);

// Validate all-in flag
assert.strictEqual(gameEngine.tableStateRepository.getPlayer(player2.id).isAllIn, true, "Player2 should be all-in after calling above stack");

// P3 call full
console.log(`[ACTION] P3 (Charlie) -> CALL`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CALL);

// After last call, street should advance to FLOP
let street = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] After preflop, street=${street}`);
assert.strictEqual(street, PokerStreets.FLOP, "Should advance to FLOP after preflop betting closes");

// Pots should exist and total should be > 0
assert.ok(gameEngine.tableStateRepository.pots && gameEngine.tableStateRepository.pots.length > 0, "Pots array should exist and have at least one pot");

// Log pots
console.log("[POTS] After preflop:", gameEngine.tableStateRepository.pots);

// Total pot invariant: sum pots == sum totalBetThisHand (for all players)
const p1Total = gameEngine.tableStateRepository.getPlayer(player1.id).totalBetThisHand ?? 0;
const p2Total = gameEngine.tableStateRepository.getPlayer(player2.id).totalBetThisHand ?? 0;
const p3Total = gameEngine.tableStateRepository.getPlayer(player3.id).totalBetThisHand ?? 0;

const sumTotalBetThisHand = p1Total + p2Total + p3Total;

const sumPots = gameEngine.tableStateRepository.pots.reduce((acc, pot) => {
  // Support either pot.amount or pot.total or getTotal()
  if (typeof pot.getTotal === "function") return acc + pot.getTotal();
  if (typeof pot.amount === "number") return acc + pot.amount;
  if (typeof pot.total === "number") return acc + pot.total;
  return acc;
}, 0);

console.log(`[CHECK] totalBetThisHand sum=${sumTotalBetThisHand}, pots sum=${sumPots}`);
assert.strictEqual(sumPots, sumTotalBetThisHand, "Sum of pots should equal sum of totalBetThisHand");

// Also ensure there are at least 2 eligibility layers OR a single merged pot.
// For side pots, typical is >=2 pots here. But your merge can collapse some cases.
// We’ll assert a weaker condition: at least one pot includes P2 eligibility and at least one excludes P2.
const potEligLists = gameEngine.tableStateRepository.pots.map(p => p.eligiblePlayerIds ?? []);
const someIncludeP2 = potEligLists.some(list => list.includes(player2.id));
const someExcludeP2 = potEligLists.some(list => !list.includes(player2.id));
assert.strictEqual(someIncludeP2, true, "At least one pot should include player2 eligibility (main pot)");
assert.strictEqual(someExcludeP2, true, "At least one pot should exclude player2 eligibility (side pot)");

// ---------- Run out remaining streets (all-in scenario) ----------
// Since P2 is all-in, and you skip all-ins for action, you can just CHECK through for remaining actives,
// OR just force runout by making remaining players check until your engine advances.
console.log(`[ACTION] On FLOP: P3 CHECK, P1 CHECK (close street)`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CHECK);

street = gameEngine.tableStateRepository.getCurrentStreet();
assert.strictEqual(street, PokerStreets.TURN, "Should advance to TURN after check-check on FLOP");

console.log(`[ACTION] On TURN: P3 CHECK, P1 CHECK (close street)`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CHECK);

street = gameEngine.tableStateRepository.getCurrentStreet();
assert.strictEqual(street, PokerStreets.RIVER, "Should advance to RIVER after check-check on TURN");

// Before final river actions, force showdown board + hands to ensure:
// - P1 beats everyone overall (wins pots they are eligible for)
// - P2 has a decent hand that could win main pot if P1 was not eligible (but P1 is eligible for all pots here)
// The key is: P1 should win BOTH main pot + side pot in this constructed example.
let testCommunity = new CommunityCards();
testCommunity.addFlop(new Card("A", "Clubs"), new Card("K", "Diamonds"), new Card("2", "Hearts"));
testCommunity.addTurn(new Card("3", "Spades"));
testCommunity.addRiver(new Card("4", "Clubs"));

// P1: AA (best)
let h1 = new Hand();
h1.addCard(new Card("A", "Hearts"));
h1.addCard(new Card("A", "Diamonds"));

// P2: KK (second)
let h2 = new Hand();
h2.addCard(new Card("K", "Clubs"));
h2.addCard(new Card("K", "Spades"));

// P3: QQ (third)
let h3 = new Hand();
h3.addCard(new Card("Q", "Hearts"));
h3.addCard(new Card("Q", "Diamonds"));

// Force state
player1.hand = h1;
player2.hand = h2;
player3.hand = h3;
gameEngine.tableStateRepository.communityCards = testCommunity;

console.log(`[SHOWDOWN SETUP] Forced hands+board. Street=${gameEngine.tableStateRepository.getCurrentStreet()}`);
console.log("[POTS] Before river close:", gameEngine.tableStateRepository.pots);

// Capture chip counts before showdown
var p1ChipsBefore = gameEngine.tableStateRepository.getPlayer(player1.id).chips;
var p2ChipsBefore = gameEngine.tableStateRepository.getPlayer(player2.id).chips;
var p3ChipsBefore = gameEngine.tableStateRepository.getPlayer(player3.id).chips;

// Close river via checks to trigger showdown
console.log(`[ACTION] On RIVER: P3 CHECK, P1 CHECK (Showdown)`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CHECK);

// After showdown and reset, the engine starts a new hand automatically.
// So we must validate chips immediately after showdown. However, your engine likely
// resetForNewHand() and startGame() already ran. That means currentStreet has reset.
// We'll validate chips deltas nonetheless.

var p1ChipsAfter = gameEngine.tableStateRepository.getPlayer(player1.id).chips;
var p2ChipsAfter = gameEngine.tableStateRepository.getPlayer(player2.id).chips;
var p3ChipsAfter = gameEngine.tableStateRepository.getPlayer(player3.id).chips;

console.log(`[RESULT] Chips before: P1=${p1ChipsBefore}, P2=${p2ChipsBefore}, P3=${p3ChipsBefore}`);
console.log(`[RESULT] Chips after : P1=${p1ChipsAfter}, P2=${p2ChipsAfter}, P3=${p3ChipsAfter}`);

// P1 should win at least the sum of all pots they were eligible for (which should be all pots here).
assert.ok(p1ChipsAfter > p1ChipsBefore, "Player1 should have increased chips after winning pots");

// P2 should not gain chips (lost at showdown in this setup)
assert.ok(p2ChipsAfter <= p2ChipsBefore, "Player2 should not increase chips after losing main pot");

// P3 should not gain chips
assert.ok(p3ChipsAfter <= p3ChipsBefore, "Player3 should not increase chips after losing");

// New hand should begin
const newStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] New hand street=${newStreet}`);
assert.strictEqual(newStreet, PokerStreets.PRE_FLOP, "After showdown, new hand should reset to PRE_FLOP");


// Player 2 should not be active
assert.strictEqual(gameEngine.tableStateRepository.getActivePlayerIds().includes(player2.id), false, "Player2 should not be active after losing all-in and being eliminated");

// Dealer should have rotated to next player (player 3 in this case)
const newDealerId = gameEngine.tableStateRepository.getDealer();
assert.strictEqual(newDealerId, player3.id, "Dealer should have rotated to player 3 for new round since player 2 is eliminated");




// Reset GameEngine state for next test (new hand with all-in scenarios)
// ---------- Setup ----------
player1 = new Player("Alice");   // will lose
player2 = new Player("Bob");     // may win short stack, all-in
player3 = new Player("Charlie"); // will win side pot, may win main pot

players = [player2, player3, player1]; // rotate seating order so player2 is dealer for this hand
gameEngine = new GameEngineService(players);


// Set player 2's chips to 200, and player 1's and 3's to 1000 for next test
gameEngine.tableStateRepository.getPlayer(player1.id).chips = 1000;
gameEngine.tableStateRepository.getPlayer(player2.id).chips = 200;
gameEngine.tableStateRepository.getPlayer(player3.id).chips = 1000;

console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// player 2 - ALL-IN
console.log(`[ACTION] New Hand: P2 (Bob) -> ALL-IN 200`);
gameEngine.playerAction(player2.id, GAME_ACTIONS.RAISE, 190); // from 10 to 200
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P2 Chips: ${player2.chips}`);

// player 3 - RAISE to 400
console.log(`[ACTION] P3 (Charlie) -> RAISE to 300`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.RAISE, 300 - 200); // from 200 to 400
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// player 1 - RAISE to 500
console.log(`[ACTION] P1 (Alice) -> RAISE to 400`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.RAISE, 400 - 300); // from 400 to 500
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// player 3 - CALL
console.log(`[ACTION] P3 (Charlie) -> CALL`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CALL);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

// Street should advance to FLOP
console.log(`[STREET] After betting, street=${gameEngine.tableStateRepository.getCurrentStreet()}`);
assert.strictEqual(gameEngine.tableStateRepository.getCurrentStreet(), PokerStreets.FLOP, "Should advance to FLOP after betting closes");

// Pots should exist and total should be > 0
assert.ok(gameEngine.tableStateRepository.pots && gameEngine.tableStateRepository.pots.length > 0, "Pots array should exist and have at least one pot");

// Log pots
console.log("[POTS] After pre-flop:", gameEngine.tableStateRepository.pots);

// player 3 RAISE to 50 
console.log(`[ACTION] On FLOP: P3 (Charlie) -> BET 50`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.BET, 50);
console.log(`[BET] Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);


console.log("[POTS] Before river close:", gameEngine.tableStateRepository.pots);

// Capture chip counts before showdown
p1ChipsBefore = gameEngine.tableStateRepository.getPlayer(player1.id).chips;
p2ChipsBefore = gameEngine.tableStateRepository.getPlayer(player2.id).chips;
p3ChipsBefore = gameEngine.tableStateRepository.getPlayer(player3.id).chips;


// player 1 FOLD
console.log(`[ACTION] On FLOP: P1 (Alice) -> FOLD`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.FOLD);

// Board should be run out to showdown
const newStreet2 = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] After run out, street=${gameEngine.tableStateRepository.getCurrentStreet()}`);
assert.strictEqual(newStreet2, PokerStreets.PRE_FLOP, "After showdown, new hand should reset to PRE_FLOP");

p1ChipsAfter = gameEngine.tableStateRepository.getPlayer(player1.id).chips;
p2ChipsAfter = gameEngine.tableStateRepository.getPlayer(player2.id).chips;
p3ChipsAfter = gameEngine.tableStateRepository.getPlayer(player3.id).chips;

console.log(`[RESULT] Chips before: P1=${p1ChipsBefore}, P2=${p2ChipsBefore}, P3=${p3ChipsBefore}`);
console.log(`[RESULT] Chips after : P1=${p1ChipsAfter}, P2=${p2ChipsAfter}, P3=${p3ChipsAfter}`);

// P1 should lose chips
assert.ok(p1ChipsAfter <= p1ChipsBefore, "Player1 should not have increased chips after losing");

// P2 COULD gain chips - cannot enforce cards in this instance

// P3 should gain chips
assert.ok(p3ChipsAfter > p3ChipsBefore, "Player3 should have increased after winning side pot");


console.log("✅ ALL-IN + SIDE POTS system test passed.");
