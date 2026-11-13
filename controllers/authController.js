/**
 * Authentication Controller
 * Handles Login, Logout, Profile Management, and Self-Service Password Updates
 */

const fs = require('fs');
const path = require('path');
const UserModel = require('../models/userModel');

function loadView(viewName) {
  const filePath = path.join(__dirname, '..', 'views', viewName);
  return fs.readFileSync(filePath, 'utf8');
}

function escapeHtml(string) {
  if (string === null || string === undefined) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class AuthController {
  /**
   * Render Login page
   * GET /login
   */
  static renderLogin(req, res) {
    if (req.session && req.session.user) {
      if (req.session.user.role_name === 'SUPERADMIN' || req.session.user.role_name === 'ADMIN') {
        return res.redirect('/users');
      }
      return res.redirect('/');
    }

    const err = req.query.err || '';
    const msg = req.query.msg || '';
    const returnUrl = req.query.returnUrl || '';

    let html = loadView('login.html');

    let alertHtml = '';
    if (err) {
      alertHtml = `<div class="alert-banner alert-error"><span>⚠️ ${escapeHtml(err)}</span></div>`;
    } else if (msg === 'registered') {
      alertHtml = `<div class="alert-banner alert-success"><span>✓ Registration successful! Your customer account has been created. Please sign in below.</span></div>`;
    } else if (msg === 'logged_out') {
      alertHtml = `<div class="alert-banner alert-info"><span>✓ You have been signed out safely.</span></div>`;
    } else if (msg === 'password_updated') {
      alertHtml = `<div class="alert-banner alert-success"><span>✓ Password updated successfully. Please sign in with your new password.</span></div>`;
    }

    html = html.replace('<!-- {{ALERT_BANNER}} -->', alertHtml);
    html = html.replace('{{RETURN_URL}}', escapeHtml(returnUrl));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  /**
   * Render Customer Registration page
   * GET /register
   */
  static renderRegister(req, res) {
    if (req.session && req.session.user) {
      return res.redirect('/');
    }

    const err = req.query.err || '';
    const full_name = req.query.full_name || '';
    const username = req.query.username || '';
    const email = req.query.email || '';
    const contact = req.query.contact || '';

    let html = loadView('register.html');

    let alertHtml = '';
    if (err) {
      alertHtml = `<div class="alert-banner alert-error"><span>⚠️ ${escapeHtml(err)}</span></div>`;
    }

    html = html.replace('<!-- {{ALERT_BANNER}} -->', alertHtml);
    html = html.replace('{{FULL_NAME}}', escapeHtml(full_name));
    html = html.replace('{{USERNAME}}', escapeHtml(username));
    html = html.replace('{{EMAIL}}', escapeHtml(email));
    html = html.replace('{{CONTACT}}', escapeHtml(contact));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  /**
   * Process Customer Registration
   * Automatically assigns CUSTOMER role. Customers cannot register as ADMIN or SUPERADMIN.
   * POST /register & POST /api/auth/register
   */
  static async handleRegister(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'));
    const { full_name, username, email, contact_number, password, confirmPassword } = req.body;

    const errors = [];

    // Full name validation
    const cleanFullName = typeof full_name === 'string' ? full_name.trim() : '';
    if (!cleanFullName || cleanFullName.length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    }

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

    // Email validation
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      errors.push('Email address is required.');
    } else if (!emailRegex.test(cleanEmail)) {
      errors.push('Please enter a valid email address format.');
    } else {
      const existingEmail = await UserModel.findByEmail(cleanEmail);
      if (existingEmail) {
        errors.push(`Email address "${cleanEmail}" is already registered.`);
      }
    }

    // Password validation
    const cleanPassword = typeof password === 'string' ? password : '';
    if (!cleanPassword || cleanPassword.length < 4) {
      errors.push('Password must be at least 4 characters long.');
    } else if (cleanPassword !== confirmPassword) {
      errors.push('Password and confirm password do not match.');
    }

    if (errors.length > 0) {
      if (isApi) {
        return res.status(400).json({ success: false, errors, message: errors.join(' ') });
      }
      const q = new URLSearchParams({
        err: errors[0],
        full_name: cleanFullName,
        username: cleanUsername,
        email: cleanEmail,
        contact: contact_number || ''
      });
      return res.redirect(`/register?${q.toString()}`);
    }

    try {
      // Look up CUSTOMER role ID from database
      const customerRoleId = await UserModel.getCustomerRoleId();

      // Create new customer account: ALWAYS CUSTOMER role, ACTIVE status, must_change_password 0
      const newUserId = await UserModel.create({
        user_type_id: customerRoleId,
        username: cleanUsername,
        password: cleanPassword,
        full_name: cleanFullName,
        email: cleanEmail,
        contact_number: contact_number ? contact_number.trim() : null,
        status: 'ACTIVE',
        must_change_password: 0
      });

      await UserModel.logAudit({
        userId: newUserId,
        action: 'CUSTOMER_REGISTERED',
        details: `New customer registered: "${cleanUsername}" (${cleanEmail})`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.status(201).json({
          success: true,
          message: 'Account registered successfully. You can now sign in.',
          userId: newUserId
        });
      }

      // Redirect to existing Sign-In page with success notification
      return res.redirect('/login?msg=registered');
    } catch (error) {
      console.error('Customer registration error:', error);
      if (isApi) return res.status(500).json({ success: false, message: error.message });
      return res.redirect(`/register?err=${encodeURIComponent('Registration error: ' + error.message)}`);
    }
  }

  /**
   * Process Login submission
   * POST /login & POST /api/auth/login
   */
  static async handleLogin(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'));
    const { identifier, password, returnUrl } = req.body;

    if (!identifier || !password) {
      const msg = 'Please enter both your username/email and password.';
      if (isApi) return res.status(400).json({ success: false, message: msg });
      return res.redirect(`/login?err=${encodeURIComponent(msg)}`);
    }

    try {
      const user = await UserModel.findByIdentifier(identifier);
      if (!user) {
        await UserModel.logAudit({
          action: 'LOGIN_FAILED',
          details: `Failed login attempt for identifier: ${identifier} (User not found)`,
          ipAddress: req.ip || req.connection.remoteAddress
        });
        const msg = 'Invalid username/email or password.';
        if (isApi) return res.status(401).json({ success: false, message: msg });
        return res.redirect(`/login?err=${encodeURIComponent(msg)}`);
      }

      // Check account status
      if (user.status === 'DEACTIVATED' || user.status === 'INACTIVE') {
        const msg = `Account is ${user.status.toLowerCase()}. Please contact a Super Administrator for assistance.`;
        if (isApi) return res.status(403).json({ success: false, message: msg });
        return res.redirect(`/login?err=${encodeURIComponent(msg)}`);
      }

      // Verify bcrypt password
      const isMatch = await UserModel.verifyPassword(password, user.password);
      if (!isMatch) {
        await UserModel.logAudit({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: `Password mismatch for user #${user.id} (${user.username})`,
          ipAddress: req.ip || req.connection.remoteAddress
        });
        const msg = 'Invalid username/email or password.';
        if (isApi) return res.status(401).json({ success: false, message: msg });
        return res.redirect(`/login?err=${encodeURIComponent(msg)}`);
      }

      // Login success -> establish session
      req.session.user = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        contact_number: user.contact_number,
        user_type_id: user.user_type_id,
        role_name: user.role_name,
        status: user.status,
        must_change_password: Boolean(user.must_change_password)
      };

      await UserModel.logAudit({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: `Successful login as ${user.role_name}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.json({
          success: true,
          message: 'Login successful.',
          user: req.session.user,
          mustChangePassword: req.session.user.must_change_password
        });
      }

      // If user must change password (e.g. default admin account on first login)
      if (user.must_change_password) {
        return res.redirect('/change-password?required=1');
      }

      if (returnUrl && returnUrl.startsWith('/')) {
        return res.redirect(returnUrl);
      }

      if (user.role_name === 'SUPERADMIN' || user.role_name === 'ADMIN') {
        return res.redirect('/users');
      }

      return res.redirect('/');
    } catch (error) {
      console.error('Login error:', error);
      if (isApi) return res.status(500).json({ success: false, message: 'Server error during login.' });
      return res.redirect(`/login?err=${encodeURIComponent('Internal error during login: ' + error.message)}`);
    }
  }

  /**
   * Process Logout
   * GET /logout & POST /api/auth/logout
   */
  static handleLogout(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api');
    const user = req.session ? req.session.user : null;

    if (user) {
      UserModel.logAudit({
        userId: user.id,
        action: 'LOGOUT',
        details: 'User logged out',
        ipAddress: req.ip || req.connection.remoteAddress
      });
    }

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      if (isApi) {
        return res.json({ success: true, message: 'Logged out successfully.' });
      }
      res.redirect('/login?msg=logged_out');
    });
  }

  /**
   * Render Change Password page
   * GET /change-password
   */
  static renderChangePassword(req, res) {
    const isRequired = req.query.required === '1' || req.session?.user?.must_change_password;
    const err = req.query.err || '';
    const msg = req.query.msg || '';

    let html = loadView('change-password.html');

    let bannerHtml = '';
    if (err) {
      bannerHtml = `<div class="alert-banner alert-error"><span>⚠️ ${escapeHtml(err)}</span></div>`;
    } else if (isRequired) {
      bannerHtml = `<div class="alert-banner alert-info"><span>🔒 Security Notice: You must change your default password before accessing the system.</span></div>`;
    } else if (msg === 'updated') {
      bannerHtml = `<div class="alert-banner alert-success"><span>✓ Password updated successfully!</span></div>`;
    }

    html = html.replace('<!-- {{ALERT_BANNER}} -->', bannerHtml);
    html = html.replace('{{USER_NAME}}', escapeHtml(req.session.user.full_name));
    html = html.replace('{{USER_ROLE}}', escapeHtml(req.session.user.role_name));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  /**
   * Process Password Change submission
   * POST /change-password
   */
  static async handleChangePassword(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api');
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;

    try {
      const user = await UserModel.findById(userId);
      // Fetch user with hashed password
      const fullUser = await UserModel.findByUsername(user.username);

      // Verify current password
      const isMatch = await UserModel.verifyPassword(currentPassword, fullUser.password);
      if (!isMatch) {
        const msg = 'Current password is incorrect.';
        if (isApi) return res.status(400).json({ success: false, message: msg });
        return res.redirect(`/change-password?err=${encodeURIComponent(msg)}`);
      }

      if (newPassword !== confirmPassword) {
        const msg = 'New password and confirmation do not match.';
        if (isApi) return res.status(400).json({ success: false, message: msg });
        return res.redirect(`/change-password?err=${encodeURIComponent(msg)}`);
      }

      if (newPassword.length < 4) {
        const msg = 'New password must be at least 4 characters long.';
        if (isApi) return res.status(400).json({ success: false, message: msg });
        return res.redirect(`/change-password?err=${encodeURIComponent(msg)}`);
      }

      // Update password & clear must_change_password flag
      await UserModel.updatePassword(userId, newPassword, 0);
      req.session.user.must_change_password = false;

      await UserModel.logAudit({
        userId: userId,
        action: 'PASSWORD_CHANGE_SELF',
        details: 'User successfully changed their own password',
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.json({ success: true, message: 'Password changed successfully.' });
      }

      if (req.session.user.role_name === 'SUPERADMIN' || req.session.user.role_name === 'ADMIN') {
        return res.redirect('/users?msg=password_updated');
      }
      return res.redirect('/profile?msg=password_updated');
    } catch (error) {
      console.error('Change password error:', error);
      if (isApi) return res.status(500).json({ success: false, message: error.message });
      return res.redirect(`/change-password?err=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Render User Profile page
   * GET /profile
   */
  static async renderProfile(req, res) {
    try {
      const userId = req.session.user.id;
      const user = await UserModel.findById(userId);
      const settlement = await UserModel.checkPaymentSettlement(userId);
      const err = req.query.err || '';
      const msg = req.query.msg || '';

      let html = loadView('profile.html');

      let alertHtml = '';
      if (err) {
        alertHtml = `<div class="alert-banner alert-error"><span>⚠️ ${escapeHtml(err)}</span></div>`;
      } else if (msg === 'profile_updated') {
        alertHtml = `<div class="alert-banner alert-success"><span>✓ Profile updated successfully!</span></div>`;
      } else if (msg === 'password_updated') {
        alertHtml = `<div class="alert-banner alert-success"><span>✓ Password updated successfully!</span></div>`;
      }

      // Render transactions table rows
      const txnRows = settlement.transactions.length > 0
        ? settlement.transactions.map(t => `
          <tr>
            <td><strong>${escapeHtml(t.transaction_code)}</strong></td>
            <td>${escapeHtml(t.description)}</td>
            <td>$${parseFloat(t.amount_due).toFixed(2)}</td>
            <td>$${parseFloat(t.amount_paid).toFixed(2)}</td>
            <td><strong>$${(parseFloat(t.amount_due) - parseFloat(t.amount_paid)).toFixed(2)}</strong></td>
            <td>
              <span class="status-pill status-${t.payment_status === 'PAID' ? 'active' : 'unpaid'}">
                ${t.payment_status}
              </span>
            </td>
            <td>${new Date(t.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">No transaction records found.</td></tr>';

      html = html.replace('<!-- {{ALERT_BANNER}} -->', alertHtml);
      html = html.replace(/{{USER_ID}}/g, user.id.toString());
      html = html.replace(/{{USERNAME}}/g, escapeHtml(user.username));
      html = html.replace(/{{FULL_NAME}}/g, escapeHtml(user.full_name));
      html = html.replace(/{{EMAIL}}/g, escapeHtml(user.email));
      html = html.replace(/{{CONTACT}}/g, escapeHtml(user.contact_number || ''));
      html = html.replace(/{{ROLE_NAME}}/g, escapeHtml(user.role_name));
      html = html.replace(/{{STATUS}}/g, escapeHtml(user.status));
      html = html.replace('{{OUTSTANDING_BALANCE}}', settlement.outstandingBalance.toFixed(2));
      html = html.replace('{{UNPAID_COUNT}}', settlement.unpaidCount.toString());
      html = html.replace('<!-- {{TRANSACTION_ROWS}} -->', txnRows);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Render profile error:', error);
      res.status(500).send(`Profile error: ${error.message}`);
    }
  }

  /**
   * Process Self Profile Update
   * POST /profile
   */
  static async handleUpdateProfile(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api');
    const userId = req.session.user.id;
    const { full_name, email, contact_number } = req.body;

    try {
      // Users cannot change their own username or role here
      await UserModel.update(userId, { full_name, email, contact_number });

      // Update session values
      req.session.user.full_name = full_name;
      req.session.user.email = email;
      req.session.user.contact_number = contact_number;

      await UserModel.logAudit({
        userId,
        action: 'PROFILE_UPDATED',
        details: 'User updated personal profile information',
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.json({ success: true, message: 'Profile updated successfully.' });
      }
      return res.redirect('/profile?msg=profile_updated');
    } catch (error) {
      console.error('Profile update error:', error);
      if (isApi) return res.status(500).json({ success: false, message: error.message });
      return res.redirect(`/profile?err=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Get current user session info
   * GET /api/auth/me
   */
  static apiMe(req, res) {
    if (req.session && req.session.user) {
      return res.json({ success: true, user: req.session.user });
    }
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
}

module.exports = AuthController;
