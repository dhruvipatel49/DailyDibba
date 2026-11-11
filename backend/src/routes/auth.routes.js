import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registerBody, updateMeBody } from '../schemas.js';
import { conflict, unauthorized } from '../utils/httpError.js';
import { notifyAdmins } from '../services/notifications.js';

const router = Router();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });

// POST /api/auth/register — customers, cooks and delivery partners self-register. Admins are created by the seed script.
router.post('/register', validate({ body: registerBody }), async (req, res) => {
  const b = req.valid.body;
  const hash = await bcrypt.hash(b.password, 10);

  const user = await withTransaction(async (client) => {
    const exists = await client.query('SELECT 1 FROM users WHERE lower(email) = $1', [b.email]);
    if (exists.rowCount) throw conflict('An account with this email already exists');

    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role`,
      [b.name, b.email, hash, b.phone ?? null, b.role],
    );
    const u = rows[0];

    if (b.role === 'cook') {
      await client.query(
        `INSERT INTO cook_profiles (user_id, kitchen_name, cuisines, is_veg, address_line, area, city)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Ahmedabad'))`,
        [u.id, b.kitchenName, b.cuisines ?? [], b.isVeg ?? true, b.address ?? null, b.area ?? null, b.city ?? null],
      );
      await notifyAdmins(client, 'New cook awaiting approval', `${b.kitchenName} just signed up`, { userId: u.id });
    } else if (b.role === 'delivery') {
      await client.query('INSERT INTO partner_profiles (user_id, vehicle_type) VALUES ($1, $2)', [u.id, b.vehicleType ?? null]);
    }
    return u;
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', validate({ body: loginBody }), async (req, res) => {
  const { email, password } = req.valid.body;
  const { rows } = await query(
    'SELECT id, name, email, phone, role, password_hash, is_active FROM users WHERE lower(email) = $1',
    [email],
  );
  const u = rows[0];
  // Same message for unknown email / wrong password / disabled so we don't leak which accounts exist.
  const ok = u && u.is_active && (await bcrypt.compare(password, u.password_hash));
  if (!ok) throw unauthorized('Invalid email or password');

  res.json({ token: signToken(u), user: publicUser(u) });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = { ...req.user };
  if (user.role === 'cook') {
    const { rows } = await query(
      `SELECT id AS "cookId", kitchen_name AS "kitchenName", is_approved AS "isApproved", is_open AS "isOpen"
         FROM cook_profiles WHERE user_id = $1`,
      [user.id],
    );
    user.cook = rows[0] ?? null;
  }
  res.json({ user });
});

// PATCH /api/auth/me
router.patch('/me', authenticate, validate({ body: updateMeBody }), async (req, res) => {
  const { name, phone } = req.valid.body;
  const { rows } = await query(
    `UPDATE users SET name = COALESCE($2, name), phone = COALESCE($3, phone)
      WHERE id = $1 RETURNING id, name, email, phone, role`,
    [req.user.id, name ?? null, phone ?? null],
  );
  res.json({ user: rows[0] });
});

export default router;
