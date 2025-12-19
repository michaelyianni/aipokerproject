import test from 'node:test';

import CommunityCards from '../src/models/CommunityCards.js';
import Card from '../src/models/Card.js';

import assert from 'assert';

console.log("Testing CommunityCards class...");

let communityCards = new CommunityCards();
assert.strictEqual(communityCards.getCards().length, 0, "New CommunityCards should have 0 cards");

let card1 = new Card('5', 'Diamonds');
let card2 = new Card('J', 'Clubs');
let card3 = new Card('A', 'Hearts');

communityCards.addFlop(card1, card2, card3);
assert.strictEqual(communityCards.getCards().length, 3, "CommunityCards should have 3 cards after adding flop");
assert.deepStrictEqual(communityCards.getCards(), [card1, card2, card3], "Flop cards should match the added cards");


let errorCaughtInvalid = false;
try {
    communityCards.addTurn({}); 
} catch (e) {
    errorCaughtInvalid = true;
}
assert.strictEqual(errorCaughtInvalid, true, "Adding an invalid turn card should throw an error");


let card4 = new Card('9', 'Spades');
communityCards.addTurn(card4);
assert.strictEqual(communityCards.getCards().length, 4, "CommunityCards should have 4 cards after adding turn");
assert.strictEqual(communityCards.getCards()[3], card4, "Turn card should match the added card");

let card5 = new Card('2', 'Hearts');
communityCards.addRiver(card5);
assert.strictEqual(communityCards.getCards().length, 5, "CommunityCards should have 5 cards after adding river");
assert.strictEqual(communityCards.getCards()[4], card5, "River card should match the added card");
communityCards.clear();
assert.strictEqual(communityCards.getCards().length, 0, "CommunityCards should have 0 cards after clearing");

console.log("All CommunityCards tests passed!");

