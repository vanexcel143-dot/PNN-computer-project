# 🖥️ PNN Computer & Cellphone Shop — Node.js Edition

A full-stack **Node.js + Express + MySQL2** web application.  
Includes an interactive **storefront**, **Student CRUD system**, and a complete **Role-Based User Account Management System** with **Payment Settlement Validation**.

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

### 3. Run the automated test suite
```bash
npm run test:users
```

### 4. Start the server
```bash
npm start
```

### 5. Access the application
| Page | URL | Description |
|---|---|---|
| 🛒 **Storefront** | http://localhost:3000 | Product catalog, cart, and checkout |
| 👥 **User Management** | http://localhost:3000/users | Role-based User Management (Admin/Superadmin) |
| 🔑 **Sign In Portal** | http://localhost:3000/login | Authentication with session management |
| 👤 **User Profile** | http://localhost:3000/profile | Profile updates, balance check, transaction history |
| 🎓 **Student CRUD** | http://localhost:3000/students | Student records management |

---

## 🔑 Default Administrator Account

The system automatically initializes the default Superadmin account upon first run:

- **Username:** `admin`
- **Password:** `admin`
- **Role:** `SUPERADMIN`
- **Security:** Password is encrypted with `bcrypt` (10 rounds). The account is flagged with `must_change_password = 1` requiring a new password upon first login.

---

## 👥 Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| **SUPERADMIN** | Full system authority. Can create users, update all accounts, reset passwords, delete eligible accounts, manage permissions, and override administrative settings. The system default admin account is protected from deletion. |
| **ADMIN** | Can manage regular user accounts (`USER`), view permitted records, and reset passwords for standard users. Cannot modify or delete `SUPERADMIN` accounts or escalate roles. |
| **USER** | Can access personal account (`/profile`), update personal information, change own password, and view transaction history and settlement status. |

---

## 💳 Payment Settlement Validation Before Deletion

Per system financial and security policy:
1. When an Admin or Superadmin attempts to delete a user account, the system computes the user's actual outstanding balance from the `user_transactions` table:
   $$\text{Outstanding Balance} = \sum(\text{amount\_due}) - \sum(\text{amount\_paid})$$
2. **If Balance > $0.00 or pending transactions exist:** Deletion is strictly **BLOCKED** with an explanatory alert message.
3. **If Balance = $0.00:** The account can be safely deactivated or removed while preserving financial history and audit trail.

---

## 🗄️ Database Schema (`pnn_project_db`)

### Tables
1. **`user_types`** — Stores roles (`SUPERADMIN`, `ADMIN`, `USER`).
2. **`users`** — Accounts with hashed passwords (`bcryptjs`), foreign key to `user_types`, unique username/email, and status.
3. **`user_transactions`** — Financial records for payment settlement verification (`amount_due`, `amount_paid`, `payment_status`).
4. **`audit_logs`** — Logs security and administrative actions (logins, password resets, account modifications, deletion attempts).
5. **`students`** — Student CRUD records (`id`, `name`, `email`, `course`).

---

## 📋 REST API Endpoints

### Authentication API
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & start session |
| `POST` | `/api/auth/logout` | End session & clear cookie |
| `GET` | `/api/auth/me` | Get currently logged in user |
| `POST` | `/api/auth/change-password` | Update user password |

### User Management API (Protected: Admin / Superadmin)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List users with search & filters |
| `GET` | `/api/users/:id` | Get user details & balance |
| `GET` | `/api/users/:id/settlement` | Check payment settlement status |
| `POST` | `/api/users` | Create new user account |
| `PUT` | `/api/users/:id` | Update user account info |
| `POST` | `/api/users/:id/reset-password` | Admin password reset |
| `DELETE` | `/api/users/:id` | Delete account (settlement verified) |

### Students API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | Get all students |
| `GET` | `/api/students/:id` | Get student by ID |
| `POST` | `/api/students` | Add new student |
| `PUT` | `/api/students/:id` | Update student record |
| `DELETE` | `/api/students/:id` | Delete student record |
