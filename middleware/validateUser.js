/**
 * User Input Validation Middleware
 * Validates formats, lengths, and checks uniqueness before database operations.
 */

const UserModel = require('../models/userModel');

class ValidateUser {
  /**
   * Validate new account creation inputs
   */
  static async validateCreate(req, res, next) {
    const { username, password, full_name, email, user_type_id } = req.body;
    const errors = [];

    // Username validation
    const cleanUsername = typeof username === 'string' ? username.trim() : '';
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!cleanUsername) {
      errors.push('Username is required.');
    } else if (!usernameRegex.test(cleanUsername)) {
      errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores.');
    } else {
      const existingUser = await UserModel.findByUsername(cleanUsername);
      if (existingUser) {
        errors.push(`Username "${cleanUsername}" is already taken.`);
      }
    }

    // Password validation
    const cleanPassword = typeof password === 'string' ? password : '';
    if (!cleanPassword || cleanPassword.length < 4) {
      errors.push('Password must be at least 4 characters long.');
    }

    // Full name validation
    const cleanFullName = typeof full_name === 'string' ? full_name.trim() : '';
    if (!cleanFullName || cleanFullName.length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    }

    // Email validation
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      errors.push('Email address is required.');
    } else if (!emailRegex.test(cleanEmail)) {
      errors.push('Please enter a valid email address.');
    } else {
      const existingEmail = await UserModel.findByEmail(cleanEmail);
      if (existingEmail) {
        errors.push(`Email address "${cleanEmail}" is already registered.`);
      }
    }

    // User Type / Role validation
    const roleId = parseInt(user_type_id, 10);
    if (isNaN(roleId) || roleId <= 0) {
      errors.push('Please select a valid user type / role.');
    } else {
      const roles = await UserModel.getUserTypes();
      const validRole = roles.find(r => r.id === roleId);
      if (!validRole) {
        errors.push('Selected user type does not exist.');
      } else if (validRole.type_name === 'SUPERADMIN' && req.session?.user?.role_name !== 'SUPERADMIN') {
        errors.push('Only an active SUPERADMIN can assign the SUPERADMIN role.');
      }
    }

    if (errors.length > 0) {
      if (req.xhr || req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({ success: false, errors, message: errors.join(' ') });
      }
      return res.redirect(`/users/create?err=${encodeURIComponent(errors[0])}`);
    }

    // Attach sanitized values
    req.body.username = cleanUsername;
    req.body.password = cleanPassword;
    req.body.full_name = cleanFullName;
    req.body.email = cleanEmail;
    req.body.user_type_id = roleId;

    next();
  }

  /**
   * Validate account update inputs
   */
  static async validateUpdate(req, res, next) {
    const userId = parseInt(req.params.id || req.body.id, 10);
    const { username, full_name, email, contact_number, user_type_id } = req.body;
    const errors = [];

    // Check target exists
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.redirect('/users?err=User+not+found');
    }

    // Username validation (if updating)
    if (username !== undefined) {
      const cleanUsername = username.trim();
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(cleanUsername)) {
        errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores.');
      } else if (cleanUsername !== currentUser.username) {
        const existing = await UserModel.findByUsername(cleanUsername);
        if (existing && existing.id !== userId) {
          errors.push(`Username "${cleanUsername}" is already taken.`);
        }
      }
      req.body.username = cleanUsername;
    }

    // Full name validation
    if (full_name !== undefined) {
      const cleanFullName = full_name.trim();
      if (cleanFullName.length < 2) {
        errors.push('Full name must be at least 2 characters long.');
      }
      req.body.full_name = cleanFullName;
    }

    // Email validation
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.push('Please enter a valid email address.');
      } else if (cleanEmail !== currentUser.email) {
        const existing = await UserModel.findByEmail(cleanEmail);
        if (existing && existing.id !== userId) {
          errors.push(`Email address "${cleanEmail}" is already registered by another user.`);
        }
      }
      req.body.email = cleanEmail;
    }

    // Role validation
    if (user_type_id !== undefined) {
      const roleId = parseInt(user_type_id, 10);
      const roles = await UserModel.getUserTypes();
      const validRole = roles.find(r => r.id === roleId);
      if (!validRole) {
        errors.push('Selected user type does not exist.');
      } else if (validRole.type_name === 'SUPERADMIN' && req.session?.user?.role_name !== 'SUPERADMIN') {
        errors.push('Only an active SUPERADMIN can assign the SUPERADMIN role.');
      }
      req.body.user_type_id = roleId;
    }

    if (errors.length > 0) {
      if (req.xhr || req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({ success: false, errors, message: errors.join(' ') });
      }
      return res.redirect(`/users/edit/${userId}?err=${encodeURIComponent(errors[0])}`);
    }

    next();
  }

  /**
   * Validate password change inputs
   */
  static async validatePasswordChange(req, res, next) {
    const { currentPassword, newPassword, confirmPassword, isSuperAdminReset } = req.body;
    const errors = [];

    // If regular self-service, current password must be provided
    if (!isSuperAdminReset) {
      if (!currentPassword) {
        errors.push('Current password is required.');
      }
    }

    if (!newPassword || newPassword.length < 4) {
      errors.push('New password must be at least 4 characters long.');
    }

    if (newPassword !== confirmPassword) {
      errors.push('New password and confirmation do not match.');
    }

    if (errors.length > 0) {
      if (req.xhr || req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({ success: false, errors, message: errors.join(' ') });
      }
      const backUrl = req.headers.referer || '/profile';
      return res.redirect(`${backUrl}?err=${encodeURIComponent(errors[0])}`);
    }

    next();
  }
}

module.exports = ValidateUser;
