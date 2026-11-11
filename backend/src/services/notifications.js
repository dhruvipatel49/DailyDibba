import { query } from '../db.js';

/** Insert a notification. `db` is a pg client (inside a transaction) or the pool. */
export async function notify(db, userId, title, body = null, data = {}) {
  if (!userId) return;
  await db.query('INSERT INTO notifications (user_id, title, body, data) VALUES ($1, $2, $3, $4)', [
    userId,
    title,
    body,
    JSON.stringify(data),
  ]);
}

export async function notifyAdmins(db, title, body = null, data = {}) {
  await db.query(
    `INSERT INTO notifications (user_id, title, body, data)
     SELECT id, $1, $2, $3 FROM users WHERE role = 'admin' AND is_active`,
    [title, body, JSON.stringify(data)],
  );
}

export async function listNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  const { rows } = await query(
    `SELECT id, title, body, data, read_at IS NOT NULL AS read, created_at AS "createdAt"
       FROM notifications
      WHERE user_id = $1 ${unreadOnly ? 'AND read_at IS NULL' : ''}
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit],
  );
  return rows;
}
