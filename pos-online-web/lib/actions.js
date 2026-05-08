"use server";
import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';

const sql = neon(process.env.DATABASE_URL);

// --- 1. DASHBOARD ANALYTICS ---
export async function getDashboardStats() {
  const stats = await sql`
    SELECT 
      SUM(total) as total_sales, 
      COUNT(id) as total_orders,
      SUM(CASE WHEN method = 'CASH' THEN total ELSE 0 END) as cash_sales,
      SUM(CASE WHEN method = 'ONLINE' THEN total ELSE 0 END) as online_sales
    FROM sales 
    WHERE date(sale_date) = CURRENT_DATE
  `;
  const lowStock = await sql`SELECT * FROM products WHERE stock_quantity < 10 LIMIT 5`;
  return { stats: stats[0], lowStock };
}

// --- 2. INVENTORY MANAGEMENT ---
export async function getProducts() {
  return await sql`SELECT * FROM products ORDER BY created_at DESC`;
}

export async function saveProduct(data, isEditing) {
  try {
    if (isEditing) {
      await sql`
        UPDATE products SET 
          name = ${data.name}, brand = ${data.brand}, category = ${data.category}, 
          size = ${data.size}, unit_type = ${data.unit}, sale_price = ${data.price}, 
          stock_quantity = ${data.stock}
        WHERE barcode = ${data.barcode}`;
    } else {
      await sql`
        INSERT INTO products (barcode, name, brand, category, size, unit_type, sale_price, stock_quantity)
        VALUES (${data.barcode}, ${data.name}, ${data.brand}, ${data.category}, ${data.size}, ${data.unit}, ${data.price}, ${data.stock})`;
    }
    revalidatePath('/inventory');
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

export async function deleteProduct(barcode) {
  await sql`DELETE FROM products WHERE barcode = ${barcode}`;
  revalidatePath('/inventory');
  return { success: true };
}

// --- 3. SALES HISTORY ---
export async function getSalesHistory(filter = 'all') {
  let query = sql`SELECT * FROM sales`;
  
  if (filter === 'today') {
    return await sql`SELECT * FROM sales WHERE date(sale_date) = CURRENT_DATE ORDER BY sale_date DESC`;
  } else if (filter === 'yesterday') {
    return await sql`SELECT * FROM sales WHERE date(sale_date) = CURRENT_DATE - INTERVAL '1 day' ORDER BY sale_date DESC`;
  }
  
  return await sql`SELECT * FROM sales ORDER BY sale_date DESC`;
}

// --- 4. SETTINGS ---
export async function getSetting(key) {
  const res = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return res[0]?.value || "";
}

export async function saveSetting(key, value) {
  await sql`
    INSERT INTO settings (key, value) 
    VALUES (${key}, ${value}) 
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  revalidatePath('/settings');
  return { success: true };
}

export async function getProductByBarcode(barcode) {
  const res = await sql`SELECT * FROM products WHERE barcode = ${barcode} LIMIT 1`;
  return res[0] || null;
}

export async function saveSaleAction(saleData) {
  // 1. Save the sale first. Neon will give us a real ID.
  const [newSale] = await sql`
    INSERT INTO sales (total, received, change_amount, method) 
    VALUES (${saleData.total}, ${saleData.received}, ${saleData.change}, ${saleData.method})
    RETURNING id
  `;
  
  const officialId = newSale.id;

  // 2. Also set local_id to match the official id for sync consistency
  await sql`UPDATE sales SET local_id = ${officialId} WHERE id = ${officialId}`;

  // 3. Save items using that same official ID
  for (const item of saleData.items) {
    await sql`
      INSERT INTO sale_items (sale_id, product_name, barcode, qty, price, total)
      VALUES (${officialId}, ${item.name}, ${item.barcode}, ${item.qty}, ${item.sale_price}, ${item.sale_price * item.qty})
    `;
  }

  return { success: true };
}



// Add these to app/lib/actions.js
export async function getDashboardData() {
  // 1. Get Financials for Today
  const stats = await sql`
    SELECT 
      COALESCE(SUM(total), 0) as total_sales, 
      COUNT(id) as total_orders,
      COALESCE(SUM(CASE WHEN method = 'CASH' THEN total ELSE 0 END), 0) as cash_total,
      COALESCE(SUM(CASE WHEN method = 'ONLINE' THEN total ELSE 0 END), 0) as online_total
    FROM sales 
    WHERE date(sale_date) = CURRENT_DATE
  `;

  // 2. Get Sync Status (Local vs Cloud check)
  const productSync = await sql`
    SELECT 
      COUNT(*) as total_products,
      SUM(CASE WHEN stock_quantity < 10 THEN 1 ELSE 0 END) as low_stock_count
    FROM products
  `;

// 3. Get Low Stock Products (Top 3 for dashboard)
  const lowStock = await sql`
    SELECT name, barcode, stock_quantity 
    FROM products 
    WHERE stock_quantity < 10 
    ORDER BY stock_quantity ASC 
    LIMIT 3
  `;

  // 4. Get Recent Activity
  const recentSales = await sql`SELECT * FROM sales ORDER BY sale_date DESC LIMIT 5`;

  return { 
    stats: stats[0], 
    products: productSync[0],
    lowStock,
    recentSales 
  };
}

export async function getSaleItems(saleId) {
  // We match against local_id if you are using that mapping
  return await sql`SELECT * FROM sale_items WHERE sale_id = ${saleId}`;
}
