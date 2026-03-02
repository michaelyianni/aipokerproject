import LobbyRepository from "../../src/repositories/lobby.repository.js";  
import Player from "../../src/models/Player.js";

import assert from 'assert';

console.log("Testing LobbyRepository class...");

let lobby = new LobbyRepository();

// Test adding players

let player1id = lobby.addPlayer("Alice");
let player2id = lobby.addPlayer("Bob");
let retrievedPlayer1 = lobby.getPlayer(player1id);
assert.strictEqual(retrievedPlayer1.id, player1id, "Retrieved Player 1 should match");
let retrievedPlayer2 = lobby.getPlayer(player2id);
assert.strictEqual(retrievedPlayer2.id, player2id, "Retrieved Player 2 should match");

// Test getting lobby state
let lobbyState = lobby.getLobbyState();
console.log("Lobby state after adding players:", lobbyState);
assert.strictEqual(lobbyState.players.length, 2, "Lobby should have 2 players");
assert.strictEqual(lobbyState.players.find(p => p.id === player1id).username, "Alice", "Player 1 username should be Alice");
assert.strictEqual(lobbyState.players.find(p => p.id === player2id).username, "Bob", "Player 2 username should be Bob");

// Test removing a player
lobby.removePlayer(player1id);
let removedPlayer = lobby.getPlayer(player1id);
assert.strictEqual(removedPlayer, undefined, "Removed player should be undefined");

console.log("All LobbyRepository tests passed successfully.");