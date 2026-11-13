/**
 * PNN Project - Database Migration: User Account Management & Payment System
 * Safely creates tables, foreign keys, indexes, and seeds default records.
 * Idempotent: can be executed multiple times without errors or data destruction.
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'pnn_project_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306
};

async function runMigration() {
  console.log('🔄 Starting User Management & Payment System Migration...');
  
  // 1. Connect to MySQL server and ensure database exists
  const serverConn = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port
  });

  await serverConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`
  );
  await serverConn.end();

  // 2. Connect to the database
  const db = await mysql.createConnection(dbConfig);
  console.log(`✅ Connected to database: ${dbConfig.database}`);

  try {
    // -------------------------------------------------------------
    // Table 1: user_types (Roles: SUPERADMIN, ADMIN, USER)
    // -------------------------------------------------------------
    console.log('Creating table `user_types`...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`user_types\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`type_name\` VARCHAR(50) NOT NULL UNIQUE,
        \`description\` VARCHAR(255) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Seed default roles if missing
    const [roles] = await db.query('SELECT COUNT(*) AS cnt FROM `user_types`');
    if (roles[0].cnt === 0) {
      await db.query(`
        INSERT INTO \`user_types\` (\`type_name\`,\`description\`) VALUES
        ('SUPERADMIN', 'Full system access, manage accounts, permissions, and financial overrides'),
        ('ADMIN', 'Manage regular user accounts, orders, and view permitted reports'),
        ('CUSTOMER', 'Standard customer or student member with access to personal account and orders');
      `);
      console.log('✅ Seeded default user types: SUPERADMIN, ADMIN, CUSTOMER.');
    } else {
      console.log('ℹ️ User types already exist, ensuring all 3 standard roles are present...');
      // If legacy 'USER' exists, update to 'CUSTOMER' per updated role requirements
      await db.query(`
        UPDATE \`user_types\` 
        SET \`type_name\` = 'CUSTOMER', 
            \`description\` = 'Standard customer account with access to personal account and orders'
        WHERE \`type_name\` = 'USER';
      `);
      await db.query(`
        INSERT IGNORE INTO \`user_types\` (\`type_name\`, \`description\`) VALUES
        ('SUPERADMIN', 'Full system access, manage accounts, permissions, and financial overrides'),
        ('ADMIN', 'Manage regular user accounts, orders, and view permitted reports'),
        ('CUSTOMER', 'Standard customer account with access to personal account and orders');
      `);
    }

    // Cache role IDs
    const [roleRows] = await db.query('SELECT id, type_name FROM `user_types`');
    const roleMap = {};
    roleRows.forEach(r => { roleMap[r.type_name] = r.id; });

    // -------------------------------------------------------------
    // Table 2: users (Role-based User Accounts)
    // -------------------------------------------------------------
    console.log('Creating table `users`...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`user_type_id\` INT(11) NOT NULL,
        \`username\` VARCHAR(60) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`full_name\` VARCHAR(120) NOT NULL,
        \`email\` VARCHAR(120) NOT NULL UNIQUE,
        \`contact_number\` VARCHAR(30) DEFAULT NULL,
        \`status\` ENUM('ACTIVE', 'INACTIVE', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
        \`must_change_password\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_username\` (\`username\`),
        INDEX \`idx_email\` (\`email\`),
        INDEX \`idx_user_type\` (\`user_type_id\`),
        CONSTRAINT \`fk_users_user_type\` FOREIGN KEY (\`user_type_id\`) REFERENCES \`user_types\` (\`id\`) ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // -------------------------------------------------------------
    // Table 3: user_transactions (For Payment Settlement Validation)
    // -------------------------------------------------------------
    console.log('Creating table `user_transactions`...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`user_transactions\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`user_id\` INT(11) NOT NULL,
        \`transaction_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`description\` VARCHAR(255) NOT NULL,
        \`amount_due\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`amount_paid\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`payment_status\` ENUM('PAID', 'PARTIALLY_PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
        \`due_date\` DATE DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_user_transactions\` (\`user_id\`),
        CONSTRAINT \`fk_transactions_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // -------------------------------------------------------------
    // Table 4: audit_logs (Administrative & Security Audit Trail)
    // -------------------------------------------------------------
    console.log('Creating table `audit_logs`...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`user_id\` INT(11) DEFAULT NULL,
        \`action\` VARCHAR(100) NOT NULL,
        \`details\` TEXT DEFAULT NULL,
        \`ip_address\` VARCHAR(50) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_audit_user\` (\`user_id\`),
        CONSTRAINT \`fk_audit_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // -------------------------------------------------------------
    // 3. Seed Default SUPERADMIN Account
    // Username: admin, Password: admin (Hashed with bcrypt)
    // -------------------------------------------------------------
    console.log('Checking default SUPERADMIN account...');
    const [adminExists] = await db.query(
      'SELECT id, username, must_change_password FROM `users` WHERE `username` = ?',
      ['admin']
    );

    const superAdminRoleId = roleMap['SUPERADMIN'];

    if (adminExists.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);

      const [resAdmin] = await db.query(`
        INSERT INTO \`users\` 
          (\`user_type_id\`, \`username\`, \`password\`, \`full_name\`, \`email\`, \`contact_number\`, \`status\`, \`must_change_password\`)
        VALUES 
          (?, 'admin', ?, 'System Super Administrator', 'admin@pnntech.com', '+63 912 345 6789', 'ACTIVE', 1);
      `, [superAdminRoleId, hashedPassword]);

      console.log(`✅ Default SUPERADMIN created successfully (ID: #${resAdmin.insertId})`);
      console.log('   Username: admin | Password: admin (must change on first login)');

      // Log to audit log
      await db.query(
        'INSERT INTO `audit_logs` (`user_id`, `action`, `details`, `ip_address`) VALUES (?, ?, ?, ?)',
        [resAdmin.insertId, 'SYSTEM_INITIALIZATION', 'Default SUPERADMIN account initialized', '127.0.0.1']
      );
    } else {
      console.log(`ℹ️ Default SUPERADMIN account already exists (ID: #${adminExists[0].id}). No duplicate created.`);
    }

    // Also seed a sample ADMIN and sample USER for immediate testing if only admin exists
    const [userCount] = await db.query('SELECT COUNT(*) AS cnt FROM `users`');
    if (userCount[0].cnt === 1) {
      const salt = await bcrypt.genSalt(10);
      const samplePass = await bcrypt.hash('password123', salt);

      // Seed sample Admin
      await db.query(`
        INSERT INTO \`users\`
          (\`user_type_id\`, \`username\`, \`password\`, \`full_name\`, \`email\`, \`contact_number\`, \`status\`, \`must_change_password\`)
        VALUES
          (?, 'staff_admin', ?, 'Clarisse Ramos (Staff Admin)', 'staff@pnntech.com', '+63 920 111 2233', 'ACTIVE', 0);
      `, [roleMap['ADMIN'], samplePass]);

      // Seed sample User (Customer)
      const [customerRes] = await db.query(`
        INSERT INTO \`users\`
          (\`user_type_id\`, \`username\`, \`password\`, \`full_name\`, \`email\`, \`contact_number\`, \`status\`, \`must_change_password\`)
        VALUES
          (?, 'juan_customer', ?, 'Juan Dela Cruz (Student)', 'juan.student@pnntech.com', '+63 917 888 9999', 'ACTIVE', 0);
      `, [roleMap['USER'], samplePass]);

      // Seed a settled transaction for Juan
      await db.query(`
        INSERT INTO \`user_transactions\`
          (\`user_id\`, \`transaction_code\`, \`description\`, \`amount_due\`, \`amount_paid\`, \`payment_status\`, \`due_date\`)
        VALUES
          (?, 'TXN-PAID-001', 'Tuition / Lab Tech Package Fee', 500.00, 500.00, 'PAID', '2026-11-01');
      `, [customerRes.insertId]);

      // Seed another user with an UNPAID balance to test deletion blocking
      const [unpaidRes] = await db.query(`
        INSERT INTO \`users\`
          (\`user_type_id\`, \`username\`, \`password\`, \`full_name\`, \`email\`, \`contact_number\`, \`status\`, \`must_change_password\`)
        VALUES
          (?, 'unpaid_student', ?, 'Mark Anthony Debt', 'mark.unpaid@pnntech.com', '+63 908 777 6655', 'ACTIVE', 0);
      `, [roleMap['USER'], samplePass]);

      await db.query(`
        INSERT INTO \`user_transactions\`
          (\`user_id\`, \`transaction_code\`, \`description\`, \`amount_due\`, \`amount_paid\`, \`payment_status\`, \`due_date\`)
        VALUES
          (?, 'TXN-UNPAID-002', 'High-Performance Laptop Installment Plan', 1200.00, 400.00, 'PARTIALLY_PAID', '2026-11-30');
      `, [unpaidRes.insertId]);

      console.log('✅ Seeded demo accounts: `staff_admin`, `juan_customer` (settled), and `unpaid_student` (unsettled balance).');
    }

    console.log('🎉 Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration Error:', error);
    throw error;
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runMigration };
