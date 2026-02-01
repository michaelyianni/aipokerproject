import GameEngineService from "../../src/services/gameEngine.service.js";
import TableStateRepository from "../../src/repositories/tableState.repository.js";
import Player from "../../src/models/Player.js";
import Card from "../../src/models/Card.js";
import { PokerStreets } from "../../src/constants/pokerStreets.js";
import { GAME_ACTIONS } from "../../src/constants/gameActions.js";

import assert from 'assert';
import CommunityCards from "../../src/models/CommunityCards.js";
import Hand from "../../src/models/Hand.js";

console.log("Testing GameEngineService class...");

let player1 = new Player("Alice");
let player2 = new Player("Bob");
let player3 = new Player("Charlie");
let players = [player1, player2, player3];

let gameEngine = new GameEngineService(players);

console.log(`[STREET] Initial street: ${gameEngine.tableStateRepository.getCurrentStreet()}`);

// Test initial dealer
let dealerId = gameEngine.tableStateRepository.getDealer();
assert.strictEqual(dealerId === player1.id, true, "Dealer should be player 1");

// Test initial street
var currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
assert.strictEqual(currentStreet, PokerStreets.PRE_FLOP, "Initial street should be PRE_FLOP");

// Test initial active turn player
let activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId === player1.id, true, "Active turn should be dealer");

// Test blinds posted
let player2Bet = gameEngine.tableStateRepository.getPlayer(player2.id).currentBet;
let player3Bet = gameEngine.tableStateRepository.getPlayer(player3.id).currentBet;

console.log(`[BET] Blinds posted | P2 (Bob) currentBet = ${player2Bet} | P3 (Charlie) currentBet = ${player3Bet} | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

assert.strictEqual(player2Bet, gameEngine.tableStateRepository.smallBlindAmount, "Player 2 should have posted small blind");
assert.strictEqual(player3Bet, gameEngine.tableStateRepository.bigBlindAmount, "Player 3 should have posted big blind");

// Test player action in-turn - player 1 CALL
console.log(`[ACTION] P1 (Alice) -> CALL`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CALL);
console.log(`[BET] After P1 CALL | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P1 currentBet = ${gameEngine.tableStateRepository.getPlayer(player1.id).currentBet}`);

let player1Bet = gameEngine.tableStateRepository.getPlayer(player1.id).currentBet;
assert.strictEqual(player1Bet, gameEngine.tableStateRepository.bigBlindAmount, "Player 1 should have called to big blind amount");
// Should now be player 2's turn
activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player2.id, "Active turn should be player 2");

// Test player action in-turn - player 2 RAISE
let player2Raise = 20;
let currentBetBeforeRaise = gameEngine.tableStateRepository.getCurrentBet();

console.log(`[ACTION] P2 (Bob) -> RAISE ${player2Raise}`);
console.log(`[BET] Before P2 RAISE | Table currentBet = ${currentBetBeforeRaise}`);

gameEngine.playerAction(player2.id, GAME_ACTIONS.RAISE, player2Raise);

console.log(`[BET] After P2 RAISE | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P2 currentBet = ${gameEngine.tableStateRepository.getPlayer(player2.id).currentBet}`);

player2Bet = gameEngine.tableStateRepository.getPlayer(player2.id).currentBet;
assert.strictEqual(player2Bet, player2Raise + currentBetBeforeRaise, "Player 2 should have raised by 20 from small blind (5)");
// Should now be player 3's turn
activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId === player3.id, true, "Active turn should be player 3");

// All players match the raise - proceed to FLOP
console.log(`[ACTION] P3 (Charlie) -> CALL`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CALL);
console.log(`[BET] After P3 CALL | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P3 currentBet = ${gameEngine.tableStateRepository.getPlayer(player3.id).currentBet}`);

console.log(`[ACTION] P1 (Alice) -> CALL`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CALL);
console.log(`[BET] After P1 CALL | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P1 currentBet = ${gameEngine.tableStateRepository.getPlayer(player1.id).currentBet}`);

// Current street should now have advanced to FLOP
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] Now on ${currentStreet} | Pot = ${gameEngine.tableStateRepository.pots[0].getTotal()}`);
assert.strictEqual(currentStreet, PokerStreets.FLOP, "Current street should be FLOP after all players have matched the raise");

// Pot should reflect total bets
let potAmount1 = gameEngine.tableStateRepository.pots[0].getTotal();
let expectedPot = 3 * player2Bet;
assert.strictEqual(potAmount1, expectedPot, "Pot amount should equal total bets from all players");
// Reset current bets for new street
for (let playerId of gameEngine.tableStateRepository.getActivePlayerIds()) {
    let player = gameEngine.tableStateRepository.getPlayer(playerId);
    assert.strictEqual(player.currentBet, 0, "Player current bet should be reset to 0 for new street");
}
// Community cards should have 3 cards
let communityCards = gameEngine.tableStateRepository.getCommunityCards();
assert.strictEqual(communityCards.getCards().length, 3, "There should be 3 community cards on the FLOP");
// Active turn should be first active player after dealer (player 2)
activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player2.id, "Active turn should be player 2 on FLOP");

console.log(gameEngine.tableStateRepository.getActivePlayerIds());
console.log("Current turn player ID:", gameEngine.tableStateRepository.getCurrentTurnPlayerId());

// Test player action in-turn - player 2 FOLD
console.log(`[ACTION] P2 (Bob) -> FOLD`);
gameEngine.playerAction(player2.id, GAME_ACTIONS.FOLD);

let activePlayerIds = gameEngine.tableStateRepository.getActivePlayerIds();
assert.strictEqual(activePlayerIds.includes(player2.id), false, "Player 2 should have folded and be inactive");
activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player3.id, "Active turn should be player 3 after player 2 folds");

// Test player action in-turn - player 3 CHECK
console.log(`[ACTION] P3 (Charlie) -> CHECK`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);

activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player1.id, "Active turn should be player 1 after player 3 checks");

// player 1 RAISE
let player1Raise = 50;
console.log(`[ACTION] P1 (Alice) -> RAISE ${player1Raise}`);
console.log(`[BET] Before P1 RAISE | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

gameEngine.playerAction(player1.id, GAME_ACTIONS.RAISE, player1Raise);

console.log(`[BET] After P1 RAISE | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P1 currentBet = ${gameEngine.tableStateRepository.getPlayer(player1.id).currentBet}`);

// Check active turn is back to player 3
activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player3.id, "Active turn should be back to player 3 after player 1's raise");

// player 3 RAISE
let player3Raise = 10;
console.log(`[ACTION] P3 (Charlie) -> RAISE ${player3Raise}`);
console.log(`[BET] Before P3 RAISE | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()}`);

gameEngine.playerAction(player3.id, GAME_ACTIONS.RAISE, player3Raise);

console.log(`[BET] After P3 RAISE | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P3 currentBet = ${gameEngine.tableStateRepository.getPlayer(player3.id).currentBet}`);

// Check player 3's bet
player3Bet = gameEngine.tableStateRepository.getPlayer(player3.id).currentBet;
assert.strictEqual(player3Bet, player1Raise + player3Raise, "Player 3's current bet should reflect the raise of player 1 plus their own raise");
// Check current street is still FLOP
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
assert.strictEqual(currentStreet, PokerStreets.FLOP, "Current street should still be FLOP after raises");

// player 1 CALL
console.log(`[ACTION] P1 (Alice) -> CALL`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CALL);
console.log(`[BET] After P1 CALL | Table currentBet = ${gameEngine.tableStateRepository.getCurrentBet()} | P1 currentBet = ${gameEngine.tableStateRepository.getPlayer(player1.id).currentBet}`);

// Current street should now have advanced to TURN
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] Now on ${currentStreet} | Pot = ${gameEngine.tableStateRepository.pots[0].getTotal()}`);
assert.strictEqual(currentStreet, PokerStreets.TURN, "Current street should be TURN after all players have matched the raise");
// Community cards should have 4 cards
communityCards = gameEngine.tableStateRepository.getCommunityCards();
assert.strictEqual(communityCards.getCards().length, 4, "There should be 4 community cards on the TURN");
// Pot should reflect total bets

console.log("Pots: ", gameEngine.tableStateRepository.pots);

let potAmount2 = gameEngine.tableStateRepository.pots[0].getTotal();
expectedPot = potAmount1 + (player1Raise + player3Raise) * 2; // previous pot + new bets from player 1 and 3
assert.strictEqual(potAmount2, expectedPot, "Pot amount should reflect total bets from all players after player 1 calls and player 3 raises");
// Current bets should be reset
for (let playerId of gameEngine.tableStateRepository.getActivePlayerIds()) {
    let player = gameEngine.tableStateRepository.getPlayer(playerId);
    assert.strictEqual(player.currentBet, 0, "Player current bet should be reset to 0 for new street");
}
// Current turn should be first active player after dealer (player 3)
activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player3.id, "Active turn should be player 3 on TURN");

// player 3 CHECK
console.log(`[ACTION] P3 (Charlie) -> CHECK`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);

activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player1.id, "Active turn should be player 1 after player 3 checks");

// player 1 CHECK
console.log(`[ACTION] P1 (Alice) -> CHECK`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CHECK);

// Current street should now have advanced to RIVER
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] Now on ${currentStreet} | Pot = ${gameEngine.tableStateRepository.pots[0].getTotal()}`);
assert.strictEqual(currentStreet, PokerStreets.RIVER, "Current street should be RIVER after all players have checked");
// Community cards should have 5 cards
communityCards = gameEngine.tableStateRepository.getCommunityCards();
assert.strictEqual(communityCards.getCards().length, 5, "There should be 5 community cards on the RIVER");

// player 3 CHECK
console.log(`[ACTION] P3 (Charlie) -> CHECK`);
gameEngine.playerAction(player3.id, GAME_ACTIONS.CHECK);

activeTurnId = gameEngine.tableStateRepository.getCurrentTurnPlayerId();
assert.strictEqual(activeTurnId, player1.id, "Active turn should be player 1 after player 3 checks");

// Before final action, set player hands and community cards for showdown
let testPlayer1Hand = new Hand();
testPlayer1Hand.addCard(new Card('A', 'Hearts'));
testPlayer1Hand.addCard(new Card('A', 'Diamonds'));

let testPlayer3Hand = new Hand();
testPlayer3Hand.addCard(new Card('K', 'Clubs'));
testPlayer3Hand.addCard(new Card('K', 'Spades'));

let testCommunityCards = new CommunityCards();
testCommunityCards.addFlop(new Card('A', 'Clubs'), new Card('K', 'Diamonds'), new Card('2', 'Hearts'));
testCommunityCards.addTurn(new Card('3', 'Spades'));
testCommunityCards.addRiver(new Card('4', 'Clubs'));

player1.hand = testPlayer1Hand;
player3.hand = testPlayer3Hand;
gameEngine.tableStateRepository.communityCards = testCommunityCards;

console.log(`[SHOWDOWN SETUP] Forced hands + board set. Pot = ${gameEngine.tableStateRepository.pots[0].getTotal()} | Street = ${gameEngine.tableStateRepository.getCurrentStreet()}`);

let player1CurrentChips = gameEngine.tableStateRepository.getPlayer(player1.id).chips;
let player3CurrentChips = gameEngine.tableStateRepository.getPlayer(player3.id).chips;
let potFinalAmount = gameEngine.tableStateRepository.pots[0].getTotal();
// player 1 CHECK
console.log(`[ACTION] P1 (Alice) -> CHECK (Showdown)`);
console.log(`[INFO]  | Pot = ${gameEngine.tableStateRepository.pots[0].getTotal()}`);
gameEngine.playerAction(player1.id, GAME_ACTIONS.CHECK);
console.log(`[STREET] ${gameEngine.tableStateRepository.getCurrentStreet()}`);

// Hand should be complete, pot awarded to player 1 with AA over KK
let player1FinalChips = gameEngine.tableStateRepository.getPlayer(player1.id).chips;
let player3FinalChips = gameEngine.tableStateRepository.getPlayer(player3.id).chips;
assert.strictEqual(player1FinalChips > player1CurrentChips, true, "Player 1 should have won the pot");
assert.strictEqual(player3FinalChips <= player3CurrentChips, true, "Player 3's chips should be less than before after losing the pot");

// New round should be prepared
currentStreet = gameEngine.tableStateRepository.getCurrentStreet();
console.log(`[STREET] New round prepared | Street = ${currentStreet}`);
assert.strictEqual(currentStreet, PokerStreets.PRE_FLOP, "New round should be prepared with street reset to PRE_FLOP");
let newDealerId = gameEngine.tableStateRepository.getDealer();
assert.strictEqual(newDealerId, player2.id, "Dealer should have rotated to player 2 for new round");
