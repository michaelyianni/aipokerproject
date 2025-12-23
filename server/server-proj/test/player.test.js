import test from 'node:test';

import Player from '../src/models/Player.js';
import Card from '../src/models/Card.js';

import assert from 'assert';

console.log("Testing Player class...");

let player = new Player("Alice", 1000);
assert.strictEqual(player.name, "Alice", "Player name should be 'Alice'");
assert.strictEqual(player.chips, 1000, "Player chips should be 1000");
assert.strictEqual(player.getHand().getCards().length, 0, "New player should have an empty hand");

let card1 = new Card('K', 'Diamonds');
let card2 = new Card('3', 'Spades');

player.receiveCard(card1);
player.receiveCard(card2);

assert.strictEqual(player.getHand().getCards().length, 2, "Player should have 2 cards in hand");
assert.strictEqual(player.getHand().getCards()[0], card1, "First card in hand should be the first received card");
assert.strictEqual(player.getHand().getCards()[1], card2, "Second card in hand should be the second received card");

let errorCaught = false;
try {
    player.placeBet(500);
} catch (e) {
    errorCaught = true;
}
assert.strictEqual(errorCaught, true, "Placing a bet when it is not the player's turn should throw an error");

player.setTurn(true);
assert.strictEqual(player.isTurn, true, "Player's turn status should be true");

player.placeBet(200);
assert.strictEqual(player.chips, 800, "Player chips should be 800 after placing a bet of 200");
assert.strictEqual(player.isTurn, false, "Player's turn status should be false after placing a bet");

player.setTurn(true);
errorCaught = false;
try {
    player.placeBet(900);
} catch (e) {
    errorCaught = true;
}
assert.strictEqual(errorCaught, true, "Placing a bet exceeding chips should throw an error");


player.fold();
assert.strictEqual(player.getFoldStatus(), true, "Player should be marked as folded");


errorCaught = false;
try {
    player.placeBet(100);
} catch (e) {
    errorCaught = true;
}   
assert.strictEqual(errorCaught, true, "Placing a bet when folded should throw an error");


player.resetForNewRound();
assert.strictEqual(player.getHand().getCards().length, 0, "Player hand should be empty after clearing");
assert.strictEqual(player.getCurrentBet(), 0, "Player current bet should be 0 after reset");
assert.strictEqual(player.getFoldStatus(), false, "Player should not be folded after reset");
assert.strictEqual(player.getTurnStatus(), false, "Player's turn status should be false after reset");


console.log("All Player tests passed!");
