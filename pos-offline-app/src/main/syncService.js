import { db } from './database.js';
import { connectNeon } from './ipcHandler.js';

export const startAutoSync = () => {
  setInterval(async () => {
    try {
      const client = await connectNeon();

      // --- 1. PUSH LOCAL SALES & ITEMS TO CLOUD ---
      const localUnsynced = await new Promise((res) =>
        db.all("SELECT * FROM sales WHERE is_synced = 0", (err, r) => res(r || []))
      );

      for (const s of localUnsynced) {
        try {
          // A. Push the Main Sale
         // Ensure s.sale_date is passed as a raw string from SQLite
await client.query(
  "INSERT INTO sales (local_id, total, received, change_amount, method, sale_date) VALUES ($1, $2, $3, $4, $5, $6)", 
  [s.id, s.total, s.received, s.change_amount, s.method, s.sale_date] 
);


          // B. Fetch and Push Items
          const items = await new Promise((res) =>
            db.all("SELECT * FROM sale_items WHERE sale_id = ?", [s.id], (err, r) => res(r || []))
          );

          for (const item of items) {
            await client.query(
              "INSERT INTO sale_items (sale_id, product_name, barcode, qty, price, total) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
              [s.id, item.product_name, item.barcode, item.qty, item.price, item.total]
            );
          }

          db.run("UPDATE sales SET is_synced = 1 WHERE id = ?", [s.id]);
        } catch (e) { console.error("Push Error:", e.message); }
      }

      // --- 2. PULL SALES FOR RECOVERY ---
      const cloudSales = await client.query("SELECT * FROM sales");
      for (let s of cloudSales.rows) {
        const officialId = s.local_id || s.id;
        db.run(`INSERT OR IGNORE INTO sales (id, total, received, change_amount, method, sale_date, is_synced) VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [officialId, s.total, s.received, s.change_amount, s.method, s.sale_date]
        );
      }

      // --- 3. PULL SALE ITEMS (FIXED: PREVENTS DUPLICATION) ---
      const cloudItems = await client.query("SELECT * FROM sale_items");
      for (let item of cloudItems.rows) {
        // Only insert if this specific item row doesn't exist for this sale
        const itemExists = await new Promise((res) =>
          db.get("SELECT id FROM sale_items WHERE sale_id = ? AND barcode = ? AND qty = ?",
            [item.sale_id, item.barcode, item.qty], (err, row) => res(row))
        );

        if (!itemExists) {
          db.run(`INSERT INTO sale_items (sale_id, product_name, barcode, qty, price, total) VALUES (?, ?, ?, ?, ?, ?)`,
            [item.sale_id, item.product_name, item.barcode, item.qty, item.price, item.total]);
        }
      }

      // --- 4. PULL PRODUCTS ---
      const cloudProds = await client.query("SELECT * FROM products");
      for (const cp of cloudProds.rows) {
        db.run(`INSERT OR REPLACE INTO products 
          (barcode, name, brand, category, size, unit_type, sale_price, stock_quantity, created_at, is_synced) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [cp.barcode, cp.name, cp.brand, cp.category, cp.size, cp.unit_type, cp.sale_price, cp.stock_quantity, cp.created_at]
        );
      }

      await client.end();
      console.log("✅ Full Mirror Sync Complete.");

      // Notify UI to refresh
      import('electron').then(({ BrowserWindow }) => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          windows[0].webContents.send('database-updated');
        }
      });

    } catch (error) {
      console.log("☁️ Sync Paused: Connection Issue.");
    }
  }, 15000);
};
