import pg from 'pg';
import { config } from './config.js';

// Return int8 (COUNT / SUM) as JS numbers — our counts and ₹ totals are far below 2^53.
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
// numeric (e.g. rating_avg, AVG) as numbers
pg.types.setTypeParser(1700, (v) => parseFloat(v));
// date columns as plain 'YYYY-MM-DD' strings (avoid timezone shifting)
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => console.error('Unexpected PostgreSQL pool error:', err));

export const query = (text, params) => pool.query(text, params);

/** Run `fn(client)` inside a transaction. Commits on success, rolls back on any throw. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* connection is already broken; nothing to roll back */
    }
    throw err;
  } finally {
    client.release();
  }
}
