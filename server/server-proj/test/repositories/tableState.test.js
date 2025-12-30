import test from 'node:test';

import TableStateRepository from '../../src/repositories/tableState.repository.js';
import Player from '../../src/models/Player.js';
import Card from '../../src/models/Card.js';
import CommunityCards from '../../src/models/CommunityCards.js';

import assert from 'assert';

console.log("Testing TableStateRepository class...");

let player1 = new Player("Alice");
let player2 = new Player("Bob");
let players = {
    [player1.id]: player1,
    [player2.id]: player2
};

let tableState = new TableStateRepository(players);

// Test getPlayers
let retrievedPlayers = tableState.getPlayers();
assert.strictEqual(Object.keys(retrievedPlayers).length, 2, "There should be 2 players in the table state");
assert.strictEqual(retrievedPlayers[player1.id], player1, "Player 1 should match");
assert.strictEqual(retrievedPlayers[player2.id], player2, "Player 2 should match");
// Test getPlayer
let retrievedPlayer1 = tableState.getPlayer(player1.id);
assert.strictEqual(retrievedPlayer1, player1, "Retrieved Player 1 should match");
let retrievedPlayer2 = tableState.getPlayer(player2.id);
assert.strictEqual(retrievedPlayer2, player2, "Retrieved Player 2 should match");

// Test initialiseTable
tableState.initialiseTable();
let dealerId = tableState.getDealer();
assert.strictEqual(dealerId, player1.id, "Dealer should be player 1");
let activeTurnId = tableState.getActivePlayerTurnId();
assert.strictEqual(activeTurnId, dealerId, "Active turn should be dealer");

// Test active players
let activePlayerIds = tableState.getActivePlayerIds();
assert.strictEqual(activePlayerIds.length, 2, "There should be 2 active players initially");

// Test dealing to players
tableState.dealCardsToPlayers();
for (let playerId of activePlayerIds) {
    let player = tableState.getPlayer(playerId);
    assert.strictEqual(player.getHand().getCards().length, 2, "Each player should have 2 cards after dealing");
}

// Test community cards
tableState.dealFlop([new Card('A', 'Hearts'), new Card('K', 'Clubs'), new Card('Q', 'Diamonds')]);
let communityCards = tableState.getCommunityCards();
assert.strictEqual(communityCards.getCards().length, 3, "There should be 3 cards on the flop");
tableState.dealTurn(new Card('J', 'Spades'));
assert.strictEqual(communityCards.getCards().length, 4, "There should be 4 cards after the turn");
tableState.dealRiver(new Card('10', 'Hearts'));
assert.strictEqual(communityCards.getCards().length, 5, "There should be 5 cards after the river");


// Test advancing active player turn
let initialTurnId = tableState.getActivePlayerTurnId();
tableState.advanceToNextActivePlayer();
let nextTurnId = tableState.getActivePlayerTurnId();
assert.notStrictEqual(nextTurnId, initialTurnId, "Active player turn should have advanced to the next player");

// Test betting
tableState.applyBet(player1.id, 100);
assert.strictEqual(player1.chips, 900, "Player 1 should have 900 chips after betting 100");
assert.strictEqual(player1.getCurrentBet(), 100, "Player 1's current bet should be 100");


// Test removing an active player
tableState.removeActivePlayer(player2.id);
let updatedActivePlayerIds = tableState.getActivePlayerIds();
assert.strictEqual(updatedActivePlayerIds.length, 1, "There should be 1 active player after removal");
assert.strictEqual(updatedActivePlayerIds[0], player1.id, "The remaining active player should be Player 1");




console.log("All TableStateRepository tests passed!");