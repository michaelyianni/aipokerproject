import test from 'node:test';

import Pot from '../../src/models/Pot.js';

import assert from 'assert';

console.log("Testing Pot class...");

let pot = new Pot();
assert.strictEqual(pot.getTotal(), 0, "New Pot should have total of 0");

pot.addChips(100);
assert.strictEqual(pot.getTotal(), 100, "Pot total should be 100 after adding 100");

pot.addChips(50);
assert.strictEqual(pot.getTotal(), 150, "Pot total should be 150 after adding another 50");

pot.addEligiblePlayer("player1");
pot.addEligiblePlayer("player2");
pot.addEligiblePlayer("player1"); // Duplicate, should not be added again
assert.deepStrictEqual(pot.eligiblePlayerIds, ["player1", "player2"], "Eligible players should be unique");

pot.clear();
assert.strictEqual(pot.getTotal(), 0, "Pot total should be 0 after clearing");

console.log("All Pot tests passed!");