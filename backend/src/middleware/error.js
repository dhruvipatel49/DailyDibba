import { ZodError } from 'zod';
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';
import { config } from '../config.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 3 MB or smaller' : err.message });
  }
  // PostgreSQL constraint errors
  if (err?.code === '23505') return res.status(409).json({ error: 'That record already exists' });
  if (err?.code === '23503') return res.status(400).json({ error: 'Referenced record does not exist' });
  if (err?.code === '23514') return res.status(400).json({ error: 'A value is out of the allowed range' });
  if (err?.code === '22P02') return res.status(400).json({ error: 'Invalid identifier format' });
  // body-parser: malformed JSON
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });

  console.error(err);
  res.status(500).json({ error: 'Something went wrong', ...(config.isProd ? {} : { detail: err?.message }) });
}
