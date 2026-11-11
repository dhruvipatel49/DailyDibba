// Shared business constants (no env / DB imports so they can be unit-tested alone).

export const ROLES = ['customer', 'cook', 'delivery', 'admin'];

// Canonical food categories. "Panjabi" (spelling used in the frontend's assets.js) is accepted as an alias.
export const CATEGORIES = ['Gujarati', 'Punjabi', 'South Indian', 'Jain', 'Diet Food'];
export const CATEGORY_ALIASES = { panjabi: 'Punjabi' };

export function normalizeCategory(value) {
  const v = String(value).trim();
  const alias = CATEGORY_ALIASES[v.toLowerCase()];
  if (alias) return alias;
  return CATEGORIES.find((c) => c.toLowerCase() === v.toLowerCase()) ?? v;
}

// Same rule as the frontend: small = -₹3, large = +₹5.
export const SIZES = ['small', 'regular', 'large'];
export const SIZE_ADJUSTMENT = { small: -3, regular: 0, large: 5 };
export function unitPrice(basePrice, size) {
  return Math.max(1, basePrice + SIZE_ADJUSTMENT[size]);
}

export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
export const TERMINAL_STATUSES = ['delivered', 'cancelled'];

// Labels + progress step the MyOrders page expects (it shows "Preparing" / "Delivered" and a step number).
export const STATUS_LABEL = {
  pending: 'Order Placed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
export const STATUS_STEP = { pending: 1, preparing: 2, ready: 2, out_for_delivery: 3, delivered: 4, cancelled: 0 };

export const TIME_SLOTS = {
  morning: 'Morning (9:00 AM - 11:30 AM)',
  afternoon: 'Afternoon (12:00 PM - 2:30 PM)',
  evening: 'Evening (6:00 PM - 8:30 PM)',
};

// Which status changes each role may make. Keys are the *current* status.
// For delivery partners, pending -> out_for_delivery is only valid for pickup orders (checked in the service).
export const TRANSITIONS = {
  customer: { pending: ['cancelled'] },
  cook: {
    pending: ['preparing', 'cancelled'],
    preparing: ['ready', 'pending'],
    ready: ['preparing'],
  },
  delivery: {
    pending: ['out_for_delivery'],
    ready: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
  },
};
