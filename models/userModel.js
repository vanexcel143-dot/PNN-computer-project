/**
 * User Model
 * Handles database operations for User Accounts, Roles, Payments & Audit Logs
 * Uses prepared SQL statements and bcrypt for password hashing.
 */

const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
  /**
   * Find all users with role information and payment balance summary
   * @param {Object} filters { search, userTypeId, status }
   */
  static async findAll(filters = {}) {
    const { search = '', userTypeId = '', status = '' } = filters;
    let query = `
      SELECT 
        u.id,
        u.user_type_id,
        u.username,
        u.full_name,
        u.email,
        u.contact_number,
        u.status,
        u.must_change_password,
        u.created_at,
        u.updated_at,
        ut.type_name AS role_name,
        ut.description AS role_description,
        COALESCE(tx.total_due, 0) AS total_due,
        COALESCE(tx.total_paid, 0) AS total_paid,
        COALESCE(tx.outstanding_balance, 0) AS outstanding_balance,
        COALESCE(tx.unpaid_count, 0) AS unpaid_transactions_count
      FROM users u
      INNER JOIN user_types ut ON u.user_type_id = ut.id
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(amount_due) AS total_due,
          SUM(amount_paid) AS total_paid,
          SUM(amount_due - amount_paid) AS outstanding_balance,
          SUM(CASE WHEN payment_status != 'PAID' THEN 1 ELSE 0 END) AS unpaid_count
        FROM user_transactions
        GROUP BY user_id
      ) tx ON u.id = tx.user_id
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR u.contact_number LIKE ?)`;
      params.push(term, term, term, term);
    }

    if (userTypeId && userTypeId !== 'all') {
      query += ` AND u.user_type_id = ?`;
      params.push(parseInt(userTypeId, 10));
    }

    if (status && status !== 'all') {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY u.id ASC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Find a user by primary key ID
   * @param {number} id
   */
  static async findById(id) {
    const query = `
      SELECT 
        u.id,
        u.user_type_id,
        u.username,
        u.full_name,
        u.email,
        u.contact_number,
        u.status,
        u.must_change_password,
        u.created_at,
        u.updated_at,
        ut.type_name AS role_name,
        ut.description AS role_description
      FROM users u
      INNER JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find user by username (includes hashed password for auth)
   * @param {string} username
   */
  static async findByUsername(username) {
    const query = `
      SELECT u.*, ut.type_name AS role_name 
      FROM users u
      INNER JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.username = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [username.trim()]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find user by email
   * @param {string} email
   */
  static async findByEmail(email) {
    const query = `
      SELECT u.*, ut.type_name AS role_name 
      FROM users u
      INNER JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.email = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [email.trim().toLowerCase()]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find user by username OR email (for flexible login)
   * @param {string} identifier
   */
  static async findByIdentifier(identifier) {
    const term = identifier.trim();
    const query = `
      SELECT u.*, ut.type_name AS role_name 
      FROM users u
      INNER JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.username = ? OR u.email = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [term, term.toLowerCase()]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new user account with bcrypt password hashing
   * @param {Object} data
   */
  static async create(data) {
    const {
      user_type_id,
      username,
      password,
      full_name,
      email,
      contact_number = null,
      status = 'ACTIVE',
      must_change_password = 0
    } = data;

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (
        user_type_id, username, password, full_name, email, contact_number, status, must_change_password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      user_type_id,
      username.trim(),
      hashedPassword,
      full_name.trim(),
      email.trim().toLowerCase(),
      contact_number ? contact_number.trim() : null,
      status,
      must_change_password ? 1 : 0
    ]);

    return result.insertId;
  }

  /**
   * Update user general profile information
   * @param {number} id
   * @param {Object} data
   */
  static async update(id, data) {
    const { user_type_id, username, full_name, email, contact_number, status } = data;
    
    // Build dynamic query depending on what fields are supplied
    const updates = [];
    const params = [];

    if (user_type_id !== undefined) {
      updates.push('user_type_id = ?');
      params.push(parseInt(user_type_id, 10));
    }
    if (username !== undefined) {
      updates.push('username = ?');
      params.push(username.trim());
    }
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name.trim());
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email.trim().toLowerCase());
    }
    if (contact_number !== undefined) {
      updates.push('contact_number = ?');
      params.push(contact_number ? contact_number.trim() : null);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) return true;

    params.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Update user password with bcrypt hashing
   * @param {number} id
   * @param {string} newPassword
   * @param {number} mustChangePassword
   */
  static async updatePassword(id, newPassword, mustChangePassword = 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const query = `
      UPDATE users 
      SET password = ?, must_change_password = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [hashedPassword, mustChangePassword ? 1 : 0, id]);
    return result.affectedRows > 0;
  }

  /**
   * Verify password against bcrypt hash
   * @param {string} plainPassword
   * @param {string} hashedPassword
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Payment Settlement Verification
   * Checks whether a user account has any unsettled transactions or outstanding balance.
   * Requirement 6: Must verify actual transaction records, not just a status label.
   * @param {number} userId
   * @returns {Promise<Object>} { isSettled: boolean, balance: number, unpaidCount: number, transactions: Array }
   */
  static async checkPaymentSettlement(userId) {
    // 1. Retrieve all transactions for this user
    const [transactions] = await pool.execute(
      `SELECT id, transaction_code, description, amount_due, amount_paid, 
              (amount_due - amount_paid) AS balance, payment_status, due_date, created_at
       FROM user_transactions 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    // 2. Compute accurate financial balance
    let totalDue = 0;
    let totalPaid = 0;
    let unpaidCount = 0;

    for (const txn of transactions) {
      const due = parseFloat(txn.amount_due) || 0;
      const paid = parseFloat(txn.amount_paid) || 0;
      totalDue += due;
      totalPaid += paid;

      const remaining = due - paid;
      if (remaining > 0 || txn.payment_status !== 'PAID') {
        unpaidCount++;
      }
    }

    const outstandingBalance = Math.max(0, totalDue - totalPaid);
    const isSettled = outstandingBalance <= 0 && unpaidCount === 0;

    return {
      isSettled,
      totalDue,
      totalPaid,
      outstandingBalance,
      unpaidCount,
      transactions
    };
  }

  /**
   * Verify whether a user can be safely deleted or deactivated
   * @param {number} userId
   * @returns {Promise<Object>} { allowed: boolean, reason: string, details: Object }
   */
  static async canDeleteUser(userId) {
    const user = await this.findById(userId);
    if (!user) {
      return { allowed: false, reason: 'User does not exist.' };
    }

    // Default Superadmin protection
    if (user.username === 'admin' || user.role_name === 'SUPERADMIN' && user.id === 1) {
      return { allowed: false, reason: 'The default SUPERADMIN system account cannot be deleted.' };
    }

    // Check payment settlement
    const settlement = await this.checkPaymentSettlement(userId);
    if (!settlement.isSettled) {
      return {
        allowed: false,
        reason: `Account deletion blocked: User has an unsettled outstanding balance of $${settlement.outstandingBalance.toFixed(2)} across ${settlement.unpaidCount} unpaid/pending transaction(s). All financial obligations must be settled before deletion.`,
        settlement
      };
    }

    return { allowed: true, settlement };
  }

  /**
   * Delete or deactive user account
   * If user has transactions on file, perform safe soft deletion (status = 'DEACTIVATED')
   * to preserve financial & audit history.
   * If 0 transactions, permanent deletion can be performed.
   * @param {number} userId
   * @param {boolean} forcePermanent
   */
  static async delete(userId, forcePermanent = false) {
    const check = await this.canDeleteUser(userId);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const { settlement } = check;

    // If user has historical transactions (all settled), soft-deactivate to preserve financial record history
    if (settlement.transactions.length > 0 && !forcePermanent) {
      await pool.execute(
        `UPDATE users SET status = 'DEACTIVATED' WHERE id = ?`,
        [userId]
      );
      return { type: 'DEACTIVATED', message: 'User account has been safely deactivated. Financial and transaction records preserved.' };
    }

    // Otherwise permanently remove user
    try {
      await pool.execute(`DELETE FROM users WHERE id = ?`, [userId]);
      return { type: 'DELETED', message: 'User account has been permanently removed.' };
    } catch (err) {
      // If foreign key constraint trips, fall back to deactivation
      await pool.execute(
        `UPDATE users SET status = 'DEACTIVATED' WHERE id = ?`,
        [userId]
      );
      return { type: 'DEACTIVATED', message: 'User account deactivated to preserve related database records.' };
    }
  }

  /**
   * Get all user types / roles
   */
  static async getUserTypes() {
    const [rows] = await pool.query('SELECT * FROM user_types ORDER BY id ASC');
    return rows;
  }

  /**
   * Get CUSTOMER role ID from database
   */
  static async getCustomerRoleId() {
    const [rows] = await pool.query(
      "SELECT id FROM user_types WHERE type_name = 'CUSTOMER' OR type_name = 'USER' ORDER BY id ASC LIMIT 1"
    );
    if (rows.length > 0) return rows[0].id;
    return 3;
  }

  /**
   * Log administrative & security actions to audit_logs
   * @param {Object} logData { userId, action, details, ipAddress }
   */
  static async logAudit({ userId = null, action, details = '', ipAddress = '127.0.0.1' }) {
    try {
      await pool.execute(
        'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, action, details, ipAddress]
      );
    } catch (e) {
      console.error('Audit log error:', e.message);
    }
  }
}

module.exports = UserModel;
