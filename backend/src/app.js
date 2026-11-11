import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { query } from './db.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import cartRoutes from './routes/cart.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import cookRoutes from './routes/cook.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { notificationsRouter, uploadsRouter, UPLOAD_DIR } from './routes/misc.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind a proxy (Render, Railway, Vercel…) so rate limiting sees the real client IP.
  if (config.isProd) app.set('trust proxy', 1);

  // crossOriginResourcePolicy: uploaded images are loaded by the frontend on a different origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  if (config.env !== 'test') app.use(morgan(config.isProd ? 'combined' : 'dev'));

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

  app.get('/api/health', async (req, res) => {
    await query('SELECT 1');
    res.json({ status: 'ok' });
  });

  // Brute-force protection on login / register.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts, please try again in a few minutes' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api', publicRoutes); // /cooks, /cooks/:id, /menu, /menu/categories
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/cook', cookRoutes);
  app.use('/api/delivery', deliveryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/uploads', uploadsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
