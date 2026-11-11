// All Zod request schemas. Imports only zod + constants so they can be tested in isolation.
import { z } from 'zod';
import { SIZES, TIME_SLOTS, normalizeCategory } from './constants.js';

const trimmed = (min = 1, max = 200) => z.string().trim().min(min).max(max);
const optionalText = (max = 500) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().trim().max(max).optional());
const phone = z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number');
const uuid = z.string().uuid();
const category = z.string().trim().min(1).max(50).transform(normalizeCategory);
const boolish = z.preprocess((v) => (v === 'true' || v === true ? true : v === 'false' || v === false ? false : v), z.boolean());

export const idParam = z.object({ id: uuid });

// ───────────── Auth ─────────────
export const registerBody = z
  .object({
    name: trimmed(2, 100),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    phone: phone.optional(),
    role: z.enum(['customer', 'cook', 'delivery']).default('customer'),
    // cook-only
    kitchenName: trimmed(2, 120).optional(),
    cuisines: z.array(trimmed(1, 50)).max(10).optional(),
    isVeg: z.boolean().optional(),
    address: optionalText(300),
    area: optionalText(100),
    city: optionalText(100),
    // delivery-only
    vehicleType: optionalText(50),
  })
  .superRefine((v, ctx) => {
    if (v.role === 'cook' && !v.kitchenName) {
      ctx.addIssue({ code: 'custom', path: ['kitchenName'], message: 'kitchenName is required for cooks' });
    }
  });

export const loginBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const updateMeBody = z
  .object({ name: trimmed(2, 100).optional(), phone: phone.optional() })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

// ───────────── Public browsing ─────────────
export const listCooksQuery = z.object({
  veg: boolish.optional(),
  cuisine: z.string().trim().max(50).optional(),
  maxPrice: z.coerce.number().int().positive().optional(), // e.g. 100 → "price under ₹100"
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(200).optional(),
  sort: z.enum(['rating', 'distance', 'price']).optional(),
});

export const listMenuQuery = z.object({
  category: z.string().trim().max(50).transform(normalizeCategory).optional(),
  veg: boolish.optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  cookId: uuid.optional(),
  q: z.string().trim().max(100).optional(),
  includeSoldOut: boolish.optional(),
});

// ───────────── Cart ─────────────
export const setCartItemBody = z.object({
  menuItemId: uuid,
  size: z.enum(SIZES).default('regular'),
  quantity: z.number().int().min(0).max(20), // 0 removes the line
  instructions: optionalText(300),
});

// ───────────── Orders ─────────────
const checkoutItem = z.object({
  menuItemId: uuid,
  size: z.enum(SIZES).default('regular'),
  quantity: z.number().int().min(1).max(20),
  instructions: optionalText(300),
});

export const checkoutBody = z.object({
  contact: z.object({
    firstName: trimmed(1, 60),
    lastName: trimmed(1, 60),
    email: z.string().trim().email().max(254),
    phone,
  }),
  address: z.object({
    street: trimmed(2, 200),
    city: trimmed(2, 100),
    state: trimmed(2, 100),
    zip: trimmed(3, 12),
    country: trimmed(2, 60).default('India'),
  }),
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
  notes: optionalText(500),
  // Optional: if omitted, the server-side cart is used.
  items: z.array(checkoutItem).min(1).max(50).optional(),
});

export const pickupBody = z.object({
  sender: z.object({ firstName: trimmed(1, 60), lastName: trimmed(1, 60), phone }),
  pickup: z.object({
    flat: trimmed(1, 150), // "Flat / House No. / Building Name"
    street: trimmed(2, 200), // "Street Address / Area"
    landmark: optionalText(150),
    pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  }),
  // The frontend form doesn't collect these yet; optional so the current form still works.
  recipient: z
    .object({ name: trimmed(1, 100), phone, address: trimmed(5, 300) })
    .optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  timeSlot: z.enum(Object.keys(TIME_SLOTS)),
  instructions: optionalText(500),
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
});

export const reviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: optionalText(1000),
});

export const orderListQuery = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']).optional(),
  scope: z.enum(['active', 'history']).optional(), // active = not delivered/cancelled
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ───────────── Cook module ─────────────
export const cookProfileBody = z
  .object({
    kitchenName: trimmed(2, 120).optional(),
    bio: optionalText(1000),
    cuisines: z.array(trimmed(1, 50)).max(10).optional(),
    isVeg: z.boolean().optional(),
    address: optionalText(300),
    area: optionalText(100),
    city: trimmed(2, 100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    imageUrl: optionalText(500),
    isOpen: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

// "Today's Menu" form: photo, food type, quantity, dish name, price, short description
export const menuItemBody = z.object({
  name: trimmed(2, 120),
  category,
  price: z.number().int().min(1).max(5000),
  quantity: z.number().int().min(0).max(500),
  description: optionalText(300),
  imageUrl: optionalText(500),
  isVeg: z.boolean().optional(),
});

export const menuItemPatchBody = menuItemBody
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const cookOrderStatusBody = z.object({ status: z.enum(['pending', 'preparing', 'ready', 'cancelled']) });

// ───────────── Delivery module ─────────────
export const deliveryStatusBody = z.object({ status: z.enum(['out_for_delivery', 'delivered']) });
export const availabilityBody = z.object({ isAvailable: z.boolean() });
export const assignmentListQuery = z.object({
  status: z.enum(['offered', 'accepted', 'declined', 'cancelled']).optional(),
});
export const deliveriesQuery = z.object({
  kind: z.enum(['delivery', 'pickup']).optional(), // frontend "delivery page" vs "pickup page"
  scope: z.enum(['active', 'history']).default('active'),
});

// ───────────── Admin ─────────────
export const adminUsersQuery = z.object({
  role: z.enum(['customer', 'cook', 'delivery', 'admin']).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export const adminUserPatchBody = z.object({ isActive: z.boolean() });
export const adminCooksQuery = z.object({ approved: boolish.optional() });
export const adminCookApprovalBody = z.object({ approved: z.boolean() });
export const adminOrdersQuery = orderListQuery.extend({ type: z.enum(['meal', 'pickup']).optional() });
export const adminOrderStatusBody = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
});
export const assignBody = z.object({ partnerId: uuid });
