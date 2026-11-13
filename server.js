/**
 * PNN COMPUTER & CELLPHONE SHOP - Upgraded Node.js Server
 * Full-stack Express.js Application with MySQL2 Student CRUD & Storefront
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initializeDatabase } = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// ==========================================================================
// Middleware Configuration
// ==========================================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public directory and project root
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// ==========================================================================
// Student CRUD Routes (Migrated from resources/ PHP)
// ==========================================================================
app.use('/', studentRoutes);

// Compatibility redirect from old PHP path: /resources/read.php -> /students
app.get('/resources/read.php', (req, res) => res.redirect('/students'));
app.get('/resources/create.php', (req, res) => res.redirect('/students/create'));
app.get('/resources/update.php', (req, res) => {
  const id = req.query.id;
  res.redirect(id ? `/students/edit/${id}` : '/students');
});

// ==========================================================================
// Storefront Root Route
// ==========================================================================
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// ==========================================================================
// Storefront REST API Routes (Products, Orders, Coupons, Analytics)
// ==========================================================================

function readJsonFile(filename, defaultData = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return defaultData;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return defaultData;
  }
}

function writeJsonFile(filename, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

// GET /api/products — Catalog
app.get('/api/products', (req, res) => {
  let products = readJsonFile('products.json');
  const { category, search } = req.query;

  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: products.length, data: products });
});

// GET /api/products/:id — Single product
app.get('/api/products/:id', (req, res) => {
  const products = readJsonFile('products.json');
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json({ success: true, data: product });
  } else {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
});

// POST /api/products — Add product
app.post('/api/products', (req, res) => {
  const body = req.body;
  if (!body.name || !body.price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }

  const products = readJsonFile('products.json');
  const newProduct = {
    id: 'p' + Date.now(),
    name: body.name,
    category: body.category || 'laptop',
    categoryLabel: (body.category || 'laptop').toUpperCase(),
    price: parseFloat(body.price),
    originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : parseFloat(body.price) * 1.15,
    rating: body.rating || 5.0,
    reviewsCount: 1,
    badge: body.badge || 'new',
    badgeText: body.badgeText || 'New Arrival',
    isBestSeller: Boolean(body.isBestSeller),
    image: body.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=700&q=80',
    thumbnails: body.thumbnails || ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=700&q=80'],
    colors: body.colors || [{ name: 'Standard', hex: '#0070f3' }],
    summary: body.summary || 'High performance tech hardware.',
    specs: body.specs || { Brand: 'PNN Tech', Warranty: '1-Year Official Warranty' }
  };

  products.unshift(newProduct);
  writeJsonFile('products.json', products);
  res.status(201).json({ success: true, data: newProduct });
});

// DELETE /api/products/:id — Delete product
app.delete('/api/products/:id', (req, res) => {
  let products = readJsonFile('products.json');
  const initialLen = products.length;
  products = products.filter(p => p.id !== req.params.id);
  if (products.length < initialLen) {
    writeJsonFile('products.json', products);
    res.json({ success: true, message: 'Product deleted' });
  } else {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
});

// GET /api/orders — Dispatch Orders
app.get('/api/orders', (req, res) => {
  const orders = readJsonFile('orders.json');
  res.json({ success: true, count: orders.length, data: orders });
});

// POST /api/orders — Place Order
app.post('/api/orders', (req, res) => {
  const orders = readJsonFile('orders.json');
  const newOrder = {
    id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    customer: req.body.customer || 'Customer',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    items: req.body.items || 'Hardware item',
    total: req.body.total || '$0.00',
    status: 'Processing',
    payment: req.body.payment || 'Credit Card'
  };

  orders.unshift(newOrder);
  writeJsonFile('orders.json', orders);
  res.status(201).json({ success: true, data: newOrder });
});

// PATCH /api/orders/:id — Update Status
app.patch('/api/orders/:id', (req, res) => {
  const orders = readJsonFile('orders.json');
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    if (req.body.status) order.status = req.body.status;
    writeJsonFile('orders.json', orders);
    res.json({ success: true, data: order });
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
});

// POST /api/coupons/validate — Student coupon
app.post('/api/coupons/validate', (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();
  if (code === 'STUDENT10') {
    res.json({ valid: true, code: 'STUDENT10', discountPercent: 10, message: '10% Discount applied!' });
  } else {
    res.status(400).json({ valid: false, message: 'Invalid promo code' });
  }
});

// GET /api/stats — Analytics
app.get('/api/stats', (req, res) => {
  const products = readJsonFile('products.json');
  const orders = readJsonFile('orders.json');
  const revenue = orders.reduce((sum, o) => {
    const num = parseFloat((o.total || '0').replace(/[^0-9.-]+/g, '')) || 0;
    return sum + num;
  }, 38878);

  res.json({
    success: true,
    stats: {
      totalRevenue: '$' + revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      ordersCount: orders.length,
      activeProducts: products.length,
      customerSatisfaction: '99.4%'
    }
  });
});

// ==========================================================================
// 404 & Global Error Handlers
// ==========================================================================
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>404 Not Found</title><link rel="stylesheet" href="/css/styles.css"></head>
    <body style="font-family: sans-serif; text-align: center; padding: 5rem 1rem;">
      <h1 style="font-size: 3rem; color: #0070f3;">404</h1>
      <p style="font-size: 1.2rem; color: #64748b;">The requested page could not be found.</p>
      <div style="margin-top: 1.5rem;">
        <a href="/" class="btn-primary" style="margin-right: 0.5rem; text-decoration: none;">Go to Storefront</a>
        <a href="/students" class="btn-secondary" style="text-decoration: none; border: 1px solid #cbd5e1; color: #334155;">Student Records CRUD</a>
      </div>
    </body>
    </html>
  `);
});

app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// ==========================================================================
// Server Start & DB Initialization
// ==========================================================================
async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 PNN TECH & STUDENT CRUD - Node.js Express Server`);
    console.log(`  🌐 Website URL:     http://localhost:${PORT}`);
    console.log(`  🎓 Student CRUD:    http://localhost:${PORT}/students`);
    console.log(`  ⚡ Student REST:    http://localhost:${PORT}/api/students`);
    console.log(`  🛒 Products API:    http://localhost:${PORT}/api/products`);
    console.log(`======================================================\n`);
  });
}

startServer();
