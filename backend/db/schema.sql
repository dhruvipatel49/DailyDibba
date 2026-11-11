-- DailyDibba schema (PostgreSQL 13+, works on NeonDB). Idempotent: safe to re-run.
-- Money is stored as whole rupees (integer), matching the frontend.

CREATE SEQUENCE IF NOT EXISTS order_code_seq START 1000;

-- ───────────── Users & role profiles ─────────────
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL,
  password_hash text NOT NULL,
  phone         text,
  role          text NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer','cook','delivery','admin')),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE TABLE IF NOT EXISTS cook_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  kitchen_name text NOT NULL,
  bio          text,
  cuisines     text[] NOT NULL DEFAULT '{}',
  is_veg       boolean NOT NULL DEFAULT true,      -- "Pure Veg" kitchen
  address_line text,
  area         text,
  city         text NOT NULL DEFAULT 'Ahmedabad',
  latitude     double precision,
  longitude    double precision,
  image_url    text,
  rating_avg   numeric(2,1) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  is_approved  boolean NOT NULL DEFAULT false,     -- admin must approve before customers see the cook
  is_open      boolean NOT NULL DEFAULT true,      -- cook can pause taking orders
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cook_profiles_city_idx ON cook_profiles (city) WHERE is_approved;

CREATE TABLE IF NOT EXISTS partner_profiles (
  user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type text,
  is_available boolean NOT NULL DEFAULT true
);

-- ───────────── Menu ─────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cook_id       uuid NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  category      text NOT NULL,                      -- Gujarati / Punjabi / South Indian / Jain / Diet Food
  price         integer NOT NULL CHECK (price > 0), -- regular-size price in ₹
  image_url     text,
  is_veg        boolean NOT NULL DEFAULT true,
  quantity_left integer NOT NULL DEFAULT 0 CHECK (quantity_left >= 0),
  is_active     boolean NOT NULL DEFAULT true,      -- soft delete
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS menu_items_cook_idx ON menu_items (cook_id);
CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items (category) WHERE is_active;

-- ───────────── Wishlist & cart ─────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, menu_item_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  size         text NOT NULL DEFAULT 'regular' CHECK (size IN ('small','regular','large')),
  quantity     integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  instructions text,
  UNIQUE (user_id, menu_item_id, size)
);

-- ───────────── Orders ─────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code          text NOT NULL UNIQUE DEFAULT ('ORD-' || nextval('order_code_seq')),
  type                text NOT NULL DEFAULT 'meal' CHECK (type IN ('meal','pickup')),
  customer_id         uuid NOT NULL REFERENCES users(id),
  cook_id             uuid REFERENCES cook_profiles(id),      -- null for pickup orders
  delivery_partner_id uuid REFERENCES users(id),
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','preparing','ready','out_for_delivery','delivered','cancelled')),
  subtotal            integer NOT NULL CHECK (subtotal >= 0),
  delivery_fee        integer NOT NULL CHECK (delivery_fee >= 0),
  total               integer NOT NULL CHECK (total >= 0),
  payment_method      text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod','online')),
  payment_status      text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid')),
  contact_name        text NOT NULL,
  contact_email       text,
  contact_phone       text NOT NULL,
  address             jsonb NOT NULL,                          -- snapshot of delivery / pickup address
  notes               text,
  placed_at           timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  delivered_at        timestamptz,
  CHECK (type <> 'meal' OR cook_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS orders_cook_idx     ON orders (cook_id, status, placed_at DESC);
CREATE INDEX IF NOT EXISTS orders_partner_idx  ON orders (delivery_partner_id, status);
CREATE INDEX IF NOT EXISTS orders_status_idx   ON orders (status, placed_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name         text NOT NULL,                                  -- snapshot
  size         text NOT NULL DEFAULT 'regular' CHECK (size IN ('small','regular','large')),
  unit_price   integer NOT NULL CHECK (unit_price > 0),         -- snapshot, size adjustment included
  quantity     integer NOT NULL CHECK (quantity > 0),
  instructions text
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

-- Extra details for "Schedule a Home Pick Up" orders (1:1 with orders where type = 'pickup')
CREATE TABLE IF NOT EXISTS pickup_details (
  order_id        uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  sender_name     text NOT NULL,
  sender_phone    text NOT NULL,
  pickup_address  text NOT NULL,
  landmark        text,
  pincode         text NOT NULL,
  recipient_name  text,
  recipient_phone text,
  drop_address    text,
  pickup_date     date NOT NULL,
  time_slot       text NOT NULL CHECK (time_slot IN ('morning','afternoon','evening')),
  instructions    text
);

-- ───────────── Delivery assignments (admin offers, partner accepts / declines) ─────────────
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  partner_id   uuid NOT NULL REFERENCES users(id),
  status       text NOT NULL DEFAULT 'offered'
               CHECK (status IN ('offered','accepted','declined','cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
-- at most one live (offered/accepted) assignment per order
CREATE UNIQUE INDEX IF NOT EXISTS delivery_assignments_live_key
  ON delivery_assignments (order_id) WHERE status IN ('offered','accepted');
CREATE INDEX IF NOT EXISTS delivery_assignments_partner_idx ON delivery_assignments (partner_id, status);

-- ───────────── Reviews ─────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id),
  cook_id     uuid NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_cook_idx ON reviews (cook_id, created_at DESC);

-- ───────────── In-app notifications ─────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  body       text,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);
