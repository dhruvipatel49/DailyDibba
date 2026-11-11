// Notifications (all roles) and image upload (cook/admin).
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../schemas.js';
import { listNotifications } from '../services/notifications.js';
import { badRequest } from '../utils/httpError.js';

export const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(path.join(UPLOAD_DIR, 'dishes'), { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, 'dishes')),
    // Random name + extension chosen from the verified MIME type, never from the client's filename.
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(badRequest('Only JPG, PNG or WebP images are allowed'))),
});

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

// GET /api/notifications?unread=true
notificationsRouter.get('/', async (req, res) => {
  const notifications = await listNotifications(req.user.id, { unreadOnly: req.query.unread === 'true' });
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL', [req.user.id]);
  res.json({ unreadCount: rows[0].n, notifications });
});

// POST /api/notifications/read-all
notificationsRouter.post('/read-all', async (req, res) => {
  await query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [req.user.id]);
  res.status(204).end();
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', validate({ params: idParam }), async (req, res) => {
  await query('UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2', [
    req.valid.params.id,
    req.user.id,
  ]);
  res.status(204).end();
});

export const uploadsRouter = Router();

// POST /api/uploads/image  (multipart field "image") → { url } to use as `imageUrl` on a dish / cook profile
uploadsRouter.post('/image', authenticate, requireRole('cook', 'admin'), upload.single('image'), (req, res) => {
  if (!req.file) throw badRequest('Attach an image in the "image" field');
  res.status(201).json({ url: `/uploads/dishes/${req.file.filename}` });
});
