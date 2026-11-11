// Admin module: users, cook approval, all orders, assign delivery partners, stats.
import { Router } from 'express';
import { pool, query, withTransaction } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminCookApprovalBody, adminCooksQuery, adminOrderStatusBody, adminOrdersQuery, adminUserPatchBody,
  adminUsersQuery, assignBody, idParam,
} from '../schemas.js';
import { TERMINAL_STATUSES } from '../constants.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { notify } from '../services/notifications.js';
import { changeOrderStatus, fetchOrders, publicOrder } from '../services/orders.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [orders, users, cooks] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE status NOT IN ('delivered','cancelled'))::int AS active,
                  COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
                  COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
                  COUNT(*) FILTER (WHERE type = 'pickup')::int AS pickups,
                  COALESCE(SUM(total) FILTER (WHERE status = 'delivered'), 0)::int AS revenue,
                  COUNT(*) FILTER (WHERE placed_at::date = CURRENT_DATE)::int AS "ordersToday"
             FROM orders`),
    query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`),
    query(`SELECT COUNT(*) FILTER (WHERE is_approved)::int AS approved,
                  COUNT(*) FILTER (WHERE NOT is_approved)::int AS "pendingApproval" FROM cook_profiles`),
  ]);
  res.json({
    orders: orders.rows[0],
    usersByRole: Object.fromEntries(users.rows.map((r) => [r.role, r.count])),
    cooks: cooks.rows[0],
  });
});

// GET /api/admin/users?role=&q=
router.get('/users', validate({ query: adminUsersQuery }), async (req, res) => {
  const f = req.valid.query;
  const params = [];
  const where = ['TRUE'];
  if (f.role) where.push(`role = $${params.push(f.role)}`);
  if (f.q) {
    const like = `$${params.push(`%${f.q}%`)}`;
    where.push(`(name ILIKE ${like} OR email ILIKE ${like})`);
  }
  const { rows } = await query(
    `SELECT id, name, email, phone, role, is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ${f.limit} OFFSET ${f.offset}`,
    params,
  );
  res.json({ users: rows });
});

// PATCH /api/admin/users/:id — activate / deactivate an account (admins can't lock themselves out)
router.patch('/users/:id', validate({ params: idParam, body: adminUserPatchBody }), async (req, res) => {
  if (req.valid.params.id === req.user.id) throw badRequest("You can't change your own status");
  const { rows } = await query(
    'UPDATE users SET is_active = $2 WHERE id = $1 RETURNING id, name, email, role, is_active AS "isActive"',
    [req.valid.params.id, req.valid.body.isActive],
  );
  if (!rows[0]) throw notFound('User not found');
  res.json({ user: rows[0] });
});

// GET /api/admin/cooks?approved=false — approval queue
router.get('/cooks', validate({ query: adminCooksQuery }), async (req, res) => {
  const { approved } = req.valid.query;
  const { rows } = await query(
    `SELECT cp.id, cp.kitchen_name AS "kitchenName", cp.cuisines, cp.is_veg AS "isVeg", cp.area, cp.city,
            cp.is_approved AS "isApproved", cp.rating_avg AS rating, cp.rating_count AS "ratingCount",
            u.id AS "userId", u.name AS "ownerName", u.email, u.phone, u.is_active AS "isActive"
       FROM cook_profiles cp JOIN users u ON u.id = cp.user_id
      WHERE ($1::boolean IS NULL OR cp.is_approved = $1)
      ORDER BY cp.created_at DESC`,
    [approved ?? null],
  );
  res.json({ cooks: rows });
});

// PATCH /api/admin/cooks/:id/approval
router.patch('/cooks/:id/approval', validate({ params: idParam, body: adminCookApprovalBody }), async (req, res) => {
  const { approved } = req.valid.body;
  const { rows } = await query(
    'UPDATE cook_profiles SET is_approved = $2 WHERE id = $1 RETURNING id, user_id, kitchen_name, is_approved',
    [req.valid.params.id, approved],
  );
  const cook = rows[0];
  if (!cook) throw notFound('Cook not found');
  await notify(pool, cook.user_id, approved ? 'Your kitchen is approved 🎉' : 'Your kitchen was un-approved',
    approved ? 'Customers can now see and order from you.' : null);
  res.json({ cook: { id: cook.id, kitchenName: cook.kitchen_name, isApproved: cook.is_approved } });
});

// GET /api/admin/delivery-partners — who can I assign?
router.get('/delivery-partners', async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.phone, pp.vehicle_type AS "vehicleType", COALESCE(pp.is_available, true) AS "isAvailable",
            (SELECT COUNT(*)::int FROM orders o WHERE o.delivery_partner_id = u.id
                AND o.status NOT IN ('delivered','cancelled')) AS "activeDeliveries"
       FROM users u LEFT JOIN partner_profiles pp ON pp.user_id = u.id
      WHERE u.role = 'delivery' AND u.is_active
      ORDER BY "activeDeliveries", u.name`,
  );
  res.json({ partners: rows });
});

// GET /api/admin/orders?type=&status=&scope=
router.get('/orders', validate({ query: adminOrdersQuery }), async (req, res) => {
  const f = req.valid.query;
  const params = [];
  const where = ['TRUE'];
  if (f.type) where.push(`o.type = $${params.push(f.type)}`);
  if (f.status) where.push(`o.status = $${params.push(f.status)}`);
  if (f.scope === 'active') where.push(`o.status NOT IN ('delivered','cancelled')`);
  if (f.scope === 'history') where.push(`o.status IN ('delivered','cancelled')`);
  const orders = await fetchOrders(pool, where.join(' AND '), params, `ORDER BY o.placed_at DESC LIMIT ${f.limit} OFFSET ${f.offset}`);
  res.json({ orders: orders.map(publicOrder) });
});

// PATCH /api/admin/orders/:id/status — admin override
router.patch('/orders/:id/status', validate({ params: idParam, body: adminOrderStatusBody }), async (req, res) => {
  const order = await withTransaction((client) =>
    changeOrderStatus(client, { orderId: req.valid.params.id, newStatus: req.valid.body.status, actor: req.user }),
  );
  if (!order) throw notFound('Order not found');
  res.json({ order: publicOrder(order) });
});

// POST /api/admin/orders/:id/assign { partnerId } — offer the order to a delivery partner (they accept/decline)
router.post('/orders/:id/assign', validate({ params: idParam, body: assignBody }), async (req, res) => {
  const { partnerId } = req.valid.body;
  const assignment = await withTransaction(async (client) => {
    const o = (await client.query('SELECT id, order_code, status, type FROM orders WHERE id = $1 FOR UPDATE', [req.valid.params.id])).rows[0];
    if (!o) throw notFound('Order not found');
    if (TERMINAL_STATUSES.includes(o.status)) throw badRequest(`Order is already ${o.status}`);

    const partner = (await client.query(`SELECT id, name FROM users WHERE id = $1 AND role = 'delivery' AND is_active`, [partnerId])).rows[0];
    if (!partner) throw badRequest('That user is not an active delivery partner');

    // Withdraw any previous live offer/assignment, and free the order from the old partner.
    await client.query(
      `UPDATE delivery_assignments SET status = 'cancelled', responded_at = now()
        WHERE order_id = $1 AND status IN ('offered','accepted')`,
      [o.id],
    );
    await client.query('UPDATE orders SET delivery_partner_id = NULL, updated_at = now() WHERE id = $1', [o.id]);

    const { rows } = await client.query(
      `INSERT INTO delivery_assignments (order_id, partner_id) VALUES ($1, $2) RETURNING id, status, created_at AS "createdAt"`,
      [o.id, partnerId],
    );
    await notify(client, partnerId,
      o.type === 'pickup' ? `New pick-up request ${o.order_code}` : `New delivery ${o.order_code}`,
      'Open your assignments to accept or decline',
      { orderId: o.id, orderCode: o.order_code, assignmentId: rows[0].id });
    return { ...rows[0], orderId: o.id, partnerId, partnerName: partner.name };
  });
  res.status(201).json({ assignment });
});

export default router;
