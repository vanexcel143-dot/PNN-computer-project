/**
 * Student Model
 * Handles database operations using MySQL2 prepared statements.
 */

const { pool } = require('../config/db');

class StudentModel {
  /**
   * Retrieve all students or filter by search query
   * @param {string} search
   * @returns {Promise<Array>}
   */
  static async findAll(search = '') {
    if (search && search.trim() !== '') {
      const query = `
        SELECT * FROM students 
        WHERE name LIKE ? OR email LIKE ? OR course LIKE ?
        ORDER BY id DESC
      `;
      const term = `%${search.trim()}%`;
      const [rows] = await pool.execute(query, [term, term, term]);
      return rows;
    }

    const query = `SELECT * FROM students ORDER BY id DESC`;
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Retrieve a single student by primary key ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `SELECT * FROM students WHERE id = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Insert a new student record
   * @param {Object} data { name, email, course }
   * @returns {Promise<number>} Inserted ID
   */
  static async create({ name, email, course }) {
    const query = `
      INSERT INTO students (name, email, course) 
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [name.trim(), email.trim(), course.trim()]);
    return result.insertId;
  }

  /**
   * Update an existing student record
   * @param {number} id
   * @param {Object} data { name, email, course }
   * @returns {Promise<boolean>}
   */
  static async update(id, { name, email, course }) {
    const query = `
      UPDATE students 
      SET name = ?, email = ?, course = ? 
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name.trim(), email.trim(), course.trim(), id]);
    return result.affectedRows > 0;
  }

  /**
   * Permanently delete a student record by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const query = `DELETE FROM students WHERE id = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Count total registered students
   * @returns {Promise<number>}
   */
  static async count() {
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM students`);
    return rows[0].total || 0;
  }
}

module.exports = StudentModel;
