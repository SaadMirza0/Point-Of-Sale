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
          await client.query(
            "INSERT INTO sales (local_id, total, received, change_amount, method, sale_date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (local_id) DO NOTHING",
            [s.id, s.total, s.received, s.change_amount, s.method, s.sale_date]
          );

          // B. Fetch and Push the specific Items for this sale
          const items = await new Promise((res) =>
            db.all("SELECT * FROM sale_items WHERE sale_id = ?", [s.id], (err, r) => res(r || []))
          );

          for (const item of items) {
            await client.query(
              "INSERT INTO sale_items (sale_id, product_name, barcode, qty, price, total) VALUES ($1, $2, $3, $4, $5, $6)",
              [s.id, item.product_name, item.barcode, item.qty, item.price, item.total]
            );
          }

          // C. Mark as synced locally
          db.run("UPDATE sales SET is_synced = 1 WHERE id = ?", [s.id]);
        } catch (e) { console.error("Push Error:", e.message); }
      }

      // --- 2. PULL SALES FOR RECOVERY/SYNC ---
      // Inside your syncService loop (PULL SALES section)
      const cloudSales = await client.query("SELECT * FROM sales");
      for (let s of cloudSales.rows) {
        // Use the real Cloud ID as the ID on the PC
        const officialId = s.id;

        db.run(`INSERT OR IGNORE INTO sales 
    (id, total, received, change_amount, method, sale_date, is_synced) 
    VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [officialId, s.total, s.received, s.change_amount, s.method, s.sale_date]
        );
      }


      // --- 3. PULL SALE ITEMS ---
      const cloudItems = await client.query("SELECT * FROM sale_items");
      for (let item of cloudItems.rows) {
        db.run(`INSERT OR IGNORE INTO sale_items (sale_id, product_name, barcode, qty, price, total) VALUES (?, ?, ?, ?, ?, ?)`,
          [item.sale_id, item.product_name, item.barcode, item.qty, item.price, item.total]);
      }

      // --- 4. PULL PRODUCTS (Keep Inventory Identical) ---
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

      import('electron').then(({ BrowserWindow }) => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          windows[0].webContents.send('database-updated');
        }
      });

    } catch (error) {
      console.log("☁️ Sync Paused: Connection Issue.");
    }
  }, 30000); // every 30 seconds
};


