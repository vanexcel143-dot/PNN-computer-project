/**
 * Authentication Routes
 * Web UI views and JSON API endpoints for Authentication & Profile Management
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/authMiddleware');
const ValidateUser = require('../middleware/validateUser');

// ==========================================================================
// Web Browser UI Routes
// ==========================================================================

// Login Page & Submission
router.get('/login', AuthController.renderLogin);
router.post('/login', AuthController.handleLogin);

// Customer Registration Page & Submission
router.get('/register', AuthController.renderRegister);
router.post('/register', AuthController.handleRegister);

// Logout
router.get('/logout', AuthController.handleLogout);

// Change Password (Self & First Login Mandatory)
router.get('/change-password', AuthMiddleware.isAuthenticated, AuthController.renderChangePassword);
router.post(
  '/change-password',
  AuthMiddleware.isAuthenticated,
  ValidateUser.validatePasswordChange,
  AuthController.handleChangePassword
);

// User Profile
router.get(
  '/profile',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.checkMustChangePassword,
  AuthController.renderProfile
);
router.post(
  '/profile',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.checkMustChangePassword,
  AuthController.handleUpdateProfile
);

// ==========================================================================
// REST API Endpoints
// ==========================================================================
router.post('/api/auth/login', AuthController.handleLogin);
router.post('/api/auth/register', AuthController.handleRegister);
router.post('/api/auth/logout', AuthController.handleLogout);
router.get('/api/auth/me', AuthController.apiMe);
router.post(
  '/api/auth/change-password',
  AuthMiddleware.isAuthenticated,
  ValidateUser.validatePasswordChange,
  AuthController.handleChangePassword
);

module.exports = router;
