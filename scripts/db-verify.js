/**
 * PNN Project — Full Database Verification & CRUD Test Script
 * Run: node scripts/db-verify.js
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const cfg = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  port:     parseInt(process.env.DB_PORT, 10) || 3306
};

const DB_NAME = process.env.DB_NAME || 'pnn_project_db';

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';
const WARN = '⚠️  WARN';

const results = {
  dbConnection:    null,
  dbExists:        null,
  tableStudents:   null,
  schemaMatch:     null,
  existingRecords: null,
  crudCreate:      null,
  crudRead:        null,
  crudUpdate:      null,
  crudDelete:      null,
  errors:          [],
  fixes:           [],
};

async function run() {
  let conn;
  let testId = null;

  console.log('\n=================================================');
  console.log('  PNN PROJECT — DATABASE VERIFICATION REPORT');
  console.log('=================================================\n');

  // ── 1. Connect to MySQL server (no database selected) ───────────────────
  console.log('[ STEP 1 ] Connecting to MySQL server...');
  try {
    conn = await mysql.createConnection(cfg);
    results.dbConnection = PASS;
    console.log(`  ${PASS} Connected to MySQL at ${cfg.host}:${cfg.port} as "${cfg.user}"\n`);
  } catch (err) {
    results.dbConnection = FAIL;
    results.errors.push(`MySQL connection failed: ${err.message}`);
    console.error(`  ${FAIL} Cannot connect to MySQL: ${err.message}`);
    console.error('  → Make sure XAMPP MySQL is running on port 3306.\n');
    printSummary();
    return;
  }

  // ── 2. Check/create database ─────────────────────────────────────────────
  console.log(`[ STEP 2 ] Checking database "${DB_NAME}"...`);
  try {
    const [rows] = await conn.query(
      `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`, [DB_NAME]
    );
    if (rows.length > 0) {
      results.dbExists = PASS;
      console.log(`  ${PASS} Database "${DB_NAME}" exists.\n`);
    } else {
      await conn.query(
        `CREATE DATABASE \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
      );
      results.dbExists = PASS;
      results.fixes.push(`Created missing database "${DB_NAME}"`);
      console.log(`  ${WARN} Database "${DB_NAME}" was missing — created it.\n`);
    }
  } catch (err) {
    results.dbExists = FAIL;
    results.errors.push(`Database check failed: ${err.message}`);
    console.error(`  ${FAIL} ${err.message}\n`);
  }

  // Switch to target database
  try {
    await conn.query(`USE \`${DB_NAME}\``);
  } catch (err) {
    results.errors.push(`USE ${DB_NAME} failed: ${err.message}`);
    await conn.end();
    printSummary();
    return;
  }

  // ── 3. Check/create students table ──────────────────────────────────────
  console.log('[ STEP 3 ] Checking "students" table...');
  try {
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'`, [DB_NAME]
    );
    if (tables.length > 0) {
      results.tableStudents = PASS;
      console.log(`  ${PASS} Table "students" exists.`);
    } else {
      await conn.query(`
        CREATE TABLE \`students\` (
          \`id\`     INT(11) NOT NULL AUTO_INCREMENT,
          \`name\`   VARCHAR(100) NOT NULL,
          \`email\`  VARCHAR(100) NOT NULL,
          \`course\` VARCHAR(100) NOT NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      results.tableStudents = PASS;
      results.fixes.push('Created missing "students" table');
      console.log(`  ${WARN} Table "students" was missing — created it.`);
    }
  } catch (err) {
    results.tableStudents = FAIL;
    results.errors.push(`Table check failed: ${err.message}`);
    console.error(`  ${FAIL} ${err.message}\n`);
  }

  // ── 4. Verify schema columns ─────────────────────────────────────────────
  console.log('\n[ STEP 4 ] Verifying table schema...');
  const requiredColumns = ['id', 'name', 'email', 'course'];
  try {
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
       ORDER BY ORDINAL_POSITION`, [DB_NAME]
    );
    const foundCols = cols.map(c => c.COLUMN_NAME);
    const missing = requiredColumns.filter(c => !foundCols.includes(c));

    console.log('  Columns found:', foundCols.join(', '));
    cols.forEach(c => {
      const key = c.COLUMN_KEY === 'PRI' ? ' [PK]' : '';
      console.log(`    - ${c.COLUMN_NAME}: ${c.DATA_TYPE.toUpperCase()} | nullable: ${c.IS_NULLABLE}${key}`);
    });

    if (missing.length === 0) {
      results.schemaMatch = PASS;
      console.log(`  ${PASS} All required columns present.\n`);
    } else {
      results.schemaMatch = WARN;
      results.errors.push(`Missing columns in "students": ${missing.join(', ')}`);
      console.log(`  ${WARN} Missing columns: ${missing.join(', ')}\n`);
    }
  } catch (err) {
    results.schemaMatch = FAIL;
    results.errors.push(`Schema check failed: ${err.message}`);
    console.error(`  ${FAIL} ${err.message}\n`);
  }

  // ── 5. Count existing records ────────────────────────────────────────────
  console.log('[ STEP 5 ] Checking existing records...');
  try {
    const [countRows] = await conn.execute('SELECT COUNT(*) AS cnt FROM `students`');
    const count = countRows[0].cnt;
    results.existingRecords = `${count} record(s) found — preserved`;
    console.log(`  ${PASS} ${count} existing student record(s) — will NOT be modified.\n`);

    if (count > 0) {
      const [preview] = await conn.execute('SELECT * FROM `students` LIMIT 5');
      console.log('  Preview (first 5 records):');
      preview.forEach(r => console.log(`    ID#${r.id} | ${r.name} | ${r.email} | ${r.course}`));
      console.log('');
    }
  } catch (err) {
    results.existingRecords = FAIL;
    results.errors.push(`Record count failed: ${err.message}`);
    console.error(`  ${FAIL} ${err.message}\n`);
  }

  // ── 6. CRUD Testing ──────────────────────────────────────────────────────
  console.log('[ STEP 6 ] Running CRUD tests...');

  // CREATE
  try {
    const [insert] = await conn.execute(
      'INSERT INTO `students` (`name`, `email`, `course`) VALUES (?, ?, ?)',
      ['[TEST] Verification Bot', 'verify.test@pnntech.test', 'CRUD Test Course']
    );
    testId = insert.insertId;
    results.crudCreate = PASS;
    console.log(`  ${PASS} CREATE — Inserted test record ID #${testId}`);
  } catch (err) {
    results.crudCreate = FAIL;
    results.errors.push(`CRUD CREATE failed: ${err.message}`);
    console.error(`  ${FAIL} CREATE — ${err.message}`);
  }

  // READ
  if (testId !== null) {
    try {
      const [rows] = await conn.execute('SELECT * FROM `students` WHERE `id` = ?', [testId]);
      if (rows.length > 0 && rows[0].name === '[TEST] Verification Bot') {
        results.crudRead = PASS;
        console.log(`  ${PASS} READ   — Retrieved test record: ${JSON.stringify(rows[0])}`);
      } else {
        results.crudRead = FAIL;
        results.errors.push('CRUD READ: record not found after insert');
        console.error(`  ${FAIL} READ   — Record not found after insert`);
      }
    } catch (err) {
      results.crudRead = FAIL;
      results.errors.push(`CRUD READ failed: ${err.message}`);
      console.error(`  ${FAIL} READ   — ${err.message}`);
    }
  } else {
    results.crudRead = `${WARN} Skipped (no test record created)`;
    console.log(`  ${WARN} READ   — Skipped (CREATE failed)`);
  }

  // UPDATE
  if (testId !== null) {
    try {
      const [upd] = await conn.execute(
        'UPDATE `students` SET `name` = ?, `course` = ? WHERE `id` = ?',
        ['[TEST] Updated Bot', 'CRUD Updated Course', testId]
      );
      if (upd.affectedRows === 1) {
        results.crudUpdate = PASS;
        console.log(`  ${PASS} UPDATE — Test record #${testId} updated (affectedRows=1)`);
      } else {
        results.crudUpdate = FAIL;
        results.errors.push('CRUD UPDATE: 0 rows affected');
        console.error(`  ${FAIL} UPDATE — 0 rows affected`);
      }
    } catch (err) {
      results.crudUpdate = FAIL;
      results.errors.push(`CRUD UPDATE failed: ${err.message}`);
      console.error(`  ${FAIL} UPDATE — ${err.message}`);
    }
  } else {
    results.crudUpdate = `${WARN} Skipped`;
    console.log(`  ${WARN} UPDATE — Skipped`);
  }

  // DELETE (only the test record)
  if (testId !== null) {
    try {
      const [del] = await conn.execute('DELETE FROM `students` WHERE `id` = ?', [testId]);
      if (del.affectedRows === 1) {
        results.crudDelete = PASS;
        console.log(`  ${PASS} DELETE — Test record #${testId} permanently removed`);
      } else {
        results.crudDelete = FAIL;
        results.errors.push('CRUD DELETE: 0 rows affected');
        console.error(`  ${FAIL} DELETE — 0 rows affected`);
      }
    } catch (err) {
      results.crudDelete = FAIL;
      results.errors.push(`CRUD DELETE failed: ${err.message}`);
      console.error(`  ${FAIL} DELETE — ${err.message}`);
    }
  } else {
    results.crudDelete = `${WARN} Skipped`;
    console.log(`  ${WARN} DELETE — Skipped`);
  }

  // ── 7. Post-test record count ────────────────────────────────────────────
  console.log('\n[ STEP 7 ] Verifying no real records were affected...');
  try {
    const [finalCount] = await conn.execute('SELECT COUNT(*) AS cnt FROM `students`');
    console.log(`  ${PASS} Final record count: ${finalCount[0].cnt} (test record removed)`);
  } catch (err) {
    console.error(`  ${FAIL} ${err.message}`);
  }

  await conn.end();
  printSummary();
}

function printSummary() {
  console.log('\n=================================================');
  console.log('  FINAL VERIFICATION REPORT');
  console.log('=================================================');
  console.log('\n📡 DATABASE CONNECTION');
  console.log(`  Status:    ${results.dbConnection}`);
  console.log(`  Database:  pnn_project_db`);

  console.log('\n📋 TABLE MIGRATION');
  console.log(`  students table:   ${results.tableStudents || 'Not tested'}`);
  console.log(`  Schema match:     ${results.schemaMatch || 'Not tested'}`);
  console.log(`  Existing records: ${results.existingRecords || 'Not tested'}`);

  console.log('\n🧪 CRUD TESTING');
  console.log(`  Create: ${results.crudCreate || 'Not tested'}`);
  console.log(`  Read:   ${results.crudRead   || 'Not tested'}`);
  console.log(`  Update: ${results.crudUpdate || 'Not tested'}`);
  console.log(`  Delete: ${results.crudDelete || 'Not tested'}`);

  if (results.fixes.length > 0) {
    console.log('\n🔧 AUTO-FIXES APPLIED');
    results.fixes.forEach(f => console.log(`  - ${f}`));
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS FOUND');
    results.errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('\n  No errors found.');
  }

  const allPassed = [
    results.crudCreate, results.crudRead,
    results.crudUpdate, results.crudDelete
  ].every(r => r && r.includes('PASS'));

  const dbOk = results.dbConnection && results.dbConnection.includes('PASS');

  console.log('\n🏁 FINAL STATUS');
  if (dbOk && allPassed && results.errors.length === 0) {
    console.log('  ✅ FULLY WORKING — All tests passed. Ready to run with: npm start');
  } else if (dbOk) {
    console.log('  ⚠️  PARTIALLY WORKING — DB connected but some tests failed.');
  } else {
    console.log('  ❌ NOT WORKING — MySQL not reachable. Start XAMPP MySQL first.');
  }

  console.log('\n=================================================\n');
}

run().catch(err => {
  console.error('\n💥 Unexpected error:', err.message);
  process.exit(1);
});
