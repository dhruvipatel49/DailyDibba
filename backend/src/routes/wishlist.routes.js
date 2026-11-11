import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../schemas.js';
import { notFound } from '../utils/httpError.js';

const router = Router();
router.use(authenticate, requireRole('customer'));

// GET /api/wishlist
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT mi.id, mi.name, mi.description, mi.category, mi.price, mi.image_url AS image,
            mi.is_veg AS "isVeg", mi.quantity_left AS "quantityLeft", mi.is_active AS "isActive",
            mi.cook_id AS "cookId", cp.kitchen_name AS "cookName"
       FROM wishlist_items w
       JOIN menu_items mi ON mi.id = w.menu_item_id
       JOIN cook_profiles cp ON cp.id = mi.cook_id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC`,
    [req.user.id],
  );
  res.json({ items: rows });
});

// POST /api/wishlist/:id/toggle — heart icon: adds if missing, removes if present
router.post('/:id/toggle', validate({ params: idParam }), async (req, res) => {
  const { id } = req.valid.params;
  const del = await query('DELETE FROM wishlist_items WHERE user_id = $1 AND menu_item_id = $2', [req.user.id, id]);
  if (del.rowCount) return res.json({ wishlisted: false });

  const item = await query('SELECT 1 FROM menu_items WHERE id = $1 AND is_active', [id]);
  if (!item.rowCount) throw notFound('Dish not found');
  await query('INSERT INTO wishlist_items (user_id, menu_item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, id]);
  res.json({ wishlisted: true });
});

// DELETE /api/wishlist/:id
router.delete('/:id', validate({ params: idParam }), async (req, res) => {
  await query('DELETE FROM wishlist_items WHERE user_id = $1 AND menu_item_id = $2', [req.user.id, req.valid.params.id]);
  res.status(204).end();
});

export default router;
