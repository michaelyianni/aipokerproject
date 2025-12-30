import test from 'node:test';
import Deck from '../../src/models/Deck.js';
import assert from 'assert';

console.log("Testing Deck class...");

let deck = new Deck();
assert.strictEqual(deck.cards.length, 52, "Deck should contain 52 cards");

let card = deck.dealCard();
assert.ok(card, "Dealing a card should return a card");

assert.strictEqual(deck.cards.length, 51, "Deck should contain 51 cards after dealing one");

deck.resetAndShuffle();
assert.strictEqual(deck.cards.length, 52, "Deck should contain 52 cards after resetting and shuffling");

console.log("All Deck tests passed!");