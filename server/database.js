import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { seedContent } from './seed-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function transaction(db, callback) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function createDatabase(filename = process.env.DATABASE_PATH || path.join(ROOT, 'storage/portfolio.sqlite')) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS content_items (
      type TEXT NOT NULL CHECK (type IN ('projects', 'experiences', 'certificates')),
      id TEXT NOT NULL,
      position INTEGER NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (type, id)
    );
    CREATE INDEX IF NOT EXISTS content_items_order ON content_items(type, position);
    CREATE TABLE IF NOT EXISTS admin_sessions (
      sid TEXT PRIMARY KEY,
      session TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
  `);

  const count = db.prepare('SELECT COUNT(*) AS count FROM content_items').get().count;
  if (count === 0) {
    const insert = db.prepare(
      'INSERT INTO content_items (type, id, position, data) VALUES (?, ?, ?, ?)'
    );
    transaction(db, () => {
      for (const [type, records] of Object.entries(seedContent)) {
        records.forEach((record, position) => {
          insert.run(type, record.id, position, JSON.stringify(record));
        });
      }
    });
  }

  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now());
  return db;
}

export function listContent(db) {
  const records = db.prepare(
    'SELECT type, data FROM content_items ORDER BY type, position, id'
  ).all();
  const content = { projects: [], experiences: [], certificates: [] };
  records.forEach(({ type, data }) => content[type].push(JSON.parse(data)));
  return content;
}

export function createContentItem(db, type, record) {
  const insert = db.prepare(
    'INSERT INTO content_items (type, id, position, data) VALUES (?, ?, ?, ?)'
  );
  transaction(db, () => {
    if (type === 'experiences') {
      db.prepare('UPDATE content_items SET position = position + 1 WHERE type = ?').run(type);
      insert.run(type, record.id, 0, JSON.stringify(record));
      return;
    }
    const position = db.prepare(
      'SELECT COALESCE(MAX(position), -1) + 1 AS position FROM content_items WHERE type = ?'
    ).get(type).position;
    insert.run(type, record.id, position, JSON.stringify(record));
  });
  return record;
}

export function updateContentItem(db, type, id, record) {
  const result = db.prepare(
    'UPDATE content_items SET data = ? WHERE type = ? AND id = ?'
  ).run(JSON.stringify(record), type, id);
  return result.changes > 0;
}

export function deleteContentItem(db, type, id) {
  return transaction(db, () => {
    const record = db.prepare(
      'SELECT position FROM content_items WHERE type = ? AND id = ?'
    ).get(type, id);
    if (!record) return false;
    const result = db.prepare(
      'DELETE FROM content_items WHERE type = ? AND id = ?'
    ).run(type, id);
    if (!result.changes) return false;
    db.prepare(
      'UPDATE content_items SET position = position - 1 WHERE type = ? AND position > ?'
    ).run(type, record.position);
    return true;
  });
}
