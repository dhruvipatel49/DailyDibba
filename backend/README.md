# DailyDibba — Backend API

Node.js + Express 5 + PostgreSQL (NeonDB-ready). JWT auth, role-based access (customer / cook / delivery / admin), Zod validation.

## Run it

```bash
npm install
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, ADMIN_EMAIL/PASSWORD
npm run migrate             # creates tables (idempotent)
npm run seed                # demo cooks/dishes from your frontend + demo logins + admin
npm run dev                 # http://localhost:5000  →  GET /api/health
```

Demo logins (password `Password@123`): `customer@dailydibba.local`, `rider@dailydibba.local`, `premila@dailydibba.local` (cook; also `simran@`, `bhakti@`, `nutrimeal@`, `lakshmi@`). Admin = `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.
`npm run seed:reset` wipes everything first.

Send the token as `Authorization: Bearer <token>`. Errors are `{ "error": "...", "details": [...] }`.

## How an order flows

```
customer checkout ──► pending ──cook──► preparing ──cook──► ready ──admin assigns partner──► partner accepts
                                                                     ──partner──► out_for_delivery ──► delivered
home pick-up request ──► pending ──admin assigns──► partner accepts ──► out_for_delivery ──► delivered
```
* A cart with dishes from several cooks becomes **one order per cook** (each is its own delivery) — each gets the ₹40 delivery fee.
* Stock (`quantity_left`) is taken at checkout inside a transaction with row locks, and put back on cancel.
* Customers can cancel while `pending`; cooks can reject; admins can override anything.
* COD orders flip to `paid` when delivered. `POST /api/orders/:id/pay` is a **mock** for online payment — swap in Razorpay/Stripe later.
* Every status change / new order / assignment creates an in-app notification (`/api/notifications`). Poll it for now.

## Endpoints

| Role | Method & path | What it does |
|---|---|---|
| public | `POST /api/auth/register` `POST /api/auth/login` | Sign up (customer, cook, delivery) / log in → `{token, user}` |
| any | `GET /api/auth/me` `PATCH /api/auth/me` | Current user |
| public | `GET /api/cooks?veg=&cuisine=&maxPrice=100&q=&lat=&lng=&radiusKm=&sort=` | Cooks page + filters; `distanceKm` when lat/lng given |
| public | `GET /api/cooks/:id` `GET /api/cooks/:id/reviews` | Cook page: profile + menu, reviews |
| public | `GET /api/menu?category=&veg=&maxPrice=&cookId=&q=` `GET /api/menu/categories` | Home page dishes / "Explore our dibbas" |
| customer | `GET /api/wishlist` `POST /api/wishlist/:dishId/toggle` `DELETE /api/wishlist/:dishId` | Heart icon |
| customer | `GET /api/cart` `PUT /api/cart/items` `DELETE /api/cart` | Server cart (size + quantity + instructions) |
| customer | `POST /api/orders/checkout` | Body: `contact`, `address`, `paymentMethod`, optional `items` (else uses the cart) |
| customer | `POST /api/orders/pickup` | "Schedule a Home Pick Up" form |
| customer | `GET /api/orders?scope=active\|history` `GET /api/orders/:id` | My Orders (+ tracking data) |
| customer | `POST /api/orders/:id/cancel` `POST /api/orders/:id/review` `POST /api/orders/:id/pay` | Cancel, rate cook (1–5), mock pay |
| cook | `GET/PATCH /api/cook/profile` | Kitchen profile, open/closed switch |
| cook | `GET/POST /api/cook/menu` `PATCH/DELETE /api/cook/menu/:id` | **Today's Menu**: name, food type, price, quantity, description, image |
| cook | `GET /api/cook/orders?scope=active\|history` `PATCH /api/cook/orders/:id/status` | Order queue: pending / preparing / ready / cancelled |
| cook | `GET /api/cook/stats` | Landing-page numbers |
| delivery | `GET /api/delivery/assignments?status=offered` | Offers from admin |
| delivery | `POST /api/delivery/assignments/:id/accept` `…/decline` | Accept / decline |
| delivery | `GET /api/delivery/deliveries?kind=pickup\|delivery&scope=` | The two partner pages |
| delivery | `PATCH /api/delivery/orders/:id/status` | `out_for_delivery` / `delivered` |
| delivery | `PATCH /api/delivery/availability` | On/off duty |
| admin | `GET /api/admin/stats` `GET /api/admin/users` `PATCH /api/admin/users/:id` | Dashboard, enable/disable accounts |
| admin | `GET /api/admin/cooks?approved=false` `PATCH /api/admin/cooks/:id/approval` | Approve new cooks (hidden from customers until approved) |
| admin | `GET /api/admin/orders` `PATCH /api/admin/orders/:id/status` | All orders, override status |
| admin | `GET /api/admin/delivery-partners` `POST /api/admin/orders/:id/assign` | Offer an order to a partner (they get a notification) |
| all | `GET /api/notifications` `POST /api/notifications/read-all` `PATCH /api/notifications/:id/read` | Notifications |
| cook/admin | `POST /api/uploads/image` (multipart field `image`) | Dish photo → `{url}` (served from `/uploads/...`) |

Roles are enforced in `src/middleware/auth.js` (`requireRole`). Self-registration can't create admins.

## Plugging in the frontend later

| Frontend today | Backend |
|---|---|
| `cooks_list` (`_id`, `cook_name`, `cuisine`, `isVeg`, `rating`, `address`, `image`) | `GET /api/cooks` → `id`, `cookName`, `cuisine` (string) + `cuisines[]`, `isVeg`, `rating`, `address`, `image` |
| `food_list` (`_id`, `name`, `price`, `category`, `image`) | `GET /api/menu` → `id`, `name`, `price`, `category`, `image`, `cookId`, `cookName` |
| `orders_list` / `myOrders` (`status`, `step`, `date`, `totalAmount`, `cookName`, `items[]`) | `GET /api/orders` → same names plus `statusLabel`, `placedAt`, `orderCode` |
| Cart keys like `"33-large"` | `PUT /api/cart/items` with `{menuItemId, size, quantity}`; price rule (small −₹3, large +₹5) lives in `src/constants.js` |
| `CookDetails` filters dishes by matching cuisine text | `GET /api/cooks/:id` returns the cook's own menu — no text matching needed |

Image URLs are relative (`/uploads/...`); prefix with the API origin in the frontend.

Things worth knowing:
* Category spelling is `Punjabi`. The old `Panjabi` is accepted and converted. (In the current frontend, "Punjabi" cooks never show their Punjabi Thali because `"punjabi, north indian".includes("panjabi")` is false — using `GET /api/cooks/:id` fixes that.)
* The pick-up form has no recipient fields yet; the API accepts an optional `recipient {name, phone, address}` for when you add them.
* Promo codes (the cart's promo box) and a real payment gateway are not built.

## Layout

```
db/schema.sql          tables, constraints, indexes
scripts/migrate.js     applies schema.sql
scripts/seed.js        demo data
src/schemas.js         every Zod request schema
src/constants.js       categories, size pricing, status machine, role transitions
src/services/orders.js order queries + status-change rules (the one place statuses change)
src/routes/*.js        one file per module
```
