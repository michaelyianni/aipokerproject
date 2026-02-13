// ./src/server/createServer.js (ESM)
import http from "http";
import express from "express";
import { Server } from "socket.io";

import LobbyRepository from "../repositories/lobby.repository.js";
import LobbyController from "../controllers/lobby.controller.js";
import PlayerActionController from "../controllers/playerAction.controller.js";
import GameEngineService from "../services/gameEngine.service.js";

export function createServer({ corsOrigin = "*" } = {}) {
    const app = express();
    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
        cors: { origin: corsOrigin },
    });

    // Dependencies
    const lobbyRepository = new LobbyRepository();
    const lobbyController = new LobbyController(lobbyRepository);

    const playerActionController = new PlayerActionController(lobbyRepository);
    let gameEngineService;

    const LOBBY_ROOM = "lobby";

    // Optional HTTP health route
    app.get("/health", (req, res) => res.json({ ok: true }));

    function emitLobbyState() {
        io.to(LOBBY_ROOM).emit("lobby:update", {
            isGameStarted: lobbyRepository.isGameStarted,
            lobby: lobbyRepository.players,
        });
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

                ack?.({ ok: true });

                io.to(LOBBY_ROOM).emit("game:started", {
                    startedBy: socket.data.playerId,
                });

                emitLobbyState();

                // TODO: Start game engine here, then emit initial game state:
                // io.to(LOBBY_ROOM).emit("game:state", initialState);

                gameEngineService = new GameEngineService(lobbyRepository.players); 



            } catch (err) {
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

        socket.on("game:action", ({ playerId, action, amount } = {}, ack) => {
            try {
                playerActionController.performAction(playerId, action, amount);


                ack?.({ ok: true });
            } catch (err) {
                ack?.({ ok: false, error: err.message });
            }
        });


        socket.on("disconnect", () => {
            try {
                
                if (lobbyRepository.isGameStarted) {
                   
                    
                    // TODO: Handle mid-game disconnects 
                    
                        // Check if only one player left - if so, end the game and reset lobby
                        // If game is ongoing, mark player as disconnected and skip their turns until they reconnect or game ends
                        // If player was host, assign new host (could be first player to the left in seating order, or first to join lobby, etc)
                        
                    

                }
                else {
                    const { playerId, username } = socket.data || {};

                    // If this socket never joined the lobby, ignore it
                    if (!playerId) {
                        return;
                    }

                    if (playerId && !lobbyRepository.isGameStarted) {
                        lobbyRepository.removePlayer(playerId);
                        emitLobbyState();
                    }

                    console.log(
                        `Player ${username} (${playerId}) disconnected and removed from lobby`
                    );
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
    };
}
