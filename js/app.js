/**
 * PNN COMPUTER & CELLPHONE SHOP - Core Application Logic
 * Interactive Storefront, PDP Modal, Cart Drawer, Multi-Step Checkout, Auth, and Admin Dashboard
 * Seamlessly connects to Node.js backend REST API (/api/*) with local fallback.
 */

// Initial Product Catalog modeled from Figma (used as default / fallback)
const INITIAL_PRODUCTS = [
  {
    id: "p1",
    name: "2024 Laptop Computer Ultra",
    category: "laptop",
    categoryLabel: "Laptop",
    price: 1999.00,
    originalPrice: 2299.00,
    rating: 5.0,
    reviewsCount: 142,
    badge: "sale",
    badgeText: "Sale 13% Off",
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Space Gray", hex: "#4b5563" },
      { name: "Cyber Silver", hex: "#e2e8f0" },
      { name: "Midnight Black", hex: "#0f172a" },
      { name: "Electric Cyan", hex: "#00e5ff" }
    ],
    summary: "13th Gen Intel Core i7, 16GB DDR5, 1TB NVMe SSD, 15.6\" 144Hz IPS Display, RTX 4060.",
    specs: {
      "Brand": "PNN Tech / ASUS",
      "Model": "PNN Strix G16 2024",
      "Operating System": "Windows 11 Home 64-bit",
      "Processor": "Intel Core i7-13650HX (14 Cores, up to 4.9GHz)",
      "System Memory": "16GB DDR5 4800MHz Dual-Channel",
      "Storage": "1TB M.2 NVMe PCIe 4.0 SSD",
      "Display Size": "15.6-inch Full HD (1920 x 1080) 144Hz IPS",
      "Graphics GPU": "NVIDIA GeForce RTX 4060 8GB GDDR6",
      "Web Camera": "720p HD with Privacy Shutter",
      "Ports": "1x Thunderbolt 4, 1x USB-C, 2x USB 3.2, HDMI 2.1, RJ-45",
      "Warranty": "1-Year Official PNN Manufacturer Warranty"
    }
  },
  {
    id: "p2",
    name: "Pro RGB 7.1 Gaming Headset",
    category: "peripherals",
    categoryLabel: "Peripherals",
    price: 1398.00,
    originalPrice: 1599.00,
    rating: 5.0,
    reviewsCount: 98,
    badge: "hot",
    badgeText: "Best Seller",
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Matte Black", hex: "#111827" },
      { name: "Neon Blue", hex: "#0070f3" },
      { name: "Cyber White", hex: "#ffffff" }
    ],
    summary: "True 7.1 Spatial Surround Sound, 50mm Titanium Drivers, Detachable AI Noise-Cancelling Mic.",
    specs: {
      "Brand": "PNN Audio / HyperX",
      "Model": "Cloud Alpha Cyber 7.1",
      "Driver Diameter": "50mm Dynamic Neodymium",
      "Frequency Response": "13Hz – 27,000Hz",
      "Microphone": "Detachable Noise-Cancelling Bi-directional",
      "Connectivity": "Wireless 2.4GHz + 3.5mm Analog Audio",
      "Battery Life": "Up to 300 Hours on a Single Charge",
      "Lighting": "RGB Custom Prism Effects",
      "Warranty": "1-Year Official Replacement Warranty"
    }
  },
  {
    id: "p3",
    name: "HP HyperSpeed Gaming Mouse",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 989.00,
    originalPrice: 1199.00,
    rating: 5.0,
    reviewsCount: 76,
    badge: "hot",
    badgeText: "Top Rated",
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Obsidian Black", hex: "#1e293b" },
      { name: "Cyber Teal", hex: "#00c8ff" }
    ],
    summary: "16,000 DPI Optical Sensor, 1ms Ultra-Low Latency Wireless, 6 Programmable Macro Buttons.",
    specs: {
      "Brand": "HP Omen / PNN",
      "Model": "Vector Wireless Pro",
      "Sensor": "PixArt PMW3389 Optical (Up to 16,000 DPI)",
      "Polling Rate": "1000Hz (1ms response time)",
      "Switches": "Omron Mechanical (50 Million Clicks)",
      "Weight": "69g Ultra-lightweight Ergonomic Design",
      "Battery Life": "Up to 180 Hours (USB-C Fast Charging)",
      "Warranty": "1-Year Official Warranty"
    }
  },
  {
    id: "p4",
    name: "ASUS ROG Gaming Desktop Rig",
    category: "system_unit",
    categoryLabel: "System Unit",
    price: 1899.00,
    originalPrice: 2199.00,
    rating: 5.0,
    reviewsCount: 64,
    badge: "new",
    badgeText: "Flagship",
    isBestSeller: true,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Stealth Black", hex: "#0b0c10" },
      { name: "Titanium Silver", hex: "#94a3b8" }
    ],
    summary: "Intel Core i9-14900KF, 32GB DDR5 6000MHz, 2TB PCIe 4.0 SSD, RTX 4080 Super 16GB, Liquid Cooled.",
    specs: {
      "Brand": "ASUS ROG Strix / PNN Custom",
      "Model": "G35CA Gaming Station",
      "Processor": "Intel Core i9-14900KF (24 Cores, 32 Threads)",
      "Cooling": "360mm AIO ARGB Liquid Cooler",
      "RAM": "32GB (2x16GB) DDR5 6000MHz Corsair Vengeance",
      "GPU": "NVIDIA GeForce RTX 4080 Super 16GB GDDR6X",
      "Motherboard": "ASUS ROG Strix Z790-F Gaming WiFi",
      "Storage": "2TB Samsung 990 Pro NVMe PCIe 4.0 SSD",
      "Power Supply": "Corsair RM850e 850W Gold Fully Modular",
      "Case": "Dual Chamber Tempered Glass with 6 ARGB Fans",
      "Warranty": "2-Years Comprehensive Warranty + On-site Service"
    }
  },
  {
    id: "p5",
    name: "2024 Slim Ultrabook Pro",
    category: "laptop",
    categoryLabel: "Laptop",
    price: 999.00,
    originalPrice: 1199.00,
    rating: 4.9,
    reviewsCount: 88,
    badge: "sale",
    badgeText: "Popular",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Silver Metal", hex: "#cbd5e1" },
      { name: "Dark Indigo", hex: "#1e1b4b" }
    ],
    summary: "AMD Ryzen 7 7840HS, 16GB LPDDR5X, 512GB SSD, 14\" 2.8K OLED 120Hz display.",
    specs: {
      "Brand": "PNN Slimline",
      "Model": "ZenBook Ultra 14",
      "Operating System": "Windows 11 Home",
      "Processor": "AMD Ryzen 7 7840HS (8 Cores, 16 Threads)",
      "RAM": "16GB LPDDR5X 6400MHz",
      "Storage": "512GB NVMe M.2 SSD",
      "Display": "14-inch 2.8K (2880 x 1800) OLED 120Hz 100% DCI-P3",
      "Weight": "1.28 kg (Ultra-light)",
      "Battery": "75Wh with 65W Fast Charging (14hr Battery Life)",
      "Warranty": "1-Year International Warranty"
    }
  },
  {
    id: "p6",
    name: "Lenovo Legion Pro Gaming Laptop",
    category: "laptop",
    categoryLabel: "Laptop",
    price: 1444.00,
    originalPrice: 1699.00,
    rating: 4.8,
    reviewsCount: 115,
    badge: "hot",
    badgeText: "High Perf",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Storm Grey", hex: "#475569" },
      { name: "Glacier White", hex: "#f1f5f9" }
    ],
    summary: "Intel Core i7-14700HX, 16GB DDR5, RTX 4070 8GB, 16\" WQXGA 240Hz 500 nits HDR.",
    specs: {
      "Brand": "Lenovo Legion",
      "Model": "Legion Pro 5 Gen 9",
      "Processor": "Intel Core i7-14700HX",
      "GPU": "NVIDIA GeForce RTX 4070 8GB GDDR6 (140W TGP)",
      "RAM": "16GB DDR5 5600MHz",
      "Storage": "1TB SSD M.2 2280 PCIe 4.0",
      "Display": "16\" WQXGA (2560x1600) IPS 240Hz, 500nits, G-SYNC",
      "Warranty": "2-Years Legion Ultimate Support"
    }
  },
  {
    id: "p7",
    name: "PNN Cyber Rig Custom Build",
    category: "system_unit",
    categoryLabel: "System Unit",
    price: 1499.00,
    originalPrice: 1699.00,
    rating: 4.9,
    reviewsCount: 42,
    badge: "new",
    badgeText: "Custom Built",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Cyber White", hex: "#f8fafc" },
      { name: "Matte Black", hex: "#0f172a" }
    ],
    summary: "AMD Ryzen 7 7800X3D, RTX 4070 Ti, 32GB RGB DDR5, 1TB NVMe, Custom Glass Chassis.",
    specs: {
      "Brand": "PNN Custom Rig",
      "Model": "CyberStation V4",
      "Processor": "AMD Ryzen 7 7800X3D Gaming Processor",
      "Graphics": "NVIDIA RTX 4070 Ti 12GB OC Edition",
      "RAM": "32GB (2x16GB) DDR5 6000MHz RGB",
      "Storage": "1TB PCIe Gen4 NVMe M.2 SSD",
      "Motherboard": "B650 WiFi Gaming Board",
      "Power Supply": "750W 80+ Gold Certified",
      "Warranty": "2-Year Parts & Labor Warranty"
    }
  },
  {
    id: "p8",
    name: "Geekom Mini IT13 Core i9 Mini PC",
    category: "mini_pc",
    categoryLabel: "Mini PC",
    price: 699.00,
    originalPrice: 799.00,
    rating: 4.7,
    reviewsCount: 53,
    badge: "sale",
    badgeText: "Compact",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Deep Cobalt", hex: "#1e3a8a" },
      { name: "Space Gray", hex: "#475569" }
    ],
    summary: "Intel Core i9-13900H (14 cores), 32GB RAM, 2TB SSD, Dual 8K Display support, WiFi 6E.",
    specs: {
      "Brand": "Geekom / PNN",
      "Model": "Mini IT13 High-Performance",
      "Processor": "Intel Core i9-13900H (14 cores, up to 5.4GHz)",
      "RAM": "32GB DDR4 3200MHz Dual Channel (Up to 64GB)",
      "Storage": "2TB PCIe Gen4 M.2 SSD",
      "Display Outputs": "2x USB4 (8K@60Hz) + 2x HDMI 2.0 (4K@60Hz)",
      "Dimensions": "117 x 112 x 49.2 mm (Ultra Compact)",
      "Warranty": "1-Year Full Warranty"
    }
  },
  {
    id: "p9",
    name: "Samsung Galaxy S24 Ultra",
    category: "phone",
    categoryLabel: "Phone",
    price: 1199.00,
    originalPrice: 1299.00,
    rating: 5.0,
    reviewsCount: 184,
    badge: "hot",
    badgeText: "Flagship Phone",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Titanium Gray", hex: "#64748b" },
      { name: "Titanium Black", hex: "#0f172a" },
      { name: "Titanium Violet", hex: "#581c87" },
      { name: "Titanium Yellow", hex: "#ca8a04" }
    ],
    summary: "Snapdragon 8 Gen 3, Galaxy AI, 200MP Quad Telephoto Camera, 6.8\" Dynamic AMOLED 2X, S-Pen.",
    specs: {
      "Brand": "Samsung",
      "Model": "Galaxy S24 Ultra 5G",
      "Processor": "Qualcomm Snapdragon 8 Gen 3 for Galaxy",
      "RAM": "12GB LPDDR5X",
      "Storage": "512GB UFS 4.0",
      "Display": "6.8\" Flat QHD+ Dynamic AMOLED 2X, 1-120Hz, 2600 nits",
      "Camera": "200MP Main + 50MP 5x Tele + 10MP 3x Tele + 12MP Ultra-wide",
      "Battery": "5,000 mAh with 45W Fast Charging",
      "Warranty": "1-Year Official Samsung Philippines Warranty"
    }
  },
  {
    id: "p10",
    name: "Apple iPhone 15 Pro Max",
    category: "phone",
    categoryLabel: "Phone",
    price: 1299.00,
    originalPrice: 1399.00,
    rating: 5.0,
    reviewsCount: 210,
    badge: "sale",
    badgeText: "Hot Phone",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Natural Titanium", hex: "#94a3b8" },
      { name: "Blue Titanium", hex: "#1e3a8a" },
      { name: "Black Titanium", hex: "#18181b" },
      { name: "White Titanium", hex: "#f4f4f5" }
    ],
    summary: "A17 Pro 3nm chip, Aerospace Titanium design, 48MP Camera with 5x Telephoto, USB-C 10Gbps.",
    specs: {
      "Brand": "Apple",
      "Model": "iPhone 15 Pro Max",
      "Chip": "A17 Pro chip with 6-core GPU and Ray Tracing",
      "Storage": "256GB / 512GB",
      "Display": "6.7\" Super Retina XDR with ProMotion 120Hz & Always-On",
      "Camera": "Pro camera system (48MP Main, 12MP Ultra Wide, 12MP 5x Tele)",
      "Build": "Forged Titanium Frame with Ceramic Shield Front",
      "Warranty": "1-Year Apple Limited Warranty"
    }
  },
  {
    id: "p11",
    name: "RGB Mechanical Gaming Keyboard",
    category: "peripherals",
    categoryLabel: "Peripherals",
    price: 129.00,
    originalPrice: 159.00,
    rating: 4.9,
    reviewsCount: 65,
    badge: "hot",
    badgeText: "Hot Swap",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Cyberpunk Edition", hex: "#7c3aed" },
      { name: "Arctic White", hex: "#f1f5f9" }
    ],
    summary: "Hot-Swappable Linear Silver Switches, Gasket Mounted, Sound Dampening Foam, Per-key RGB.",
    specs: {
      "Brand": "PNN MechLab",
      "Model": "CyberKeys Pro 75%",
      "Switch Type": "Pre-lubed Custom Linear Silver Switches",
      "Layout": "75% Compact (82 Keys) + CNC Aluminum Knob",
      "Keycaps": "Double-shot PBT Cherry Profile",
      "Connectivity": "Tri-Mode (Bluetooth 5.1, 2.4GHz Wireless, USB-C)",
      "Battery": "4000mAh Rechargable Battery",
      "Warranty": "1-Year Replacement Warranty"
    }
  },
  {
    id: "p12",
    name: "27\" 240Hz 1ms Curved Gaming Monitor",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 349.00,
    originalPrice: 429.00,
    rating: 4.8,
    reviewsCount: 89,
    badge: "sale",
    badgeText: "240Hz Super Fast",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80"
    ],
    colors: [
      { name: "Dark Armor", hex: "#0f172a" }
    ],
    summary: "1500R Curvature, 2560x1440 QHD, 240Hz Refresh Rate, 0.5ms MPRT, AMD FreeSync Premium Pro.",
    specs: {
      "Brand": "PNN Vision / AOC",
      "Model": "Curved Thunder 27G",
      "Screen Size": "27-inch 1500R Curved Fast VA Panel",
      "Resolution": "QHD 2560 x 1440",
      "Refresh Rate": "240Hz via DisplayPort 1.4",
      "Response Time": "0.5ms (MPRT) / 1ms (GtG)",
      "Color Gamut": "125% sRGB, 95% DCI-P3, HDR400",
      "Ports": "2x HDMI 2.0, 2x DisplayPort 1.4, Audio Out",
      "Warranty": "3-Years Zero Bright Dot Warranty"
    }
  }
];

// Initial Admin Orders
const INITIAL_ORDERS = [
  {
    id: "ORD-9841",
    customer: "Mark Anthony Santos",
    date: "Nov 12, 2026",
    items: "2024 Laptop Computer Ultra (x1)",
    total: "$1,999.00",
    status: "Delivered",
    payment: "GCash"
  },
  {
    id: "ORD-9842",
    customer: "Kristine Joy Reyes",
    date: "Nov 13, 2026",
    items: "ASUS ROG Gaming Desktop Rig (x1)",
    total: "$1,899.00",
    status: "Processing",
    payment: "Credit Card"
  },
  {
    id: "ORD-9843",
    customer: "Carlos Miguel Mendoza",
    date: "Nov 13, 2026",
    items: "Pro RGB 7.1 Gaming Headset (x1), HP Gaming Mouse (x1)",
    total: "$2,387.00",
    status: "Pending",
    payment: "Cash on Delivery"
  },
  {
    id: "ORD-9844",
    customer: "Daphne Ramos",
    date: "Nov 13, 2026",
    items: "Samsung Galaxy S24 Ultra (x1)",
    total: "$1,199.00",
    status: "Shipped",
    payment: "PayPal"
  }
];

// State Management
const state = {
  products: JSON.parse(localStorage.getItem("pnn_products")) || INITIAL_PRODUCTS,
  cart: JSON.parse(localStorage.getItem("pnn_cart")) || [],
  orders: JSON.parse(localStorage.getItem("pnn_orders")) || INITIAL_ORDERS,
  activeCategory: "all",
  searchQuery: "",
  couponDiscount: parseFloat(localStorage.getItem("pnn_coupon_discount")) || 0,
  activeCouponCode: localStorage.getItem("pnn_coupon_code") || "",
  currentUser: JSON.parse(localStorage.getItem("pnn_user")) || null,
  activePdpProduct: null,
  selectedColorIndex: 0,
  pdpQuantity: 1,
  checkoutStep: 1,
  hasBackendAPI: false
};

// Check if running on Node.js server with REST APIs
async function checkBackendConnection() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        state.products = data.data;
        state.hasBackendAPI = true;
        renderBestSellers();
        renderCatalog();
        console.log("Connected to PNN Node.js REST API successfully.");
      }
    }
  } catch (err) {
    // Graceful fallback to client-side localStorage/INITIAL_PRODUCTS
    console.log("Running in standalone/offline mode.");
  }
}

// ==========================================================================
// RENDER FUNCTIONS
// ==========================================================================

function formatCurrency(amount) {
  return "$" + Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderBestSellers() {
  const container = document.getElementById("best-sellers-grid");
  if (!container) return;

  const bestSellers = state.products.filter(p => p.isBestSeller).slice(0, 4);
  container.innerHTML = bestSellers.map(product => createProductCardHTML(product)).join("");
}

function renderCatalog() {
  const container = document.getElementById("catalog-grid");
  if (!container) return;

  let filtered = state.products;

  if (state.activeCategory !== "all") {
    filtered = filtered.filter(p => p.category === state.activeCategory);
  }

  if (state.searchQuery.trim() !== "") {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.summary.toLowerCase().includes(q) || 
      p.categoryLabel.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-card-subtle); border-radius: var(--radius-lg);">
        <h4 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No products found</h4>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try adjusting your search terms or filter category.</p>
        <button class="btn-primary" onclick="resetFilters()">View All Products</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(product => createProductCardHTML(product)).join("");
}

function createProductCardHTML(product) {
  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-badge-wrap">
        <span class="badge-tag ${product.badge || 'hot'}">${product.badgeText || 'Special'}</span>
      </div>

      <div class="product-image-container" onclick="openPDP('${product.id}')" style="cursor: pointer;">
        <img class="product-img" src="${product.image}" alt="${product.name}" loading="lazy">
        <button class="quick-view-btn" onclick="event.stopPropagation(); openPDP('${product.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          Quick View
        </button>
      </div>

      <div class="product-meta-row">
        <span class="product-category-label">${product.categoryLabel}</span>
        <div class="product-rating">
          ★ ${product.rating.toFixed(1)} <span style="color: var(--text-subtle); font-weight: 500;">(${product.reviewsCount})</span>
        </div>
      </div>

      <h3 class="product-title" onclick="openPDP('${product.id}')" style="cursor: pointer;">${product.name}</h3>
      <p class="product-specs-summary">${product.summary}</p>

      <div class="product-bottom-row">
        <div class="product-price-block">
          ${product.originalPrice ? `<span class="price-original">${formatCurrency(product.originalPrice)}</span>` : ''}
          <span class="price-current">${formatCurrency(product.price)}</span>
        </div>
        <button class="btn-add-cart" onclick="addToCart('${product.id}', 1); event.stopPropagation();">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          ADD TO CART
        </button>
      </div>
    </article>
  `;
}

// ==========================================================================
// CART FUNCTIONALITY
// ==========================================================================

function saveCart() {
  localStorage.setItem("pnn_cart", JSON.stringify(state.cart));
  updateCartUI();
}

function addToCart(productId, quantity = 1, selectedColor = null) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const color = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0].name : "Standard");
  const existingItemIndex = state.cart.findIndex(item => item.id === productId && item.color === color);

  if (existingItemIndex > -1) {
    state.cart[existingItemIndex].quantity += quantity;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      color: color,
      quantity: quantity
    });
  }

  saveCart();
  showToast(`Added ${quantity}x "${product.name}" to cart!`);
}

function updateCartQuantity(index, delta) {
  if (state.cart[index]) {
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity <= 0) {
      state.cart.splice(index, 1);
    }
    saveCart();
  }
}

function removeFromCart(index) {
  if (state.cart[index]) {
    const item = state.cart[index];
    state.cart.splice(index, 1);
    saveCart();
    showToast(`Removed "${item.name}" from cart.`);
  }
}

function calculateCartTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (state.couponDiscount / 100);
  const shipping = subtotal > 0 ? (subtotal > 2000 ? 0 : 50) : 0;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  return { subtotal, discountAmount, shipping, total };
}

function updateCartUI() {
  const countBadges = document.querySelectorAll(".cart-count-badge");
  const totalItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  countBadges.forEach(badge => {
    badge.textContent = totalItemCount;
    badge.style.display = totalItemCount > 0 ? "flex" : "none";
  });

  const cartList = document.getElementById("cart-items-container");
  if (!cartList) return;

  if (state.cart.length === 0) {
    cartList.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; color: var(--text-subtle);"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <p style="font-weight: 700; font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.25rem;">Your cart is empty</p>
        <p style="font-size: 0.9rem;">Explore our high-performance computers & tech gear!</p>
      </div>
    `;
  } else {
    cartList.innerHTML = state.cart.map((item, idx) => `
      <div class="cart-item-row">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Color: ${item.color}</span>
          <div class="cart-item-price">${formatCurrency(item.price)}</div>
          <div class="cart-item-controls">
            <div class="quantity-stepper" style="transform: scale(0.85); transform-origin: left center;">
              <button class="stepper-btn" onclick="updateCartQuantity(${idx}, -1)">-</button>
              <span class="stepper-value">${item.quantity}</span>
              <button class="stepper-btn" onclick="updateCartQuantity(${idx}, 1)">+</button>
            </div>
            <button class="item-delete-btn" onclick="removeFromCart(${idx})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  const { subtotal, discountAmount, shipping, total } = calculateCartTotals();

  const elSubtotal = document.getElementById("cart-subtotal");
  const elDiscount = document.getElementById("cart-discount");
  const elShipping = document.getElementById("cart-shipping");
  const elTotal = document.getElementById("cart-total");

  if (elSubtotal) elSubtotal.textContent = formatCurrency(subtotal);
  if (elDiscount) {
    elDiscount.textContent = discountAmount > 0 ? `-${formatCurrency(discountAmount)} (${state.couponDiscount}%)` : "$0.00";
    elDiscount.parentElement.style.color = discountAmount > 0 ? "var(--sale-red)" : "inherit";
  }
  if (elShipping) elShipping.textContent = shipping === 0 ? "FREE" : formatCurrency(shipping);
  if (elTotal) elTotal.textContent = formatCurrency(total);
}

function applyCoupon() {
  const input = document.getElementById("coupon-code-input");
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (code === "STUDENT10") {
    state.couponDiscount = 10;
    state.activeCouponCode = "STUDENT10";
    localStorage.setItem("pnn_coupon_discount", "10");
    localStorage.setItem("pnn_coupon_code", "STUDENT10");
    updateCartUI();
    showToast("🎉 10% Student Discount applied successfully!");
  } else if (code === "") {
    showToast("Please enter a discount code.");
  } else {
    showToast("Invalid promo code. Use STUDENT10 for 10% off!");
  }
}

function copyPromoCode(code) {
  navigator.clipboard.writeText(code);
  const input = document.getElementById("coupon-code-input");
  if (input) input.value = code;
  showToast(`Copied "${code}" to clipboard!`);
}

function toggleCartDrawer(open) {
  const overlay = document.getElementById("cart-drawer-overlay");
  if (!overlay) return;

  if (open) {
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  } else {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// ==========================================================================
// PRODUCT DETAIL MODAL (PDP)
// ==========================================================================

function openPDP(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  state.activePdpProduct = product;
  state.selectedColorIndex = 0;
  state.pdpQuantity = 1;

  const modal = document.getElementById("pdp-modal");
  const content = document.getElementById("pdp-modal-content");
  if (!modal || !content) return;

  const specsRows = Object.entries(product.specs || {}).map(([key, val]) => `
    <tr>
      <td class="spec-key">${key}</td>
      <td class="spec-val">${val}</td>
    </tr>
  `).join("");

  const swatches = (product.colors || []).map((c, idx) => `
    <div class="color-swatch ${idx === 0 ? 'active' : ''}" 
         style="background-color: ${c.hex};" 
         title="${c.name}" 
         onclick="selectPdpColor(${idx})"></div>
  `).join("");

  const thumbs = (product.thumbnails || [product.image]).map((img, idx) => `
    <img class="pdp-thumb ${idx === 0 ? 'active' : ''}" 
         src="${img}" 
         alt="${product.name} thumb ${idx+1}" 
         onclick="switchPdpImage('${img}', this)">
  `).join("");

  content.innerHTML = `
    <div class="pdp-modal-body">
      <div class="pdp-grid">
        <div class="pdp-gallery">
          <div class="pdp-main-image-wrap">
            <img id="pdp-main-image" class="pdp-main-image" src="${product.image}" alt="${product.name}">
          </div>
          <div class="pdp-thumbnails-row">
            ${thumbs}
          </div>
        </div>

        <div class="pdp-details">
          <div class="pdp-breadcrumb">Store > ${product.categoryLabel} > ${product.name}</div>
          <h2 class="pdp-title">${product.name}</h2>
          
          <div class="pdp-rating-stock">
            <div class="product-rating" style="font-size: 0.95rem;">
              ★ ${product.rating.toFixed(1)} <span style="color: var(--text-muted); font-size: 0.85rem;">(${product.reviewsCount} customer reviews)</span>
            </div>
            <span class="stock-pill">✓ In Stock & Ready to Ship</span>
          </div>

          <div class="pdp-price-tag">
            ${formatCurrency(product.price)}
            ${product.originalPrice ? `<span style="font-size: 1rem; color: var(--text-subtle); text-decoration: line-through; margin-left: 0.5rem; font-weight: 500;">${formatCurrency(product.originalPrice)}</span>` : ''}
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">${product.summary}</p>

          ${product.colors && product.colors.length > 0 ? `
            <div class="color-picker-wrap">
              <span class="color-label">Color Variant: <strong id="selected-color-name" style="color: var(--primary);">${product.colors[0].name}</strong></span>
              <div class="color-swatches-row">
                ${swatches}
              </div>
            </div>
          ` : ''}

          <div style="margin-top: 0.5rem;">
            <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main);">Technical Specifications:</h4>
            <table class="pdp-specs-table">
              <tbody>
                ${specsRows}
              </tbody>
            </table>
          </div>

          <div class="pdp-actions-row">
            <div class="quantity-stepper">
              <button class="stepper-btn" onclick="adjustPdpQty(-1)">-</button>
              <span id="pdp-qty-val" class="stepper-value">1</span>
              <button class="stepper-btn" onclick="adjustPdpQty(1)">+</button>
            </div>
            
            <button class="btn-primary" style="flex: 1;" onclick="addCurrentPdpToCart(false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              ADD TO CART
            </button>

            <button class="btn-primary" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);" onclick="addCurrentPdpToCart(true)">
              BUY NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePDP() {
  const modal = document.getElementById("pdp-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function switchPdpImage(src, thumbEl) {
  const main = document.getElementById("pdp-main-image");
  if (main) main.src = src;

  document.querySelectorAll(".pdp-thumb").forEach(t => t.classList.remove("active"));
  if (thumbEl) thumbEl.classList.add("active");
}

function selectPdpColor(idx) {
  if (!state.activePdpProduct || !state.activePdpProduct.colors[idx]) return;
  state.selectedColorIndex = idx;

  const colorName = state.activePdpProduct.colors[idx].name;
  const nameLabel = document.getElementById("selected-color-name");
  if (nameLabel) nameLabel.textContent = colorName;

  document.querySelectorAll(".color-swatch").forEach((sw, i) => {
    sw.classList.toggle("active", i === idx);
  });
}

function adjustPdpQty(delta) {
  state.pdpQuantity = Math.max(1, state.pdpQuantity + delta);
  const qtyEl = document.getElementById("pdp-qty-val");
  if (qtyEl) qtyEl.textContent = state.pdpQuantity;
}

function addCurrentPdpToCart(goToCheckout = false) {
  if (!state.activePdpProduct) return;

  const color = state.activePdpProduct.colors && state.activePdpProduct.colors[state.selectedColorIndex] 
    ? state.activePdpProduct.colors[state.selectedColorIndex].name 
    : "Standard";

  addToCart(state.activePdpProduct.id, state.pdpQuantity, color);
  closePDP();

  if (goToCheckout) {
    openCheckout();
  } else {
    toggleCartDrawer(true);
  }
}

// ==========================================================================
// MULTI-STEP CHECKOUT
// ==========================================================================

function openCheckout() {
  if (state.cart.length === 0) {
    showToast("Your cart is empty! Add items first.");
    return;
  }

  toggleCartDrawer(false);
  state.checkoutStep = 1;
  renderCheckoutStep();

  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeCheckout() {
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function renderCheckoutStep() {
  const container = document.getElementById("checkout-content-container");
  const stepIndicators = document.querySelectorAll(".step-indicator");
  if (!container) return;

  stepIndicators.forEach((ind, i) => {
    ind.classList.toggle("active", i + 1 <= state.checkoutStep);
  });

  const { subtotal, discountAmount, shipping, total } = calculateCartTotals();

  if (state.checkoutStep === 1) {
    // Step 1: Customer & Delivery Address
    container.innerHTML = `
      <form id="checkout-form-step1" onsubmit="event.preventDefault(); goToCheckoutStep(2);">
        <h4 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem;">Step 1: Delivery Address & Customer Details</h4>
        
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">First Name *</label>
            <input type="text" class="form-control" required placeholder="e.g. John" value="${state.currentUser ? state.currentUser.firstName : 'Juan'}">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name *</label>
            <input type="text" class="form-control" required placeholder="e.g. Doe" value="${state.currentUser ? state.currentUser.lastName : 'Dela Cruz'}">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" class="form-control" required placeholder="you@example.com" value="${state.currentUser ? state.currentUser.email : 'juan.delacruz@gmail.com'}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number *</label>
            <input type="tel" class="form-control" required placeholder="+63 912 345 6789" value="+63 917 890 1234">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Street Address *</label>
          <input type="text" class="form-control" required placeholder="Unit / House No., Street, Barangay" value="Block 14 Lot 8 Cyber Tech Village">
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">City / Municipality *</label>
            <input type="text" class="form-control" required placeholder="e.g. Quezon City / Manila" value="Quezon City">
          </div>
          <div class="form-group">
            <label class="form-label">Postal / Zip Code *</label>
            <input type="text" class="form-control" required placeholder="e.g. 1100" value="1100">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
          <button type="submit" class="btn-primary">
            Continue to Shipping Method →
          </button>
        </div>
      </form>
    `;
  } else if (state.checkoutStep === 2) {
    // Step 2: Shipping Method
    container.innerHTML = `
      <form id="checkout-form-step2" onsubmit="event.preventDefault(); goToCheckoutStep(3);">
        <h4 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem;">Step 2: Select Shipping Method</h4>
        
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border: 2px solid var(--primary); border-radius: var(--radius-lg); background: var(--primary-light); cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <input type="radio" name="shipping-option" checked style="accent-color: var(--primary);">
              <div>
                <strong style="color: var(--text-main);">PNN Standard Delivery</strong>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">2-4 Business Days with Full Tracking & Insurance</p>
              </div>
            </div>
            <strong style="color: var(--primary);">FREE</strong>
          </label>

          <label style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border: 1px solid var(--border-light); border-radius: var(--radius-lg); background: white; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <input type="radio" name="shipping-option" style="accent-color: var(--primary);">
              <div>
                <strong style="color: var(--text-main);">Express Same-Day / Next-Day Courier</strong>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">Direct Motorbike / Van dispatch within Metro areas</p>
              </div>
            </div>
            <strong>$15.00</strong>
          </label>

          <label style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border: 1px solid var(--border-light); border-radius: var(--radius-lg); background: white; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <input type="radio" name="shipping-option" style="accent-color: var(--primary);">
              <div>
                <strong style="color: var(--text-main);">In-Store Pickup (PNN Main Branch)</strong>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">Ready for pickup within 2 hours of verification</p>
              </div>
            </div>
            <strong style="color: var(--success-green);">FREE</strong>
          </label>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
          <button type="button" class="btn-secondary" style="color: var(--text-main); border-color: var(--border-light);" onclick="goToCheckoutStep(1)">← Back to Address</button>
          <button type="submit" class="btn-primary">Continue to Payment →</button>
        </div>
      </form>
    `;
  } else if (state.checkoutStep === 3) {
    // Step 3: Payment Method
    container.innerHTML = `
      <form id="checkout-form-step3" onsubmit="event.preventDefault(); completeOrder();">
        <h4 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem;">Step 3: Payment & Order Confirmation</h4>
        
        <div style="background: var(--bg-card-subtle); padding: 1.25rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid var(--border-light);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>Subtotal (${state.cart.length} items):</span>
            <strong>${formatCurrency(subtotal)}</strong>
          </div>
          ${discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--sale-red);">
              <span>Student Discount (10%):</span>
              <strong>-${formatCurrency(discountAmount)}</strong>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>Shipping:</span>
            <strong>${shipping === 0 ? 'FREE' : formatCurrency(shipping)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800; color: var(--primary); border-top: 1px dashed var(--border-light); padding-top: 0.75rem;">
            <span>Order Total:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>

        <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.85rem;">Select Payment Method:</h5>

        <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem;">
          <label style="display: flex; align-items: center; gap: 0.85rem; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: white; cursor: pointer;">
            <input type="radio" name="payment-method" value="Credit / Debit Card" checked style="accent-color: var(--primary);">
            <div style="flex: 1;">
              <strong>Credit or Debit Card (Visa / Mastercard)</strong>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Instant 256-bit encrypted checkout</p>
            </div>
            <div style="display: flex; gap: 0.35rem;">
              <span class="payment-badge" style="background: #e2e8f0; color: #1e293b;">VISA</span>
              <span class="payment-badge" style="background: #e2e8f0; color: #1e293b;">MC</span>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 0.85rem; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: white; cursor: pointer;">
            <input type="radio" name="payment-method" value="GCash / Maya E-Wallet" style="accent-color: var(--primary);">
            <div style="flex: 1;">
              <strong>GCash / Maya E-Wallet</strong>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Scan QR code or direct wallet transfer</p>
            </div>
            <span class="payment-badge" style="background: #0070f3; color: white;">GCash</span>
          </label>

          <label style="display: flex; align-items: center; gap: 0.85rem; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: white; cursor: pointer;">
            <input type="radio" name="payment-method" value="Cash on Delivery" style="accent-color: var(--primary);">
            <div style="flex: 1;">
              <strong>Cash on Delivery (COD)</strong>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Pay in cash when rider delivers to your doorstep</p>
            </div>
            <span class="payment-badge" style="background: #10b981; color: white;">COD</span>
          </label>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
          <button type="button" class="btn-secondary" style="color: var(--text-main); border-color: var(--border-light);" onclick="goToCheckoutStep(2)">← Back to Shipping</button>
          <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">Place Order (${formatCurrency(total)}) ✓</button>
        </div>
      </form>
    `;
  } else if (state.checkoutStep === 4) {
    // Step 4: Order Confirmation & Receipt
    const lastOrder = state.orders[0];
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="width: 70px; height: 70px; border-radius: 50%; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 2rem;">✓</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">Thank You for Your Order!</h3>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 1.5rem;">Your order <strong>#${lastOrder ? lastOrder.id : 'ORD-9845'}</strong> has been received and is now being prepared by our technical team.</p>

        <div style="background: var(--bg-card-subtle); border-radius: var(--radius-lg); padding: 1.5rem; text-align: left; max-width: 550px; margin: 0 auto 2rem; border: 1px solid var(--border-light);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span style="color: var(--text-muted);">Order Tracking ID:</span>
            <strong style="color: var(--primary);">${lastOrder ? lastOrder.id : 'ORD-9845'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span style="color: var(--text-muted);">Payment Method:</span>
            <strong>${lastOrder ? lastOrder.payment : 'Credit Card'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span style="color: var(--text-muted);">Status:</span>
            <span class="status-pill status-processing">Processing</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; border-top: 1px dashed var(--border-light); padding-top: 0.75rem; margin-top: 0.75rem;">
            <span>Total Paid:</span>
            <span style="color: var(--primary);">${lastOrder ? lastOrder.total : '$0.00'}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <button class="btn-primary" onclick="closeCheckout();">Continue Shopping</button>
          <button class="btn-secondary" style="color: var(--text-main); border-color: var(--border-light);" onclick="openAdminDashboard(); closeCheckout();">View in Admin Dispatch</button>
        </div>
      </div>
    `;
  }
}

function goToCheckoutStep(step) {
  state.checkoutStep = step;
  renderCheckoutStep();
}

async function completeOrder() {
  const { total } = calculateCartTotals();
  const paymentMethodInput = document.querySelector('input[name="payment-method"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : "Credit Card";

  const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  const itemsSummary = state.cart.map(item => `${item.name} (x${item.quantity})`).join(", ");

  const newOrder = {
    id: orderId,
    customer: state.currentUser ? `${state.currentUser.firstName} ${state.currentUser.lastName}` : "Juan Dela Cruz",
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    items: itemsSummary,
    total: formatCurrency(total),
    status: "Processing",
    payment: paymentMethod
  };

  // Sync with Node.js Backend API if available
  if (state.hasBackendAPI) {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
    } catch (e) {}
  }

  state.orders.unshift(newOrder);
  localStorage.setItem("pnn_orders", JSON.stringify(state.orders));

  // Clear cart
  state.cart = [];
  saveCart();

  goToCheckoutStep(4);
  showToast("🎉 Order placed successfully!");
}

// ==========================================================================
// USER AUTHENTICATION & PROFILE
// ==========================================================================

function openAuthModal(mode = "login") {
  const modal = document.getElementById("auth-modal");
  const content = document.getElementById("auth-modal-content");
  if (!modal || !content) return;

  if (mode === "login") {
    content.innerHTML = `
      <div class="auth-header">
        <div class="brand-icon" style="margin: 0 auto 1rem; width: 50px; height: 50px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <h3>Welcome Back</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Log in to access your PNN Tech account & warranty</p>
      </div>
      <div class="auth-body">
        <form onsubmit="event.preventDefault(); handleLogin();">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="login-email" class="form-control" required placeholder="you@example.com" value="user@pnntech.com">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="login-password" class="form-control" required placeholder="••••••••" value="password123">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem;">
            <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
              <input type="checkbox" checked style="accent-color: var(--primary);"> Remember me
            </label>
            <a href="#" style="color: var(--primary); font-weight: 600;" onclick="event.preventDefault(); openAuthModal('forgot');">Forgot password?</a>
          </div>
          <button type="submit" class="btn-primary" style="width: 100%;">Sign In to Account</button>
          
          <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
            Don't have an account yet? 
            <a href="#" style="color: var(--primary); font-weight: 700;" onclick="event.preventDefault(); openAuthModal('register');">Create Account</a>
          </div>
        </form>
      </div>
    `;
  } else if (mode === "register") {
    content.innerHTML = `
      <div class="auth-header">
        <h3>Create Your Account</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Join PNN for member discounts and priority support</p>
      </div>
      <div class="auth-body">
        <form onsubmit="event.preventDefault(); handleRegister();">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input type="text" id="reg-fname" class="form-control" required placeholder="Juan">
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input type="text" id="reg-lname" class="form-control" required placeholder="Dela Cruz">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="reg-email" class="form-control" required placeholder="juan@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="reg-pass" class="form-control" required placeholder="At least 8 characters">
          </div>
          <div style="margin-bottom: 1.5rem; font-size: 0.8rem; color: var(--text-muted);">
            By registering, you agree to PNN Computer Shop's Terms of Service and Privacy Policy.
          </div>
          <button type="submit" class="btn-primary" style="width: 100%;">Create Account</button>
          
          <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
            Already have an account? 
            <a href="#" style="color: var(--primary); font-weight: 700;" onclick="event.preventDefault(); openAuthModal('login');">Sign In</a>
          </div>
        </form>
      </div>
    `;
  } else if (mode === "profile") {
    content.innerHTML = `
      <div class="auth-header">
        <div class="user-avatar" style="width: 64px; height: 64px; font-size: 1.6rem; margin: 0 auto 1rem;">
          ${state.currentUser ? state.currentUser.firstName.charAt(0) : 'U'}
        </div>
        <h3>${state.currentUser ? state.currentUser.firstName + ' ' + state.currentUser.lastName : 'User Account'}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${state.currentUser ? state.currentUser.email : 'user@pnntech.com'}</p>
        <div style="margin-top: 0.5rem;">
          <span class="status-pill status-delivered" style="font-size: 0.75rem;">Verified Member ★</span>
        </div>
      </div>
      <div class="auth-body">
        <div style="background: var(--bg-card-subtle); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <h5 style="font-weight: 700; margin-bottom: 0.5rem;">Account Perks Active:</h5>
          <ul style="font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.35rem;">
            <li>✓ 10% Student Discount eligible</li>
            <li>✓ Free Priority Nationwide Delivery</li>
            <li>✓ 1-Year Full Warranty Protection</li>
          </ul>
        </div>
        <div style="display: flex; gap: 1rem;">
          <button class="btn-secondary" style="flex: 1; color: var(--text-main); border-color: var(--border-light);" onclick="openAdminDashboard(); closeAuthModal();">Admin Portal</button>
          <button class="btn-primary" style="flex: 1; background: #ef4444;" onclick="handleLogout()">Sign Out</button>
        </div>
      </div>
    `;
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function handleLogin() {
  const email = document.getElementById("login-email").value;
  state.currentUser = {
    firstName: "Alex",
    lastName: "Rivera",
    email: email || "alex.rivera@pnntech.com"
  };
  localStorage.setItem("pnn_user", JSON.stringify(state.currentUser));
  updateAuthUI();
  closeAuthModal();
  showToast("Welcome back, Alex! 👋");
}

function handleRegister() {
  const fname = document.getElementById("reg-fname").value;
  const lname = document.getElementById("reg-lname").value;
  const email = document.getElementById("reg-email").value;

  state.currentUser = {
    firstName: fname || "Juan",
    lastName: lname || "Dela Cruz",
    email: email || "juan@example.com"
  };
  localStorage.setItem("pnn_user", JSON.stringify(state.currentUser));
  updateAuthUI();
  closeAuthModal();
  showToast("Account created successfully! Welcome to PNN.");
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem("pnn_user");
  updateAuthUI();
  closeAuthModal();
  showToast("Signed out successfully.");
}

function updateAuthUI() {
  const btn = document.getElementById("header-user-btn");
  if (!btn) return;

  if (state.currentUser) {
    btn.innerHTML = `
      <div class="user-avatar">${state.currentUser.firstName.charAt(0)}</div>
      <span>${state.currentUser.firstName}</span>
    `;
    btn.onclick = () => openAuthModal("profile");
  } else {
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      <span>Sign In</span>
    `;
    btn.onclick = () => openAuthModal("login");
  }
}

// ==========================================================================
// ADMIN DASHBOARD & SHOP MANAGEMENT
// ==========================================================================

async function openAdminDashboard() {
  const modal = document.getElementById("admin-modal");
  if (!modal) return;

  // Try fetching latest orders from Node.js backend
  if (state.hasBackendAPI) {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const d = await res.json();
        if (d.data) state.orders = d.data;
      }
    } catch (e) {}
  }

  renderAdminStats();
  renderAdminProductsTable();
  renderAdminOrdersTable();

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAdminDashboard() {
  const modal = document.getElementById("admin-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function renderAdminStats() {
  const totalRevenue = state.orders.reduce((sum, ord) => {
    const val = parseFloat(ord.total.replace(/[^0-9.-]+/g, "")) || 0;
    return sum + val;
  }, 34980);

  const elRevenue = document.getElementById("admin-stat-revenue");
  const elOrders = document.getElementById("admin-stat-orders");
  const elProducts = document.getElementById("admin-stat-products");

  if (elRevenue) elRevenue.textContent = formatCurrency(totalRevenue);
  if (elOrders) elOrders.textContent = state.orders.length;
  if (elProducts) elProducts.textContent = state.products.length;
}

function renderAdminProductsTable() {
  const tableBody = document.getElementById("admin-products-tbody");
  if (!tableBody) return;

  tableBody.innerHTML = state.products.map(p => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${p.image}" style="width: 40px; height: 40px; object-fit: contain; background: #f1f5f9; border-radius: 6px;">
          <div>
            <strong>${p.name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.id}</div>
          </div>
        </div>
      </td>
      <td><span class="badge-tag new" style="font-size: 0.7rem;">${p.categoryLabel}</span></td>
      <td><strong>${formatCurrency(p.price)}</strong></td>
      <td>★ ${p.rating.toFixed(1)}</td>
      <td>
        <button onclick="deleteProduct('${p.id}')" style="color: #ef4444; font-size: 0.85rem; font-weight: 600;">Delete</button>
      </td>
    </tr>
  `).join("");
}

function renderAdminOrdersTable() {
  const tableBody = document.getElementById("admin-orders-tbody");
  if (!tableBody) return;

  tableBody.innerHTML = state.orders.map((ord, idx) => `
    <tr>
      <td><strong>${ord.id}</strong></td>
      <td>${ord.customer}</td>
      <td>${ord.date}</td>
      <td style="max-width: 250px; font-size: 0.8rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${ord.items}</td>
      <td><strong>${ord.total}</strong></td>
      <td>
        <select onchange="updateOrderStatus(${idx}, this.value)" style="padding: 0.3rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-light); font-size: 0.8rem; font-weight: 700;">
          <option value="Pending" ${ord.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${ord.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${ord.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
    </tr>
  `).join("");
}

async function updateOrderStatus(idx, newStatus) {
  if (state.orders[idx]) {
    const ord = state.orders[idx];
    ord.status = newStatus;
    localStorage.setItem("pnn_orders", JSON.stringify(state.orders));

    if (state.hasBackendAPI) {
      try {
        await fetch(`/api/orders/${ord.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (e) {}
    }

    showToast(`Order #${ord.id} status updated to ${newStatus}`);
  }
}

async function openAddProductModal() {
  const name = prompt("Enter product name (e.g. RTX 4090 Rig):");
  if (!name) return;

  const category = prompt("Category (laptop / system_unit / mini_pc / phone / peripherals / accessories):", "laptop") || "laptop";
  const price = parseFloat(prompt("Price in USD (e.g. 1499):", "1499")) || 999;

  const newProd = {
    id: "p" + (Date.now()),
    name: name,
    category: category,
    categoryLabel: category.toUpperCase(),
    price: price,
    originalPrice: price * 1.15,
    rating: 5.0,
    reviewsCount: 1,
    badge: "new",
    badgeText: "New Arrival",
    isBestSeller: false,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=700&q=80",
    thumbnails: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=700&q=80"],
    colors: [{ name: "Standard", hex: "#0070f3" }],
    summary: "High performance hardware configuration.",
    specs: {
      "Brand": "PNN Tech",
      "Model": name,
      "Warranty": "1-Year Official Warranty"
    }
  };

  if (state.hasBackendAPI) {
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
    } catch (e) {}
  }

  state.products.unshift(newProd);
  localStorage.setItem("pnn_products", JSON.stringify(state.products));

  renderAdminStats();
  renderAdminProductsTable();
  renderCatalog();
  showToast(`Product "${name}" added to inventory!`);
}

async function deleteProduct(productId) {
  if (confirm("Are you sure you want to remove this product from inventory?")) {
    if (state.hasBackendAPI) {
      try {
        await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      } catch (e) {}
    }

    state.products = state.products.filter(p => p.id !== productId);
    localStorage.setItem("pnn_products", JSON.stringify(state.products));
    renderAdminStats();
    renderAdminProductsTable();
    renderBestSellers();
    renderCatalog();
    showToast("Product removed.");
  }
}

// ==========================================================================
// TOAST NOTIFICATIONS & FILTERS
// ==========================================================================

function showToast(message) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--accent-cyan);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setCategoryFilter(category, buttonEl) {
  state.activeCategory = category;

  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.classList.remove("active");
  });

  if (buttonEl) {
    buttonEl.classList.add("active");
  }

  renderCatalog();
}

function resetFilters() {
  state.activeCategory = "all";
  state.searchQuery = "";

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  const firstPill = document.querySelector(".filter-pill");
  if (firstPill) {
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    firstPill.classList.add("active");
  }

  renderCatalog();
}

function handleSearch(query) {
  state.searchQuery = query;
  renderCatalog();
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("newsletter-email");
  if (input && input.value) {
    showToast("🎉 Thank you for subscribing! Your 10% voucher has been sent to your email.");
    input.value = "";
  }
}

// ==========================================================================
// DOM READY INITIALIZATION
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  renderBestSellers();
  renderCatalog();
  updateCartUI();
  updateAuthUI();
  checkBackendConnection();

  // Search input live handler
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      handleSearch(e.target.value);
    });
  }

  // Header scroll shadow handler
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".site-header");
    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 20);
    }
  });

  // Check if coupon was already applied
  if (state.activeCouponCode) {
    const couponInput = document.getElementById("coupon-code-input");
    if (couponInput) couponInput.value = state.activeCouponCode;
  }
});
