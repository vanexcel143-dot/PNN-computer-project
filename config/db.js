/**
 * PNN Project - Database Configuration & Connection Pool
 * Node.js + MySQL2 (Promise-based)
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { runMigration } = require('../migrations/migrate_user_system');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'pnn_project_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

let isDbInitialized = false;

/**
 * Automatically ensures database and `students` table exist
 */
async function initializeDatabase() {
  if (isDbInitialized) return true;

  try {
    // 1. Connect to MySQL server without database selected to ensure DB exists
    const serverConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await serverConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`
    );
    await serverConnection.end();

    // 2. Ensure `students` table exists with proper schema
    const tableQuery = `
      CREATE TABLE IF NOT EXISTS \`students\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) NOT NULL,
        \`course\` VARCHAR(100) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await pool.query(tableQuery);

    // 3. Seed starter student record if empty (from original student_db.sql)
    const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM \`students\`;`);
    if (rows[0].count === 0) {
      await pool.query(`
        INSERT INTO \`students\` (\`name\`, \`email\`, \`course\`) VALUES
        ('Cuizon Jhong', 'cuizon@gmail.com', 'BSIT'),
        ('Maria Santos', 'maria.santos@pnntech.edu.ph', 'BS Computer Science'),
        ('Juan Dela Cruz', 'juan.delacruz@pnntech.edu.ph', 'BS Information Systems');
      `);
      console.log('✅ Initial student records seeded into pnn_project_db.');
    }

    // 4. Initialize User System, User Types, & Default Superadmin
    await runMigration();

    isDbInitialized = true;
    console.log(`✅ MySQL connected & verified: ${dbConfig.database}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MySQL Connection Warning: ${error.message}`);
    console.warn('👉 Please ensure MySQL is started in your XAMPP Control Panel.');
    return false;
  }
}

module.exports = {
  pool,
  dbConfig,
  initializeDatabase
};
