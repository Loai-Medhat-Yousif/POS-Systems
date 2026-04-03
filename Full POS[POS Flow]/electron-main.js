const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let db;

function initDatabase() {
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'pos.db');
    console.log('[POS] Database path:', dbPath);
    db = new Database(dbPath);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6B7280'
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL DEFAULT 0,
        barcode TEXT,
        stock INTEGER DEFAULT 0,
        category_id TEXT,
        FOREIGN KEY(category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL,
        total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY(sale_id) REFERENCES sales(id)
      );

      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id TEXT PRIMARY KEY,
        supplier TEXT,
        invoice_ref TEXT,
        total REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        cost REAL NOT NULL,
        FOREIGN KEY(invoice_id) REFERENCES purchase_invoices(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      );
    `);

    // Insert default settings if they don't exist
    const settings = [
      { key: 'shop_name', value: 'متجري الذكي' },
      { key: 'shop_address', value: 'العنوان هنا' },
    ];

    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (id, key, value) VALUES (?, ?, ?)');
    for (const s of settings) {
      insertSetting.run(require('crypto').randomUUID(), s.key, s.value);
    }

    // Migration / Correction: ensure columns exist in case table was created with old schema
    try { db.exec("ALTER TABLE products ADD COLUMN barcode TEXT;"); } catch (e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN category_id TEXT;"); } catch (e) {}

    console.log('[POS] Database initialized successfully.');
  } catch (err) {
    console.error('[POS] Failed to initialize database:', err);
    dialog.showErrorBox('Database Error', `Failed to open the database:\n\n${err.message}\n\nThe application will now exit.`);
    app.quit();
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 870,
    minWidth: 1024,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Pos Flow',
    show: false,
    autoHideMenuBar: true,
  });

  // Remove menu bar completely
  win.setMenuBarVisibility(false);

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:8080');
    win.webContents.openDevTools();
  } else {
    // In production, load from the app directory
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath).catch((err) => {
      console.error('[POS] Failed to load index.html:', err);
      // Fallback: try relative to __dirname
      win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }
}

// IPC handler: generic query
ipcMain.handle('db-query', async (_event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const upperSql = sql.trim().toUpperCase();
    if (upperSql.startsWith('SELECT')) {
      return stmt.all(...params);
    } else {
      const info = stmt.run(...params);
      console.log(`[POS] Query Success: ${sql}`, params);
      return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    }
  } catch (error) {
    console.error('[POS] DB error:', error.message, '| SQL:', sql, '| Params:', params);
    // In dev mode, show a dialog for easier debugging
    if (isDev) {
      dialog.showErrorBox('Database Query Error', `Error: ${error.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
    }
    throw error;
  }
});

// IPC handler: run multiple statements in a transaction
ipcMain.handle('db-transaction', async (_event, statements) => {
  try {
    const runAll = db.transaction((stmts) => {
      const results = [];
      for (const { sql, params = [] } of stmts) {
        const stmt = db.prepare(sql);
        const info = stmt.run(...params);
        results.push({ lastInsertRowid: info.lastInsertRowid, changes: info.changes });
      }
      return results;
    });
    return runAll(statements);
  } catch (error) {
    console.error('[POS] Transaction error:', error.message);
    throw error;
  }
});

// IPC handler: Delete Sale
ipcMain.handle('db-delete-sale', async (_event, saleId) => {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId);
    db.prepare('DELETE FROM sales WHERE id = ?').run(saleId);
  });
  return transaction();
});

// IPC handler: Delete Purchase
ipcMain.handle('db-delete-purchase', async (_event, invoiceId) => {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM purchase_items WHERE invoice_id = ?').run(invoiceId);
    db.prepare('DELETE FROM purchase_invoices WHERE id = ?').run(invoiceId);
  });
  return transaction();
});

// IPC handler: Print
ipcMain.handle('print', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.webContents.print({ silent: false, printBackground: true });
});

// IPC handler: Save File
ipcMain.handle('save-file', async (event, content, filename, filters) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'حفظ الملف',
    defaultPath: filename,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
});

// IPC handler: Open File
ipcMain.handle('open-file', async (event, filters) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'فتح ملف',
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  if (filePaths && filePaths.length > 0) {
    return fs.readFileSync(filePaths[0], 'utf-8');
  }
  return null;
});

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  // Enable auto-launch for production builds on Windows
  if (!isDev && process.platform === 'win32') {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe'),
      });
      console.log('[POS] Auto-launch enabled.');
    } catch (err) {
      console.error('[POS] Failed to set login item settings:', err);
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
