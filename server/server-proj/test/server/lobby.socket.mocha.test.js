// test/server/lobby.socket.mocha.test.js
import { expect } from "chai";
import { io as ioClient } from "socket.io-client";
import { createServer } from "../../src/server/createServer.js";

function lobbySizeFromMap(lobbyMap) {
  return Object.keys(lobbyMap || {}).length;
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(url, {
      transports: ["websocket"], // deterministic
      forceNew: true,
      reconnection: false,
      timeout: 2000,
    });

    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });
}

function waitForEventMatching(socket, event, predicate, timeoutMs = 2000) {
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

/**
 * Emit an event with Socket.IO ack. Optionally wait for a confirming event on the SAME socket.
 * - If confirmEvent is provided, resolves { ack, confirm }
 * - Otherwise resolves ack
 */
function emitAck(socket, event, payload = {}, opts = {}) {
  const { confirmEvent = null, confirmPredicate = null, timeoutMs = 2000 } = opts;

  return new Promise((resolve, reject) => {
    // Attach confirm listener BEFORE emitting so we can't miss it
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

/**
 * Common pattern for broadcasts:
 * - one socket emits (emitSocket)
 * - a different socket observes the broadcast (observeSocket)
 */
async function emitAckAndConfirmOn(observeSocket, emitSocket, event, payload, opts = {}) {
  const { confirmEvent, confirmPredicate, timeoutMs = 2000 } = opts;

  const confirmPromise = waitForEventMatching(
    observeSocket,
    confirmEvent,
    confirmPredicate,
    timeoutMs
  );

  const ack = await emitAck(emitSocket, event, payload, { timeoutMs }); // ack only
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

describe("Lobby Socket.IO (Mocha/Chai)", function () {
  this.timeout(10000);

  let srv;
  let url;

  // Track sockets so we can always close them + wait for disconnect before reset
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
    // Close any remaining sockets before stopping server
    await Promise.all(openSockets.map((s) => closeAndWait(s)));
    openSockets.length = 0;

    await srv.stop();
  });

  afterEach(async () => {
    // Ensure all sockets from this test are fully disconnected
    await Promise.all(openSockets.map((s) => closeAndWait(s)));
    openSockets.length = 0;
  });

  beforeEach(() => {
    // Safe now because afterEach waits for disconnects from prior test
    srv.lobbyRepository.reset();
  });

  it("first join is host + sets hostPlayerId + broadcasts lobby:update", async () => {
    const alice = await connectTracked();

    const { ack: joinAck, confirm: update } = await emitAck(
      alice,
      "lobby:join",
      { username: "Alice" },
      {
        confirmEvent: "lobby:update",
        confirmPredicate: (u) =>
          u.isGameStarted === false && lobbySizeFromMap(u.lobby) === 1,
      }
    );

    expect(joinAck.ok).to.equal(true);
    expect(joinAck.isHost).to.equal(true);
    expect(joinAck.playerId).to.equal(srv.lobbyRepository.hostPlayerId);

    expect(joinAck.lobby).to.be.an("object");
    expect(lobbySizeFromMap(joinAck.lobby)).to.equal(1);

    expect(update).to.have.property("isGameStarted", false);
    expect(update.lobby).to.be.an("object");
    expect(lobbySizeFromMap(update.lobby)).to.equal(1);
  });

  it("second join is not host and lobby has 2 players", async () => {
    const alice = await connectTracked();
    const bob = await connectTracked();

    // Alice joins, wait for size 1
    const { ack: aliceJoin } = await emitAck(alice, "lobby:join", { username: "Alice" }, {
      confirmEvent: "lobby:update",
      confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 1,
    });
    expect(aliceJoin.isHost).to.equal(true);

    // Bob joins, confirm Alice sees size 2
    const { ack: bobJoinAck, confirm: updateOnAlice } = await emitAckAndConfirmOn(
      alice,
      bob,
      "lobby:join",
      { username: "Bob" },
      {
        confirmEvent: "lobby:update",
        confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 2,
      }
    );

    expect(bobJoinAck.ok).to.equal(true);
    expect(bobJoinAck.isHost).to.equal(false);

    expect(updateOnAlice.lobby).to.be.an("object");
    expect(lobbySizeFromMap(updateOnAlice.lobby)).to.equal(2);

    expect(srv.lobbyRepository.getLobbySize()).to.equal(2);
  });

  it("non-host cannot start; host can start; game:started broadcast; isGameStarted becomes true", async () => {
    const host = await connectTracked();
    const guest = await connectTracked();

    const { ack: hostJoin } = await emitAck(host, "lobby:join", { username: "Host" }, {
      confirmEvent: "lobby:update",
      confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 1,
    });

    const { ack: guestJoin } = await emitAckAndConfirmOn(
      host,
      guest,
      "lobby:join",
      { username: "Guest" },
      {
        confirmEvent: "lobby:update",
        confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 2,
      }
    );

    expect(hostJoin.ok).to.equal(true);
    expect(hostJoin.isHost).to.equal(true);
    expect(guestJoin.ok).to.equal(true);
    expect(guestJoin.isHost).to.equal(false);

    // Non-host start should fail (ack only)
    const guestStart = await emitAck(guest, "lobby:start");
    expect(guestStart.ok).to.equal(false);
    expect(guestStart.error).to.match(/Only the host/i);

    // Host start should succeed; confirm guest sees game:started
    const { ack: hostStartAck, confirm: startedOnGuest } = await emitAckAndConfirmOn(
      guest,
      host,
      "lobby:start",
      {},
      {
        confirmEvent: "game:started",
        confirmPredicate: (e) => e.startedBy === hostJoin.playerId,
      }
    );

    expect(hostStartAck.ok).to.equal(true);
    expect(startedOnGuest.startedBy).to.equal(hostJoin.playerId);
    expect(srv.lobbyRepository.isGameStarted).to.equal(true);
  });

  it("joining after game started is rejected", async () => {
    const host = await connectTracked();

    const { ack: hostJoin } = await emitAck(host, "lobby:join", { username: "Host" }, {
      confirmEvent: "lobby:update",
      confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 1,
    });

    expect(hostJoin.ok).to.equal(true);
    expect(hostJoin.isHost).to.equal(true);

    const startAck = await emitAck(host, "lobby:start");
    expect(startAck.ok).to.equal(true);

    const late = await connectTracked();
    const lateJoin = await emitAck(late, "lobby:join", { username: "Late" });

    expect(lateJoin.ok).to.equal(false);
    expect(lateJoin.error).to.match(/already started/i);
  });

  it("lobby caps at 6 players; 7th join is rejected", async () => {
    const sockets = [];

    // P1 is our observer socket
    const p1 = await connectTracked();
    sockets.push(p1);

    await emitAck(p1, "lobby:join", { username: "P1" }, {
      confirmEvent: "lobby:update",
      confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 1,
    });

    // Join P2..P6, confirm P1 sees lobby size increment each time
    for (let i = 2; i <= 6; i++) {
      const s = await connectTracked();
      sockets.push(s);

      await emitAckAndConfirmOn(
        p1,
        s,
        "lobby:join",
        { username: `P${i}` },
        {
          confirmEvent: "lobby:update",
          confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === i,
        }
      );
    }

    expect(srv.lobbyRepository.getLobbySize()).to.equal(6);

    // 7th should fail
    const seventh = await connectTracked();
    const res7 = await emitAck(seventh, "lobby:join", { username: "P7" });

    expect(res7.ok).to.equal(false);
    expect(res7.error).to.match(/Lobby is full/i);
  });

  it("disconnect before game start removes player and broadcasts lobby:update", async () => {
    const alice = await connectTracked();
    const bob = await connectTracked();

    await emitAck(alice, "lobby:join", { username: "Alice" }, {
      confirmEvent: "lobby:update",
      confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 1,
    });

    // Bob joins; confirm Alice sees size 2
    await emitAckAndConfirmOn(
      alice,
      bob,
      "lobby:join",
      { username: "Bob" },
      {
        confirmEvent: "lobby:update",
        confirmPredicate: (u) => lobbySizeFromMap(u.lobby) === 2,
      }
    );

    expect(srv.lobbyRepository.getLobbySize()).to.equal(2);

    // Now wait specifically for Alice to observe size 1 AFTER Bob disconnects
    const sizeOnePromise = waitForEventMatching(
      alice,
      "lobby:update",
      (u) => lobbySizeFromMap(u.lobby) === 1
    );

    // Close bob and wait for alice to get the update
    bob.close();

    const update = await sizeOnePromise;
    expect(lobbySizeFromMap(update.lobby)).to.equal(1);
    expect(srv.lobbyRepository.getLobbySize()).to.equal(1);
  });
});
