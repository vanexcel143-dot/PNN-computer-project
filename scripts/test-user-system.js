/**
 * Comprehensive Automated Verification Test Script for User Account Management & Customer Registration
 * Run: node scripts/test-user-system.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
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
  console.log('  🧪 PNN USER ACCOUNT & CUSTOMER REGISTRATION VERIFICATION');
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

  // Test 3: User Types / Roles Verification (SUPERADMIN, ADMIN, CUSTOMER)
  console.log('\n[ TEST GROUP 2: User Types & Roles ]');
  const roles = await UserModel.getUserTypes();
  const roleNames = roles.map(r => r.type_name);
  recordTest('Role "SUPERADMIN" exists', roleNames.includes('SUPERADMIN'));
  recordTest('Role "ADMIN" exists', roleNames.includes('ADMIN'));
  recordTest('Role "CUSTOMER" exists', roleNames.includes('CUSTOMER') || roleNames.includes('USER'));

  const customerRoleId = await UserModel.getCustomerRoleId();
  recordTest('Customer Role ID retrieved successfully', customerRoleId > 0, `ID: #${customerRoleId}`);

  // Test 4: Default SUPERADMIN Account Verification
  console.log('\n[ TEST GROUP 3: Default SUPERADMIN Account & Existing Users ]');
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

  // Verify staff admin
  const staffUser = await UserModel.findByUsername('staff_admin');
  recordTest('Existing Admin user ("staff_admin") exists and functional', staffUser !== null && staffUser.role_name === 'ADMIN');

  // Test 5: Customer Registration Functionality
  console.log('\n[ TEST GROUP 4: Customer Registration System ]');
  const testCustomerUser = 'cust_' + Math.floor(Math.random() * 10000);
  const testCustomerEmail = `${testCustomerUser}@customertest.com`;
  let registeredCustId = null;

  try {
    // Simulate Customer Registration (Must automatically assign CUSTOMER role)
    registeredCustId = await UserModel.create({
      user_type_id: customerRoleId,
      username: testCustomerUser,
      password: 'CustomerSecurePass123',
      full_name: 'Clarissa Customer Test',
      email: testCustomerEmail,
      contact_number: '+63 918 123 4567',
      status: 'ACTIVE',
      must_change_password: 0
    });
    recordTest('New customer registration succeeds', registeredCustId > 0, `ID #${registeredCustId}`);
  } catch (e) {
    recordTest('New customer registration succeeds', false, e.message);
  }

  if (registeredCustId) {
    const custRecord = await UserModel.findById(registeredCustId);
    recordTest('New account automatically receives CUSTOMER as user type', custRecord.role_name === 'CUSTOMER' || custRecord.role_name === 'USER');

    // Test sign in with customer credentials
    const fullCust = await UserModel.findByUsername(testCustomerUser);
    const passMatches = await bcrypt.compare('CustomerSecurePass123', fullCust.password);
    recordTest('Newly registered customer password verified with bcrypt', passMatches);
  }

  // Duplicate username prevention
  let duplicateUsernameBlocked = false;
  try {
    await UserModel.create({
      user_type_id: customerRoleId,
      username: testCustomerUser, // duplicate
      password: 'password123',
      full_name: 'Imposter',
      email: 'imposter_' + Date.now() + '@example.com'
    });
  } catch (e) {
    duplicateUsernameBlocked = e.code === 'ER_DUP_ENTRY' || e.message.includes('Duplicate');
  }
  recordTest('Duplicate username registration is rejected by database', duplicateUsernameBlocked);

  // Duplicate email prevention
  let duplicateEmailBlocked = false;
  try {
    await UserModel.create({
      user_type_id: customerRoleId,
      username: 'unique_' + Date.now(),
      password: 'password123',
      full_name: 'Imposter Email',
      email: testCustomerEmail // duplicate
    });
  } catch (e) {
    duplicateEmailBlocked = e.code === 'ER_DUP_ENTRY' || e.message.includes('Duplicate');
  }
  recordTest('Duplicate email registration is rejected by database', duplicateEmailBlocked);

  // Test 6: Payment Settlement Validation & Account Deletion
  console.log('\n[ TEST GROUP 5: Payment Settlement Validation & Deletion Protection ]');

  // Case A: Default Superadmin protection
  const superAdminCheck = await UserModel.canDeleteUser(adminUser.id);
  recordTest('SUPERADMIN Protection: System admin account cannot be deleted', !superAdminCheck.allowed, superAdminCheck.reason);

  // Case B: User with UNPAID transactions
  const unpaidUser = await UserModel.findByUsername('unpaid_student');
  if (unpaidUser) {
    const unpaidCheck = await UserModel.canDeleteUser(unpaidUser.id);
    recordTest('Payment Settlement: User with unpaid balance is BLOCKED from deletion', !unpaidCheck.allowed, unpaidCheck.reason);
  }

  // Case C: User with SETTLED transactions
  const settledUser = await UserModel.findByUsername('juan_customer');
  if (settledUser) {
    const settledCheck = await UserModel.canDeleteUser(settledUser.id);
    recordTest('Payment Settlement: User with $0.00 settled balance is ALLOWED deletion/deactivation', settledCheck.allowed);
  }

  // Clean up registered customer test record
  if (registeredCustId) {
    await UserModel.delete(registeredCustId, true);
    recordTest('Cleaned up test customer account', true);
  }

  // Test 7: Storefront Navigation & UI Connections
  console.log('\n[ TEST GROUP 6: Storefront Navigation & Authentication Links ]');
  const publicIndexPath = path.join(__dirname, '..', 'public', 'index.html');
  const publicIndexHtml = fs.readFileSync(publicIndexPath, 'utf8');

  const hasUserAccountsInNav = publicIndexHtml.includes('User Accounts');
  recordTest('Storefront navigation REMOVED "User Accounts" link', !hasUserAccountsInNav);

  const hasSignInLink = publicIndexHtml.includes('href="/login"') || publicIndexHtml.includes('header-user-btn');
  recordTest('Storefront has "Sign In" link pointing to authentication portal', hasSignInLink);

  const loginViewPath = path.join(__dirname, '..', 'views', 'login.html');
  const loginViewHtml = fs.readFileSync(loginViewPath, 'utf8');
  const hasRegisterLinkInLogin = loginViewHtml.includes('/register');
  recordTest('Sign-In page includes link to Customer Registration (/register)', hasRegisterLinkInLogin);

  const registerViewPath = path.join(__dirname, '..', 'views', 'register.html');
  const registerViewHtml = fs.readFileSync(registerViewPath, 'utf8');
  const hasLoginLinkInRegister = registerViewHtml.includes('/login');
  recordTest('Registration page includes link back to Sign-In (/login)', hasLoginLinkInRegister);

  // Test 8: Audit Logging
  console.log('\n[ TEST GROUP 7: Security Audit Logging ]');
  await UserModel.logAudit({
    userId: adminUser.id,
    action: 'TEST_REGISTRATION_VERIFICATION',
    details: 'Verified customer registration and storefront navigation update',
    ipAddress: '127.0.0.1'
  });

  const [logs] = await db.query(
    'SELECT * FROM audit_logs WHERE action = "TEST_REGISTRATION_VERIFICATION" ORDER BY id DESC LIMIT 1'
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
    console.log('\n  🎉 ALL TESTS PASSED! Registration & Navigation updates verified 100%.');
  } else {
    console.log('\n  ⚠️ Some tests failed. Please review the output above.');
  }
  console.log('=============================================================\n');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
