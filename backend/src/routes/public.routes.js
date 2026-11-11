// Public (no login) browsing: cooks, dishes, categories.
import { Router } from 'express';
import { query } from '../db.js';
import { validate } from '../middleware/validate.js';
import { idParam, listCooksQuery, listMenuQuery } from '../schemas.js';
import { CATEGORIES } from '../constants.js';
import { notFound } from '../utils/httpError.js';

const router = Router();

const COOK_COLS = `
  cp.id,
  cp.kitchen_name  AS "cookName",
  cp.bio,
  cp.cuisines,
  array_to_string(cp.cuisines, ', ') AS cuisine,     -- display string like the frontend's "Gujarati, Jain"
  cp.is_veg        AS "isVeg",
  cp.address_line  AS address,
  cp.area,
  cp.city,
  cp.image_url     AS image,
  cp.rating_avg    AS rating,
  cp.rating_count  AS "ratingCount",
  cp.is_open       AS "isOpen"`;

const MENU_COLS = `
  mi.id,
  mi.name,
  mi.description,
  mi.category,
  mi.price,
  mi.image_url  AS image,
  mi.is_veg     AS "isVeg",
  mi.quantity_left AS "quantityLeft",
  mi.cook_id    AS "cookId",
  cp.kitchen_name AS "cookName"`;

// GET /api/cooks?veg=true&cuisine=Gujarati&maxPrice=100&q=&city=&lat=&lng=&radiusKm=&sort=rating|distance|price
router.get('/cooks', validate({ query: listCooksQuery }), async (req, res) => {
  const f = req.valid.query;
  const params = [];
  const p = (v) => {
    params.push(v);
    return `$${params.length}`;
  };

  const where = ['cp.is_approved'];
  if (f.veg !== undefined) where.push(`cp.is_veg = ${p(f.veg)}`);
  if (f.cuisine) {
    where.push(`EXISTS (SELECT 1 FROM unnest(cp.cuisines) c WHERE c ILIKE ${p(`%${f.cuisine}%`)})`);
  }
  if (f.city) where.push(`cp.city ILIKE ${p(f.city)}`);
  if (f.q) {
    const like = p(`%${f.q}%`);
    where.push(`(cp.kitchen_name ILIKE ${like} OR cp.area ILIKE ${like} OR EXISTS (SELECT 1 FROM unnest(cp.cuisines) c WHERE c ILIKE ${like}))`);
  }
  if (f.maxPrice) {
    where.push(
      `EXISTS (SELECT 1 FROM menu_items mi WHERE mi.cook_id = cp.id AND mi.is_active AND mi.quantity_left > 0 AND mi.price <= ${p(f.maxPrice)})`,
    );
  }

  const hasGeo = f.lat !== undefined && f.lng !== undefined;
  let distanceCol = 'NULL::float8';
  if (hasGeo) {
    const lat = p(f.lat);
    const lng = p(f.lng);
    // Haversine great-circle distance in km
    distanceCol = `CASE WHEN cp.latitude IS NULL OR cp.longitude IS NULL THEN NULL ELSE
      6371 * acos(LEAST(1, cos(radians(${lat})) * cos(radians(cp.latitude)) * cos(radians(cp.longitude) - radians(${lng}))
                         + sin(radians(${lat})) * sin(radians(cp.latitude)))) END`;
  }

  let sql = `
    SELECT * FROM (
      SELECT ${COOK_COLS},
             (SELECT MIN(mi.price) FROM menu_items mi
               WHERE mi.cook_id = cp.id AND mi.is_active AND mi.quantity_left > 0) AS "minPrice",
             ${distanceCol} AS "distanceKm"
        FROM cook_profiles cp
       WHERE ${where.join(' AND ')}
    ) t`;
  if (hasGeo && f.radiusKm) sql += ` WHERE t."distanceKm" <= ${p(f.radiusKm)}`;

  const sort = f.sort ?? (hasGeo ? 'distance' : 'rating');
  const orderBy = {
    distance: 't."distanceKm" ASC NULLS LAST, t.rating DESC',
    price: 't."minPrice" ASC NULLS LAST, t.rating DESC',
    rating: 't.rating DESC, t."ratingCount" DESC',
  }[sort];
  sql += ` ORDER BY ${orderBy} LIMIT 100`;

  const { rows } = await query(sql, params);
  res.json({ cooks: rows.map((c) => ({ ...c, distanceKm: c.distanceKm == null ? null : Math.round(c.distanceKm * 10) / 10 })) });
});

// GET /api/cooks/:id — profile + menu (the CookDetails page)
router.get('/cooks/:id', validate({ params: idParam }), async (req, res) => {
  const { rows } = await query(`SELECT ${COOK_COLS} FROM cook_profiles cp WHERE cp.id = $1 AND cp.is_approved`, [req.valid.params.id]);
  const cook = rows[0];
  if (!cook) throw notFound('Cook not found');

  const menu = await query(
    `SELECT ${MENU_COLS} FROM menu_items mi JOIN cook_profiles cp ON cp.id = mi.cook_id
      WHERE mi.cook_id = $1 AND mi.is_active ORDER BY (mi.quantity_left > 0) DESC, mi.name`,
    [cook.id],
  );
  res.json({ cook, menu: menu.rows });
});

// GET /api/cooks/:id/reviews
router.get('/cooks/:id/reviews', validate({ params: idParam }), async (req, res) => {
  const { rows } = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at AS "createdAt", u.name AS "customerName"
       FROM reviews r JOIN users u ON u.id = r.customer_id
      WHERE r.cook_id = $1 ORDER BY r.created_at DESC LIMIT 50`,
    [req.valid.params.id],
  );
  res.json({ reviews: rows });
});

// GET /api/menu?category=&veg=&maxPrice=&cookId=&q=&includeSoldOut=  — the home page dish list
router.get('/menu', validate({ query: listMenuQuery }), async (req, res) => {
  const f = req.valid.query;
  const params = [];
  const p = (v) => {
    params.push(v);
    return `$${params.length}`;
  };
  const where = ['mi.is_active', 'cp.is_approved'];
  if (!f.includeSoldOut) where.push('mi.quantity_left > 0');
  if (f.category) where.push(`mi.category = ${p(f.category)}`);
  if (f.veg !== undefined) where.push(`mi.is_veg = ${p(f.veg)}`);
  if (f.maxPrice) where.push(`mi.price <= ${p(f.maxPrice)}`);
  if (f.cookId) where.push(`mi.cook_id = ${p(f.cookId)}`);
  if (f.q) {
    const like = p(`%${f.q}%`);
    where.push(`(mi.name ILIKE ${like} OR mi.description ILIKE ${like})`);
  }
  const { rows } = await query(
    `SELECT ${MENU_COLS} FROM menu_items mi JOIN cook_profiles cp ON cp.id = mi.cook_id
      WHERE ${where.join(' AND ')} ORDER BY cp.rating_avg DESC, mi.name LIMIT 200`,
    params,
  );
  res.json({ items: rows });
});

// GET /api/menu/categories — the "Explore our dibbas" list
router.get('/menu/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

export default router;
