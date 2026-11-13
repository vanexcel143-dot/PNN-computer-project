/**
 * Student Controller
 * Connects routes with StudentModel and view templates.
 */

const fs = require('fs');
const path = require('path');
const StudentModel = require('../models/studentModel');

// Helper to load HTML view file
function loadView(viewName) {
  const filePath = path.join(__dirname, '..', 'views', viewName);
  return fs.readFileSync(filePath, 'utf8');
}

class StudentController {
  // ========================================================================
  // HTML VIEW HANDLERS (Browser UI)
  // ========================================================================

  /**
   * Render student records page (READ)
   * GET /students
   */
  static async renderStudentsPage(req, res) {
    try {
      const search = req.query.search || '';
      const msg = req.query.msg || '';
      const err = req.query.err || '';

      const students = await StudentModel.findAll(search);
      let html = loadView('students.html');

      // Inject server-rendered rows into table
      const rowsHtml = students.length > 0
        ? students.map(s => `
          <tr>
            <td><strong>#${s.id}</strong></td>
            <td><div style="font-weight: 700; color: #0f172a;">${escapeHtml(s.name)}</div></td>
            <td><a href="mailto:${escapeHtml(s.email)}" style="color: #0070f3; text-decoration: none;">${escapeHtml(s.email)}</a></td>
            <td><span class="course-badge">${escapeHtml(s.course)}</span></td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 0.5rem; justify-content: flex-end;">
                <a href="/students/edit/${s.id}" class="btn-action-edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Edit
                </a>
                <form action="/students/delete/${s.id}" method="POST" style="margin: 0; display: inline;" onsubmit="return confirm('Permanently delete student ${escapeHtml(s.name)} (ID #${s.id})?');">
                  <button type="submit" class="btn-action-delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                  </button>
                </form>
              </div>
            </td>
          </tr>
        `).join('')
        : `
          <tr>
            <td colspan="5" style="text-align: center; padding: 3rem 1.5rem; color: #64748b;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📂</div>
              <p style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">No student records found</p>
              <p style="font-size: 0.9rem; margin: 0 0 1.5rem 0;">
                ${search ? `No matches found for "${escapeHtml(search)}".` : 'Start by adding your first student record to MySQL.'}
              </p>
              ${search ? '<a href="/students" class="btn-secondary" style="padding: 0.6rem 1.25rem;">View All Records</a>' : '<a href="/students/create" class="btn-primary" style="padding: 0.6rem 1.25rem;">+ Add New Student</a>'}
            </td>
          </tr>
        `;

      // Inject alerts
      let alertHtml = '';
      if (msg === 'created') {
        alertHtml = `<div class="alert-banner alert-success"><span>✓ New student record created successfully!</span></div>`;
      } else if (msg === 'updated') {
        alertHtml = `<div class="alert-banner alert-success"><span>✓ Student record updated successfully!</span></div>`;
      } else if (msg === 'deleted') {
        alertHtml = `<div class="alert-banner alert-info"><span>✓ Student record permanently removed.</span></div>`;
      } else if (err) {
        alertHtml = `<div class="alert-banner alert-error"><span>⚠️ ${escapeHtml(err)}</span></div>`;
      }

      html = html.replace('<!-- {{ALERT_BANNER}} -->', alertHtml);
      html = html.replace('<!-- {{STUDENT_ROWS}} -->', rowsHtml);
      html = html.replace('{{TOTAL_COUNT}}', students.length.toString());
      html = html.replace('{{SEARCH_VALUE}}', escapeHtml(search));

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Error rendering students page:', error);
      res.status(500).send(renderErrorPage(error.message));
    }
  }

  /**
   * Render create student form (CREATE)
   * GET /students/create
   */
  static async renderCreatePage(req, res) {
    try {
      const err = req.query.err || '';
      let html = loadView('student-create.html');

      let errorHtml = err ? `<div class="alert-error">⚠️ ${escapeHtml(err)}</div>` : '';
      html = html.replace('<!-- {{ERROR_BANNER}} -->', errorHtml);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send(renderErrorPage(error.message));
    }
  }

  /**
   * Process form POST for creating a student
   * POST /students/create
   */
  static async handleCreateStudent(req, res) {
    try {
      const { name, email, course } = req.body;
      await StudentModel.create({ name, email, course });
      res.redirect('/students?msg=created');
    } catch (error) {
      console.error('Error creating student:', error);
      res.redirect(`/students/create?err=${encodeURIComponent('Database error: ' + error.message)}`);
    }
  }

  /**
   * Render edit student form (UPDATE)
   * GET /students/edit/:id
   */
  static async renderEditPage(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const err = req.query.err || '';

      if (isNaN(id)) {
        return res.redirect('/students');
      }

      const student = await StudentModel.findById(id);
      if (!student) {
        return res.status(404).send(renderErrorPage(`Student with ID #${id} not found.`));
      }

      let html = loadView('student-edit.html');

      let errorHtml = err ? `<div class="alert-error">⚠️ ${escapeHtml(err)}</div>` : '';
      html = html.replace('<!-- {{ERROR_BANNER}} -->', errorHtml);
      html = html.replace(/{{STUDENT_ID}}/g, student.id.toString());
      html = html.replace('{{STUDENT_NAME}}', escapeHtml(student.name));
      html = html.replace('{{STUDENT_EMAIL}}', escapeHtml(student.email));
      html = html.replace('{{STUDENT_COURSE}}', escapeHtml(student.course));

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send(renderErrorPage(error.message));
    }
  }

  /**
   * Process form POST for updating student
   * POST /students/edit/:id
   */
  static async handleUpdateStudent(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, email, course } = req.body;

      if (isNaN(id)) {
        return res.redirect('/students');
      }

      const success = await StudentModel.update(id, { name, email, course });
      if (success) {
        res.redirect('/students?msg=updated');
      } else {
        res.redirect(`/students/edit/${id}?err=${encodeURIComponent('Record update failed or no changes made.')}`);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      res.redirect(`/students/edit/${req.params.id}?err=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Process student deletion
   * POST /students/delete/:id
   */
  static async handleDeleteStudent(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (!isNaN(id)) {
        await StudentModel.delete(id);
      }
      res.redirect('/students?msg=deleted');
    } catch (error) {
      console.error('Error deleting student:', error);
      res.redirect(`/students?err=${encodeURIComponent(error.message)}`);
    }
  }

  // ========================================================================
  // REST API HANDLERS (JSON for AJAX / Frontend Fetch)
  // ========================================================================

  static async apiGetAll(req, res) {
    try {
      const search = req.query.search || '';
      const students = await StudentModel.findAll(search);
      res.json({ success: true, count: students.length, data: students });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async apiGetOne(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const student = await StudentModel.findById(id);
      if (student) {
        res.json({ success: true, data: student });
      } else {
        res.status(404).json({ success: false, message: 'Student not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async apiCreate(req, res) {
    try {
      const { name, email, course } = req.body;
      const insertId = await StudentModel.create({ name, email, course });
      res.status(201).json({ success: true, message: 'Student created successfully', data: { id: insertId, name, email, course } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async apiUpdate(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, email, course } = req.body;
      const success = await StudentModel.update(id, { name, email, course });
      if (success) {
        res.json({ success: true, message: 'Student updated successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Student not found or unchanged' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async apiDelete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await StudentModel.delete(id);
      if (success) {
        res.json({ success: true, message: 'Student deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Student not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

// Utility: HTML escaping to prevent XSS
function escapeHtml(string) {
  if (string === null || string === undefined) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Utility: Error page renderer
function renderErrorPage(errorMessage) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Application Error | PNN System</title>
      <style>
        body { font-family: sans-serif; background: #f8fafc; padding: 3rem; color: #0f172a; }
        .error-card { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 2rem; border-left: 5px solid #ef4444; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
      </style>
    </head>
    <body>
      <div class="error-card">
        <h2 style="color: #b91c1c; margin-top: 0;">⚠️ System / Database Error</h2>
        <p>${escapeHtml(errorMessage)}</p>
        <p style="color: #64748b; font-size: 0.9rem;">Please verify MySQL is running in XAMPP on localhost:3306 with database <strong>pnn_project_db</strong>.</p>
        <a href="/students" style="display: inline-block; margin-top: 1rem; color: #0070f3; font-weight: 700;">← Return to Student List</a>
      </div>
    </body>
    </html>
  `;
}

module.exports = StudentController;
