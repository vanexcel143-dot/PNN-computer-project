/**
 * Seed initial student records into pnn_project_db
 * Run: node scripts/seed.js
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'pnn_project_db',
    port:     parseInt(process.env.DB_PORT, 10) || 3306
  });

  const [rows] = await conn.execute('SELECT COUNT(*) AS cnt FROM `students`');
  if (rows[0].cnt === 0) {
    await conn.execute(
      'INSERT INTO `students` (`name`, `email`, `course`) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [
        'Cuizon Jhong',  'cuizon@gmail.com',                   'BSIT',
        'Maria Santos',  'maria.santos@pnntech.edu.ph',         'BS Computer Science',
        'Juan Dela Cruz','juan.delacruz@pnntech.edu.ph',        'BS Information Systems'
      ]
    );
    console.log('✅ Seeded 3 starter student records.');
  } else {
    console.log(`ℹ️  ${rows[0].cnt} record(s) already exist. Skipping seed.`);
  }

  const [all] = await conn.execute('SELECT * FROM `students`');
  console.log('\nCurrent students in database:');
  all.forEach(r => console.log(`  #${r.id} | ${r.name} | ${r.email} | ${r.course}`));

  await conn.end();
}

seed().catch(err => { console.error('Seed error:', err.message); process.exit(1); });
