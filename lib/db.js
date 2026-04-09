// lib/db.js
// Base de données sql.js — même approche que PolyBot

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'stocks.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS portfolio (
      user_id   TEXT NOT NULL,
      symbol    TEXT NOT NULL,
      quantity  REAL NOT NULL DEFAULT 0,
      avg_price REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, symbol)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL,
      symbol     TEXT NOT NULL,
      type       TEXT NOT NULL CHECK(type IN ('buy','sell')),
      quantity   REAL NOT NULL,
      price      REAL NOT NULL,
      total      REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  save();
  return db;
}

function save() {
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// --- Portfolio ---

function getHolding(userId, symbol) {
  const stmt = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND symbol = ?');
  stmt.bind([userId, symbol.toUpperCase()]);
  if (stmt.step()) return stmt.getAsObject();
  return null;
}

function getPortfolio(userId) {
  const stmt = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND quantity > 0');
  stmt.bind([userId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  return rows;
}

function upsertHolding(userId, symbol, quantity, avgPrice) {
  db.run(
    `INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, symbol) DO UPDATE SET
       quantity  = excluded.quantity,
       avg_price = excluded.avg_price`,
    [userId, symbol.toUpperCase(), quantity, avgPrice]
  );
  save();
}

function logTransaction(userId, symbol, type, quantity, price) {
  db.run(
    `INSERT INTO transactions (user_id, symbol, type, quantity, price, total)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, symbol.toUpperCase(), type, quantity, price, quantity * price]
  );
  save();
}

function getTransactions(userId, limit = 10) {
  const stmt = db.prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  );
  stmt.bind([userId, limit]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  return rows;
}

module.exports = { initDB, getHolding, getPortfolio, upsertHolding, logTransaction, getTransactions };
