// ./src/server.js (ESM)
import { createServer } from "./server/createServer.js";

async function main() {
  const { start } = createServer({ corsOrigin: "*" });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await start(port);

  console.log(`Socket.IO server listening on port ${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
