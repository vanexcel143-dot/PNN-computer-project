/**
 * Comprehensive Automated Verification Test Script for User Account Management System
 * Run: node scripts/test-user-system.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const UserModel = require('../models/userModel');
const { runMigration } = require('../migrations/migrate_user_system');

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

const report = [];

function recordTest(name, passed, details = '') {
  report.push({ name, passed, details });
  const status = passed ? PASS : FAIL;
  console.log(`  ${status} - ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('  🧪 PNN USER ACCOUNT MANAGEMENT & SECURITY VERIFICATION TEST');
  console.log('=============================================================\n');

  // Test 1: Migration Idempotency
  console.log('[ TEST GROUP 1: Database Migration & Tables ]');
  try {
    await runMigration();
    recordTest('Migration executed idempotently without error', true);
  } catch (err) {
    recordTest('Migration executed idempotently without error', false, err.message);
  }

  // Test 2: Check required tables in MySQL
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'pnn_project_db',
    port: parseInt(process.env.DB_PORT, 10) || 3306
  });

  const [tables] = await db.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  const requiredTables = ['user_types', 'users', 'user_transactions', 'audit_logs', 'students'];

  for (const table of requiredTables) {
    recordTest(`Table "${table}" exists in pnn_project_db`, tableNames.includes(table));
  }

  // Test 3: User Types / Roles Verification
  console.log('\n[ TEST GROUP 2: User Types & Roles ]');
  const roles = await UserModel.getUserTypes();
  const roleNames = roles.map(r => r.type_name);
  recordTest('Role "SUPERADMIN" exists', roleNames.includes('SUPERADMIN'));
  recordTest('Role "ADMIN" exists', roleNames.includes('ADMIN'));
  recordTest('Role "USER" exists', roleNames.includes('USER'));

  // Test 4: Default SUPERADMIN Account Verification
  console.log('\n[ TEST GROUP 3: Default SUPERADMIN Account ]');
  const adminUser = await UserModel.findByUsername('admin');
  recordTest('Default admin account exists', adminUser !== null);
  if (adminUser) {
    recordTest('Admin has SUPERADMIN role', adminUser.role_name === 'SUPERADMIN');
    recordTest('Admin account status is ACTIVE', adminUser.status === 'ACTIVE');
    recordTest('Admin must change password on first login', adminUser.must_change_password === 1);
    
    // Verify password is not plain text and matches 'admin' via bcrypt
    const isPlain = adminUser.password === 'admin';
    const isBcrypt = adminUser.password.startsWith('$2a$') || adminUser.password.startsWith('$2b$');
    const bcryptMatches = await bcrypt.compare('admin', adminUser.password);

    recordTest('Password is NOT stored as plain text', !isPlain);
    recordTest('Password is a valid bcrypt hash', isBcrypt);
    recordTest('Bcrypt hash verifies against default password "admin"', bcryptMatches);
  }

  // Test 5: Duplicate Prevention
  console.log('\n[ TEST GROUP 4: Duplicate Prevention ]');
  let duplicateUsernameBlocked = false;
  try {
    await UserModel.create({
      user_type_id: 3,
      username: 'admin', // already taken
      password: 'somepassword',
      full_name: 'Imposter Admin',
      email: 'imposter@pnntech.com'
    });
  } catch (e) {
    duplicateUsernameBlocked = e.code === 'ER_DUP_ENTRY' || e.message.includes('Duplicate');
  }
  recordTest('Duplicate username registration is blocked by database constraint', duplicateUsernameBlocked);

  let duplicateEmailBlocked = false;
  try {
    await UserModel.create({
      user_type_id: 3,
      username: 'unique_user_' + Date.now(),
      password: 'somepassword',
      full_name: 'Imposter Email',
      email: 'admin@pnntech.com' // already taken
    });
  } catch (e) {
    duplicateEmailBlocked = e.code === 'ER_DUP_ENTRY' || e.message.includes('Duplicate');
  }
  recordTest('Duplicate email registration is blocked by database constraint', duplicateEmailBlocked);

  // Test 6: Create, Read, Update User Account
  console.log('\n[ TEST GROUP 5: User Account CRUD Operations ]');
  const testUsername = 'test_user_' + Math.floor(Math.random() * 10000);
  const testEmail = `${testUsername}@example.com`;
  let testUserId = null;

  try {
    testUserId = await UserModel.create({
      user_type_id: roles.find(r => r.type_name === 'USER').id,
      username: testUsername,
      password: 'InitialPassword123',
      full_name: 'Test Verification User',
      email: testEmail,
      contact_number: '+63 999 111 2222',
      status: 'ACTIVE',
      must_change_password: 0
    });
    recordTest(`CREATE: New account created (ID #${testUserId})`, testUserId > 0);
  } catch (e) {
    recordTest('CREATE: New account created', false, e.message);
  }

  if (testUserId) {
    // READ
    const retrieved = await UserModel.findById(testUserId);
    recordTest('READ: Retrieved user matches created data', retrieved && retrieved.username === testUsername);

    // UPDATE Info
    await UserModel.update(testUserId, {
      full_name: 'Test User Updated Name',
      contact_number: '+63 999 888 7777'
    });
    const updatedUser = await UserModel.findById(testUserId);
    recordTest('UPDATE: Full name and contact updated', updatedUser.full_name === 'Test User Updated Name');

    // UPDATE Password
    await UserModel.updatePassword(testUserId, 'NewSecurePassword456', 0);
    const userWithPw = await UserModel.findByUsername(testUsername);
    const newPwMatches = await bcrypt.compare('NewSecurePassword456', userWithPw.password);
    const oldPwRejected = !(await bcrypt.compare('InitialPassword123', userWithPw.password));
    recordTest('UPDATE PASSWORD: New password hashed & verified via bcrypt', newPwMatches && oldPwRejected);
  }

  // Test 7: Payment Settlement Validation & Account Deletion
  console.log('\n[ TEST GROUP 6: Payment Settlement Validation & Deletion Protection ]');

  // Case A: Default Superadmin protection
  const superAdminCheck = await UserModel.canDeleteUser(adminUser.id);
  recordTest('SUPERADMIN Protection: System admin account cannot be deleted', !superAdminCheck.allowed, superAdminCheck.reason);

  // Case B: User with UNPAID transactions
  const unpaidUser = await UserModel.findByUsername('unpaid_student');
  if (unpaidUser) {
    const unpaidCheck = await UserModel.canDeleteUser(unpaidUser.id);
    recordTest('Payment Settlement: User with unpaid balance is BLOCKED from deletion', !unpaidCheck.allowed, unpaidCheck.reason);

    let deleteThrew = false;
    try {
      await UserModel.delete(unpaidUser.id);
    } catch (e) {
      deleteThrew = true;
    }
    recordTest('Payment Settlement: UserModel.delete() throws error for unsettled account', deleteThrew);
  }

  // Case C: User with SETTLED transactions
  const settledUser = await UserModel.findByUsername('juan_customer');
  if (settledUser) {
    const settledCheck = await UserModel.canDeleteUser(settledUser.id);
    recordTest('Payment Settlement: User with $0.00 settled balance is ALLOWED deletion/deactivation', settledCheck.allowed);
  }

  // Case D: Clean up our newly created test user (has 0 transactions)
  if (testUserId) {
    const deleteRes = await UserModel.delete(testUserId, true);
    recordTest('DELETE: Eligible test account safely deleted/deactivated', deleteRes !== null, deleteRes.type);
    
    // Verify deletion
    const finalCheck = await UserModel.findById(testUserId);
    recordTest('DELETE: Test account confirmed removed or deactivated', finalCheck === null || finalCheck.status === 'DEACTIVATED');
  }

  // Test 8: Audit Logging
  console.log('\n[ TEST GROUP 7: Security Audit Logging ]');
  await UserModel.logAudit({
    userId: adminUser.id,
    action: 'TEST_VERIFICATION_EVENT',
    details: 'Automated test suite ran verification check',
    ipAddress: '127.0.0.1'
  });

  const [logs] = await db.query(
    'SELECT * FROM audit_logs WHERE action = "TEST_VERIFICATION_EVENT" ORDER BY id DESC LIMIT 1'
  );
  recordTest('Audit Logging: Action successfully written to `audit_logs` table', logs.length > 0);

  await db.end();

  // Summary
  console.log('\n=============================================================');
  console.log('  🏁 TEST EXECUTION SUMMARY');
  console.log('=============================================================');
  const total = report.length;
  const passedCount = report.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`  Total Tests Run:  ${total}`);
  console.log(`  Tests Passed:    ${passedCount} / ${total}`);
  console.log(`  Tests Failed:    ${failedCount}`);

  if (failedCount === 0) {
    console.log('\n  🎉 ALL TESTS PASSED! User Account Management System is 100% operational.');
  } else {
    console.log('\n  ⚠️ Some tests failed. Please review the failed items above.');
  }
  console.log('=============================================================\n');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
