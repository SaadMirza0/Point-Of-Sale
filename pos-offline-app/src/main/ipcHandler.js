import { ipcMain } from 'electron';
import { db } from './database.js';
import { printReceipt } from './printer.js';
import pg from 'pg';
const { Client } = pg;

const neonConfig = {
  connectionString: "postgresql://neondb_owner:npg_CR35wFemruYs@ep-rapid-surf-aod97wzm-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
};

export async function connectNeon() {
  const client = new Client(neonConfig);
  await client.connect();
  return client;
}

export const setupHandlers = () => {

  //  PRINTER MANAGEMENT 
  ipcMain.handle('get-printers', async (event) => {
    return await event.sender.getPrintersAsync();
  });

  ipcMain.on('print-receipt', (event, data) => {
    try {
      printReceipt(data);
    } catch (error) {
      console.error("Printer Error:", error);
    }
  });

  // --- PRODUCT MANAGEMENT ---

  // 1. Add a New Product with Cloud Sync
  ipcMain.handle('add-product', async (event, product) => {
    const timestamp = new Date().toISOString();



    return new Promise((resolve, reject) => {
      const { barcode, name, brand, category, size, unit, price, stock } = product;

      // STEP 1: SAVE TO LOCAL HDD (SQLite)
      const localSql = `INSERT INTO products (barcode, name, brand, category, size, unit_type, sale_price, stock_quantity, created_at, is_synced) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`;

      db.run(localSql, [barcode, name, brand, category, size, unit, price, stock, timestamp], async function (err) {
        if (err) {
          return reject(err);
        }

        // UNLOCK UI: Respond to React immediately so the app doesn't jam
        resolve({ success: true });

        // STEP 2: BACKGROUND SYNC TO NEON (Online)
        try {
          const cloudStartMs = Date.now();
          const client = await connectNeon(); // This calls your Neon connection helper

          const neonQuery = `
          INSERT INTO products (barcode, name, brand, category, size, unit_type, sale_price, stock_quantity, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (barcode) DO UPDATE SET 
          name = EXCLUDED.name, 
          sale_price = EXCLUDED.sale_price, 
          stock_quantity = EXCLUDED.stock_quantity
        `;

          const values = [barcode, name, brand, category, size, unit, price, stock, timestamp];

          await client.query(neonQuery, values);
          await client.end();




          // STEP 3: MARK AS SYNCED LOCALLY
          db.run("UPDATE products SET is_synced = 1 WHERE barcode = ?", [barcode]);
          console.log(`✅ Product ${barcode} synced to Cloud (Neon)`);

        } catch (cloudErr) {



          console.error("☁️ Offline: Saved locally but cloud sync failed. Will retry later.");
        }
      });
    });
  });




  // 2. Search for a single product (Used in Sell Page & for checking existing items)
  ipcMain.handle('get-product', async (event, barcode) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM products WHERE barcode = ?", [barcode], (err, row) => {
        if (err) reject(err);
        resolve(row || null);
      });
    });
  });

  // 3. Get all products (Used to show the table in Inventory Page)
  ipcMain.handle('get-all-products', async () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM products ORDER BY created_at DESC", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  });
  //  Delete a product
  ipcMain.handle('delete-product', async (event, barcode) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM products WHERE barcode = ?", [barcode], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  });

  //  Update an existing product
  ipcMain.handle('update-product', async (event, product) => {
    return new Promise((resolve, reject) => {
      const { barcode, name, brand, category, size, unit, price, stock } = product;
      const sql = `UPDATE products SET 
                 name=?, brand=?, category=?, size=?, unit_type=?, sale_price=?, stock_quantity=? 
                 WHERE barcode=?`;
      db.run(sql, [name, brand, category, size, unit, price, stock, barcode], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  });

  // --- SALES MANAGEMENT ---



  // Save Sale with Cloud Sync
  ipcMain.handle('save-sale', async (event, saleData) => {
    const now = new Date().toISOString();

    return new Promise((resolve) => {
      db.serialize(() => {
        // 1. Save Main Sale
        db.run(
          "INSERT INTO sales (total, received, change_amount, method, sale_date, is_synced) VALUES (?, ?, ?, ?, ?, 0)",
          [saleData.total, saleData.received, saleData.change, saleData.method, now],
          function (err) {
            if (err) return resolve({ success: false });
            const saleId = this.lastID;

            // 2. IMPORTANT: Use a Statement to prevent "Double Inserting"
            const stmt = db.prepare("INSERT INTO sale_items (sale_id, product_name, barcode, qty, price, total) VALUES (?, ?, ?, ?, ?, ?)");

            saleData.items.forEach(item => {
              // We save the grouped quantity (e.g., Qty: 3) as ONE row
              stmt.run(saleId, item.name, item.barcode, item.qty, item.sale_price, (item.sale_price * item.qty));

              // Update Stock
              db.run("UPDATE products SET stock_quantity = stock_quantity - ? WHERE barcode = ?", [item.qty, item.barcode]);
            });

            stmt.finalize();
            resolve({ success: true, id: saleId });
          }
        );
      });
    });
  });


  // 4. NEW HANDLER: Fetch items for the History Modal

  ipcMain.handle('get-sale-items', async (event, saleId) => {
    return new Promise((resolve) => {
      const query = "SELECT * FROM sale_items WHERE sale_id = ?";
      db.all(query, [saleId], (err, rows) => {
        if (err) {
          console.error("SQL Error fetching items:", err.message);
          resolve([]); // Return empty array instead of crashing
        } else {
          resolve(rows || []);
        }
      });
    });
  });


  ipcMain.handle('get-sync-count', async () => {
    return new Promise((resolve) => {
      db.get("SELECT COUNT(*) as count FROM sales WHERE is_synced = 0", (err, row) => {
        if (err) resolve(0);
        resolve(row ? row.count : 0);
      });
    });
  });


  ipcMain.handle('full-sync-recovery', async () => {
    try {
      const client = await connectNeon();

      // --- 1. SYNC PRODUCTS ---
      const prodResult = await client.query("SELECT * FROM products");
      for (let p of prodResult.rows) {
        db.run(`INSERT OR REPLACE INTO products (barcode, name, brand, category, size, unit_type, sale_price, stock_quantity, created_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [p.barcode, p.name, p.brand, p.category, p.size, p.unit_type, p.sale_price, p.stock_quantity, p.created_at]);
      }

      // --- 2. SYNC SALES ---
      const salesResult = await client.query("SELECT * FROM sales");
      for (let s of salesResult.rows) {
        db.run(`INSERT OR IGNORE INTO sales (id, total, received, change_amount, method, sale_date, is_synced) VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [s.local_id, s.total, s.received, s.change_amount, s.method, s.sale_date]);
      }

      // --- 3. SYNC SETTINGS (New) ---
      const setResult = await client.query("SELECT * FROM settings");
      for (let set of setResult.rows) {
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [set.key, set.value]);
      }

      await client.end();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });



  // Get a specific setting (like tax_rate)
  ipcMain.handle('get-setting', async (event, key) => {
    return new Promise((resolve) => {
      db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
        resolve(row ? row.value : "0");
      });
    });
  });

  // Add this to allow saving settings from the Settings page 
  ipcMain.handle('save-setting', async (event, { key, value }) => {
    return new Promise(async (resolve) => {

      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value], async (err) => {
        if (err) return resolve({ success: false });


        try {
          const client = await connectNeon();
          await client.query(
            "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
            [key, value]
          );
          await client.end();
        } catch (e) {
          console.error("Settings Cloud Sync Failed");
        }
        resolve({ success: true });
      });
    });
  });




  // Get Sales History with optional filters
  ipcMain.handle('get-sales-history', async (event, filter) => {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM sales";

      if (filter === 'today') {
        // Use date() with 'localtime' to correctly compare UTC ISO strings to local date
        query += " WHERE date(sale_date, 'localtime') = date('now', 'localtime')";
      } else if (filter === 'yesterday') {
        query += " WHERE date(sale_date, 'localtime') = date('now', '-1 day', 'localtime')";
      } else if (filter === 'month') {
        query += " WHERE sale_date > date('now', '-30 days')";
      }
      // If filter is 'all', no WHERE clause is added

      query += " ORDER BY sale_date DESC";

      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  });

  // Get details for a specific sale
  ipcMain.handle('get-sale-details', async (event, saleId) => {
    return new Promise((resolve, reject) => {

      db.all("SELECT * FROM sale_items WHERE sale_id = ?", [saleId], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  });

  ipcMain.handle('search-sales', async (event, searchTerm) => {
    return new Promise((resolve, reject) => {
      // We search ID and Method because bill_number doesn't exist
      const query = "SELECT * FROM sales WHERE id LIKE ? OR method LIKE ? ORDER BY sale_date DESC";
      db.all(query, [`%${searchTerm}%`, `%${searchTerm}%`], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  });


  // Get Summary for Today
  ipcMain.handle('get-dashboard-stats', async () => {
    return new Promise((resolve) => {
      const query = `
      SELECT 
        SUM(total) as totalSales, 
        COUNT(id) as totalOrders,
        SUM(CASE WHEN method = 'CASH' THEN total ELSE 0 END) as cashSales,
        SUM(CASE WHEN method = 'ONLINE' THEN total ELSE 0 END) as onlineSales
      FROM sales 
      WHERE date(sale_date, 'localtime') = date('now', 'localtime')
    `;
      db.get(query, [], (err, row) => {
        resolve(row || { totalSales: 0, totalOrders: 0, cashSales: 0, onlineSales: 0 });
      });
    });
  });

  // Get Low Stock Products
  ipcMain.handle('get-low-stock', async () => {
    return new Promise((resolve) => {
      const query = "SELECT * FROM products WHERE stock_quantity < 10 LIMIT 5";
      db.all(query, [], (err, rows) => {
        resolve(rows || []);
      });
    });
  });

};



