// src/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const { DB_PATH } = require('./config');

// DB_PATH absolut bo‘lsa ham, relative bo‘lsa ham ishlasin
const resolvedDbPath = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.resolve(process.cwd(), DB_PATH);

// DB papkasini yaratib qo‘yamiz (Render /var/data kabi)
fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });

const db = new sqlite3.Database(resolvedDbPath, (err) => {
  if (err) {
    console.error('❌ SQLite open ERROR:', err);
  } else {
    console.log('✅ SQLite DB path:', resolvedDbPath);
  }
});

function runSequential(sqlList, cb) {
  const next = (i) => {
    if (i >= sqlList.length) return cb(null);
    db.run(sqlList[i], (err) => {
      if (err) return cb(err);
      next(i + 1);
    });
  };
  next(0);
}

function ensureBooksColumns(cb) {
  db.all('PRAGMA table_info(books)', [], (err, cols) => {
    if (err) return cb(err);

    const names = new Set((cols || []).map((c) => c.name));
    const alters = [];

    if (!names.has('file_id')) alters.push('ALTER TABLE books ADD COLUMN file_id TEXT');
    if (!names.has('file_name')) alters.push('ALTER TABLE books ADD COLUMN file_name TEXT');
    if (!names.has('mime_type')) alters.push('ALTER TABLE books ADD COLUMN mime_type TEXT');
    if (!names.has('file_size')) alters.push('ALTER TABLE books ADD COLUMN file_size INTEGER');

    if (alters.length === 0) return cb(null);

    runSequential(alters, (alterErr) => {
      if (alterErr) return cb(alterErr);
      console.log('✅ books table migrated (new columns added):', alters.length);
      cb(null);
    });
  });
}

db.serialize(() => {
  // Yaxshiroq barqarorlik
  db.run('PRAGMA journal_mode=WAL;');
  db.run('PRAGMA foreign_keys=ON;');

  // Foydalanuvchilar jadvali
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      ref_code TEXT UNIQUE,
      referred_by INTEGER,
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
      inviter_id INTEGER,
      invited_id INTEGER,
      created_at TEXT,
      is_active INTEGER DEFAULT 1,
      UNIQUE(inviter_id, invited_id)
    )
  `);

  // Kitoblar jadvali (file_path hozircha qoladi — backward compatible)
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT NOT NULL,
      required_points INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  // ✅ Migratsiya: books jadvaliga file_id va boshqalarni qo‘shamiz
  ensureBooksColumns((migErr) => {
    if (migErr) {
      console.error('❌ books migration ERROR:', migErr);
      return;
    }

    // Sample kitob faqat books bo‘sh bo‘lsa qo‘shiladi (xavfsiz)
    const sampleBookPath = 'assets/books/sat-math-guide.txt';
    const now = new Date().toISOString();

    db.get('SELECT COUNT(*) AS count FROM books', [], (err, row) => {
      if (err) {
        console.error('books count check ERROR:', err);
        return;
      }

      if (row && row.count === 0) {
        db.run(
          `INSERT INTO books (title, description, file_path, required_points, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?)`,
          [
            'SAT Matematika Asoslari',
            "Boshlang'ich darajadagi tayyorlov kitobi, misollar va yechish yondashuvlari bilan.",
            sampleBookPath,
            2,
            now,
            now,
          ],
          (insertErr) => {
            if (insertErr) {
              console.error('Sample book insert ERROR:', insertErr);
            } else {
              console.log("✅ Sample kitob database ga qo'shildi.");
            }
          }
        );
      }
    });
  });
});

module.exports = db;
