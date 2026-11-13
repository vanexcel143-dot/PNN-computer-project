/**
 * Student CRUD Routes
 * Web UI routes and JSON API routes
 */

const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { validateStudent } = require('../middleware/validateStudent');

// ==========================================================================
// Web Browser UI Routes (HTML Views)
// ==========================================================================

// READ: List all students with search & alerts
router.get('/students', StudentController.renderStudentsPage);

// CREATE: Form view
router.get('/students/create', StudentController.renderCreatePage);

// CREATE: Process submission
router.post('/students/create', validateStudent, StudentController.handleCreateStudent);

// UPDATE: Form view with preloaded student data
router.get('/students/edit/:id', StudentController.renderEditPage);

// UPDATE: Process submission
router.post('/students/edit/:id', validateStudent, StudentController.handleUpdateStudent);

// DELETE: Process deletion with confirmation
router.post('/students/delete/:id', StudentController.handleDeleteStudent);

// ==========================================================================
// REST API Endpoints (JSON for AJAX / external clients)
// ==========================================================================
router.get('/api/students', StudentController.apiGetAll);
router.get('/api/students/:id', StudentController.apiGetOne);
router.post('/api/students', validateStudent, StudentController.apiCreate);
router.put('/api/students/:id', validateStudent, StudentController.apiUpdate);
router.delete('/api/students/:id', StudentController.apiDelete);

module.exports = router;
