const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Foydalanuvchilar jadvali
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      ref_code TEXT UNIQUE,
      referred_by INTEGER, -- inviter telegram_id
      points INTEGER DEFAULT 0,
      has_vip_access INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  // Referal juftliklari
  db.run(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER, -- inviter telegram_id
      invited_id INTEGER, -- invited telegram_id
      created_at TEXT,
      is_active INTEGER DEFAULT 1,
      UNIQUE(inviter_id, invited_id)
    )
  `);
});

module.exports = db;
