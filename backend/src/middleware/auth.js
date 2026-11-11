import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { forbidden, unauthorized } from '../utils/httpError.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/** Requires a valid Bearer token. Loads the user fresh so deactivated accounts are locked out immediately. */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Invalid or expired token');
  }

  const { rows } = await query('SELECT id, name, email, phone, role, is_active FROM users WHERE id = $1', [payload.sub]);
  const user = rows[0];
  if (!user || !user.is_active) throw unauthorized('Account not found or disabled');

  req.user = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
  next();
}

/** RBAC: allow only the listed roles. Use after `authenticate`. */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden(`This action requires role: ${roles.join(' or ')}`);
    next();
  };
