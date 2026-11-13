# PNN Computer & Cellphone Shop 💻📱

Official online store and management portal for **PNN Computer and Cellphone Shop**, built precisely according to the [Figma Design: PNN-COMPUTER-SHOP-2](https://www.figma.com/design/yjOcheGxFvDdqOmRjbQdiR/PNN-COMPUTER-SHOP-2).

---

## 🚀 Quick Start with Node.js

### 1. Run the Server
You can start the Node.js server immediately without installing any external packages (runs on native Node.js HTTP/FS/Path modules):

```bash
node server.js
```

Or using npm:
```bash
npm start
```

For live reload development (Node 18+):
```bash
npm run dev
```

### 2. Open in Your Browser
Once the server starts, open:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ Don't Have Node.js Installed Yet?
If Node.js is not yet installed on your Windows machine:
1. Download the recommended LTS installer from **[https://nodejs.org](https://nodejs.org)**.
2. Run the installer and check the box to add Node.js to your `PATH`.
3. Open a new terminal in this folder and run `npm start`.

> **Note**: You can also open `index.html` directly by double-clicking it in Windows Explorer anytime—the storefront works in both standalone offline mode and full Node.js API mode!

---

## 📂 Project Architecture

```
PNN computer project/
├── package.json          # Node.js project manifest & scripts
├── server.js             # Dual-engine Node.js backend server & static asset host
├── data/
│   ├── products.json     # Product catalog database (Laptops, Desktops, Phones, Accessories)
│   └── orders.json       # Admin dispatch & customer orders database
├── public/               # Served static web root
│   ├── index.html        # Main storefront UI & responsive components
│   ├── css/
│   │   └── styles.css    # Figma design tokens, cyber blue aesthetic, responsive grid
│   └── js/
│       └── app.js        # Dynamic catalog, cart drawer, checkout, and admin logic
├── index.html            # Standalone root entry for instant double-click preview
├── css/
│   └── styles.css
└── js/
    └── app.js
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Retrieve all products (Supports `?category=...&search=...`) |
| `GET` | `/api/products/:id` | Retrieve single product details & technical specifications |
| `POST` | `/api/products` | Add new product to inventory (Admin) |
| `DELETE` | `/api/products/:id` | Remove product from inventory (Admin) |
| `GET` | `/api/orders` | Retrieve delivery dispatch orders (Admin) |
| `POST` | `/api/orders` | Place a new customer order (Checkout) |
| `PATCH` | `/api/orders/:id` | Update order delivery status (*Pending*, *Processing*, *Shipped*, *Delivered*) |
| `POST` | `/api/coupons/validate` | Validate promo code (e.g. `STUDENT10` for 10% discount) |
| `GET` | `/api/stats` | Retrieve revenue, active inventory, and dispatch counters |

---

## 🎯 Figma Design Features Implemented

* **Student Promo Announcement Bar**: Red banner with one-click copyable coupon `STUDENT10`.
* **Futuristic Cyber Aesthetics**: Electric Blue (`#0070F3`), Neon Teal (`#00E5FF`), Dark Slate Midnight cards, and circuit patterns.
* **Featured Best Sellers**:
  1. 2024 Laptop Computer Ultra ($1,999.00)
  2. Pro RGB 7.1 Gaming Headset ($1,398.00)
  3. HP HyperSpeed Gaming Mouse ($989.00)
  4. ASUS ROG Gaming Desktop Rig ($1,899.00)
* **Product Detail Page (PDP) Modal**: Multi-angle image preview, 6-color variant picker, full specifications table, quantity stepper, and "Add to Cart" / "Buy Now".
* **Multi-Step Checkout Flow**: Address input ➔ Shipping selection ➔ Payment method (Credit Card, GCash, COD) ➔ Order confirmation & tracking ID receipt.
* **Admin Dispatch & Inventory Portal**: Live sales revenue, product catalog CRUD, and order status tracking.
* **Mobile Responsive**: Compact layout with sticky bottom navigation (Home, Shop, Cart, Account).
