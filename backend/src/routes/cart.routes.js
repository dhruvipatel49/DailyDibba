import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { setCartItemBody } from '../schemas.js';
import { config } from '../config.js';
import { unitPrice } from '../constants.js';
import { badRequest, notFound } from '../utils/httpError.js';

const router = Router();
router.use(authenticate, requireRole('customer'));

async function loadCart(userId) {
  const { rows } = await query(
    `SELECT ci.menu_item_id AS "menuItemId", ci.size, ci.quantity, ci.instructions,
            mi.name, mi.price AS "basePrice", mi.image_url AS image, mi.quantity_left AS "quantityLeft",
            mi.is_active AS "isActive", mi.cook_id AS "cookId", cp.kitchen_name AS "cookName"
       FROM cart_items ci
       JOIN menu_items mi ON mi.id = ci.menu_item_id
       JOIN cook_profiles cp ON cp.id = mi.cook_id
      WHERE ci.user_id = $1
      ORDER BY cp.kitchen_name, mi.name, ci.size`,
    [userId],
  );
  const items = rows.map((r) => {
    const price = unitPrice(r.basePrice, r.size);
    return { ...r, price, lineTotal: price * r.quantity, available: r.isActive && r.quantityLeft >= r.quantity };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  // One delivery fee per cook, because each cook's food is a separate delivery.
  const cooks = new Set(items.map((i) => i.cookId)).size;
  const deliveryFee = cooks * config.deliveryFee;
  return { items, subtotal, deliveryFee, total: subtotal + deliveryFee, cookCount: cooks };
}

// GET /api/cart
router.get('/', async (req, res) => {
  res.json(await loadCart(req.user.id));
});

// PUT /api/cart/items — set the absolute quantity of one line (menuItemId + size). quantity 0 removes it.
router.put('/items', validate({ body: setCartItemBody }), async (req, res) => {
  const { menuItemId, size, quantity, instructions } = req.valid.body;

  if (quantity === 0) {
    await query('DELETE FROM cart_items WHERE user_id = $1 AND menu_item_id = $2 AND size = $3', [req.user.id, menuItemId, size]);
    return res.json(await loadCart(req.user.id));
  }

  const item = await query('SELECT quantity_left, is_active FROM menu_items WHERE id = $1', [menuItemId]);
  if (!item.rowCount || !item.rows[0].is_active) throw notFound('Dish not found');

  // Total across sizes of this dish can't exceed what the cook has left.
  const others = await query(
    'SELECT COALESCE(SUM(quantity), 0)::int AS n FROM cart_items WHERE user_id = $1 AND menu_item_id = $2 AND size <> $3',
    [req.user.id, menuItemId, size],
  );
  if (others.rows[0].n + quantity > item.rows[0].quantity_left) {
    throw badRequest(`Only ${item.rows[0].quantity_left} left of this dish today`);
  }

  await query(
    `INSERT INTO cart_items (user_id, menu_item_id, size, quantity, instructions)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, menu_item_id, size)
     DO UPDATE SET quantity = EXCLUDED.quantity, instructions = COALESCE(EXCLUDED.instructions, cart_items.instructions)`,
    [req.user.id, menuItemId, size, quantity, instructions ?? null],
  );
  res.json(await loadCart(req.user.id));
});

// DELETE /api/cart — empty the cart
router.delete('/', async (req, res) => {
  await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
  res.json(await loadCart(req.user.id));
});

export default router;
