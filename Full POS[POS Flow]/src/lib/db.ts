// Type declarations for the Electron bridge
declare global {
  interface Window {
    electronAPI?: {
      dbQuery: (sql: string, params?: any[]) => Promise<any>;
      dbTransaction: (statements: { sql: string; params?: any[] }[]) => Promise<any[]>;
      deleteSale: (saleId: string) => Promise<void>;
      deletePurchase: (invoiceId: string) => Promise<void>;
      saveFile: (content: string, filename: string, filters?: any[]) => Promise<boolean>;
      openFile: (filters?: any[]) => Promise<string | null>;
    };
  }
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode?: string;
  stock: number;
  category_id?: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PurchaseInvoice {
  id: string;
  supplier: string;
  invoice_ref: string;
  total: number;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  cost: number;
}

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      calendar: 'gregory'
    });
  } catch (e) {
    return dateString;
  }
};

const uuid = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

const api = () => {
  if (!window.electronAPI) {
    const msg = 'Electron API not available. Make sure you are running inside Electron.';
    console.warn(msg);
    throw new Error(msg);
  }
  return window.electronAPI;
};

export const dbService = {
  // ─── Categories ───────────────────────────────────────────────
  getCategories: (): Promise<Category[]> =>
    api().dbQuery('SELECT * FROM categories ORDER BY name'),

  addCategory: (cat: Omit<Category, 'id'>): Promise<any> => {
    const id = uuid();
    return api().dbQuery(
      'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
      [id, cat.name, cat.color]
    );
  },

  updateCategory: (id: string, cat: Partial<Category>): Promise<any> =>
    api().dbQuery(
      'UPDATE categories SET name = ?, color = ? WHERE id = ?',
      [cat.name, cat.color, id]
    ),

  deleteCategory: (id: string): Promise<any> =>
    api().dbQuery('DELETE FROM categories WHERE id = ?', [id]),

  // ─── Products ─────────────────────────────────────────────────
  getProducts: (): Promise<Product[]> =>
    api().dbQuery('SELECT * FROM products ORDER BY name'),

  addProduct: (product: Omit<Product, 'id'>): Promise<any> => {
    const id = uuid();
    const params = [
      id,
      product.name || 'Unnamed Product',
      Number(product.price) || 0,
      product.barcode || null,
      Number(product.stock) || 0,
      product.category_id || null
    ];
    console.log('[POS] dbService.addProduct params:', params);
    return api().dbQuery(
      'INSERT INTO products (id, name, price, barcode, stock, category_id) VALUES (?, ?, ?, ?, ?, ?)',
      params
    );
  },

  updateProduct: (id: string, product: Partial<Omit<Product, 'id'>>): Promise<any> =>
    api().dbQuery(
      'UPDATE products SET name = ?, price = ?, barcode = ?, stock = ?, category_id = ? WHERE id = ?',
      [product.name, product.price, product.barcode ?? null, product.stock, product.category_id ?? null, id]
    ),

  deleteProduct: (id: string): Promise<any> =>
    api().dbQuery('DELETE FROM products WHERE id = ?', [id]),

  getProductByBarcode: (barcode: string): Promise<Product | undefined> =>
    api().dbQuery('SELECT * FROM products WHERE barcode = ? LIMIT 1', [barcode])
         .then((rows: Product[]) => rows[0]),

  updateStock: (productId: string, delta: number): Promise<any> =>
    api().dbQuery(
      'UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?',
      [delta, productId]
    ),

  // ─── Sales ────────────────────────────────────────────────────
  getSales: (): Promise<Sale[]> =>
    api().dbQuery('SELECT * FROM sales ORDER BY created_at DESC'),

  getSaleItems: (saleId: string): Promise<SaleItem[]> =>
    api().dbQuery('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]),

  saveSale: async (invoiceNumber: string, total: number, items: any[]): Promise<string> => {
    const saleId = uuid();
    const statements = [
      {
        sql: 'INSERT INTO sales (id, invoice_number, total) VALUES (?, ?, ?)',
        params: [saleId, invoiceNumber, total],
      },
      ...items.map((item) => ({
        sql: 'INSERT INTO sale_items (id, sale_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        params: [uuid(), saleId, item.id, item.name, item.price, item.quantity],
      })),
      // Decrement stock for each item
      ...items.map((item) => ({
        sql: 'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?',
        params: [item.quantity, item.id],
      })),
    ];
    await api().dbTransaction(statements);
    return saleId;
  },

  // ─── Purchase Invoices ────────────────────────────────────────
  getPurchaseInvoices: (): Promise<PurchaseInvoice[]> =>
    api().dbQuery('SELECT * FROM purchase_invoices ORDER BY created_at DESC'),

  getPurchaseItems: (invoiceId: string): Promise<PurchaseItem[]> =>
    api().dbQuery('SELECT * FROM purchase_items WHERE invoice_id = ?', [invoiceId]),

  addPurchaseInvoice: async (
    supplier: string,
    invoiceRef: string,
    total: number,
    items: Omit<PurchaseItem, 'id' | 'invoice_id'>[]
  ): Promise<string> => {
    const invoiceId = uuid();
    const statements = [
      {
        sql: 'INSERT INTO purchase_invoices (id, supplier, invoice_ref, total) VALUES (?, ?, ?, ?)',
        params: [invoiceId, supplier, invoiceRef, total],
      },
      ...items.map((item) => ({
        sql: 'INSERT INTO purchase_items (id, invoice_id, product_id, product_name, quantity, cost) VALUES (?, ?, ?, ?, ?, ?)',
        params: [uuid(), invoiceId, item.product_id ?? null, item.product_name, item.quantity, item.cost],
      })),
      // Increment stock for each purchased item
      ...items
        .filter((item) => item.product_id)
        .map((item) => ({
          sql: 'UPDATE products SET stock = stock + ? WHERE id = ?',
          params: [item.quantity, item.product_id],
        })),
    ];
    await api().dbTransaction(statements);
    return invoiceId;
  },

  // ─── Reports ──────────────────────────────────────────────────
  getSalesSummary: (): Promise<{ date: string; total: number; count: number }[]> =>
    api().dbQuery(`
      SELECT DATE(created_at) as date,
             SUM(total)       as total,
             COUNT(*)         as count
      FROM sales
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `),

  getTopProducts: (): Promise<{ name: string; total_qty: number; total_revenue: number }[]> =>
    api().dbQuery(`
      SELECT si.name,
             SUM(si.quantity)           as total_qty,
             SUM(si.price * si.quantity) as total_revenue
      FROM sale_items si
      GROUP BY si.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `),

  deleteSale: (saleId: string): Promise<void> => api().deleteSale(saleId),

  deletePurchaseInvoice: (invoiceId: string): Promise<void> => api().deletePurchase(invoiceId),

  // ─── Settings ─────────────────────────────────────────────────
  getSettings: async (): Promise<Record<string, string>> => {
    const rows = await api().dbQuery('SELECT key, value FROM settings');
    return rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  },

  updateSetting: (key: string, value: string): Promise<any> =>
    api().dbQuery('UPDATE settings SET value = ? WHERE key = ?', [value, key]),

  restoreBackup: async (data: { sales: any[], sale_items: any[] }): Promise<void> => {
    const statements: any[] = [];
    
    // Clear existing (Optional, but safer for "restore")
    // statements.push({ sql: 'DELETE FROM sale_items', params: [] });
    // statements.push({ sql: 'DELETE FROM sales', params: [] });

    for (const sale of data.sales) {
      statements.push({
        sql: 'INSERT OR REPLACE INTO sales (id, invoice_number, total, created_at) VALUES (?, ?, ?, ?)',
        params: [sale.id, sale.invoice_number, sale.total, sale.created_at]
      });
    }
    for (const item of data.sale_items) {
      statements.push({
        sql: 'INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        params: [item.id, item.sale_id, item.product_id, item.name, item.price, item.quantity]
      });
    }
    await api().dbTransaction(statements);
  },
};
