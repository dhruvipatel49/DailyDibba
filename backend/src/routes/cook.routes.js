// Cook module: profile, "Today's Menu", order queue, past orders.
import { Router } from 'express';
import { pool, query, withTransaction } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cookOrderStatusBody, cookProfileBody, idParam, menuItemBody, menuItemPatchBody, orderListQuery } from '../schemas.js';
import { notFound } from '../utils/httpError.js';
import { changeOrderStatus, fetchOrders, publicOrder } from '../services/orders.js';

const router = Router();
router.use(authenticate, requireRole('cook'));

/** Every cook route needs the cook_profiles row for the logged-in user. */
router.use(async (req, res, next) => {
  const { rows } = await query('SELECT id, is_approved FROM cook_profiles WHERE user_id = $1', [req.user.id]);
  if (!rows[0]) throw notFound('Cook profile not found');
  req.cook = { id: rows[0].id, isApproved: rows[0].is_approved };
  next();
});

const PROFILE_COLS = `id, kitchen_name AS "kitchenName", bio, cuisines, is_veg AS "isVeg", address_line AS address,
  area, city, latitude, longitude, image_url AS "imageUrl", rating_avg AS rating, rating_count AS "ratingCount",
  is_approved AS "isApproved", is_open AS "isOpen"`;

const ITEM_COLS = `id, name, description, category, price, image_url AS "imageUrl", is_veg AS "isVeg",
  quantity_left AS quantity, is_active AS "isActive", updated_at AS "updatedAt"`;

// GET /api/cook/profile
router.get('/profile', async (req, res) => {
  const { rows } = await query(`SELECT ${PROFILE_COLS} FROM cook_profiles WHERE id = $1`, [req.cook.id]);
  res.json({ profile: rows[0] });
});

// PATCH /api/cook/profile
router.patch('/profile', validate({ body: cookProfileBody }), async (req, res) => {
  const b = req.valid.body;
  const { rows } = await query(
    `UPDATE cook_profiles SET
        kitchen_name = COALESCE($2, kitchen_name), bio = COALESCE($3, bio), cuisines = COALESCE($4, cuisines),
        is_veg = COALESCE($5, is_veg), address_line = COALESCE($6, address_line), area = COALESCE($7, area),
        city = COALESCE($8, city), latitude = COALESCE($9, latitude), longitude = COALESCE($10, longitude),
        image_url = COALESCE($11, image_url), is_open = COALESCE($12, is_open)
      WHERE id = $1 RETURNING ${PROFILE_COLS}`,
    [req.cook.id, b.kitchenName ?? null, b.bio ?? null, b.cuisines ?? null, b.isVeg ?? null, b.address ?? null,
     b.area ?? null, b.city ?? null, b.latitude ?? null, b.longitude ?? null, b.imageUrl ?? null, b.isOpen ?? null],
  );
  res.json({ profile: rows[0] });
});

// ───────────── Today's Menu ─────────────
// GET /api/cook/menu
router.get('/menu', async (req, res) => {
  const { rows } = await query(
    `SELECT ${ITEM_COLS} FROM menu_items WHERE cook_id = $1 AND is_active ORDER BY created_at DESC`,
    [req.cook.id],
  );
  res.json({ items: rows });
});

// POST /api/cook/menu — photo (imageUrl from /api/uploads/image), food type, quantity, dish name, price, description
router.post('/menu', validate({ body: menuItemBody }), async (req, res) => {
  const b = req.valid.body;
  const { rows } = await query(
    `INSERT INTO menu_items (cook_id, name, description, category, price, image_url, is_veg, quantity_left)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, (SELECT is_veg FROM cook_profiles WHERE id = $1)), $8)
     RETURNING ${ITEM_COLS}`,
    [req.cook.id, b.name, b.description ?? null, b.category, b.price, b.imageUrl ?? null, b.isVeg ?? null, b.quantity],
  );
  res.status(201).json({ item: rows[0] });
});

// PATCH /api/cook/menu/:id — edit, restock (quantity) or hide (isActive:false)
router.patch('/menu/:id', validate({ params: idParam, body: menuItemPatchBody }), async (req, res) => {
  const b = req.valid.body;
  const { rows } = await query(
    `UPDATE menu_items SET
        name = COALESCE($3, name), description = COALESCE($4, description), category = COALESCE($5, category),
        price = COALESCE($6, price), image_url = COALESCE($7, image_url), is_veg = COALESCE($8, is_veg),
        quantity_left = COALESCE($9, quantity_left), is_active = COALESCE($10, is_active), updated_at = now()
      WHERE id = $1 AND cook_id = $2 RETURNING ${ITEM_COLS}`,
    [req.valid.params.id, req.cook.id, b.name ?? null, b.description ?? null, b.category ?? null, b.price ?? null,
     b.imageUrl ?? null, b.isVeg ?? null, b.quantity ?? null, b.isActive ?? null],
  );
  if (!rows[0]) throw notFound('Dish not found');
  res.json({ item: rows[0] });
});

// DELETE /api/cook/menu/:id — soft delete (past orders keep their snapshot)
router.delete('/menu/:id', validate({ params: idParam }), async (req, res) => {
  const { rowCount } = await query(
    'UPDATE menu_items SET is_active = false, updated_at = now() WHERE id = $1 AND cook_id = $2',
    [req.valid.params.id, req.cook.id],
  );
  if (!rowCount) throw notFound('Dish not found');
  res.status(204).end();
});

// ───────────── Orders ─────────────
// GET /api/cook/orders?scope=active|history&status=   (landing page "past orders received" = scope=history)
router.get('/orders', validate({ query: orderListQuery }), async (req, res) => {
  const f = req.valid.query;
  const params = [req.cook.id];
  let where = 'o.cook_id = $1';
  if (f.status) where += ` AND o.status = $${params.push(f.status)}`;
  if (f.scope === 'active') where += ` AND o.status NOT IN ('delivered','cancelled')`;
  if (f.scope === 'history') where += ` AND o.status IN ('delivered','cancelled')`;
  // Active queue: oldest first (first come, first cooked). History: newest first.
  const tail = f.scope === 'active' ? 'ORDER BY o.placed_at ASC' : 'ORDER BY o.placed_at DESC';
  const orders = await fetchOrders(pool, where, params, `${tail} LIMIT ${f.limit} OFFSET ${f.offset}`);
  res.json({ orders: orders.map(publicOrder) });
});

// PATCH /api/cook/orders/:id/status — mark pending / preparing / ready, or reject (cancelled)
router.patch('/orders/:id/status', validate({ params: idParam, body: cookOrderStatusBody }), async (req, res) => {
  const order = await withTransaction((client) =>
    changeOrderStatus(client, { orderId: req.valid.params.id, newStatus: req.valid.body.status, actor: req.user }),
  );
  if (!order) throw notFound('Order not found');
  res.json({ order: publicOrder(order) });
});

// GET /api/cook/stats — numbers for the landing page
router.get('/stats', async (req, res) => {
  const { rows } = await query(
    `SELECT COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled'))::int AS "activeOrders",
            COUNT(*) FILTER (WHERE status = 'delivered')::int AS "deliveredOrders",
            COALESCE(SUM(subtotal) FILTER (WHERE status = 'delivered'), 0)::int AS earnings,
            COUNT(*) FILTER (WHERE status = 'delivered' AND delivered_at::date = CURRENT_DATE)::int AS "deliveredToday"
       FROM orders WHERE cook_id = $1`,
    [req.cook.id],
  );
  res.json({ stats: rows[0] });
});

export default router;
