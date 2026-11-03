import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import multer from 'multer';
import {
  createContentItem,
  createDatabase,
  deleteContentItem,
  listContent,
  updateContentItem
} from './database.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });
const VALID_TYPES = new Set(['projects', 'experiences', 'certificates']);
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;
const FILE_SIGNATURES = {
  'application/pdf': (buffer) => buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  'image/jpeg': (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': (buffer) =>
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
};
const MIME_EXTENSIONS = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

class SQLiteSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;
    this.getStatement = db.prepare(
      'SELECT session, expires_at FROM admin_sessions WHERE sid = ?'
    );
    this.setStatement = db.prepare(
      'INSERT INTO admin_sessions (sid, session, expires_at) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET session = excluded.session, expires_at = excluded.expires_at'
    );
    this.touchStatement = db.prepare(
      'UPDATE admin_sessions SET expires_at = ? WHERE sid = ?'
    );
    this.deleteStatement = db.prepare('DELETE FROM admin_sessions WHERE sid = ?');
  }

  get(sid, callback) {
    try {
      const row = this.getStatement.get(sid);
      if (!row || row.expires_at <= Date.now()) {
        this.deleteStatement.run(sid);
        callback(null, null);
        return;
      }
      callback(null, JSON.parse(row.session));
    } catch (error) {
      callback(error);
    }
  }

  set(sid, value, callback = () => {}) {
    try {
      const expiresAt = value.cookie?.expires
        ? new Date(value.cookie.expires).getTime()
        : Date.now() + (value.cookie?.maxAge ?? 8 * 60 * 60 * 1000);
      this.setStatement.run(sid, JSON.stringify(value), expiresAt);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, value, callback = () => {}) {
    try {
      const expiresAt = value.cookie?.expires
        ? new Date(value.cookie.expires).getTime()
        : Date.now() + (value.cookie?.maxAge ?? 8 * 60 * 60 * 1000);
      this.touchStatement.run(expiresAt, sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.deleteStatement.run(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string') throw new Error(`${field} is required.`);
  const result = value.trim();
  if (!result || result.length > maxLength) {
    throw new Error(`${field} must contain 1 to ${maxLength} characters.`);
  }
  return result;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new Error(`${field} must be text.`);
  const result = value.trim();
  if (result.length > maxLength) throw new Error(`${field} must be at most ${maxLength} characters.`);
  return result;
}

function validateUrl(value, field, { required = false } = {}) {
  const result = optionalText(value, field, 2048);
  if (!result && required) throw new Error(`${field} is required.`);
  if (result) {
    let url;
    try {
      url = new URL(result);
    } catch {
      throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error(`${field} must use HTTP or HTTPS.`);
    }
  }
  return result;
}

function validateAssetPath(value, field, { required = false } = {}) {
  const result = optionalText(value, field, 2048);
  if (!result && required) throw new Error(`${field} is required.`);
  if (
    result &&
    !/^\/(?:uploads|certificates)\/[a-zA-Z0-9._-]+$/.test(result) &&
    !/^https?:\/\//i.test(result)
  ) {
    throw new Error(`${field} must point to an uploaded asset or a certificate file.`);
  }
  return result;
}

function validateImagePath(value, field) {
  const result = validateAssetPath(value, field);
  if (
    result &&
    /^\/(?:uploads|certificates)\//.test(result) &&
    !/\.(?:jpe?g|png|webp)$/i.test(result)
  ) {
    throw new Error(`${field} must be a JPEG, PNG, or WebP image.`);
  }
  return result;
}

function stringArray(value, field, maxItems, maxLength) {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error(`${field} must be a list with no more than ${maxItems} entries.`);
  }
  return value.map((item, index) => requiredText(item, `${field} item ${index + 1}`, maxLength));
}

function validateRecord(type, input, id) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Content must be a JSON object.');
  }

  if (type === 'projects') {
    if (!Array.isArray(input.links) || input.links.length > 10) {
      throw new Error('Project links must be a list with no more than 10 entries.');
    }
    const links = input.links.map((link, index) => {
      if (!link || typeof link !== 'object' || Array.isArray(link)) {
        throw new Error(`Project link ${index + 1} is invalid.`);
      }
      return {
        label: requiredText(link.label, `Link ${index + 1} label`, 60),
        url: validateUrl(link.url, `Link ${index + 1} URL`, { required: true })
      };
    });
    return {
      id,
      title: requiredText(input.title, 'Project title', 160),
      category: requiredText(input.category, 'Project category', 80),
      description: requiredText(input.description, 'Project description', 5000),
      tags: stringArray(input.tags, 'Project tags', 30, 50),
      links,
      imageUrl: validateImagePath(input.imageUrl, 'Project image')
    };
  }

  if (type === 'experiences') {
    return {
      id,
      title: requiredText(input.title, 'Role title', 160),
      company: requiredText(input.company, 'Company', 160),
      period: requiredText(input.period, 'Period', 100),
      bullets: stringArray(input.bullets, 'Experience bullets', 20, 2000)
    };
  }

  return {
    id,
    title: requiredText(input.title, 'Certificate title', 200),
    issuer: requiredText(input.issuer, 'Certificate issuer', 160),
    date: optionalText(input.date, 'Certificate date', 80),
    credentialId: optionalText(input.credentialId, 'Credential ID', 160),
    fileType: input.fileType === 'pdf' ? 'pdf' : 'image',
    fileUrl: validateAssetPath(input.fileUrl, 'Certificate file', { required: true }),
    previewUrl: validateImagePath(input.previewUrl, 'Certificate preview'),
    verificationUrl: validateUrl(input.verificationUrl, 'Verification URL'),
    note: optionalText(input.note, 'Certificate note', 1000)
  };
}

function isValidCsrfToken(expected, provided) {
  if (typeof expected !== 'string' || typeof provided !== 'string') return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function requireCsrf(req, res, next) {
  if (!isValidCsrfToken(req.session.csrfToken, req.get('x-csrf-token'))) {
    res.status(403).json({ error: 'Your session expired. Reload the page and try again.' });
    return;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.authenticated !== true) {
    res.status(401).json({ error: 'Please log in to continue.' });
    return;
  }
  next();
}

function validFile(file) {
  const validate = FILE_SIGNATURES[file.mimetype];
  return validate && MIME_EXTENSIONS[file.mimetype] && validate(file.buffer);
}

export function createApp({
  db = createDatabase(),
  uploadsDirectory = path.join(ROOT, 'storage/uploads'),
  staticDirectory = path.join(ROOT, 'dist'),
  env = process.env
} = {}) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    throw new Error('Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and SESSION_SECRET before starting the server.');
  }
  if (env.ADMIN_USERNAME.length > 100) {
    throw new Error('ADMIN_USERNAME must be 100 characters or fewer.');
  }
  if (env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }
  try {
    if (bcrypt.getRounds(env.ADMIN_PASSWORD_HASH) < 10) throw new Error();
  } catch {
    throw new Error('ADMIN_PASSWORD_HASH must be a bcrypt hash with at least 10 rounds.');
  }
  fs.mkdirSync(uploadsDirectory, { recursive: true, mode: 0o700 });

  const app = express();
  if (env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        frameSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        objectSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']
      }
    },
    crossOriginEmbedderPolicy: false
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(session({
    name: 'portfolio_admin',
    secret: env.SESSION_SECRET,
    store: new SQLiteSessionStore(db),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: env.NODE_ENV === 'production'
    }
  }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' }
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 1 }
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/auth/session', (req, res, next) => {
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    req.session.save((error) => {
      if (error) return next(error);
      res.json({
        authenticated: req.session.authenticated === true,
        csrfToken: req.session.csrfToken
      });
    });
  });

  app.post('/api/auth/login', loginLimiter, requireCsrf, async (req, res, next) => {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const providedUsername = Buffer.from(username);
    const configuredUsername = Buffer.from(env.ADMIN_USERNAME);
    const usernameMatches = providedUsername.length === configuredUsername.length &&
      crypto.timingSafeEqual(providedUsername, configuredUsername);
    const passwordMatches = Buffer.byteLength(password) <= 72 &&
      await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);

    if (!usernameMatches || !passwordMatches) {
      res.status(401).json({ error: 'Incorrect username or password.' });
      return;
    }

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.authenticated = true;
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.json({ authenticated: true, csrfToken: req.session.csrfToken });
      });
    });
  });

  app.post('/api/auth/logout', requireAdmin, requireCsrf, (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('portfolio_admin', {
        httpOnly: true,
        sameSite: 'strict',
        secure: env.NODE_ENV === 'production'
      });
      res.status(204).end();
    });
  });

  app.get('/api/content', (_req, res) => res.json(listContent(db)));
  app.get('/api/admin/content', requireAdmin, (_req, res) => res.json(listContent(db)));

  app.post('/api/admin/uploads', requireAdmin, requireCsrf, (req, res, next) => {
    upload.single('file')(req, res, (error) => {
      if (error) return next(error);
      if (!req.file || !validFile(req.file)) {
        res.status(400).json({ error: 'Upload a valid PDF, JPEG, PNG, or WebP file.' });
        return;
      }

      const extension = MIME_EXTENSIONS[req.file.mimetype];
      const filename = `${crypto.randomUUID()}${extension}`;
      const destination = path.join(uploadsDirectory, filename);
      fs.writeFile(destination, req.file.buffer, { flag: 'wx', mode: 0o600 }, (writeError) => {
        if (writeError) return next(writeError);
        res.status(201).json({
          url: `/uploads/${filename}`,
          mimeType: req.file.mimetype,
          originalName: path.basename(req.file.originalname).replace(/[\u0000-\u001f]/g, '').slice(0, 180)
        });
      });
    });
  });

  app.post('/api/admin/content/:type', requireAdmin, requireCsrf, (req, res) => {
    const { type } = req.params;
    if (!VALID_TYPES.has(type)) {
      res.status(404).json({ error: 'Content type not found.' });
      return;
    }
    try {
      const record = validateRecord(type, req.body, crypto.randomUUID());
      createContentItem(db, type, record);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/admin/content/:type/:id', requireAdmin, requireCsrf, (req, res) => {
    const { type, id } = req.params;
    if (!VALID_TYPES.has(type) || !ID_PATTERN.test(id)) {
      res.status(404).json({ error: 'Content item not found.' });
      return;
    }
    try {
      const record = validateRecord(type, req.body, id);
      if (!updateContentItem(db, type, id, record)) {
        res.status(404).json({ error: 'Content item not found.' });
        return;
      }
      res.json(record);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/admin/content/:type/:id', requireAdmin, requireCsrf, (req, res) => {
    const { type, id } = req.params;
    if (!VALID_TYPES.has(type) || !ID_PATTERN.test(id)) {
      res.status(404).json({ error: 'Content item not found.' });
      return;
    }
    if (!deleteContentItem(db, type, id)) {
      res.status(404).json({ error: 'Content item not found.' });
      return;
    }
    res.status(204).end();
  });

  app.get('/uploads/:filename', (req, res, next) => {
    if (!/^[a-f0-9-]{36}\.(?:pdf|jpg|png|webp)$/.test(req.params.filename)) {
      res.status(404).end();
      return;
    }
    res.sendFile(path.join(uploadsDirectory, req.params.filename), (error) => {
      if (error && !res.headersSent) next(error);
    });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  app.use(express.static(staticDirectory, { dotfiles: 'deny', index: false, maxAge: '1h' }));
  app.get('*splat', (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      next();
      return;
    }
    res.sendFile(path.join(staticDirectory, 'index.html'), (error) => {
      if (error && !res.headersSent) next(error);
    });
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({
        error: error.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. The maximum size is 20 MB.'
          : 'Upload could not be processed.'
      });
      return;
    }
    console.error('Request failed:', error);
    if (res.headersSent) return;
    res.status(500).json({ error: 'The request could not be completed. Please try again.' });
  });

  return { app, db };
}
