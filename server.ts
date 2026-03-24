import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'erp-secret-key';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Database setup
  const db = await open({
    filename: './erp.db',
    driver: sqlite3.Database
  });

  // Initialize tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Staff',
      permissions TEXT -- JSON string of allowed module IDs
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT,
      unit TEXT,
      price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 10,
      hsn_sac TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      state_id INTEGER,
      FOREIGN KEY (state_id) REFERENCES states(id)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      state_id INTEGER,
      FOREIGN KEY (state_id) REFERENCES states(id)
    );
  `);

  // Migration: Ensure state_id exists in customers and suppliers (for existing databases)
  try {
    await db.run('ALTER TABLE customers ADD COLUMN state_id INTEGER');
  } catch (e) { /* Column might already exist */ }
  try {
    await db.run('ALTER TABLE suppliers ADD COLUMN state_id INTEGER');
  } catch (e) { /* Column might already exist */ }

  try {
    await db.run('ALTER TABLE sale_schedules ADD COLUMN delivery_date DATE');
  } catch (e) { /* Column might already exist */ }
  try {
    await db.run('ALTER TABLE purchase_schedules ADD COLUMN delivery_date DATE');
  } catch (e) { /* Column might already exist */ }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total_amount REAL,
      tax_amount REAL,
      status TEXT DEFAULT 'Completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS production_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      status TEXT DEFAULT 'Pending',
      start_date DATE,
      end_date DATE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS bom (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finished_product_id INTEGER,
      raw_material_id INTEGER,
      quantity_required REAL,
      FOREIGN KEY (finished_product_id) REFERENCES products(id),
      FOREIGN KEY (raw_material_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country_id INTEGER,
      FOREIGN KEY (country_id) REFERENCES countries(id)
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state_id INTEGER,
      FOREIGN KEY (state_id) REFERENCES states(id)
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS gate_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_no TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      vehicle_no TEXT,
      supplier_id INTEGER,
      item_description TEXT,
      quantity REAL,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS mrn (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mrn_no TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      gate_entry_id INTEGER,
      supplier_id INTEGER,
      product_id INTEGER,
      quantity_received REAL,
      quantity_accepted REAL,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (gate_entry_id) REFERENCES gate_entries(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sale_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      customer_id INTEGER,
      total_amount REAL DEFAULT 0,
      discount_total REAL DEFAULT 0,
      tax_total REAL DEFAULT 0,
      cgst_total REAL DEFAULT 0,
      sgst_total REAL DEFAULT 0,
      igst_total REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      order_effective_from DATE,
      order_effective_till DATE,
      amendment_date DATE,
      amendment_effective_date DATE,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_order_id INTEGER,
      product_id INTEGER,
      quantity REAL,
      unit_price REAL,
      discount REAL DEFAULT 0,
      hsn_sac TEXT,
      cgst_rate REAL DEFAULT 0,
      sgst_rate REAL DEFAULT 0,
      igst_rate REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      amount REAL,
      FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sale_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_order_id INTEGER,
      product_id INTEGER,
      quantity REAL,
      delivery_date DATE,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      supplier_id INTEGER,
      total_amount REAL DEFAULT 0,
      discount_total REAL DEFAULT 0,
      tax_total REAL DEFAULT 0,
      cgst_total REAL DEFAULT 0,
      sgst_total REAL DEFAULT 0,
      igst_total REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      order_effective_from DATE,
      order_effective_till DATE,
      amendment_date DATE,
      amendment_effective_date DATE,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER,
      product_id INTEGER,
      quantity REAL,
      unit_price REAL,
      discount REAL DEFAULT 0,
      hsn_sac TEXT,
      cgst_rate REAL DEFAULT 0,
      sgst_rate REAL DEFAULT 0,
      igst_rate REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      amount REAL,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER,
      product_id INTEGER,
      quantity REAL,
      delivery_date DATE,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS production_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_no TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      production_order_id INTEGER,
      product_id INTEGER,
      quantity_produced REAL,
      operator_name TEXT,
      FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Migration: Add permissions column if it doesn't exist
  try {
    await db.run('ALTER TABLE users ADD COLUMN permissions TEXT');
  } catch (e) {
    // Column likely already exists
  }

  // Create default admin if not exists
  const adminExists = await db.get('SELECT * FROM users WHERE email = ?', ['admin@nexus.erp']);
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const allPermissions = JSON.stringify(['dashboard', 'inventory', 'sales', 'purchase', 'production', 'reports', 'master', 'admin', 'settings']);
    await db.run('INSERT INTO users (name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)', 
      ['Admin User', 'admin@nexus.erp', hashedPassword, 'Admin', allPermissions]);

    // Sample Products
    await db.run('INSERT INTO products (name, sku, category, unit, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Industrial Motor', 'MOT-001', 'Machinery', 'pcs', 1200, 45, 10]);
    await db.run('INSERT INTO products (name, sku, category, unit, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Steel Plate 5mm', 'STL-005', 'Raw Material', 'sqm', 85, 120, 50]);
    await db.run('INSERT INTO products (name, sku, category, unit, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Control Panel V2', 'CP-V2', 'Electronics', 'pcs', 450, 8, 15]);
    await db.run('INSERT INTO products (name, sku, category, unit, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Hydraulic Pump', 'HYD-P', 'Machinery', 'pcs', 890, 12, 5]);

    // Sample Customers
    await db.run('INSERT INTO customers (name, email, phone, address, state_id) VALUES (?, ?, ?, ?, ?)',
      ['Global Manufacturing Ltd', 'contact@globalmfg.com', '+123456789', '123 Industrial Way', 1]);
    await db.run('INSERT INTO customers (name, email, phone, address, state_id) VALUES (?, ?, ?, ?, ?)',
      ['Tech Solutions Inc', 'info@techsolutions.com', '+987654321', '456 Tech Park', 2]);

    // Sample Suppliers
    await db.run('INSERT INTO suppliers (name, contact_person, email, phone, address, state_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['Global Tech Solutions', 'John Smith', 'john@globaltech.com', '123-456-7890', '789 Tech Hub', 1]);
    await db.run('INSERT INTO suppliers (name, contact_person, email, phone, address, state_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['Industrial Parts Co', 'Sarah Wilson', 'sarah@indparts.com', '555-0199', '456 Factory Lane', 3]);

    // Sample Sales
    await db.run('INSERT INTO sales (customer_id, total_amount, tax_amount) VALUES (?, ?, ?)', [1, 2400, 432]);
    await db.run('INSERT INTO sales (customer_id, total_amount, tax_amount) VALUES (?, ?, ?)', [2, 850, 153]);

    // Sample Production Orders
    await db.run('INSERT INTO production_orders (product_id, quantity, status, start_date) VALUES (?, ?, ?, ?)',
      [1, 20, 'In-Progress', '2026-03-20']);
    await db.run('INSERT INTO production_orders (product_id, quantity, status, start_date) VALUES (?, ?, ?, ?)',
      [3, 50, 'Pending', '2026-03-25']);

    // Sample Masters
    await db.run('INSERT INTO countries (name, code) VALUES (?, ?)', ['India', 'IN']);
    await db.run('INSERT INTO states (name, country_id) VALUES (?, ?)', ['Maharashtra', 1]);
    await db.run('INSERT INTO states (name, country_id) VALUES (?, ?)', ['Gujarat', 1]);
    await db.run('INSERT INTO states (name, country_id) VALUES (?, ?)', ['Karnataka', 1]);
    await db.run('INSERT INTO cities (name, state_id) VALUES (?, ?)', ['Mumbai', 1]);
    await db.run('INSERT INTO cities (name, state_id) VALUES (?, ?)', ['Ahmedabad', 2]);
    await db.run('INSERT INTO units (name, short_name) VALUES (?, ?)', ['Pieces', 'pcs']);
    await db.run('INSERT INTO units (name, short_name) VALUES (?, ?)', ['Kilograms', 'kg']);
    await db.run('INSERT INTO taxes (name, rate, description) VALUES (?, ?, ?)', ['GST 18%', 18, 'Standard GST']);
    await db.run('INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)', ['Cash Account', 'Asset', 5000]);
  }

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Bypass for production demo if requested
    if (process.env.NODE_ENV === 'production' && token === 'demo-token') {
      req.user = { 
        id: 0, 
        email: 'demo@nexus.erp', 
        role: 'Admin', 
        permissions: JSON.stringify(['dashboard', 'inventory', 'sales', 'purchase', 'production', 'reports', 'master', 'admin', 'settings']) 
      };
      return next();
    }

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, permissions: user.permissions }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions ? JSON.parse(user.permissions) : [] } });
  });

  // Admin: User Management API
  app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') return res.sendStatus(403);
    const users = await db.all('SELECT id, name, email, role, permissions FROM users');
    const parsedUsers = users.map(u => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : []
    }));
    res.json(parsedUsers);
  });

  app.post('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') return res.sendStatus(403);
    const { name, email, password, role, permissions } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const permsString = JSON.stringify(permissions || []);
      await db.run('INSERT INTO users (name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role, permsString]);
      res.status(201).json({ message: 'User created' });
    } catch (e: any) {
      res.status(400).json({ message: e.message || 'Error creating user' });
    }
  });

  app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') return res.sendStatus(403);
    const { name, email, role, permissions, password } = req.body;
    try {
      const permsString = JSON.stringify(permissions || []);
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('UPDATE users SET name=?, email=?, role=?, permissions=?, password=? WHERE id=?',
          [name, email, role, permsString, hashedPassword, req.params.id]);
      } else {
        await db.run('UPDATE users SET name=?, email=?, role=?, permissions=? WHERE id=?',
          [name, email, role, permsString, req.params.id]);
      }
      res.json({ message: 'User updated' });
    } catch (e: any) {
      res.status(400).json({ message: e.message || 'Error updating user' });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') return res.sendStatus(403);
    try {
      await db.run('DELETE FROM users WHERE id=?', [req.params.id]);
      res.json({ message: 'User deleted' });
    } catch (e) {
      res.status(400).json({ message: 'Error deleting user' });
    }
  });

  // Products API
  app.get('/api/products', authenticateToken, async (req, res) => {
    const products = await db.all('SELECT * FROM products');
    res.json(products);
  });

  app.post('/api/products', authenticateToken, async (req, res) => {
    const { name, sku, category, unit, price, stock, min_stock } = req.body;
    try {
      await db.run('INSERT INTO products (name, sku, category, unit, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, sku, category, unit, price, stock, min_stock]);
      res.status(201).json({ message: 'Product created' });
    } catch (e: any) {
      console.error('Error creating product:', e);
      res.status(400).json({ message: e.message || 'Error creating product' });
    }
  });

  app.put('/api/products/:id', authenticateToken, async (req, res) => {
    const { name, sku, category, unit, price, stock, min_stock } = req.body;
    try {
      await db.run('UPDATE products SET name=?, sku=?, category=?, unit=?, price=?, stock=?, min_stock=? WHERE id=?',
        [name, sku, category, unit, price, stock, min_stock, req.params.id]);
      res.json({ message: 'Product updated' });
    } catch (e: any) {
      console.error('Error updating product:', e);
      res.status(400).json({ message: e.message || 'Error updating product' });
    }
  });

  app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
      await db.run('DELETE FROM products WHERE id=?', [req.params.id]);
      res.json({ message: 'Product deleted' });
    } catch (e) {
      res.status(400).json({ message: 'Error deleting product' });
    }
  });

  // Inventory Alerts
  app.get('/api/inventory/alerts', authenticateToken, async (req, res) => {
    const alerts = await db.all('SELECT * FROM products WHERE stock <= min_stock');
    res.json(alerts);
  });

  // Sales API
  app.get('/api/sales', authenticateToken, async (req, res) => {
    const sales = await db.all(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
    `);
    res.json(sales);
  });

  app.post('/api/sales', authenticateToken, async (req, res) => {
    const { customer_id, items, total_amount, tax_amount } = req.body;
    const result = await db.run('INSERT INTO sales (customer_id, total_amount, tax_amount) VALUES (?, ?, ?)',
      [customer_id, total_amount, tax_amount]);
    const saleId = result.lastID;

    for (const item of items) {
      await db.run('INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, item.unit_price]);
      await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }
    res.status(201).json({ id: saleId });
  });

  // Production API
  app.get('/api/production', authenticateToken, async (req, res) => {
    const orders = await db.all(`
      SELECT po.*, p.name as product_name 
      FROM production_orders po 
      JOIN products p ON po.product_id = p.id
    `);
    res.json(orders);
  });

  app.post('/api/production', authenticateToken, async (req, res) => {
    const { product_id, quantity, start_date } = req.body;
    try {
      await db.run('INSERT INTO production_orders (product_id, quantity, start_date) VALUES (?, ?, ?)',
        [product_id, quantity, start_date]);
      res.status(201).json({ message: 'Production order created' });
    } catch (e: any) {
      console.error('Error creating production order:', e);
      res.status(400).json({ message: e.message || 'Error creating production order' });
    }
  });

  // BOM API
  app.get('/api/bom', authenticateToken, async (req, res) => {
    const boms = await db.all(`
      SELECT b.*, p1.name as finished_product_name, p2.name as raw_material_name 
      FROM bom b
      JOIN products p1 ON b.finished_product_id = p1.id
      JOIN products p2 ON b.raw_material_id = p2.id
    `);
    res.json(boms);
  });

  app.post('/api/bom', authenticateToken, async (req, res) => {
    const { finished_product_id, raw_material_id, quantity_required } = req.body;
    try {
      await db.run('INSERT INTO bom (finished_product_id, raw_material_id, quantity_required) VALUES (?, ?, ?)',
        [finished_product_id, raw_material_id, quantity_required]);
      res.status(201).json({ message: 'BOM entry created' });
    } catch (e) {
      res.status(400).json({ message: 'Error creating BOM entry' });
    }
  });

  app.put('/api/bom/:id', authenticateToken, async (req, res) => {
    const { finished_product_id, raw_material_id, quantity_required } = req.body;
    try {
      await db.run('UPDATE bom SET finished_product_id=?, raw_material_id=?, quantity_required=? WHERE id=?',
        [finished_product_id, raw_material_id, quantity_required, req.params.id]);
      res.json({ message: 'BOM updated' });
    } catch (e) {
      res.status(400).json({ message: 'Error updating BOM' });
    }
  });

  app.delete('/api/bom/:id', authenticateToken, async (req, res) => {
    try {
      await db.run('DELETE FROM bom WHERE id=?', [req.params.id]);
      res.json({ message: 'BOM deleted' });
    } catch (e) {
      res.status(400).json({ message: 'Error deleting BOM' });
    }
  });

  // Settings API
  app.get('/api/settings', authenticateToken, async (req, res) => {
    const settings = await db.all('SELECT * FROM settings');
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  // Detailed Sale Orders API
  app.get('/api/sale_orders', authenticateToken, async (req, res) => {
    try {
      const orders = await db.all(`
        SELECT so.*, c.name as customer_name, c.state_id as customer_state_id
        FROM sale_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        ORDER BY so.date DESC
      `);
      
      for (const order of orders) {
        const items = await db.all(`
          SELECT soi.*, p.name as product_name, p.sku as product_sku, p.unit as product_unit
          FROM sale_order_items soi
          JOIN products p ON soi.product_id = p.id
          WHERE soi.sale_order_id = ?
        `, [order.id]);
        order.items = items;
      }
      res.json(orders);
    } catch (e: any) {
      console.error('Error fetching sale orders:', e);
      res.status(500).json({ message: e.message || 'Error fetching sale orders' });
    }
  });

  app.post('/api/sale_orders', authenticateToken, async (req, res) => {
    const { 
      order_no, date, customer_id, items, total_amount, discount_total, tax_total, 
      cgst_total, sgst_total, igst_total, grand_total, status,
      order_effective_from, order_effective_till, amendment_date, amendment_effective_date
    } = req.body;
    try {
      const result = await db.run(`
        INSERT INTO sale_orders (
          order_no, date, customer_id, total_amount, discount_total, tax_total, 
          cgst_total, sgst_total, igst_total, grand_total, status,
          order_effective_from, order_effective_till, amendment_date, amendment_effective_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        order_no, date, customer_id, total_amount, discount_total, tax_total, 
        cgst_total, sgst_total, igst_total, grand_total, status || 'Pending',
        order_effective_from, order_effective_till, amendment_date, amendment_effective_date
      ]);
      
      const orderId = result.lastID;
      for (const item of items) {
        await db.run(`
          INSERT INTO sale_order_items (sale_order_id, product_id, quantity, unit_price, discount, hsn_sac, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.unit_price, item.discount, item.hsn_sac, item.cgst_rate, item.sgst_rate, item.igst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount, item.amount]);
      }
      res.status(201).json({ id: orderId });
    } catch (e: any) {
      console.error('Error creating sale order:', e);
      res.status(400).json({ message: e.message || 'Error creating sale order' });
    }
  });

  app.put('/api/sale_orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { 
      order_no, date, customer_id, items, total_amount, discount_total, tax_total, 
      cgst_total, sgst_total, igst_total, grand_total, status,
      order_effective_from, order_effective_till, amendment_date, amendment_effective_date
    } = req.body;
    try {
      await db.run(`
        UPDATE sale_orders SET
          order_no = ?, date = ?, customer_id = ?, total_amount = ?, discount_total = ?, tax_total = ?, 
          cgst_total = ?, sgst_total = ?, igst_total = ?, grand_total = ?, status = ?,
          order_effective_from = ?, order_effective_till = ?, amendment_date = ?, amendment_effective_date = ?
        WHERE id = ?
      `, [
        order_no, date, customer_id, total_amount, discount_total, tax_total, 
        cgst_total, sgst_total, igst_total, grand_total, status,
        order_effective_from, order_effective_till, amendment_date, amendment_effective_date,
        id
      ]);
      
      // Replace items
      await db.run('DELETE FROM sale_order_items WHERE sale_order_id = ?', [id]);
      for (const item of items) {
        await db.run(`
          INSERT INTO sale_order_items (sale_order_id, product_id, quantity, unit_price, discount, hsn_sac, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, item.product_id, item.quantity, item.unit_price, item.discount, item.hsn_sac, item.cgst_rate, item.sgst_rate, item.igst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount, item.amount]);
      }
      res.json({ message: 'Sale order updated' });
    } catch (e: any) {
      console.error('Error updating sale order:', e);
      res.status(400).json({ message: e.message || 'Error updating sale order' });
    }
  });

  app.delete('/api/sale_orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      await db.run('DELETE FROM sale_order_items WHERE sale_order_id = ?', [id]);
      await db.run('DELETE FROM sale_orders WHERE id = ?', [id]);
      res.json({ message: 'Sale order deleted' });
    } catch (e: any) {
      console.error('Error deleting sale order:', e);
      res.status(400).json({ message: e.message || 'Error deleting sale order' });
    }
  });

  // Detailed Purchase Orders API
  app.get('/api/purchase_orders', authenticateToken, async (req, res) => {
    try {
      const orders = await db.all(`
        SELECT po.*, s.name as supplier_name, s.state_id as supplier_state_id
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.date DESC
      `);
      
      for (const order of orders) {
        const items = await db.all(`
          SELECT poi.*, p.name as product_name, p.sku as product_sku, p.unit as product_unit
          FROM purchase_order_items poi
          JOIN products p ON poi.product_id = p.id
          WHERE poi.purchase_order_id = ?
        `, [order.id]);
        order.items = items;
      }
      res.json(orders);
    } catch (e: any) {
      console.error('Error fetching purchase orders:', e);
      res.status(500).json({ message: e.message || 'Error fetching purchase orders' });
    }
  });

  app.post('/api/purchase_orders', authenticateToken, async (req, res) => {
    const { 
      order_no, date, supplier_id, items, total_amount, discount_total, tax_total, 
      cgst_total, sgst_total, igst_total, grand_total, status,
      order_effective_from, order_effective_till, amendment_date, amendment_effective_date
    } = req.body;
    try {
      const result = await db.run(`
        INSERT INTO purchase_orders (
          order_no, date, supplier_id, total_amount, discount_total, tax_total, 
          cgst_total, sgst_total, igst_total, grand_total, status,
          order_effective_from, order_effective_till, amendment_date, amendment_effective_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        order_no, date, supplier_id, total_amount, discount_total, tax_total, 
        cgst_total, sgst_total, igst_total, grand_total, status || 'Pending',
        order_effective_from, order_effective_till, amendment_date, amendment_effective_date
      ]);
      
      const orderId = result.lastID;
      for (const item of items) {
        await db.run(`
          INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, discount, hsn_sac, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.unit_price, item.discount, item.hsn_sac, item.cgst_rate, item.sgst_rate, item.igst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount, item.amount]);
      }
      res.status(201).json({ id: orderId });
    } catch (e: any) {
      console.error('Error creating purchase order:', e);
      res.status(400).json({ message: e.message || 'Error creating purchase order' });
    }
  });

  app.put('/api/purchase_orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { 
      order_no, date, supplier_id, items, total_amount, discount_total, tax_total, 
      cgst_total, sgst_total, igst_total, grand_total, status,
      order_effective_from, order_effective_till, amendment_date, amendment_effective_date
    } = req.body;
    try {
      await db.run(`
        UPDATE purchase_orders SET
          order_no = ?, date = ?, supplier_id = ?, total_amount = ?, discount_total = ?, tax_total = ?, 
          cgst_total = ?, sgst_total = ?, igst_total = ?, grand_total = ?, status = ?,
          order_effective_from = ?, order_effective_till = ?, amendment_date = ?, amendment_effective_date = ?
        WHERE id = ?
      `, [
        order_no, date, supplier_id, total_amount, discount_total, tax_total, 
        cgst_total, sgst_total, igst_total, grand_total, status,
        order_effective_from, order_effective_till, amendment_date, amendment_effective_date,
        id
      ]);
      
      // Replace items
      await db.run('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
      for (const item of items) {
        await db.run(`
          INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, discount, hsn_sac, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, item.product_id, item.quantity, item.unit_price, item.discount, item.hsn_sac, item.cgst_rate, item.sgst_rate, item.igst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount, item.amount]);
      }
      res.json({ message: 'Purchase order updated' });
    } catch (e: any) {
      console.error('Error updating purchase order:', e);
      res.status(400).json({ message: e.message || 'Error updating purchase order' });
    }
  });

  app.delete('/api/purchase_orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      await db.run('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
      await db.run('DELETE FROM purchase_orders WHERE id = ?', [id]);
      res.json({ message: 'Purchase order deleted' });
    } catch (e: any) {
      console.error('Error deleting purchase order:', e);
      res.status(400).json({ message: e.message || 'Error deleting purchase order' });
    }
  });

  // Generic Master API
  const masters = [
    'accounts', 'taxes', 'countries', 'states', 'cities', 'units', 
    'gate_entries', 'mrn', 'sale_schedules', 
    'purchase_schedules', 'production_entries',
    'suppliers', 'customers'
  ];
  masters.forEach(master => {
    app.get(`/api/${master}`, authenticateToken, async (req, res) => {
      try {
        let query = `SELECT * FROM ${master}`;
        if (master === 'states') query = `SELECT s.*, c.name as country_name FROM states s JOIN countries c ON s.country_id = c.id`;
        if (master === 'cities') query = `SELECT ci.*, st.name as state_name FROM cities ci JOIN states st ON ci.state_id = st.id`;
        if (master === 'mrn') {
          query = `
            SELECT m.*, ge.entry_no as gate_entry_no, s.name as supplier_name, p.name as product_name 
            FROM mrn m
            LEFT JOIN gate_entries ge ON m.gate_entry_id = ge.id
            LEFT JOIN suppliers s ON m.supplier_id = s.id
            LEFT JOIN products p ON m.product_id = p.id
          `;
        } else if (master === 'gate_entries') {
          query = `
            SELECT ge.*, s.name as supplier_name 
            FROM gate_entries ge
            LEFT JOIN suppliers s ON ge.supplier_id = s.id
          `;
        } else if (master === 'sale_schedules') {
          query = `
            SELECT ss.*, so.order_no, p.name as product_name 
            FROM sale_schedules ss
            LEFT JOIN sale_orders so ON ss.sale_order_id = so.id
            LEFT JOIN products p ON ss.product_id = p.id
          `;
        } else if (master === 'purchase_schedules') {
          query = `
            SELECT ps.*, po.order_no, p.name as product_name 
            FROM purchase_schedules ps
            LEFT JOIN purchase_orders po ON ps.purchase_order_id = po.id
            LEFT JOIN products p ON ps.product_id = p.id
          `;
        } else if (master === 'production_entries') {
          query = `
            SELECT pe.*, po.id as production_order_id, p.name as product_name 
            FROM production_entries pe
            LEFT JOIN production_orders po ON pe.production_order_id = po.id
            LEFT JOIN products p ON pe.product_id = p.id
          `;
        }
        
        const data = await db.all(query);
        res.json(data);
      } catch (e: any) {
        console.error(`Error fetching ${master}:`, e);
        res.status(500).json({ message: e.message || `Error fetching ${master}` });
      }
    });

    app.post(`/api/${master}`, authenticateToken, async (req, res) => {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map(() => '?').join(',');
      try {
        await db.run(`INSERT INTO ${master} (${keys.join(',')}) VALUES (${placeholders})`, values);
        res.status(201).json({ message: `${master} created` });
      } catch (e: any) {
        console.error(`Error creating ${master}:`, e);
        res.status(400).json({ message: e.message || `Error creating ${master}` });
      }
    });

    app.put(`/api/${master}/:id`, authenticateToken, async (req, res) => {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const setClause = keys.map(k => `${k}=?`).join(',');
      try {
        await db.run(`UPDATE ${master} SET ${setClause} WHERE id=?`, [...values, req.params.id]);
        res.json({ message: `${master} updated` });
      } catch (e: any) {
        console.error(`Error updating ${master}:`, e);
        res.status(400).json({ message: e.message || `Error updating ${master}` });
      }
    });

    app.delete(`/api/${master}/:id`, authenticateToken, async (req, res) => {
      try {
        await db.run(`DELETE FROM ${master} WHERE id=?`, [req.params.id]);
        res.json({ message: `${master} deleted` });
      } catch (e: any) {
        console.error(`Error deleting ${master}:`, e);
        res.status(400).json({ message: e.message || `Error deleting ${master}` });
      }
    });
  });

  // Dashboard Metrics
  app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
    const salesCount = await db.get('SELECT COUNT(*) as count FROM sales');
    const totalRevenue = await db.get('SELECT SUM(total_amount) as total FROM sales');
    const lowStockCount = await db.get('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock');
    const activeProduction = await db.get('SELECT COUNT(*) as count FROM production_orders WHERE status != "Completed"');
    
    res.json({
      salesCount: salesCount.count,
      totalRevenue: totalRevenue.total || 0,
      lowStockCount: lowStockCount.count,
      activeProduction: activeProduction.count
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
