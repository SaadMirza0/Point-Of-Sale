const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// Safe path for the database file
const dbPath = path.join(app.getPath('userData'), 'pos_database.db');
const db = new sqlite3.Database(dbPath);

const initDB = () => {
  db.serialize(() => {
    // 1. PRODUCTS TABLE
    db.run(`CREATE TABLE IF NOT EXISTS products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  size TEXT,
  unit_type TEXT,
  sale_price REAL,
  stock_quantity INTEGER DEFAULT 0,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME
)`);

    // 2. Sales
    db.run(`CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total REAL,
  received REAL,
  change_amount REAL,
  method TEXT,
  sale_date DATETIME,
  is_synced INTEGER DEFAULT 0
)`);

    // 3. Sale Items (The Details)
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER,
  product_name TEXT,
  barcode TEXT,
  qty INTEGER,
  price REAL,
  total REAL,
  FOREIGN KEY(sale_id) REFERENCES sales(id)
)`);

    // 3. SETTINGS TABLE (For Tax and Store Name)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    // Default Settings
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('tax_rate', '0')`);
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('store_name', 'My Cash & Carry')`);

    console.log(" Database Initialized at:", dbPath);
  });
};

module.exports = { db, initDB };
