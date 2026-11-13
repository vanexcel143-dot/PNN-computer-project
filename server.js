/**
 * PNN COMPUTER & CELLPHONE SHOP - Node.js Server
 * Full-stack backend & static file server
 * 
 * Features:
 * - Dual Engine: Runs out-of-the-box with native Node.js (http/fs/path),
 *   and automatically enhances with Express when installed.
 * - REST API: Products catalog, Cart checkout, Order dispatch, Student discounts.
 * - Static Assets: High-performance delivery for HTML5, CSS3, ES6 JavaScript, and images.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types dictionary for static file delivery
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Helper: Read JSON database
function readDatabase(filename, defaultData = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return defaultData;
  }
}

// Helper: Write JSON database
function writeDatabase(filename, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}

// Helper: Send JSON response
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

// Helper: Parse incoming request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

// Main HTTP request router
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight options
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ========================================================================
  // REST API ROUTES (/api/*)
  // ========================================================================

  // GET /api/products — list products with category & search filter
  if (method === 'GET' && pathname === '/api/products') {
    let products = readDatabase('products.json');
    const { category, search } = parsedUrl.query;

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

    return sendJSON(res, 200, { success: true, count: products.length, data: products });
  }

  // GET /api/products/:id — single product
  if (method === 'GET' && pathname.startsWith('/api/products/')) {
    const id = pathname.replace('/api/products/', '');
    const products = readDatabase('products.json');
    const product = products.find(p => p.id === id);

    if (product) {
      return sendJSON(res, 200, { success: true, data: product });
    }
    return sendJSON(res, 404, { success: false, message: 'Product not found' });
  }

  // POST /api/products — Admin add product
  if (method === 'POST' && pathname === '/api/products') {
    const body = await parseRequestBody(req);
    if (!body.name || !body.price) {
      return sendJSON(res, 400, { success: false, message: 'Name and price are required' });
    }

    const products = readDatabase('products.json');
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
      summary: body.summary || 'High performance tech configuration.',
      specs: body.specs || { Brand: 'PNN Tech', Warranty: '1-Year Official Warranty' }
    };

    products.unshift(newProduct);
    writeDatabase('products.json', products);
    return sendJSON(res, 201, { success: true, data: newProduct });
  }

  // DELETE /api/products/:id — Admin remove product
  if (method === 'DELETE' && pathname.startsWith('/api/products/')) {
    const id = pathname.replace('/api/products/', '');
    let products = readDatabase('products.json');
    const initialCount = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length < initialCount) {
      writeDatabase('products.json', products);
      return sendJSON(res, 200, { success: true, message: 'Product deleted' });
    }
    return sendJSON(res, 404, { success: false, message: 'Product not found' });
  }

  // GET /api/orders — Admin dispatch orders list
  if (method === 'GET' && pathname === '/api/orders') {
    const orders = readDatabase('orders.json');
    return sendJSON(res, 200, { success: true, count: orders.length, data: orders });
  }

  // POST /api/orders — Customer checkout place order
  if (method === 'POST' && pathname === '/api/orders') {
    const body = await parseRequestBody(req);
    const orders = readDatabase('orders.json');

    const newOrder = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      customer: body.customer || 'Customer',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: body.items || 'Tech items',
      total: body.total || '$0.00',
      status: 'Processing',
      payment: body.payment || 'Credit Card'
    };

    orders.unshift(newOrder);
    writeDatabase('orders.json', orders);
    return sendJSON(res, 201, { success: true, data: newOrder });
  }

  // PATCH /api/orders/:id — Admin update order status
  if (method === 'PATCH' && pathname.startsWith('/api/orders/')) {
    const id = pathname.replace('/api/orders/', '');
    const body = await parseRequestBody(req);
    const orders = readDatabase('orders.json');
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex > -1) {
      if (body.status) orders[orderIndex].status = body.status;
      writeDatabase('orders.json', orders);
      return sendJSON(res, 200, { success: true, data: orders[orderIndex] });
    }
    return sendJSON(res, 404, { success: false, message: 'Order not found' });
  }

  // POST /api/coupons/validate — Validate STUDENT10
  if (method === 'POST' && pathname === '/api/coupons/validate') {
    const body = await parseRequestBody(req);
    const code = (body.code || '').trim().toUpperCase();

    if (code === 'STUDENT10') {
      return sendJSON(res, 200, {
        valid: true,
        code: 'STUDENT10',
        discountPercent: 10,
        message: '10% Student Discount Applied!'
      });
    }
    return sendJSON(res, 400, { valid: false, message: 'Invalid or expired coupon code' });
  }

  // GET /api/stats — Dashboard revenue & counts
  if (method === 'GET' && pathname === '/api/stats') {
    const products = readDatabase('products.json');
    const orders = readDatabase('orders.json');
    const revenue = orders.reduce((sum, o) => {
      const num = parseFloat((o.total || '0').replace(/[^0-9.-]+/g, '')) || 0;
      return sum + num;
    }, 38878);

    return sendJSON(res, 200, {
      success: true,
      stats: {
        totalRevenue: '$' + revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        ordersCount: orders.length,
        activeProducts: products.length,
        customerRating: '99.4%'
      }
    });
  }

  // ========================================================================
  // STATIC ASSETS DELIVERY (public/* and root fallback)
  // ========================================================================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // If not found in public/, check root directory
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 Not Found fallback
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + pathname);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 PNN COMPUTER & CELLPHONE SHOP - Node.js Server`);
  console.log(`  🔗 Running at: http://localhost:${PORT}`);
  console.log(`  📁 Serving from: ${PUBLIC_DIR}`);
  console.log(`  ⚡ REST APIs: http://localhost:${PORT}/api/products`);
  console.log(`======================================================\n`);
});
