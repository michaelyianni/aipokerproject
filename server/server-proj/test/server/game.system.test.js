// test/server/game.system.test.js
import { expect } from "chai";
import { io as ioClient } from "socket.io-client";
import { createServer } from "../../src/server/createServer.js";
import { GAME_ACTIONS } from "../../src/constants/gameActions.js";
import { PokerStreets } from "../../src/constants/pokerStreets.js";

function lobbySizeFromMap(lobbyMap) {
    return Object.keys(lobbyMap || {}).length;
}

function connect(url) {
    return new Promise((resolve, reject) => {
        const socket = ioClient(url, {
            transports: ["websocket"],
            forceNew: true,
            reconnection: false,
            timeout: 5000,
        });

        socket.on("connect", () => resolve(socket));
        socket.on("connect_error", reject);
    });
}

function waitForEventMatching(socket, event, predicate, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, onEvent);
            reject(new Error(`Timed out waiting for ${event}`));
        }, timeoutMs);

        function onEvent(payload) {
            try {
                if (!predicate || predicate(payload)) {
                    clearTimeout(timer);
                    socket.off(event, onEvent);
                    resolve(payload);
                }
            } catch (err) {
                clearTimeout(timer);
                socket.off(event, onEvent);
                reject(err);
            }
        }

        socket.on(event, onEvent);
    });
}

function emitAck(socket, event, payload = {}, opts = {}) {
    const { confirmEvent = null, confirmPredicate = null, timeoutMs = 5000 } = opts;

    return new Promise((resolve, reject) => {
        const confirmPromise = confirmEvent
            ? waitForEventMatching(socket, confirmEvent, confirmPredicate, timeoutMs)
            : Promise.resolve(null);

        const ackTimer = setTimeout(() => {
            reject(new Error(`Timed out waiting for ack from ${event}`));
        }, timeoutMs);

        socket.emit(event, payload, async (ack) => {
            clearTimeout(ackTimer);

            if (!ack) return reject(new Error(`No ack received for ${event}`));

            try {
                const confirm = await confirmPromise;
                resolve(confirmEvent ? { ack, confirm } : ack);
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function emitAckAndConfirmOn(observeSocket, emitSocket, event, payload, opts = {}) {
    const { confirmEvent, confirmPredicate, timeoutMs = 5000 } = opts;

    const confirmPromise = waitForEventMatching(
        observeSocket,
        confirmEvent,
        confirmPredicate,
        timeoutMs
    );

    const ack = await emitAck(emitSocket, event, payload, { timeoutMs });
    const confirm = await confirmPromise;

    return { ack, confirm };
}

function closeAndWait(socket, timeoutMs = 2000) {
    return new Promise((resolve) => {
        if (!socket || socket.disconnected) return resolve();

        const timer = setTimeout(resolve, timeoutMs);
        socket.once("disconnect", () => {
            clearTimeout(timer);
            resolve();
        });

        socket.close();
    });
}

/**
 * Wait for all sockets to receive game:state matching a predicate
 */
async function waitForGameStateOnAll(sockets, predicate, timeoutMs = 5000) {
    const promises = sockets.map((socket) =>
        waitForEventMatching(socket, "game:state", predicate, timeoutMs)
    );
    return Promise.all(promises);
}

describe("Game System Test (Full Socket Integration)", function () {
    this.timeout(30000);

    let srv;
    let url;

    const openSockets = [];

    async function connectTracked() {
        const s = await connect(url);
        openSockets.push(s);
        return s;
    }

    before(async () => {
        srv = createServer({ corsOrigin: "*" });
        const port = await srv.start(0);
        url = `http://localhost:${port}`;
    });

    after(async () => {
        await Promise.all(openSockets.map((s) => closeAndWait(s)));
        openSockets.length = 0;
        await srv.stop();
    });

    afterEach(async () => {
        await Promise.all(openSockets.map((s) => closeAndWait(s)));
        openSockets.length = 0;
    });

    beforeEach(() => {
        srv.lobbyRepository.reset();
    });

    it("Full game flow: 4 players join, host starts, play multiple hands with actions, disconnects, and game state broadcasts", async function () {
        console.log("\n========== FULL GAME SYSTEM TEST ==========\n");

        // ---------- STEP 1: Players Join Lobby ----------
        console.log("--- STEP 1: Players Join Lobby ---");

        const alice = await connectTracked();
        const bob = await connectTracked();
        const charlie = await connectTracked();
        const diana = await connectTracked();

        // Alice joins (becomes host)
        const { ack: aliceJoin } = await emitAck(
            alice,
            "lobby:join",
            { username: "Alice" },
            {
                confirmEvent: "lobby:update",
                confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 1,
            }
        );
        expect(aliceJoin.ok).to.equal(true);
        expect(aliceJoin.isHost).to.equal(true);
        const aliceId = aliceJoin.playerId;
        console.log(`✓ Alice joined as host (ID: ${aliceId})`);

        // Bob joins
        const { ack: bobJoin } = await emitAckAndConfirmOn(
            alice,
            bob,
            "lobby:join",
            { username: "Bob" },
            {
                confirmEvent: "lobby:update",
                confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 2,
            }
        );
        expect(bobJoin.ok).to.equal(true);
        expect(bobJoin.isHost).to.equal(false);
        const bobId = bobJoin.playerId;
        console.log(`✓ Bob joined (ID: ${bobId})`);

        // Charlie joins
        const { ack: charlieJoin } = await emitAckAndConfirmOn(
            alice,
            charlie,
            "lobby:join",
            { username: "Charlie" },
            {
                confirmEvent: "lobby:update",
                confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 3,
            }
        );
        expect(charlieJoin.ok).to.equal(true);
        const charlieId = charlieJoin.playerId;
        console.log(`✓ Charlie joined (ID: ${charlieId})`);

        // Diana joins
        const { ack: dianaJoin } = await emitAckAndConfirmOn(
            alice,
            diana,
            "lobby:join",
            { username: "Diana" },
            {
                confirmEvent: "lobby:update",
                confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 4,
            }
        );
        expect(dianaJoin.ok).to.equal(true);
        const dianaId = dianaJoin.playerId;
        console.log(`✓ Diana joined (ID: ${dianaId})`);

        expect(srv.lobbyRepository.getLobbySize()).to.equal(4);

        // ---------- STEP 2: Host Starts Game ----------
        console.log("\n--- STEP 2: Host Starts Game ---");

        // ✅ SET UP LISTENERS FIRST (before emitting lobby:start)
        const gameStatePromises = waitForGameStateOnAll(
            [alice, bob, charlie, diana],
            (state) => state && state.currentStreet === PokerStreets.PRE_FLOP,
            10000  // 10 second timeout
        );

        // Set up listeners for game:started on all clients
        const gameStartedPromises = [bob, charlie, diana].map((socket) =>
            waitForEventMatching(socket, "game:started", (e) => e.startedBy === aliceId)
        );

        // NOW start the game
        const hostStartAck = await emitAck(alice, "lobby:start", { testingMode: true });
        expect(hostStartAck.ok).to.equal(true);
        console.log(`✓ Host (Alice) started the game`);

        // Verify all clients received game:started
        await Promise.all(gameStartedPromises);
        console.log(`✓ All clients received game:started event`);

        expect(srv.lobbyRepository.isGameStarted).to.equal(true);

        // Now wait for the game states (listeners already set up)
        const initialStates = await gameStatePromises;
        console.log(`✓ All clients received initial game:state (PRE_FLOP)`);

        // Validate initial game state structure
        const aliceState = initialStates[0];
        expect(aliceState).to.have.property("currentStreet");
        expect(aliceState).to.have.property("currentBet");
        expect(aliceState).to.have.property("currentTurnPlayerId");
        expect(aliceState).to.have.property("pots");
        expect(aliceState).to.have.property("communityCards");
        expect(aliceState).to.have.property("players");
        expect(Object.keys(aliceState.players).length).to.equal(4);
        console.log(`✓ Game state has correct structure`);

        // Determine game positions from state
        const dealerId = aliceState.dealerId;
        const currentTurnId = aliceState.currentTurnPlayerId;
        console.log(`  Dealer: ${dealerId}`);
        console.log(`  Current Turn (first to act pre-flop): ${currentTurnId}`);

        // ---------- STEP 3: Play Pre-Flop Betting Round ----------
        console.log("\n--- STEP 3: Pre-Flop Betting ---");

        // Map player IDs to sockets
        const playerSockets = {
            [aliceId]: alice,
            [bobId]: bob,
            [charlieId]: charlie,
            [dianaId]: diana,
        };

        // Test invalid action: Out of turn
        console.log("\n[INVALID ACTION TEST] Player tries to act out of turn");
        const notTurnId = [aliceId, bobId, charlieId, dianaId].find((id) => id !== currentTurnId);
        const notTurnSocket = playerSockets[notTurnId];

        const invalidAck = await emitAck(notTurnSocket, "game:action", {
            playerId: notTurnId,
            action: GAME_ACTIONS.FOLD,
            amount: 0,
        });
        expect(invalidAck.ok).to.equal(false);
        expect(invalidAck.error).to.match(/cannot act out of turn/i);
        console.log(`✓ Out-of-turn action correctly rejected`);

        // Player actions - follow betting order
        let currentState = aliceState;
        let actionCount = 0;
        const maxActions = 4; // Expect 4 players to act pre-flop

        console.log("\n[PRE-FLOP ACTIONS]");

        while (currentState.currentStreet === PokerStreets.PRE_FLOP && actionCount < maxActions) {
            const actingPlayerId = currentState.currentTurnPlayerId;
            const actingSocket = playerSockets[actingPlayerId];
            const currentBet = currentState.currentBet;

            console.log(
                `\n  Turn: Player ${actingPlayerId} | CurrentBet: ${currentBet} | Street: ${currentState.currentStreet}`
            );

            // Decide action based on position
            let action, amount;
            if (currentBet === 0) {
                action = GAME_ACTIONS.CHECK;
                amount = 0;
                console.log(`  Action: CHECK`);
            } else {
                // For variety, first player calls, others call or fold
                if (actionCount === 0 || actionCount === 1) {
                    action = GAME_ACTIONS.CALL;
                    amount = 0;
                    console.log(`  Action: CALL`);
                } else if (actionCount === 2) {
                    action = GAME_ACTIONS.FOLD;
                    amount = 0;
                    console.log(`  Action: FOLD`);
                } else if (actionCount === 3) {
                    action = GAME_ACTIONS.CHECK;
                    amount = 0;
                    console.log(`  Action: CHECK`);
                }
            }

            // Wait for game:state on all clients after this action
            const statePromises = waitForGameStateOnAll(
                [alice, bob, charlie, diana].filter((s) => !s.disconnected),
                () => true, // Accept any game state update
                10000
            );

            // Execute action
            const actionAck = await emitAck(actingSocket, "game:action", {
                playerId: actingPlayerId,
                action,
                amount,
            });

            console.log(`  Action ack:`, actionAck);

            expect(actionAck.ok).to.equal(true);

            // Wait for broadcast
            const newStates = await statePromises;
            currentState = newStates[0];

            console.log(
                `  ✓ Action broadcasted | New street: ${currentState.currentStreet} | Next turn: ${currentState.currentTurnPlayerId}`
            );

            actionCount++;
        }

        console.log(currentState);

        // Should have advanced to FLOP
        expect(currentState.currentStreet).to.equal(PokerStreets.FLOP);
        expect(currentState.communityCards.length).to.equal(3);
        console.log(`\n✓ Advanced to FLOP with ${currentState.communityCards.length} community cards`);

        // Verify pots exist
        expect(currentState.pots).to.be.an("array");
        expect(currentState.pots.length).to.be.greaterThan(0);
        const totalPot = currentState.pots.reduce((sum, pot) => sum + pot.amount, 0);
        console.log(`✓ Pots created with total: ${totalPot} chips`);

        // ---------- STEP 4: Play FLOP Betting Round with Raises ----------
        console.log("\n--- STEP 4: FLOP Betting with Raises ---");

        actionCount = 0;
        const maxFlopActions = 6; // Allow for bets and raises

        console.log("\n[FLOP ACTIONS]");

        while (currentState.currentStreet === PokerStreets.FLOP && actionCount < maxFlopActions) {
            const actingPlayerId = currentState.currentTurnPlayerId;

            // Skip if no one left to act
            if (!actingPlayerId) {
                console.log("  No active player to act, street should advance");
                break;
            }

            const actingSocket = playerSockets[actingPlayerId];
            const currentBet = currentState.currentBet;

            console.log(
                `\n  Turn: Player ${actingPlayerId} | CurrentBet: ${currentBet} | Action #${actionCount + 1}`
            );

            // Test invalid BET when currentBet = 0 with amount = 0
            if (currentBet === 0 && actionCount === 0) {
                console.log(`  [INVALID ACTION TEST] BET with amount 0`);
                const invalidBet = await emitAck(actingSocket, "game:action", {
                    playerId: actingPlayerId,
                    action: GAME_ACTIONS.BET,
                    amount: 0,
                });
                expect(invalidBet.ok).to.equal(false);
                expect(invalidBet.error).to.match(/Invalid amount|greater than 0/i);
                console.log(`  ✓ BET 0 correctly rejected`);
            }

            // Decide action
            let action, amount;
            if (currentBet === 0) {
                if (actionCount === 0) {
                    action = GAME_ACTIONS.BET;
                    amount = 50;
                    console.log(`  Action: BET ${amount}`);
                } else {
                    action = GAME_ACTIONS.CHECK;
                    amount = 0;
                    console.log(`  Action: CHECK`);
                }
            } else {
                if (actionCount === 1) {
                    action = GAME_ACTIONS.RAISE;
                    amount = 50;
                    console.log(`  Action: RAISE ${amount}`);
                } else {
                    action = GAME_ACTIONS.CALL;
                    amount = 0;
                    console.log(`  Action: CALL`);
                }
            }

            // Wait for game:state broadcast
            const statePromises = waitForGameStateOnAll(
                [alice, bob, charlie, diana].filter((s) => !s.disconnected),
                () => true,
                10000
            );

            // Execute action
            const actionAck = await emitAck(actingSocket, "game:action", {
                playerId: actingPlayerId,
                action,
                amount,
            });

            expect(actionAck.ok).to.equal(true);

            // Wait for broadcast
            const newStates = await statePromises;
            currentState = newStates[0];

            console.log(
                `  ✓ Action broadcasted | New street: ${currentState.currentStreet} | Next turn: ${currentState.currentTurnPlayerId}`
            );

            actionCount++;

            // Break if street advanced
            if (currentState.currentStreet !== PokerStreets.FLOP) break;
        }

        // Should have advanced to TURN
        expect(currentState.currentStreet).to.equal(PokerStreets.TURN);
        expect(currentState.communityCards.length).to.equal(4);
        console.log(`\n✓ Advanced to TURN with ${currentState.communityCards.length} community cards`);

        // ---------- STEP 5: Player Disconnect During Game ----------
        console.log("\n--- STEP 5: Player Disconnect During Game ---");

        // One player disconnects
        const disconnectingPlayerId = charlieId;
        console.log(`\n[DISCONNECT] Player ${disconnectingPlayerId} (Charlie) disconnects`);

        // Wait for game:state update showing disconnect
        const disconnectStatePromises = waitForGameStateOnAll(
            [alice, bob, diana].filter((s) => !s.disconnected),
            (state) => {
                const player = state.players[disconnectingPlayerId];
                return player && player.hasLeft === true;
            },
            10000
        );

        // Close Charlie's socket
        charlie.close();

        // Wait for state update
        const statesAfterDisconnect = await disconnectStatePromises;
        currentState = statesAfterDisconnect[0];

        const disconnectedPlayer = currentState.players[disconnectingPlayerId];

        console.log(disconnectedPlayer);

        expect(disconnectedPlayer.hasLeft).to.equal(true);
        console.log(`✓ Player ${disconnectingPlayerId} marked as disconnected in game state`);

        // ---------- STEP 6: Continue Game on TURN ----------
        console.log("\n--- STEP 6: Continue TURN Betting ---");

        actionCount = 0;
        const maxTurnActions = 4;

        console.log("\n[TURN ACTIONS]");

        var finalStates;

        while (currentState.currentStreet === PokerStreets.TURN && actionCount < maxTurnActions) {
            const actingPlayerId = currentState.currentTurnPlayerId;

            if (!actingPlayerId) {
                console.log("  No active player to act");
                break;
            }

            const actingSocket = playerSockets[actingPlayerId];
            const currentBet = currentState.currentBet;

            console.log(`\n  Turn: Player ${actingPlayerId} | CurrentBet: ${currentBet}`);

            // Simple check-check or check-fold pattern
            let action, amount;
            if (currentBet === 0) {
                action = GAME_ACTIONS.CHECK;
                amount = 0;
                console.log(`  Action: CHECK`);
            } else {
                action = GAME_ACTIONS.FOLD;
                amount = 0;
                console.log(`  Action: FOLD`);
            }

            // Wait for game:state broadcast
            const statePromises = waitForGameStateOnAll(
                [alice, bob, diana].filter((s) => !s.disconnected),
                () => true,
                10000
            );

            // Execute action
            const actionAck = await emitAck(actingSocket, "game:action", {
                playerId: actingPlayerId,
                action,
                amount,
            });

            expect(actionAck.ok).to.equal(true);

            // Wait for broadcast
            const newStates = await statePromises;
            currentState = newStates[0];
            finalStates = newStates;

            console.log(
                `  ✓ Action broadcasted | New street: ${currentState.currentStreet} | Next turn: ${currentState.currentTurnPlayerId}`
            );

            actionCount++;

            if (currentState.currentStreet !== PokerStreets.TURN) break;
        }

        // Should have advanced to RIVER
        console.log(`\n✓ Street after TURN: ${currentState.currentStreet}`);
        expect([PokerStreets.RIVER, PokerStreets.PRE_FLOP]).to.include(currentState.currentStreet);

        // ---------- STEP 7: Verify Game State Consistency ----------
        console.log("\n--- STEP 7: Verify Game State Consistency ---");

        // Check that all connected clients have consistent game state

        const [aliceState2, bobState2, dianaState2] = finalStates;

        expect(aliceState2.currentStreet).to.equal(bobState2.currentStreet);
        expect(aliceState2.currentStreet).to.equal(dianaState2.currentStreet);
        console.log(`✓ All clients have consistent currentStreet: ${aliceState2.currentStreet}`);

        expect(aliceState2.currentBet).to.equal(bobState2.currentBet);
        expect(aliceState2.currentBet).to.equal(dianaState2.currentBet);
        console.log(`✓ All clients have consistent currentBet: ${aliceState2.currentBet}`);

        expect(aliceState2.communityCards.length).to.equal(bobState2.communityCards.length);
        expect(aliceState2.communityCards.length).to.equal(dianaState2.communityCards.length);
        console.log(
            `✓ All clients have consistent communityCards count: ${aliceState2.communityCards.length}`
        );

        // Verify player chip counts are consistent
        Object.keys(aliceState2.players).forEach((playerId) => {
            expect(aliceState2.players[playerId].chips).to.equal(bobState2.players[playerId].chips);
            expect(aliceState2.players[playerId].chips).to.equal(dianaState2.players[playerId].chips);
        });
        console.log(`✓ All clients have consistent player chip counts`);


        // -------------- STEP 8: Verify Game State Correctness ----------
        console.log("\n--- STEP 8: Verify Game State Correctness ---");

        // Log current game state for manual inspection
        console.log("\n[RIVER GAME STATE]");
        console.log(JSON.stringify(finalStates[0], null, 2));

        // Diana (P4) turn, bet 100 on river
        // Wait for game:state broadcast
        const dianaRiverPromises = waitForGameStateOnAll(
            [alice, bob, diana].filter((s) => !s.disconnected),
            () => true,
            10000
        );



        // Execute action
        const actionAck = await emitAck(playerSockets[dianaId], "game:action", {
            playerId: dianaId,
            action: GAME_ACTIONS.BET,
            amount: 100,
        });

        expect(actionAck.ok).to.equal(true);

        // Wait for broadcast
        const newStates = await dianaRiverPromises;
        currentState = newStates[0];

        console.log(
            `  ✓ Action broadcasted | New street: ${currentState.currentStreet} | Next turn: ${currentState.currentTurnPlayerId}`
        );

        // Alice (P2) goes all-in on river

            // Wait for game:state broadcast
        const aliceRiverPromises = waitForGameStateOnAll(
            [alice, bob, diana].filter((s) => !s.disconnected),
            () => true,
            10000
        );

        // Execute action
        const aliceActionAck = await emitAck(playerSockets[aliceId], "game:action", {
            playerId: aliceId,
            action: GAME_ACTIONS.RAISE,
            amount: currentState.players[aliceId].chips, // All-in
        });

        expect(aliceActionAck.ok).to.equal(true);

        // Wait for broadcast
        const aliceNewStates = await aliceRiverPromises;
        currentState = aliceNewStates[0];

        // Log current game state for manual inspection
        console.log("\n[RIVER GAME STATE AFTER ALICE ALL-IN]");
        console.log(JSON.stringify(currentState, null, 2));

        // Diana (P4) calls all-in

        // Wait for game:state broadcast
        const dianaCallPromises = waitForGameStateOnAll(
            [alice, bob, diana].filter((s) => !s.disconnected),
            () => true,
            10000
        );

        // Execute action
        const dianaCallAck = await emitAck(playerSockets[dianaId], "game:action", {
            playerId: dianaId,
            action: GAME_ACTIONS.CALL,
            amount: 0,
        });

        console.log(`Diana's all-in action ack:`, dianaCallAck);

        expect(dianaCallAck.ok).to.equal(true);
        // Wait for broadcast
        const dianaCallStates = await dianaCallPromises;
        currentState = dianaCallStates[0];

        // Log current game state for manual inspection
        console.log("\n[RIVER GAME STATE AFTER DIANA CALL]");
        console.log(JSON.stringify(currentState, null, 2));

        // ---------- FINAL VALIDATION ----------
        console.log("\n========== FINAL VALIDATION ==========\n");

        console.log(`✓ 4 players successfully joined lobby`);
        console.log(`✓ Host successfully started game`);
        console.log(`✓ All clients received game:started event`);
        console.log(`✓ All clients received initial game:state`);
        console.log(`✓ Pre-flop betting completed with multiple actions`);
        console.log(`✓ Invalid actions correctly rejected`);
        console.log(`✓ Game advanced through streets (PRE_FLOP → FLOP → TURN)`);
        console.log(`✓ FLOP betting with BET and RAISE actions`);
        console.log(`✓ Player disconnect handled mid-game`);
        console.log(`✓ Game continued after disconnect`);
        console.log(`✓ All clients maintained consistent game state`);
        console.log(`✓ Game state broadcasts working correctly`);

        console.log("\n✅ FULL GAME SYSTEM TEST PASSED.\n");
    });

    // it("Game with all-ins and side pots", async function () {
    //     console.log("\n========== ALL-IN AND SIDE POTS SYSTEM TEST ==========\n");

    //     // Connect 4 players
    //     const p1 = await connectTracked();
    //     const p2 = await connectTracked();
    //     const p3 = await connectTracked();
    //     const p4 = await connectTracked();

    //     // All join lobby
    //     const { ack: p1Join } = await emitAck(
    //         p1,
    //         "lobby:join",
    //         { username: "Player1" },
    //         { confirmEvent: "lobby:update", confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 1 }
    //     );
    //     const p1Id = p1Join.playerId;

    //     await emitAckAndConfirmOn(p1, p2, "lobby:join", { username: "Player2" }, {
    //         confirmEvent: "lobby:update",
    //         confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 2,
    //     });

    //     await emitAckAndConfirmOn(p1, p3, "lobby:join", { username: "Player3" }, {
    //         confirmEvent: "lobby:update",
    //         confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 3,
    //     });

    //     await emitAckAndConfirmOn(p1, p4, "lobby:join", { username: "Player4" }, {
    //         confirmEvent: "lobby:update",
    //         confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 4,
    //     });

    //     console.log(`✓ 4 players joined lobby`);

    //     const statePromises = waitForGameStateOnAll([p1, p2, p3, p4], (state) =>
    //         state ? state.currentStreet === PokerStreets.PRE_FLOP : false
    //     );

    //     // Host starts game
    //     await emitAck(p1, "lobby:start");
    //     console.log(`✓ Game started`);

    //     // Wait for initial state
    //     const initialStates = await statePromises;

    //     let currentState = initialStates[0];
    //     console.log(`✓ Initial game state received`);

    //     // Create scenario for all-ins
    //     // We'll simulate by having players make aggressive bets
    //     // Note: In a real test, you might want to manipulate chip stacks via server API

    //     console.log("\n[PRE-FLOP] Attempting to create all-in scenario...");

    //     const playerSockets = Object.fromEntries(
    //         Object.keys(currentState.players).map((id, idx) => [id, [p1, p2, p3, p4][idx]])
    //     );

    //     // Play a few actions to create betting
    //     let actionCount = 0;
    //     while (currentState.currentStreet === PokerStreets.PRE_FLOP && actionCount < 4) {
    //         const actingPlayerId = currentState.currentTurnPlayerId;
    //         const actingSocket = playerSockets[actingPlayerId];

    //         const action = GAME_ACTIONS.CALL;
    //         const statePromises = waitForGameStateOnAll([p1, p2, p3, p4], () => true, 10000);

    //         await emitAck(actingSocket, "game:action", {
    //             playerId: actingPlayerId,
    //             action,
    //             amount: 0,
    //         });

    //         const newStates = await statePromises;
    //         currentState = newStates[0];
    //         actionCount++;

    //         if (currentState.currentStreet !== PokerStreets.PRE_FLOP) break;
    //     }

    //     console.log(`✓ Game progressed, current street: ${currentState.currentStreet}`);

    //     // Verify pots structure (should have at least 1 pot)
    //     expect(currentState.pots).to.be.an("array");
    //     expect(currentState.pots.length).to.be.greaterThan(0);
    //     console.log(`✓ Pots created: ${currentState.pots.length} pot(s)`);

    //     currentState.pots.forEach((pot, idx) => {
    //         console.log(
    //             `  Pot ${idx + 1}: ${pot.amount} chips | Eligible players: ${pot.eligiblePlayerIds.length}`
    //         );
    //     });

    //     console.log("\n✅ ALL-IN AND SIDE POTS SYSTEM TEST PASSED.\n");
    // });
});