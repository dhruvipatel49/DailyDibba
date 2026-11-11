// Delivery partner module: assignment offers (accept/decline), pickup + delivery pages, availability.
import { Router } from 'express';
import { pool, query, withTransaction } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { assignmentListQuery, availabilityBody, deliveriesQuery, deliveryStatusBody, idParam } from '../schemas.js';
import { TERMINAL_STATUSES } from '../constants.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { notify, notifyAdmins } from '../services/notifications.js';
import { changeOrderStatus, fetchOrders, publicOrder } from '../services/orders.js';

const router = Router();
router.use(authenticate, requireRole('delivery'));

// GET /api/delivery/assignments?status=offered — "notifications" with accept / decline buttons
router.get('/assignments', validate({ query: assignmentListQuery }), async (req, res) => {
  const params = [req.user.id];
  let where = 'da.partner_id = $1';
  if (req.valid.query.status) where += ` AND da.status = $${params.push(req.valid.query.status)}`;
  const { rows } = await query(
    `SELECT da.id, da.status, da.created_at AS "offeredAt", da.responded_at AS "respondedAt",
            o.id AS "orderId", o.order_code AS "orderCode", o.type, o.total, o.status AS "orderStatus",
            o.address, o.contact_name AS "contactName", o.contact_phone AS "contactPhone",
            cp.kitchen_name AS "cookName", cp.address_line AS "cookAddress", cp.area AS "cookArea",
            pd.pickup_date AS "pickupDate", pd.time_slot AS "timeSlot", pd.pickup_address AS "pickupAddress",
            pd.drop_address AS "dropAddress"
       FROM delivery_assignments da
       JOIN orders o ON o.id = da.order_id
       LEFT JOIN cook_profiles cp ON cp.id = o.cook_id
       LEFT JOIN pickup_details pd ON pd.order_id = o.id
      WHERE ${where}
      ORDER BY da.created_at DESC LIMIT 100`,
    params,
  );
  res.json({ assignments: rows });
});

async function respond(req, res, accept) {
  const result = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT da.id, da.status, da.order_id, o.status AS order_status, o.order_code, o.customer_id
         FROM delivery_assignments da JOIN orders o ON o.id = da.order_id
        WHERE da.id = $1 AND da.partner_id = $2 FOR UPDATE OF da, o`,
      [req.valid.params.id, req.user.id],
    );
    const a = rows[0];
    if (!a) throw notFound('Assignment not found');
    if (a.status !== 'offered') throw badRequest(`This assignment was already ${a.status}`);
    if (TERMINAL_STATUSES.includes(a.order_status)) throw badRequest(`Order is already ${a.order_status}`);

    await client.query(`UPDATE delivery_assignments SET status = $2, responded_at = now() WHERE id = $1`, [
      a.id,
      accept ? 'accepted' : 'declined',
    ]);
    const data = { orderId: a.order_id, orderCode: a.order_code, assignmentId: a.id };
    if (accept) {
      await client.query('UPDATE orders SET delivery_partner_id = $2, updated_at = now() WHERE id = $1', [a.order_id, req.user.id]);
      await notify(client, a.customer_id, `A delivery partner is assigned to ${a.order_code}`, req.user.name, data);
      await notifyAdmins(client, `${req.user.name} accepted ${a.order_code}`, null, data);
    } else {
      await notifyAdmins(client, `${req.user.name} declined ${a.order_code}`, 'Please assign another partner', data);
    }
    return { id: a.id, status: accept ? 'accepted' : 'declined' };
  });
  res.json({ assignment: result });
}

// POST /api/delivery/assignments/:id/accept | /decline
router.post('/assignments/:id/accept', validate({ params: idParam }), (req, res) => respond(req, res, true));
router.post('/assignments/:id/decline', validate({ params: idParam }), (req, res) => respond(req, res, false));

// GET /api/delivery/deliveries?kind=delivery|pickup&scope=active|history
//   kind=pickup   → the "Pickup page" (home pick-up orders)
//   kind=delivery → the "Delivery page" (cook → customer meals)
router.get('/deliveries', validate({ query: deliveriesQuery }), async (req, res) => {
  const { kind, scope } = req.valid.query;
  const params = [req.user.id];
  let where = 'o.delivery_partner_id = $1';
  if (kind === 'pickup') where += ` AND o.type = 'pickup'`;
  if (kind === 'delivery') where += ` AND o.type = 'meal'`;
  where += scope === 'active' ? ` AND o.status NOT IN ('delivered','cancelled')` : ` AND o.status IN ('delivered','cancelled')`;
  const orders = await fetchOrders(pool, where, params, 'ORDER BY o.placed_at DESC LIMIT 100');
  res.json({ orders: orders.map(publicOrder) });
});

// PATCH /api/delivery/orders/:id/status — picked up (out_for_delivery) / delivered
router.patch('/orders/:id/status', validate({ params: idParam, body: deliveryStatusBody }), async (req, res) => {
  const order = await withTransaction((client) =>
    changeOrderStatus(client, { orderId: req.valid.params.id, newStatus: req.valid.body.status, actor: req.user }),
  );
  if (!order) throw notFound('Order not found');
  res.json({ order: publicOrder(order) });
});

// PATCH /api/delivery/availability
router.patch('/availability', validate({ body: availabilityBody }), async (req, res) => {
  const { rows } = await query(
    `INSERT INTO partner_profiles (user_id, is_available) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET is_available = EXCLUDED.is_available
     RETURNING is_available AS "isAvailable"`,
    [req.user.id, req.valid.body.isAvailable],
  );
  res.json(rows[0]);
});

export default router;
