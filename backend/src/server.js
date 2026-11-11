import { config } from './config.js';
import { pool } from './db.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`DailyDibba API listening on http://localhost:${config.port} (${config.env})`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down…`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
