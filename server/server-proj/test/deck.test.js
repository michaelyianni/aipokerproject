import test from 'node:test';
import Deck from '../src/models/Deck.js';
import assert from 'assert';

console.log("Testing Deck class...");

let deck = new Deck();
assert.strictEqual(deck.cards.length, 52, "Deck should contain 52 cards");

let card = deck.deal();
assert.ok(card, "Dealing a card should return a card");

console.log("All Deck tests passed!");