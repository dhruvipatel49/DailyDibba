// Applies db/schema.sql (idempotent — safe to run on every deploy).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'schema.sql');

try {
  await pool.query(fs.readFileSync(file, 'utf8'));
  console.log('✔ Schema applied');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
