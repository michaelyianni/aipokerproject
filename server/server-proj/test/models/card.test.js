import test from 'node:test';
import Card from '../../src/models/Card.js';
import assert from 'assert';


console.log("Testing Card class...");

let card = new Card('A', 'Spades');
assert.strictEqual(card.rank, 'A', "Card rank should be 'A'");
assert.strictEqual(card.suit, 'Spades', "Card suit should be 'Spades'");


let card2 = new Card('Q', 'Hearts');
assert.strictEqual(card2.rank, 'Q', "Card rank should be 'Q'");
assert.strictEqual(card2.suit, 'Hearts', "Card suit should be 'Hearts'");

let card3 = new Card('10', 'Diamonds');
assert.strictEqual(card3.rank, '10', "Card rank should be '10'");
assert.strictEqual(card3.suit, 'Diamonds', "Card suit should be 'Diamonds'");

let errorCaught = false;
try {
    let invalidCard = new Card('1', 'Stars');
} catch (e) {
    errorCaught = true;
    assert.strictEqual(e.message, 'Invalid card rank or suit', "Error message should indicate invalid card");
}
assert.strictEqual(errorCaught, true, "Creating an invalid card should throw an error");
console.log("All Card tests passed!");