'use strict';

const { Pool } = require('pg');

let tableReady = false;

function sanitizeConnectionString(raw) {
  let s = String(raw || '').trim();
  // Handle users pasting Neon's full CLI snippet: psql 'postgresql://...'
  if (/^psql\s+/i.test(s)) {
    s = s.replace(/^psql\s+/i, '').trim();
  }
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim();
  }
  // pg v8 can fail when Neon includes channel_binding=require in the copied URL
  s = s.replace(/([?&])channel_binding=[^&]*&?/gi, '$1').replace(/[?&]$/, '');
  return s;
}

function getPool() {
  if (global.__pimPgPool) return global.__pimPgPool;
  const rawConnStr =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL;

  const connStr = sanitizeConnectionString(rawConnStr);
  if (!connStr) {
    const err = new Error('DATABASE_URL environment variable is missing.');
    err.publicCode = 'MISSING_DATABASE_URL';
    throw err;
  }
  if (!/^postgres(ql)?:\/\//i.test(connStr)) {
    const err = new Error('DATABASE_URL must start with postgresql:// or postgres://.');
    err.publicCode = 'INVALID_DATABASE_URL';
    throw err;
  }

  const needsSsl = !/localhost|127\.0\.0\.1/i.test(connStr);
  global.__pimPgPool = new Pool({
    connectionString: connStr,
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 8000,
    ssl: needsSsl ? { rejectUnauthorized: false } : false
  });
  return global.__pimPgPool;
}

async function ensureSchema() {
  const pool = getPool();
  if (tableReady) return pool;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS freshers_checkins (
      id BIGSERIAL PRIMARY KEY,
      roll_no VARCHAR(32) NOT NULL UNIQUE,
      full_name VARCHAR(80) NOT NULL,
      first_name VARCHAR(40) NOT NULL,
      entry_source VARCHAR(24) NOT NULL DEFAULT 'qr_self',
      reverify_count INTEGER NOT NULL DEFAULT 0,
      checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  tableReady = true;
  return pool;
}

async function findByRollNo(rollNo) {
  const pool = await ensureSchema();
  const { rows } = await pool.query(
    `SELECT id, roll_no, full_name, first_name, entry_source, reverify_count, checked_in_at, last_seen_at
     FROM freshers_checkins
     WHERE roll_no = $1
     LIMIT 1`,
    [rollNo]
  );
  return rows[0] || null;
}

async function insertCheckin({ rollNo, fullName, firstName, entrySource }) {
  const pool = await ensureSchema();
  const { rows } = await pool.query(
    `INSERT INTO freshers_checkins (roll_no, full_name, first_name, entry_source)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (roll_no) DO NOTHING
     RETURNING id, roll_no, full_name, first_name, entry_source, reverify_count, checked_in_at, last_seen_at`,
    [rollNo, fullName, firstName, entrySource]
  );
  return rows[0] || null;
}

async function touchReverify(rollNo) {
  const pool = await ensureSchema();
  const { rows } = await pool.query(
    `UPDATE freshers_checkins
     SET reverify_count = reverify_count + 1,
         last_seen_at = NOW()
     WHERE roll_no = $1
     RETURNING id, roll_no, full_name, first_name, entry_source, reverify_count, checked_in_at, last_seen_at`,
    [rollNo]
  );
  return rows[0] || null;
}

async function upsertAdminOverride({ rollNo, fullName, firstName, overwriteExisting }) {
  const pool = await ensureSchema();
  if (overwriteExisting) {
    const { rows } = await pool.query(
      `INSERT INTO freshers_checkins (roll_no, full_name, first_name, entry_source)
       VALUES ($1, $2, $3, 'admin_override')
       ON CONFLICT (roll_no) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         first_name = EXCLUDED.first_name,
         entry_source = 'admin_override',
         last_seen_at = NOW()
       RETURNING id, roll_no, full_name, first_name, entry_source, reverify_count, checked_in_at, last_seen_at`,
      [rollNo, fullName, firstName]
    );
    return { record: rows[0], action: 'upserted' };
  }

  const inserted = await insertCheckin({
    rollNo,
    fullName,
    firstName,
    entrySource: 'admin_override'
  });
  if (inserted) {
    return { record: inserted, action: 'inserted' };
  }
  const existing = await findByRollNo(rollNo);
  return { record: existing, action: 'exists' };
}

async function listAllCheckins() {
  const pool = await ensureSchema();
  const { rows } = await pool.query(
    `SELECT id, roll_no, full_name, first_name, entry_source, reverify_count, checked_in_at, last_seen_at
     FROM freshers_checkins
     ORDER BY checked_in_at DESC`
  );
  return rows;
}

async function deleteByRollNo(rollNo) {
  const pool = await ensureSchema();
  const { rows } = await pool.query(
    `DELETE FROM freshers_checkins
     WHERE roll_no = $1
     RETURNING roll_no`,
    [rollNo]
  );
  return rows.length > 0;
}

module.exports = {
  findByRollNo,
  insertCheckin,
  touchReverify,
  upsertAdminOverride,
  listAllCheckins,
  deleteByRollNo
};
