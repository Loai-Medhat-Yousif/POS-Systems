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
      calendar: 'gregory',
    });
  } catch (e) {
    return dateString;
  }
};

const uuid = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

// ─── In-memory mock for browser / dev mode (no Electron) ─────────────────────
const memDB = {
  categories: [] as Category[],
  products: [] as Product[],
  sales: [] as Sale[],
  saleItems: [] as SaleItem[],
  purchaseInvoices: [] as PurchaseInvoice[],
  purchaseItems: [] as PurchaseItem[],
  settings: {} as Record<string, string>,
};

const mockQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const s = sql.trim().toUpperCase().replace(/\s+/g, ' ');

  // ── Categories ──────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM CATEGORIES'))
    return [...memDB.categories].sort((a, b) => a.name.localeCompare(b.name));

  if (s.startsWith('INSERT INTO CATEGORIES')) {
    const [id, name, color] = params;
    memDB.categories.push({ id, name, color });
    return { changes: 1 };
  }
  if (s.startsWith('UPDATE CATEGORIES')) {
    const [name, color, id] = params;
    const c = memDB.categories.find((x) => x.id === id);
    if (c) { c.name = name; c.color = color; }
    return { changes: 1 };
  }
  if (s.startsWith('DELETE FROM CATEGORIES')) {
    memDB.categories = memDB.categories.filter((x) => x.id !== params[0]);
    return { changes: 1 };
  }

  // ── Products ────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM PRODUCTS ORDER BY NAME'))
    return [...memDB.products].sort((a, b) => a.name.localeCompare(b.name));

  if (s.startsWith('SELECT * FROM PRODUCTS WHERE BARCODE')) {
    return memDB.products.filter((x) => x.barcode === params[0]);
  }
  if (s.startsWith('INSERT INTO PRODUCTS')) {
    const [id, name, price, barcode, stock, category_id] = params;
    memDB.products.push({ id, name, price, barcode, stock, category_id });
    return { changes: 1 };
  }
  if (s.startsWith('UPDATE PRODUCTS SET NAME')) {
    const [name, price, barcode, stock, category_id, id] = params;
    const p = memDB.products.find((x) => x.id === id);
    if (p) Object.assign(p, { name, price, barcode, stock, category_id });
    return { changes: 1 };
  }
  if (s.startsWith('UPDATE PRODUCTS SET STOCK = MAX(0, STOCK +')) {
    const [delta, id] = params;
    const p = memDB.products.find((x) => x.id === id);
    if (p) p.stock = Math.max(0, p.stock + delta);
    return { changes: 1 };
  }
  if (s.startsWith('UPDATE PRODUCTS SET STOCK = MAX(0, STOCK -')) {
    const [delta, id] = params;
    const p = memDB.products.find((x) => x.id === id);
    if (p) p.stock = Math.max(0, p.stock - delta);
    return { changes: 1 };
  }
  if (s.startsWith('UPDATE PRODUCTS SET STOCK = STOCK +')) {
    const [delta, id] = params;
    const p = memDB.products.find((x) => x.id === id);
    if (p) p.stock = p.stock + delta;
    return { changes: 1 };
  }
  if (s.startsWith('DELETE FROM PRODUCTS')) {
    memDB.products = memDB.products.filter((x) => x.id !== params[0]);
    return { changes: 1 };
  }

  // ── Sales ───────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM SALES'))
    return [...memDB.sales].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  if (s.startsWith('SELECT * FROM SALE_ITEMS WHERE SALE_ID'))
    return memDB.saleItems.filter((x) => x.sale_id === params[0]);

  if (s.startsWith('INSERT INTO SALES')) {
    const [id, invoice_number, total] = params;
    memDB.sales.push({ id, invoice_number, total, created_at: new Date().toISOString() });
    return { changes: 1 };
  }
  if (s.startsWith('INSERT INTO SALE_ITEMS')) {
    const [id, sale_id, product_id, name, price, quantity] = params;
    memDB.saleItems.push({ id, sale_id, product_id, name, price, quantity });
    return { changes: 1 };
  }
  if (s.startsWith('DELETE FROM SALE_ITEMS WHERE SALE_ID')) {
    memDB.saleItems = memDB.saleItems.filter((x) => x.sale_id !== params[0]);
    return { changes: 1 };
  }
  if (s.startsWith('DELETE FROM SALES WHERE ID')) {
    memDB.sales = memDB.sales.filter((x) => x.id !== params[0]);
    return { changes: 1 };
  }

  // ── Purchase Invoices ───────────────────────────────────────
  if (s.startsWith('SELECT * FROM PURCHASE_INVOICES'))
    return [...memDB.purchaseInvoices].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  if (s.startsWith('SELECT * FROM PURCHASE_ITEMS WHERE INVOICE_ID'))
    return memDB.purchaseItems.filter((x) => x.invoice_id === params[0]);

  if (s.startsWith('INSERT INTO PURCHASE_INVOICES')) {
    const [id, supplier, invoice_ref, total] = params;
    memDB.purchaseInvoices.push({ id, supplier, invoice_ref, total, created_at: new Date().toISOString() });
    return { changes: 1 };
  }
  if (s.startsWith('INSERT INTO PURCHASE_ITEMS')) {
    const [id, invoice_id, product_id, product_name, quantity, cost] = params;
    memDB.purchaseItems.push({ id, invoice_id, product_id, product_name, quantity, cost });
    return { changes: 1 };
  }
  if (s.startsWith('DELETE FROM PURCHASE_ITEMS WHERE INVOICE_ID')) {
    memDB.purchaseItems = memDB.purchaseItems.filter((x) => x.invoice_id !== params[0]);
    return { changes: 1 };
  }
  if (s.startsWith('DELETE FROM PURCHASE_INVOICES WHERE ID')) {
    memDB.purchaseInvoices = memDB.purchaseInvoices.filter((x) => x.id !== params[0]);
    return { changes: 1 };
  }

  // ── Reports ─────────────────────────────────────────────────
  if (s.includes('GROUP BY DATE(CREATED_AT)')) {
    const map = new Map<string, { total: number; count: number }>();
    memDB.sales.forEach((sale) => {
      const date = sale.created_at.slice(0, 10);
      const cur = map.get(date) ?? { total: 0, count: 0 };
      map.set(date, { total: cur.total + sale.total, count: cur.count + 1 });
    });
    return [...map.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  }
  if (s.includes('GROUP BY SI.NAME')) {
    const map = new Map<string, { total_qty: number; total_revenue: number }>();
    memDB.saleItems.forEach((si) => {
      const cur = map.get(si.name) ?? { total_qty: 0, total_revenue: 0 };
      map.set(si.name, {
        total_qty: cur.total_qty + si.quantity,
        total_revenue: cur.total_revenue + si.price * si.quantity,
      });
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10);
  }

  // ── Settings ────────────────────────────────────────────────
  if (s.startsWith('SELECT KEY, VALUE FROM SETTINGS'))
    return Object.entries(memDB.settings).map(([key, value]) => ({ key, value }));

  if (s.startsWith('UPDATE SETTINGS SET VALUE')) {
    const [value, key] = params;
    memDB.settings[key] = value;
    return { changes: 1 };
  }

  // ── INSERT OR REPLACE (backup restore) ──────────────────────
  if (s.startsWith('INSERT OR REPLACE INTO SALES')) {
    const [id, invoice_number, total, created_at] = params;
    const idx = memDB.sales.findIndex((x) => x.id === id);
    const row = { id, invoice_number, total, created_at };
    if (idx >= 0) memDB.sales[idx] = row; else memDB.sales.push(row);
    return { changes: 1 };
  }
  if (s.startsWith('INSERT OR REPLACE INTO SALE_ITEMS')) {
    const [id, sale_id, product_id, name, price, quantity] = params;
    const idx = memDB.saleItems.findIndex((x) => x.id === id);
    const row = { id, sale_id, product_id, name, price, quantity };
    if (idx >= 0) memDB.saleItems[idx] = row; else memDB.saleItems.push(row);
    return { changes: 1 };
  }

  console.warn('[MOCK] Unhandled SQL:', sql, params);
  return [];
};

const mockTransaction = async (
  statements: { sql: string; params?: any[] }[]
): Promise<any[]> => {
  const results: any[] = [];
  for (const stmt of statements) {
    results.push(await mockQuery(stmt.sql, stmt.params ?? []));
  }
  return results;
};

const mockDeleteSale = async (saleId: string): Promise<void> => {
  await mockQuery('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
  await mockQuery('DELETE FROM sales WHERE id = ?', [saleId]);
};

const mockDeletePurchase = async (invoiceId: string): Promise<void> => {
  await mockQuery('DELETE FROM purchase_items WHERE invoice_id = ?', [invoiceId]);
  await mockQuery('DELETE FROM purchase_invoices WHERE id = ?', [invoiceId]);
};
// ─────────────────────────────────────────────────────────────────────────────

const api = () => {
  if (!window.electronAPI) {
    console.info('[POS] Running in mock/browser mode — using in-memory DB');
    return {
      dbQuery: mockQuery,
      dbTransaction: mockTransaction,
      deleteSale: mockDeleteSale,
      deletePurchase: mockDeletePurchase,
      saveFile: async () => false,
      openFile: async () => null,
    };
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
      product.category_id || null,
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
    api()
      .dbQuery('SELECT * FROM products WHERE barcode = ? LIMIT 1', [barcode])
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

  restoreBackup: async (data: { sales: any[]; sale_items: any[] }): Promise<void> => {
    const statements: any[] = [];

    // Clear existing (Optional, but safer for "restore")
    // statements.push({ sql: 'DELETE FROM sale_items', params: [] });
    // statements.push({ sql: 'DELETE FROM sales', params: [] });

    for (const sale of data.sales) {
      statements.push({
        sql: 'INSERT OR REPLACE INTO sales (id, invoice_number, total, created_at) VALUES (?, ?, ?, ?)',
        params: [sale.id, sale.invoice_number, sale.total, sale.created_at],
      });
    }
    for (const item of data.sale_items) {
      statements.push({
        sql: 'INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        params: [item.id, item.sale_id, item.product_id, item.name, item.price, item.quantity],
      });
    }
    await api().dbTransaction(statements);
  },
};