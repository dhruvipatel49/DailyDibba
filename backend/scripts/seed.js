// Seeds demo data from the frontend's assets.js (cooks + dishes) plus a demo customer, delivery partner and admin.
//   npm run seed          – adds anything missing
//   npm run seed:reset    – WIPES all data first, then seeds
import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import { pool } from '../src/db.js';

const DEMO_PASSWORD = 'Password@123';
const reset = process.argv.includes('--reset');

const COOKS = [
  { email: 'premila@dailydibba.local', owner: 'Premila Ben', kitchen: "Premila Ben's Kitchen", cuisines: ['Gujarati', 'Jain'],
    veg: true, area: 'Navrangpura', lat: 23.0366, lng: 72.5611, img: 'food_1.png', rating: 4.8,
    dishes: [
      { name: 'Gujarati Thali', category: 'Gujarati', price: 150, img: 'food_1.png', qty: 20, desc: 'Authentic Gujarati flavors providing essential nutrients for overall health.' },
      { name: 'Jain Thali', category: 'Jain', price: 150, img: 'food_3.png', qty: 12, desc: 'Strictly prepared Jain meal without root vegetables, cooked with care.' },
    ] },
  { email: 'simran@dailydibba.local', owner: 'Simran Kaur', kitchen: "Simran Kaur's Tiffin Services", cuisines: ['Punjabi', 'North Indian'],
    veg: false, area: 'Vastrapur', lat: 23.0396, lng: 72.529, img: 'food_2.png', rating: 4.7,
    dishes: [{ name: 'Punjabi Thali', category: 'Punjabi', price: 150, img: 'food_2.png', qty: 15, desc: 'Rich and hearty Punjabi meal crafted for a fulfilling lunch.' }] },
  { email: 'bhakti@dailydibba.local', owner: 'Bhakti Shah', kitchen: 'Bhakti Pure Veg Dibba', cuisines: ['Jain', 'Swaminarayan'],
    veg: true, area: 'Paldi', lat: 23.0127, lng: 72.5628, img: 'food_3.png', rating: 4.9,
    dishes: [{ name: 'Swaminarayan Jain Thali', category: 'Jain', price: 140, img: 'food_3.png', qty: 18, desc: 'Pure satvik meal with no onion or garlic.' }] },
  { email: 'nutrimeal@dailydibba.local', owner: 'Nidhi Mehta', kitchen: 'NutriMeal Home Kitchen', cuisines: ['Healthy', 'Diet Food'],
    veg: true, area: 'Bodakdev', lat: 23.0396, lng: 72.5066, img: 'food_4.png', rating: 4.6,
    dishes: [{ name: 'Healthy/Diet Thali', category: 'Diet Food', price: 120, img: 'food_4.png', qty: 10, desc: 'Calorie-counted, balanced diet dibba for fitness enthusiasts.' }] },
  { email: 'lakshmi@dailydibba.local', owner: 'Lakshmi Iyer', kitchen: "Lakshmi's South Indian Rasoi", cuisines: ['South Indian'],
    veg: true, area: 'Satellite', lat: 23.0258, lng: 72.5086, img: 'food_5.png', rating: 0,
    dishes: [{ name: 'South Indian Thali', category: 'South Indian', price: 130, img: 'food_5.png', qty: 14, desc: 'Traditional South Indian flavors featuring sambar, rasam, and fresh veggies.' }] },
];

async function upsertUser(client, { name, email, role, phone }, password) {
  const found = await client.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
  if (found.rowCount) return { id: found.rows[0].id, created: false };
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await client.query(
    'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [name, email, hash, phone ?? null, role],
  );
  return { id: rows[0].id, created: true };
}

const client = await pool.connect();
try {
  await client.query('BEGIN');

  if (reset) {
    await client.query(`TRUNCATE users, cook_profiles, partner_profiles, menu_items, wishlist_items, cart_items, orders,
                        order_items, pickup_details, delivery_assignments, reviews, notifications RESTART IDENTITY CASCADE`);
    await client.query('ALTER SEQUENCE order_code_seq RESTART WITH 1000');
    console.log('Existing data wiped');
  }

  if (config.adminEmail && config.adminPassword) {
    const a = await upsertUser(client, { name: 'DailyDibba Admin', email: config.adminEmail, role: 'admin' }, config.adminPassword);
    console.log(`${a.created ? 'Created' : 'Found'} admin ${config.adminEmail}`);
  } else {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin created');
  }

  for (const c of COOKS) {
    const u = await upsertUser(client, { name: c.owner, email: c.email, role: 'cook' }, DEMO_PASSWORD);
    if (!u.created) continue;
    const cp = await client.query(
      `INSERT INTO cook_profiles (user_id, kitchen_name, cuisines, is_veg, area, city, latitude, longitude,
                                  image_url, rating_avg, is_approved)
       VALUES ($1,$2,$3,$4,$5,'Ahmedabad',$6,$7,$8,$9,true) RETURNING id`,
      [u.id, c.kitchen, c.cuisines, c.veg, c.area, c.lat, c.lng, `/uploads/seed/${c.img}`, c.rating],
    );
    for (const d of c.dishes) {
      await client.query(
        `INSERT INTO menu_items (cook_id, name, description, category, price, image_url, is_veg, quantity_left)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [cp.rows[0].id, d.name, d.desc, d.category, d.price, `/uploads/seed/${d.img}`, c.veg, d.qty],
      );
    }
    console.log(`Seeded cook ${c.kitchen}`);
  }

  const cust = await upsertUser(client, { name: 'Demo Customer', email: 'customer@dailydibba.local', role: 'customer', phone: '9000000001' }, DEMO_PASSWORD);
  const del = await upsertUser(client, { name: 'Demo Rider', email: 'rider@dailydibba.local', role: 'delivery', phone: '9000000002' }, DEMO_PASSWORD);
  if (del.created) await client.query(`INSERT INTO partner_profiles (user_id, vehicle_type) VALUES ($1, 'Bike')`, [del.id]);
  if (cust.created) console.log('Seeded demo customer + delivery partner');

  await client.query('COMMIT');
  console.log(`\n✔ Done. Demo logins use password: ${DEMO_PASSWORD}`);
  console.log('  customer@dailydibba.local · rider@dailydibba.local · premila@dailydibba.local (cook) …');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
