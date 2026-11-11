import { Router } from 'express';
import { pool, query, withTransaction } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkoutBody, idParam, orderListQuery, pickupBody, reviewBody } from '../schemas.js';
import { config } from '../config.js';
import { unitPrice } from '../constants.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { notify, notifyAdmins } from '../services/notifications.js';
import { canViewOrder, changeOrderStatus, fetchOrderById, fetchOrders, publicOrder } from '../services/orders.js';

const router = Router();
router.use(authenticate);

// ───────────── Checkout ─────────────
// POST /api/orders/checkout
// Body: contact + address + paymentMethod [+ items]. If `items` is omitted the server-side cart is used.
// Creates ONE order per cook (each cook's food is a separate delivery), returns them all.
router.post('/checkout', requireRole('customer'), validate({ body: checkoutBody }), async (req, res) => {
  const b = req.valid.body;

  const orderIds = await withTransaction(async (client) => {
    // 1. Where do the items come from?
    let lines = b.items;
    const usingServerCart = !lines;
    if (usingServerCart) {
      const { rows } = await client.query(
        'SELECT menu_item_id AS "menuItemId", size, quantity, instructions FROM cart_items WHERE user_id = $1',
        [req.user.id],
      );
      lines = rows;
    }
    if (!lines.length) throw badRequest('Your cart is empty');

    // 2. Lock the dishes (sorted by id so two concurrent checkouts can't deadlock) and validate them.
    const ids = [...new Set(lines.map((l) => l.menuItemId))].sort();
    const { rows: dishes } = await client.query(
      `SELECT mi.id, mi.name, mi.price, mi.quantity_left, mi.is_active, mi.cook_id,
              cp.is_approved, cp.is_open, cp.kitchen_name
         FROM menu_items mi JOIN cook_profiles cp ON cp.id = mi.cook_id
        WHERE mi.id = ANY($1::uuid[])
        ORDER BY mi.id
          FOR UPDATE OF mi`,
      [ids],
    );
    const byId = new Map(dishes.map((d) => [d.id, d]));

    const qtyPerDish = new Map();
    for (const l of lines) {
      const d = byId.get(l.menuItemId);
      if (!d || !d.is_active || !d.is_approved) throw badRequest('One of the dishes is no longer available');
      if (!d.is_open) throw badRequest(`${d.kitchen_name} is not taking orders right now`);
      qtyPerDish.set(d.id, (qtyPerDish.get(d.id) ?? 0) + l.quantity);
    }
    for (const [id, qty] of qtyPerDish) {
      const d = byId.get(id);
      if (qty > d.quantity_left) {
        throw badRequest(d.quantity_left === 0 ? `${d.name} is sold out` : `Only ${d.quantity_left} left of ${d.name}`);
      }
    }

    // 3. Group lines by cook → one order each.
    const byCook = new Map();
    for (const l of lines) {
      const d = byId.get(l.menuItemId);
      if (!byCook.has(d.cook_id)) byCook.set(d.cook_id, []);
      byCook.get(d.cook_id).push({ ...l, dish: d });
    }

    const contactName = `${b.contact.firstName} ${b.contact.lastName}`;
    const created = [];
    for (const [cookId, cookLines] of byCook) {
      const subtotal = cookLines.reduce((s, l) => s + unitPrice(l.dish.price, l.size) * l.quantity, 0);
      const deliveryFee = config.deliveryFee;
      const { rows } = await client.query(
        `INSERT INTO orders (type, customer_id, cook_id, subtotal, delivery_fee, total, payment_method,
                             contact_name, contact_email, contact_phone, address, notes)
         VALUES ('meal', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [req.user.id, cookId, subtotal, deliveryFee, subtotal + deliveryFee, b.paymentMethod,
         contactName, b.contact.email, b.contact.phone, JSON.stringify(b.address), b.notes ?? null],
      );
      const orderId = rows[0].id;
      for (const l of cookLines) {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, size, unit_price, quantity, instructions)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [orderId, l.dish.id, l.dish.name, l.size, unitPrice(l.dish.price, l.size), l.quantity, l.instructions ?? null],
        );
      }
      created.push({ orderId, cookId, kitchen: cookLines[0].dish.kitchen_name });
    }

    // 4. Take the stock.
    for (const [id, qty] of qtyPerDish) {
      await client.query('UPDATE menu_items SET quantity_left = quantity_left - $2, updated_at = now() WHERE id = $1', [id, qty]);
    }

    // 5. Clear the server cart (only if that's what we ordered from).
    if (usingServerCart) await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    // 6. Tell the cooks.
    for (const c of created) {
      const { rows } = await client.query(
        `SELECT o.order_code, cp.user_id FROM orders o JOIN cook_profiles cp ON cp.id = o.cook_id WHERE o.id = $1`,
        [c.orderId],
      );
      await notify(client, rows[0].user_id, `New order ${rows[0].order_code}`, 'Open your order queue to accept it', {
        orderId: c.orderId,
      });
    }
    return created.map((c) => c.orderId);
  });

  const orders = await fetchOrders(pool, 'o.id = ANY($1::uuid[])', [orderIds]);
  res.status(201).json({ orders: orders.map(publicOrder) });
});

// ───────────── Home pick-up ─────────────
// POST /api/orders/pickup — "Schedule a Home Pick Up" page. Creates an order of type "pickup".
router.post('/pickup', requireRole('customer'), validate({ body: pickupBody }), async (req, res) => {
  const b = req.valid.body;

  // Compare against "today" in the app's timezone so an early-morning IST booking isn't rejected as yesterday.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: config.tz }); // YYYY-MM-DD
  if (b.date < today) throw badRequest('Pick-up date cannot be in the past');
  if (Number.isNaN(Date.parse(`${b.date}T00:00:00Z`))) throw badRequest('Invalid pick-up date');

  const fee = config.pickupFee;
  const senderName = `${b.sender.firstName} ${b.sender.lastName}`;
  const addressText = [b.pickup.flat, b.pickup.street, b.pickup.landmark].filter(Boolean).join(', ');

  const orderId = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO orders (type, customer_id, subtotal, delivery_fee, total, payment_method,
                           contact_name, contact_phone, address, notes)
       VALUES ('pickup', $1, 0, $2, $2, $3, $4, $5, $6, $7) RETURNING id, order_code`,
      [req.user.id, fee, b.paymentMethod, senderName, b.sender.phone,
       JSON.stringify({ street: addressText, zip: b.pickup.pincode }), b.instructions ?? null],
    );
    const o = rows[0];
    await client.query(
      `INSERT INTO order_items (order_id, name, size, unit_price, quantity)
       VALUES ($1, 'DailyDibba Home Pick Up Service', 'regular', GREATEST($2::int, 1), 1)`,
      [o.id, fee],
    );
    await client.query(
      `INSERT INTO pickup_details (order_id, sender_name, sender_phone, pickup_address, landmark, pincode,
                                   recipient_name, recipient_phone, drop_address, pickup_date, time_slot, instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [o.id, senderName, b.sender.phone, `${b.pickup.flat}, ${b.pickup.street}`, b.pickup.landmark ?? null, b.pickup.pincode,
       b.recipient?.name ?? null, b.recipient?.phone ?? null, b.recipient?.address ?? null,
       b.date, b.timeSlot, b.instructions ?? null],
    );
    await notifyAdmins(client, `New pick-up request ${o.order_code}`, `${b.date}, ${b.timeSlot} slot — assign a delivery partner`, {
      orderId: o.id,
    });
    return o.id;
  });

  res.status(201).json({ order: publicOrder(await fetchOrderById(pool, orderId)) });
});

// ───────────── My orders ─────────────
// GET /api/orders?scope=active|history&status=
router.get('/', requireRole('customer'), validate({ query: orderListQuery }), async (req, res) => {
  const f = req.valid.query;
  const params = [req.user.id];
  let where = 'o.customer_id = $1';
  if (f.status) where += ` AND o.status = $${params.push(f.status)}`;
  if (f.scope === 'active') where += ` AND o.status NOT IN ('delivered','cancelled')`;
  if (f.scope === 'history') where += ` AND o.status IN ('delivered','cancelled')`;
  const orders = await fetchOrders(pool, where, params, `ORDER BY o.placed_at DESC LIMIT ${f.limit} OFFSET ${f.offset}`);
  res.json({ orders: orders.map(publicOrder) });
});

// GET /api/orders/:id — owner, the cook, the assigned partner or an admin
router.get('/:id', validate({ params: idParam }), async (req, res) => {
  const order = await fetchOrderById(pool, req.valid.params.id);
  if (!order || !canViewOrder(req.user, order)) throw notFound('Order not found');
  res.json({ order: publicOrder(order) });
});

// POST /api/orders/:id/cancel — customers can cancel until the cook starts preparing
router.post('/:id/cancel', requireRole('customer'), validate({ params: idParam }), async (req, res) => {
  const order = await withTransaction((client) =>
    changeOrderStatus(client, { orderId: req.valid.params.id, newStatus: 'cancelled', actor: req.user }),
  );
  if (!order) throw notFound('Order not found');
  res.json({ order: publicOrder(order) });
});

// POST /api/orders/:id/review — rate the cook once the meal is delivered
router.post('/:id/review', requireRole('customer'), validate({ params: idParam, body: reviewBody }), async (req, res) => {
  const { rating, comment } = req.valid.body;
  const review = await withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT id, customer_id, cook_id, status, type FROM orders WHERE id = $1 FOR UPDATE',
      [req.valid.params.id],
    );
    const o = rows[0];
    if (!o || o.customer_id !== req.user.id) throw notFound('Order not found');
    if (o.type !== 'meal') throw badRequest('Only meal orders can be reviewed');
    if (o.status !== 'delivered') throw badRequest('You can review an order once it has been delivered');

    const ins = await client.query(
      `INSERT INTO reviews (order_id, customer_id, cook_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (order_id) DO NOTHING RETURNING id, rating, comment`,
      [o.id, req.user.id, o.cook_id, rating, comment ?? null],
    );
    if (!ins.rowCount) throw badRequest('You have already reviewed this order');

    // Recompute from scratch so rounding never drifts.
    await client.query(
      `UPDATE cook_profiles cp SET rating_avg = s.avg, rating_count = s.cnt
         FROM (SELECT ROUND(AVG(rating), 1) AS avg, COUNT(*)::int AS cnt FROM reviews WHERE cook_id = $1) s
        WHERE cp.id = $1`,
      [o.cook_id],
    );
    return ins.rows[0];
  });
  res.status(201).json({ review });
});

// POST /api/orders/:id/pay — MOCK payment so the "Proceed to payment" button has something to call.
// Replace the body with a Razorpay/Stripe verification step when you add a real gateway.
router.post('/:id/pay', requireRole('customer'), validate({ params: idParam }), async (req, res) => {
  const { rows } = await query(
    `UPDATE orders SET payment_status = 'paid', updated_at = now()
      WHERE id = $1 AND customer_id = $2 AND payment_method = 'online' AND payment_status = 'pending'
        AND status <> 'cancelled'
      RETURNING id`,
    [req.valid.params.id, req.user.id],
  );
  if (!rows.length) throw badRequest('Nothing to pay for this order');
  res.json({ order: publicOrder(await fetchOrderById(pool, rows[0].id)) });
});

export default router;
