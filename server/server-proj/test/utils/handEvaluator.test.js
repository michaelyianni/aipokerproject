import test from 'node:test';

import { evaluateHand, compareHands } from "../../src/utils/handEvaluator.util.js";


import assert from 'assert';

import Hand from '../../src/models/Hand.js';
import CommunityCards from '../../src/models/CommunityCards.js';
import Player from '../../src/models/Player.js';
import FullHand from '../../src/models/FullHand.js';
import Card from "../../src/models/Card.js";

console.log("Testing handEvaluator utility...");

// Test case 1: Royal Flush

let player1 = new Player("Alice");

let hand1 = new Hand();
hand1.addCard(new Card('A', 'Hearts'));
hand1.addCard(new Card('K', 'Hearts'));

let communityCards1 = new CommunityCards();
communityCards1.addFlop(new Card('Q', 'Hearts'), new Card('J', 'Hearts'), new Card('T', 'Hearts'));
communityCards1.addTurn(new Card('3', 'Clubs'));
communityCards1.addRiver(new Card('5', 'Diamonds'));

let royalFlushFullHand = new FullHand(player1, hand1, communityCards1);

let royalFlushHand = evaluateHand(royalFlushFullHand);
assert.strictEqual(royalFlushHand.name, 'Straight Flush', "Should identify Straight Flush");

// Test case 2: Full House

let player2 = new Player("Bob");

let hand2 = new Hand();

hand2.addCard(new Card('K', 'Spades'));
hand2.addCard(new Card('K', 'Diamonds'));

let communityCards2 = new CommunityCards();
communityCards2.addFlop(new Card('K', 'Clubs'), new Card('9', 'Hearts'), new Card('9', 'Spades'));
communityCards2.addTurn(new Card('2', 'Clubs'));
communityCards2.addRiver(new Card('5', 'Diamonds'));

let fullHouseFullHand = new FullHand(player2, hand2, communityCards2);

let fullHouseHand = evaluateHand(fullHouseFullHand);
assert.strictEqual(fullHouseHand.name, 'Full House', "Should identify Full House");

// Test case 3: Straight

let player3 = new Player("Charlie");

let hand3 = new Hand();
hand3.addCard(new Card('6', 'Diamonds'));
hand3.addCard(new Card('5', 'Spades'));

let communityCards3 = new CommunityCards();
communityCards3.addFlop(new Card('4', 'Hearts'), new Card('3', 'Clubs'), new Card('2', 'Diamonds'));
communityCards3.addTurn(new Card('9', 'Clubs'));
communityCards3.addRiver(new Card('8', 'Hearts'));

let straightFullHand = new FullHand(player3, hand3, communityCards3);

let straightHand = evaluateHand(straightFullHand);
assert.strictEqual(straightHand.name, 'Straight', "Should identify Straight");

// Test case 4: High Card

let player4 = new Player("Diana");

let hand4 = new Hand();
hand4.addCard(new Card('A', 'Spades'));
hand4.addCard(new Card('K', 'Diamonds'));

let communityCards4 = new CommunityCards();
communityCards4.addFlop(new Card('7', 'Clubs'), new Card('5', 'Hearts'), new Card('3', 'Spades'));
communityCards4.addTurn(new Card('2', 'Clubs'));
communityCards4.addRiver(new Card('9', 'Diamonds'));
let highCardFullHand = new FullHand(player4, hand4, communityCards4);

let highCardHand = evaluateHand(highCardFullHand);
assert.strictEqual(highCardHand.name, 'High Card', "Should identify High Card");

// Test case 5: Compare Hands
let hands = [royalFlushFullHand, fullHouseFullHand, straightFullHand, highCardFullHand];

let winner = compareHands(hands);

console.log("Winner is:", winner[0].player.name, "ID:", winner[0].player.id, "with hand:", winner[0].hand.name);
assert.strictEqual(winner[0].player.name, "Alice", "Royal Flush should win over other hands");

// Test case 6: Tie Breaker with Two Pair
let player5 = new Player("Eve");
let hand5 = new Hand();
hand5.addCard(new Card('K', 'Hearts'));
hand5.addCard(new Card('K', 'Clubs'));

let player6 = new Player("Frank");
let hand6 = new Hand();
hand6.addCard(new Card('K', 'Diamonds'));
hand6.addCard(new Card('K', 'Spades'));

let communityCards5 = new CommunityCards();
communityCards5.addFlop(new Card('3', 'Diamonds'), new Card('3', 'Spades'), new Card('9', 'Hearts'));
communityCards5.addTurn(new Card('2', 'Diamonds'));
communityCards5.addRiver(new Card('5', 'Clubs'));

let twoPairFullHand1 = new FullHand(player6, hand6, communityCards5); // Frank's Two Pair
let twoPairFullHand2 = new FullHand(player5, hand5, communityCards5); // Eve's Two Pair

let winnerTie = compareHands([twoPairFullHand1, twoPairFullHand2, highCardFullHand]);

console.log("Winner Tie is between:", winnerTie.map(w => w.player.name).join(" and "));

assert.strictEqual(winnerTie.length, 2, "Should result in a tie between two players with identical Two Pair hands");

console.log("All handEvaluator tests passed!");