/**
 * User Account Management Routes
 * Enforces role-based security (ADMIN & SUPERADMIN)
 */

const express = require('express');
const router = express.Router();
const UserManagementController = require('../controllers/userManagementController');
const AuthMiddleware = require('../middleware/authMiddleware');
const ValidateUser = require('../middleware/validateUser');

// ==========================================================================
// Web Browser UI Routes (HTML Views)
// ==========================================================================

// READ: List all users with search, role filter, status filter
router.get(
  '/users',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.checkMustChangePassword,
  UserManagementController.renderUsersPage
);

// CREATE: Form view
router.get(
  '/users/create',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.checkMustChangePassword,
  UserManagementController.renderCreatePage
);

// CREATE: Process form submission
router.post(
  '/users/create',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.checkMustChangePassword,
  ValidateUser.validateCreate,
  UserManagementController.handleCreateUser
);

// UPDATE: Form view
router.get(
  '/users/edit/:id',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.checkMustChangePassword,
  AuthMiddleware.canManageTargetUser,
  UserManagementController.renderEditPage
);

// UPDATE: Process form submission
router.post(
  '/users/edit/:id',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.checkMustChangePassword,
  AuthMiddleware.canManageTargetUser,
  ValidateUser.validateUpdate,
  UserManagementController.handleUpdateUser
);

// RESET PASSWORD: Superadmin / Admin reset
router.post(
  '/users/reset-password/:id',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.checkMustChangePassword,
  AuthMiddleware.canManageTargetUser,
  UserManagementController.handleResetPassword
);

// DELETE: Process account deletion with Payment Settlement Verification
router.post(
  '/users/delete/:id',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.checkMustChangePassword,
  AuthMiddleware.canManageTargetUser,
  UserManagementController.handleDeleteUser
);

// ==========================================================================
// REST API Endpoints (JSON for AJAX / Frontend clients)
// ==========================================================================
router.get('/api/users', AuthMiddleware.requireAdminOrSuperAdmin, UserManagementController.apiGetAll);
router.get('/api/users/:id', AuthMiddleware.requireAdminOrSuperAdmin, UserManagementController.apiGetOne);
router.get('/api/users/:id/settlement', AuthMiddleware.requireAdminOrSuperAdmin, UserManagementController.apiCheckSettlement);

router.post(
  '/api/users',
  AuthMiddleware.requireAdminOrSuperAdmin,
  ValidateUser.validateCreate,
  UserManagementController.handleCreateUser
);

router.put(
  '/api/users/:id',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.canManageTargetUser,
  ValidateUser.validateUpdate,
  UserManagementController.handleUpdateUser
);

router.post(
  '/api/users/:id/reset-password',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.canManageTargetUser,
  UserManagementController.handleResetPassword
);

router.delete(
  '/api/users/:id',
  AuthMiddleware.requireAdminOrSuperAdmin,
  AuthMiddleware.canManageTargetUser,
  UserManagementController.handleDeleteUser
);

module.exports = router;
