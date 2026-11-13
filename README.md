# 🖥️ PNN Computer & Cellphone Shop — Node.js Edition

A full-stack **Node.js + Express + MySQL2** web application.  
Includes a **storefront** (product catalog, cart, orders) and a **Student CRUD system** backed by MySQL.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ installed
- **XAMPP** installed with **MySQL** running on port 3306

### 1. Start MySQL in XAMPP
Open **XAMPP Control Panel** → click **Start** next to **MySQL**

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
npm start
```

### 4. Open your browser
| Page | URL |
|---|---|
| 🛒 Storefront | http://localhost:3000 |
| 🎓 Student CRUD | http://localhost:3000/students |
| ➕ Add Student | http://localhost:3000/students/create |
| 🔌 Students API | http://localhost:3000/api/students |

---

## 📁 Project Structure

```
PNN computer project/
│
├── config/
│   └── db.js              # MySQL2 connection pool + auto DB init
│
├── controllers/
│   └── studentController.js   # CRUD logic for HTML views & REST API
│
├── middleware/
│   └── validateStudent.js     # Input validation & sanitization
│
├── models/
│   └── studentModel.js        # MySQL queries (findAll, findById, create, update, delete)
│
├── routes/
│   └── studentRoutes.js       # Express routes for web UI + API
│
├── views/
│   ├── students.html          # READ: Student list page
│   ├── student-create.html    # CREATE: Add student form
│   └── student-edit.html      # UPDATE: Edit student form
│
├── public/
│   ├── index.html             # Storefront homepage
│   ├── css/styles.css         # Main stylesheet
│   └── js/app.js             # Frontend JavaScript
│
├── data/
│   ├── products.json          # Product catalog
│   └── orders.json            # Order records
│
├── resources/                 # Legacy PHP files (kept for reference)
│
├── .env                       # Environment variables (DB config, PORT)
├── .gitignore
├── package.json
└── server.js                  # Main Express server entry point
```

---

## 🗄️ Database Configuration

Configured in `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pnn_project_db
DB_PORT=3306
PORT=3000
```

> **Auto-setup:** On first run, `config/db.js` automatically creates the `pnn_project_db` database and `students` table if they don't exist. No manual SQL import needed.

### Database Table: `students`
```sql
CREATE TABLE students (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  course VARCHAR(100) NOT NULL
);
```

---

## 📋 CRUD System — Student Records

| Operation | URL | Method |
|---|---|---|
| List all students | `/students` | GET |
| Search students | `/students?search=keyword` | GET |
| Add new student form | `/students/create` | GET |
| Submit new student | `/students/create` | POST |
| Edit student form | `/students/edit/:id` | GET |
| Submit edit | `/students/edit/:id` | POST |
| Delete student | `/students/delete/:id` | POST |

### REST API Endpoints (JSON)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | Get all students |
| GET | `/api/students/:id` | Get one student |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

---

## 🛒 Storefront API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/products` | Get all products |
| `GET /api/products/:id` | Get single product |
| `GET /api/orders` | Get all orders |
| `POST /api/orders` | Place new order |
| `GET /api/stats` | Analytics/stats |
| `POST /api/coupons/validate` | Validate promo code |

---

## 🔐 Security Features

- ✅ **Prepared statements** via `mysql2` `.execute()` — no SQL injection
- ✅ **Input validation** via `middleware/validateStudent.js`
- ✅ **XSS protection** — `escapeHtml()` in all rendered views
- ✅ **Environment variables** — DB credentials in `.env` (not hardcoded)
- ✅ **Confirmation dialogs** before delete operations

---

## 🛠️ Development

```bash
# Auto-restart on file changes (Node.js v18+)
npm run dev
```

---

## 📌 Notes

- This project was **migrated from PHP to Node.js**
- Original PHP files are preserved in the `resources/` folder for reference
- The system serves both the **storefront** and **Student CRUD** on a single Express server (port 3000)
- MySQL must be running (via XAMPP) for student CRUD operations to work
