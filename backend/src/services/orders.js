import { STATUS_LABEL, STATUS_STEP, TERMINAL_STATUSES, TRANSITIONS } from '../constants.js';
import { badRequest, forbidden } from '../utils/httpError.js';
import { notify, notifyAdmins } from './notifications.js';

/**
 * Base SELECT for orders with items, cook name and (for pickups) the pickup details.
 * Append a WHERE / ORDER BY / LIMIT yourself.
 */
const ORDER_SELECT = `
  SELECT o.id,
         o.order_code        AS "orderCode",
         o.type,
         o.status,
         o.subtotal,
         o.delivery_fee      AS "deliveryFee",
         o.total,
         o.payment_method    AS "paymentMethod",
         o.payment_status    AS "paymentStatus",
         o.contact_name      AS "contactName",
         o.contact_email     AS "contactEmail",
         o.contact_phone     AS "contactPhone",
         o.address,
         o.notes,
         o.placed_at         AS "placedAt",
         o.delivered_at      AS "deliveredAt",
         o.customer_id       AS "customerId",
         o.cook_id           AS "cookId",
         o.delivery_partner_id AS "deliveryPartnerId",
         COALESCE(cp.kitchen_name, 'DailyDibba Partner') AS "cookName",
         cp.user_id          AS "cookUserId",
         pu.name             AS "deliveryPartnerName",
         COALESCE((
           SELECT json_agg(json_build_object(
                    'id', oi.id, 'name', oi.name, 'size', oi.size,
                    'quantity', oi.quantity, 'price', oi.unit_price,
                    'instructions', oi.instructions) ORDER BY oi.name)
             FROM order_items oi WHERE oi.order_id = o.id), '[]'::json) AS items,
         (SELECT row_to_json(x) FROM (
             SELECT pd.sender_name AS "senderName", pd.sender_phone AS "senderPhone",
                    pd.pickup_address AS "pickupAddress", pd.landmark, pd.pincode,
                    pd.recipient_name AS "recipientName", pd.recipient_phone AS "recipientPhone",
                    pd.drop_address AS "dropAddress", pd.pickup_date AS "pickupDate",
                    pd.time_slot AS "timeSlot", pd.instructions
               FROM pickup_details pd WHERE pd.order_id = o.id) x) AS pickup
    FROM orders o
    LEFT JOIN cook_profiles cp ON cp.id = o.cook_id
    LEFT JOIN users pu ON pu.id = o.delivery_partner_id`;

/** Add the fields the MyOrders page renders (label + progress step). */
export function decorateOrder(o) {
  return {
    ...o,
    statusLabel: STATUS_LABEL[o.status],
    step: STATUS_STEP[o.status],
    totalAmount: o.total, // alias: the frontend's order objects use `totalAmount`
  };
}

/** Fetch orders with a custom WHERE clause (use $1.. params). `db` can be the pool or a client. */
export async function fetchOrders(db, where = 'TRUE', params = [], tail = 'ORDER BY o.placed_at DESC') {
  const { rows } = await db.query(`${ORDER_SELECT} WHERE ${where} ${tail}`, params);
  return rows.map(decorateOrder);
}

export async function fetchOrderById(db, id) {
  const rows = await fetchOrders(db, 'o.id = $1', [id], '');
  return rows[0] ?? null;
}

/** Can this user see this order? */
export function canViewOrder(user, order) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer') return order.customerId === user.id;
  if (user.role === 'cook') return order.cookUserId === user.id;
  if (user.role === 'delivery') return order.deliveryPartnerId === user.id;
  return false;
}

/** Strip internal-only fields before sending to a client. */
export function publicOrder(o) {
  const { cookUserId, ...rest } = o; // eslint-disable-line no-unused-vars
  return rest;
}

/**
 * Move an order to a new status, enforcing the role's allowed transitions.
 * MUST be called inside a transaction with the order row locked (we lock it here).
 * Returns the updated order.
 */
export async function changeOrderStatus(client, { orderId, newStatus, actor }) {
  const { rows } = await client.query(
    `SELECT o.id, o.order_code, o.type, o.status, o.customer_id, o.cook_id, o.delivery_partner_id,
            o.payment_method, cp.user_id AS cook_user_id
       FROM orders o LEFT JOIN cook_profiles cp ON cp.id = o.cook_id
      WHERE o.id = $1 FOR UPDATE OF o`,
    [orderId],
  );
  const order = rows[0];
  if (!order) return null;

  // Ownership checks
  if (actor.role === 'customer' && order.customer_id !== actor.id) return null;
  if (actor.role === 'cook' && order.cook_user_id !== actor.id) return null;
  if (actor.role === 'delivery' && order.delivery_partner_id !== actor.id) {
    throw forbidden('This order is not assigned to you');
  }

  if (order.status === newStatus) return fetchOrderById(client, orderId); // idempotent
  if (TERMINAL_STATUSES.includes(order.status)) {
    throw badRequest(`Order is already ${order.status} and can't be changed`);
  }

  if (actor.role !== 'admin') {
    const allowed = TRANSITIONS[actor.role]?.[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw badRequest(`As ${actor.role} you can't move an order from "${order.status}" to "${newStatus}"`);
    }
    // A delivery partner may only collect straight from "pending" for home pick-up orders.
    if (actor.role === 'delivery' && order.status === 'pending' && order.type !== 'pickup') {
      throw badRequest('Meal orders must be marked ready by the cook before pickup');
    }
  }
  // Pickup orders have no cook, so only collecting / delivering / cancelling makes sense.
  if (order.type === 'pickup' && ['preparing', 'ready'].includes(newStatus)) {
    throw badRequest('Pick-up orders have no cooking stages');
  }

  await client.query(
    `UPDATE orders
        SET status = $2::text,
            updated_at = now(),
            delivered_at = CASE WHEN $2::text = 'delivered' THEN now() ELSE delivered_at END,
            payment_status = CASE WHEN $2::text = 'delivered' AND payment_method = 'cod' THEN 'paid' ELSE payment_status END
      WHERE id = $1`,
    [orderId, newStatus],
  );

  // Cancelling puts the dishes back on the menu.
  if (newStatus === 'cancelled' && order.type === 'meal') {
    await client.query(
      `UPDATE menu_items mi SET quantity_left = mi.quantity_left + s.qty, updated_at = now()
         FROM (SELECT menu_item_id, SUM(quantity)::int AS qty FROM order_items
                WHERE order_id = $1 AND menu_item_id IS NOT NULL GROUP BY menu_item_id) s
        WHERE mi.id = s.menu_item_id`,
      [orderId],
    );
  }
  if (newStatus === 'cancelled') {
    await client.query(
      `UPDATE delivery_assignments SET status = 'cancelled', responded_at = now()
        WHERE order_id = $1 AND status IN ('offered','accepted')`,
      [orderId],
    );
  }

  // Notifications
  const data = { orderId, orderCode: order.order_code, status: newStatus };
  if (actor.id !== order.customer_id) {
    await notify(client, order.customer_id, `Order ${order.order_code}: ${STATUS_LABEL[newStatus]}`, null, data);
  }
  if (newStatus === 'cancelled') {
    if (order.cook_user_id && actor.id !== order.cook_user_id) {
      await notify(client, order.cook_user_id, `Order ${order.order_code} was cancelled`, null, data);
    }
    if (order.delivery_partner_id && actor.id !== order.delivery_partner_id) {
      await notify(client, order.delivery_partner_id, `Order ${order.order_code} was cancelled`, null, data);
    }
    if (actor.role !== 'admin') await notifyAdmins(client, `Order ${order.order_code} was cancelled`, null, data);
  }
  if (newStatus === 'ready' && order.type === 'meal') {
    await notifyAdmins(client, `Order ${order.order_code} is ready for pickup`, 'Assign a delivery partner', data);
  }

  return fetchOrderById(client, orderId);
}

