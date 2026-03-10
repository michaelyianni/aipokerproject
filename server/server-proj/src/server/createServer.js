// ./src/server/createServer.js (ESM)
import http from "http";
import express from "express";
import { Server } from "socket.io";

import LobbyRepository from "../repositories/lobby.repository.js";
import LobbyController from "../controllers/lobby.controller.js";
import PlayerActionController from "../controllers/playerAction.controller.js";
import GameEngineService from "../services/gameEngine.service.js";

export function createServer({ corsOrigin = "*", testingMode = false } = {}) {
    const app = express();
    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
        cors: { origin: corsOrigin },
    });

    // Dependencies
    const lobbyRepository = new LobbyRepository();
    const lobbyController = new LobbyController(lobbyRepository);

    let playerActionController;
    let gameEngineService;

    const LOBBY_ROOM = "lobby";

    // Optional HTTP health route
    app.get("/health", (req, res) => res.json({ ok: true }));

    function emitLobbyState() {
        io.to(LOBBY_ROOM).emit("lobby:update", {
            lobby: lobbyRepository.getLobbyState(),
        });
    }

    function emitGameState() {
        if (!gameEngineService) {
            console.error("[ERROR] emitGameState called but gameEngineService is undefined");
            return;
        }

        try {
            const gameState = gameEngineService.getGameState();
            console.log("[DEBUG] Game state retrieved:", gameState ? "✓" : "✗");


            console.log("[DEBUG] Current street:", gameState?.currentStreet);
            // console.log("[DEBUG] Game state structure:", Object.keys(gameState || {}));

            // const playerStates = {};
            // for (const [id, player] of Object.entries(gameState.players || {})) {
            //     playerStates[id] = {
            //         hasLeft: player.hasLeft,
            //         hasFolded: player.hasFolded,
            //         chips: player.chips
            //     };
            // }
            // console.log("[DEBUG] Player states:", JSON.stringify(playerStates, null, 2));

            io.to(LOBBY_ROOM).emit("game:state", gameState);
            console.log("[DEBUG] game:state emitted to LOBBY_ROOM");
        } catch (err) {
            console.error("[ERROR] Failed to emit game state:", err);
        }
    }

    function emitHandResults() {
        if (!gameEngineService) {
            console.error("[ERROR] emitHandResults called but gameEngineService is undefined");
            return;
        }
        if (!gameEngineService.tableStateRepository.getHandResults()) {
            console.error("[ERROR] emitHandResults called but hand results are not available");
            return;
        }

        console.log("[DEBUG] Emitting hand results...");


        try {
            const gameState = gameEngineService.getGameState();
            console.log("[DEBUG] Game state retrieved:", gameState ? "✓" : "✗");


            console.log("[DEBUG] Current street:", gameState?.currentStreet);

            io.to(LOBBY_ROOM).emit("game:hand_results", gameState);
            console.log("[DEBUG] game:hand_results emitted to LOBBY_ROOM");
        } catch (err) {
            console.error("[ERROR] Failed to emit game state:", err);
        }
    }


    io.on("connection", (socket) => {


        // Lobby events

        socket.on("lobby:join", ({ username } = {}, ack) => {
            try {
                const { playerId, isHost, lobby } = lobbyController.lobbyJoin(username);

                socket.data.playerId = playerId;
                socket.data.username = username;
                if (isHost) {
                    lobbyRepository.setHostPlayer(playerId);
                }

                socket.join(LOBBY_ROOM);

                console.log(
                    `Player ${username} (${playerId}) joined the lobby. Host: ${isHost}`
                );

                ack?.({
                    ok: true,
                    playerId,
                    isHost,
                    lobby,
                });

                emitLobbyState();
            } catch (err) {
                ack?.({ ok: false, error: err.message });
            }
        });


        socket.on("lobby:start", (_, ack) => {
            try {
                lobbyController.lobbyStart(socket.data.playerId === lobbyRepository.hostPlayerId);

                const lobbyPlayers = Object.values(lobbyRepository.players);

                console.log("[DEBUG] Starting game with players:", lobbyPlayers.map(p => p.name).join(", "));

                // Create game engine and controller
                gameEngineService = new GameEngineService(
                    lobbyPlayers,
                    () => emitHandResults(), // callback to emit hand results on updates
                    testingMode // pass testingMode flag to game engine
                );
                playerActionController = new PlayerActionController(lobbyRepository, gameEngineService);

                console.log("[DEBUG] Game engine created:", gameEngineService ? "✓" : "✗");
                console.log("[DEBUG] Player controller created:", playerActionController ? "✓" : "✗");

                // Send acknowledgment
                ack?.({ ok: true });

                // Broadcast game started
                io.to(LOBBY_ROOM).emit("game:started", {
                    startedBy: socket.data.playerId,
                });

                emitLobbyState();

                // Wait 3 seconds before emitting game state

                if (testingMode) {
                    console.log("[TEST MODE] Skipping 3 second delay before emitting initial game state");
                    emitGameState();
                    return;
                }

                console.log("[DEBUG] Waiting 2 seconds before emitting initial game state...");
                setTimeout(() => {
                    console.log("[DEBUG] About to emit game state...");
                    emitGameState();
                    console.log("[DEBUG] Game state emission completed");
                }, 2000); // 2 seconds

            } catch (err) {
                console.error("[ERROR] Failed to start game:", err);
                ack?.({ ok: false, error: err.message });
            }
        });

        socket.on("lobby:get", (_, ack) => {
            ack?.({
                ok: true,
                isGameStarted: lobbyRepository.isGameStarted,
                lobby: lobbyRepository.players,
            });

            console.log(
                `Player ${socket.data.username} (${socket.data.playerId}) requested lobby state`
            );
        });


        // Game events

        socket.on("game:action", async ({ playerId, action, amount } = {}, ack) => {
            try {
                await playerActionController.performAction(playerId, action, amount);

                emitGameState();

                ack?.({ ok: true });
            } catch (err) {
                ack?.({ ok: false, error: err.message });
                console.error("[ERROR] Failed to perform player action from playerId:", playerId, err);
            }
        });


        socket.on("disconnect", async () => {
            try {
                if (lobbyRepository.isGameStarted && playerActionController && gameEngineService) {
                    // Check if game is not viable
                    if (!gameEngineService.gameInProgress) {
                        console.log("[INFO] Player " + socket.data.username + " (" + socket.data.playerId + ") disconnected but game already ended. Just removing from lobby.");
                        return;
                    }


                    try {
                        await playerActionController.playerDisconnect(socket.data.playerId);
                        emitGameState();
                    } catch (disconnectErr) {
                        // Game might have ended or player already removed
                        console.log("[INFO] Disconnect handled:", disconnectErr.message);
                    }


                    // Check if game ended due to disconnect
                    if (!gameEngineService.gameInProgress) {
                        console.log("[INFO] Game ended due to player disconnect. Resetting lobby.");

                        // Disconnect all clients
                        const sockets = await io.fetchSockets();
                        for (const s of sockets) {
                            s.disconnect(true);
                        }

                        lobbyRepository.reset(); // reset lobby for next game
                    }
                }
                else {
                    const { playerId, username } = socket.data || {};

                    if (!playerId) {
                        return;
                    }

                    lobbyRepository.removePlayer(playerId);
                    emitLobbyState();

                    console.log(`Player ${username} (${playerId}) disconnected and removed from lobby. Host playerId: ${lobbyRepository.hostPlayerId}`);
                }
            } catch (err) {
                console.error("Error removing player on disconnect:", err);
            }
        });
    });

    // Lifecycle
    async function start(port = 0) {
        await new Promise((resolve) => httpServer.listen(port, resolve));
        return httpServer.address().port; // actual port (useful when port=0 in tests)
    }

    async function stop() {
        await new Promise((resolve) => io.close(resolve));
        await new Promise((resolve) => httpServer.close(resolve));
    }

    // Expose useful handles for tests/debug
    return {
        app,
        httpServer,
        io,
        start,
        stop,
        lobbyRepository,
        lobbyController,
        gameEngineService,
        playerActionController,
    };
}
