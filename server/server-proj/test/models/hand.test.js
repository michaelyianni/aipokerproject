import test from 'node:test';

import Hand from '../../src/models/Hand.js';
import Card from '../../src/models/Card.js';

import assert from 'assert';


console.log("Testing Hand class...");

let hand = new Hand();
assert.strictEqual(hand.getCards().length, 0, "New hand should have 0 cards");


let errorCaughtInvalid = false;
try {
    hand.addCard({});
} catch (e) {
    errorCaughtInvalid = true;
}
assert.strictEqual(errorCaughtInvalid, true, "Adding an invalid card should throw an error");


let card1 = new Card('K', 'Hearts');
hand.addCard(card1);
assert.strictEqual(hand.getCards().length, 1, "Hand should have 1 card after adding a card");
assert.strictEqual(hand.getCards()[0], card1, "The card in hand should be the one that was added");

let card2 = new Card('7', 'Clubs');
hand.addCard(card2);
assert.strictEqual(hand.getCards().length, 2, "Hand should have 2 cards after adding another card");
assert.strictEqual(hand.getCards()[1], card2, "The second card in hand should be the one that was added");

let errorCaughtMax = false;
try {
    let card3 = new Card('3', 'Diamonds');
    hand.addCard(card3);
} catch (e) {
    errorCaughtMax = true;
}
assert.strictEqual(errorCaughtMax, true, "Adding a third card should throw an error");

hand.clear();
assert.strictEqual(hand.getCards().length, 0, "Hand should have 0 cards after clearing");

console.log("All Hand tests passed!");