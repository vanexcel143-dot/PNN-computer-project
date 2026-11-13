/**
 * User Management Controller
 * Administrative operations: List, Create, Edit, Reset Password, and Delete with Payment Settlement Verification
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

class UserManagementController {
  /**
   * Render User Management table page (READ)
   * GET /users
   */
  static async renderUsersPage(req, res) {
    try {
      const search = req.query.search || '';
      const userTypeId = req.query.userTypeId || '';
      const status = req.query.status || '';
      const msg = req.query.msg || '';
      const err = req.query.err || '';

      const users = await UserModel.findAll({ search, userTypeId, status });
      const roles = await UserModel.getUserTypes();
      const currentUser = req.session.user;
      const isSuperAdmin = currentUser.role_name === 'SUPERADMIN';

      let html = loadView('users.html');

      // Build roles filter dropdown options
      const roleFilterOptions = roles.map(r => `
        <option value="${r.id}" ${userTypeId == r.id ? 'selected' : ''}>${escapeHtml(r.type_name)}</option>
      `).join('');

      // Build table rows
      const rowsHtml = users.length > 0
        ? users.map(u => {
          const balance = parseFloat(u.outstanding_balance) || 0;
          const unpaidCount = parseInt(u.unpaid_transactions_count, 10) || 0;
          const isSettled = balance <= 0 && unpaidCount === 0;

          // Badges
          const roleClass = u.role_name === 'SUPERADMIN' ? 'role-superadmin' : (u.role_name === 'ADMIN' ? 'role-admin' : 'role-user');
          const statusClass = u.status === 'ACTIVE' ? 'status-active' : (u.status === 'DEACTIVATED' ? 'status-deactivated' : 'status-inactive');
          const balanceBadge = isSettled
            ? `<span class="balance-badge balance-settled">✓ Settled ($0.00)</span>`
            : `<span class="balance-badge balance-unpaid" title="${unpaidCount} unpaid transaction(s)">⚠️ Unpaid ($${balance.toFixed(2)})</span>`;

          // Permissions check for actions:
          // ADMIN cannot edit or delete SUPERADMIN
          const canManage = isSuperAdmin || (currentUser.role_name === 'ADMIN' && u.role_name !== 'SUPERADMIN');
          const isSelf = currentUser.id === u.id;
          const isDefaultAdmin = u.username === 'admin';

          return `
            <tr>
              <td><strong>#${u.id}</strong></td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${escapeHtml(u.username)}</div>
                <div style="font-size: 0.8rem; color: #64748b;">${escapeHtml(u.full_name)}</div>
              </td>
              <td>
                <a href="mailto:${escapeHtml(u.email)}" style="color: #0070f3; text-decoration: none;">${escapeHtml(u.email)}</a>
                <div style="font-size: 0.8rem; color: #64748b;">${escapeHtml(u.contact_number || 'N/A')}</div>
              </td>
              <td>
                <span class="role-badge ${roleClass}">${escapeHtml(u.role_name)}</span>
              </td>
              <td>
                <span class="status-pill ${statusClass}">${escapeHtml(u.status)}</span>
                ${u.must_change_password ? '<div style="font-size: 0.7rem; color: #eab308; font-weight: 700; margin-top: 0.2rem;">⚡ Must Change PW</div>' : ''}
              </td>
              <td>
                ${balanceBadge}
              </td>
              <td style="text-align: right;">
                <div style="display: inline-flex; gap: 0.4rem; justify-content: flex-end; flex-wrap: wrap;">
                  ${canManage ? `
                    <a href="/users/edit/${u.id}" class="btn-action-edit" title="Edit account information">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Edit
                    </a>
                    <button type="button" class="btn-action-reset" onclick="openResetPasswordModal(${u.id}, '${escapeHtml(u.username)}')" title="Reset Password">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Reset PW
                    </button>
                  ` : ''}

                  ${canManage && !isDefaultAdmin && !isSelf ? `
                    <button type="button" class="btn-action-delete" 
                      onclick="confirmUserDelete(${u.id}, '${escapeHtml(u.username)}', ${balance}, ${unpaidCount})" 
                      title="Delete or Deactivate Account">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Delete
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('')
        : `
          <tr>
            <td colspan="7" style="text-align: center; padding: 3rem 1.5rem; color: #64748b;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
              <p style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">No user accounts found</p>
              <p style="font-size: 0.9rem; margin: 0 0 1.5rem 0;">No user matches your search or filter parameters.</p>
              <a href="/users" class="btn-secondary" style="padding: 0.6rem 1.25rem; text-decoration: none;">Reset Filters</a>
            </td>
          </tr>
        `;

      // Inject alerts
      let alertHtml = '';
      if (msg === 'created') {
        alertHtml = `<div class="alert-banner alert-success"><span>✓ New user account created successfully!</span></div>`;
      } else if (msg === 'updated') {
        alertHtml = `<div class="alert-banner alert-success"><span>✓ User account information updated successfully!</span></div>`;
      } else if (msg === 'password_reset') {
        alertHtml = `<div class="alert-banner alert-success"><span>✓ User password has been reset successfully!</span></div>`;
      } else if (msg === 'deleted') {
        alertHtml = `<div class="alert-banner alert-info"><span>✓ User account successfully removed/deactivated after full financial settlement verification.</span></div>`;
      } else if (err) {
        alertHtml = `<div class="alert-banner alert-error"><span>⚠️ ${escapeHtml(err)}</span></div>`;
      }

      html = html.replace('<!-- {{ALERT_BANNER}} -->', alertHtml);
      html = html.replace('<!-- {{USER_ROWS}} -->', rowsHtml);
      html = html.replace('<!-- {{ROLE_FILTER_OPTIONS}} -->', roleFilterOptions);
      html = html.replace(/{{TOTAL_COUNT}}/g, users.length.toString());
      html = html.replace('{{SEARCH_VALUE}}', escapeHtml(search));
      html = html.replace('{{CURRENT_ADMIN_NAME}}', escapeHtml(currentUser.full_name));
      html = html.replace('{{CURRENT_ADMIN_ROLE}}', escapeHtml(currentUser.role_name));

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Error rendering users page:', error);
      res.status(500).send(`Server error: ${error.message}`);
    }
  }

  /**
   * Render Create User form (CREATE)
   * GET /users/create
   */
  static async renderCreatePage(req, res) {
    try {
      const roles = await UserModel.getUserTypes();
      const currentUser = req.session.user;
      const isSuperAdmin = currentUser.role_name === 'SUPERADMIN';

      // ADMIN cannot assign SUPERADMIN role
      const availableRoles = isSuperAdmin ? roles : roles.filter(r => r.type_name !== 'SUPERADMIN');

      const roleOptions = availableRoles.map(r => `
        <option value="${r.id}">${escapeHtml(r.type_name)} - ${escapeHtml(r.description || '')}</option>
      `).join('');

      const err = req.query.err || '';
      let html = loadView('user-create.html');

      let errorHtml = err ? `<div class="alert-error">⚠️ ${escapeHtml(err)}</div>` : '';
      html = html.replace('<!-- {{ERROR_BANNER}} -->', errorHtml);
      html = html.replace('<!-- {{ROLE_OPTIONS}} -->', roleOptions);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send(`Server error: ${error.message}`);
    }
  }

  /**
   * Process Create User form POST
   * POST /users/create
   */
  static async handleCreateUser(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api');
    const { username, password, full_name, email, contact_number, user_type_id, status } = req.body;
    const actor = req.session.user;

    try {
      const newUserId = await UserModel.create({
        username,
        password,
        full_name,
        email,
        contact_number,
        user_type_id,
        status: status || 'ACTIVE',
        must_change_password: 0
      });

      await UserModel.logAudit({
        userId: actor.id,
        action: 'USER_CREATED',
        details: `Created new user #${newUserId} (${username}) with role ID ${user_type_id}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.status(201).json({
          success: true,
          message: 'User created successfully.',
          userId: newUserId
        });
      }

      res.redirect('/users?msg=created');
    } catch (error) {
      console.error('Create user error:', error);
      if (isApi) return res.status(500).json({ success: false, message: error.message });
      res.redirect(`/users/create?err=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Render Edit User form (UPDATE)
   * GET /users/edit/:id
   */
  static async renderEditPage(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await UserModel.findById(id);
      if (!user) {
        return res.redirect('/users?err=User+not+found');
      }

      const roles = await UserModel.getUserTypes();
      const currentUser = req.session.user;
      const isSuperAdmin = currentUser.role_name === 'SUPERADMIN';

      // Check hierarchy: ADMIN cannot edit SUPERADMIN
      if (!isSuperAdmin && user.role_name === 'SUPERADMIN') {
        return res.redirect('/users?err=Access+Denied:+Cannot+edit+Superadmin');
      }

      const availableRoles = isSuperAdmin ? roles : roles.filter(r => r.type_name !== 'SUPERADMIN');

      const roleOptions = availableRoles.map(r => `
        <option value="${r.id}" ${user.user_type_id === r.id ? 'selected' : ''}>
          ${escapeHtml(r.type_name)} - ${escapeHtml(r.description || '')}
        </option>
      `).join('');

      const err = req.query.err || '';
      let html = loadView('user-edit.html');

      let errorHtml = err ? `<div class="alert-error">⚠️ ${escapeHtml(err)}</div>` : '';
      html = html.replace('<!-- {{ERROR_BANNER}} -->', errorHtml);
      html = html.replace(/{{USER_ID}}/g, user.id.toString());
      html = html.replace('{{USERNAME}}', escapeHtml(user.username));
      html = html.replace('{{FULL_NAME}}', escapeHtml(user.full_name));
      html = html.replace('{{EMAIL}}', escapeHtml(user.email));
      html = html.replace('{{CONTACT}}', escapeHtml(user.contact_number || ''));
      html = html.replace('<!-- {{ROLE_OPTIONS}} -->', roleOptions);

      // Status radio buttons
      html = html.replace('{{STATUS_ACTIVE_CHECKED}}', user.status === 'ACTIVE' ? 'checked' : '');
      html = html.replace('{{STATUS_INACTIVE_CHECKED}}', user.status === 'INACTIVE' ? 'checked' : '');
      html = html.replace('{{STATUS_DEACTIVATED_CHECKED}}', user.status === 'DEACTIVATED' ? 'checked' : '');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send(`Server error: ${error.message}`);
    }
  }

  /**
   * Process Edit User form POST
   * POST /users/edit/:id
   */
  static async handleUpdateUser(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api');
    const id = parseInt(req.params.id, 10);
    const { username, full_name, email, contact_number, user_type_id, status } = req.body;
    const actor = req.session.user;

    try {
      await UserModel.update(id, {
        username,
        full_name,
        email,
        contact_number,
        user_type_id,
        status
      });

      await UserModel.logAudit({
        userId: actor.id,
        action: 'USER_UPDATED',
        details: `Updated user #${id} (${username || ''})`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.json({ success: true, message: 'User updated successfully.' });
      }

      res.redirect('/users?msg=updated');
    } catch (error) {
      console.error('Update user error:', error);
      if (isApi) return res.status(500).json({ success: false, message: error.message });
      res.redirect(`/users/edit/${id}?err=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Superadmin Reset User Password
   * POST /users/reset-password/:id & POST /api/users/:id/reset-password
   */
  static async handleResetPassword(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api');
    const id = parseInt(req.params.id, 10);
    const { newPassword, confirmPassword, mustChangePassword } = req.body;
    const actor = req.session.user;

    if (!newPassword || newPassword.length < 4) {
      const msg = 'New password must be at least 4 characters long.';
      if (isApi) return res.status(400).json({ success: false, message: msg });
      return res.redirect(`/users?err=${encodeURIComponent(msg)}`);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      const msg = 'New password and confirmation do not match.';
      if (isApi) return res.status(400).json({ success: false, message: msg });
      return res.redirect(`/users?err=${encodeURIComponent(msg)}`);
    }

    try {
      await UserModel.updatePassword(id, newPassword, mustChangePassword ? 1 : 0);

      await UserModel.logAudit({
        userId: actor.id,
        action: 'PASSWORD_RESET_ADMIN',
        details: `Administrative password reset for user #${id} by ${actor.username}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.json({ success: true, message: 'Password reset successfully.' });
      }

      res.redirect('/users?msg=password_reset');
    } catch (error) {
      console.error('Reset password error:', error);
      if (isApi) return res.status(500).json({ success: false, message: error.message });
      res.redirect(`/users?err=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Delete User Account with Payment Settlement Verification
   * POST /users/delete/:id & DELETE /api/users/:id
   */
  static async handleDeleteUser(req, res) {
    const isApi = req.xhr || req.path.startsWith('/api');
    const id = parseInt(req.params.id, 10);
    const actor = req.session.user;

    try {
      // 1. Verify Payment Settlement & Deletion Eligibility
      const check = await UserModel.canDeleteUser(id);

      if (!check.allowed) {
        await UserModel.logAudit({
          userId: actor.id,
          action: 'USER_DELETE_BLOCKED',
          details: `Attempted delete of user #${id} blocked: ${check.reason}`,
          ipAddress: req.ip || req.connection.remoteAddress
        });

        if (isApi) {
          return res.status(400).json({
            success: false,
            blocked: true,
            reason: check.reason,
            settlement: check.settlement
          });
        }

        return res.redirect(`/users?err=${encodeURIComponent(check.reason)}`);
      }

      // 2. Perform safe deletion / deactivation
      const result = await UserModel.delete(id);

      await UserModel.logAudit({
        userId: actor.id,
        action: 'USER_DELETED',
        details: `User #${id} successfully ${result.type.toLowerCase()}`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (isApi) {
        return res.json({
          success: true,
          type: result.type,
          message: result.message
        });
      }

      res.redirect('/users?msg=deleted');
    } catch (error) {
      console.error('Delete user error:', error);
      if (isApi) return res.status(500).json({ success: false, message: error.message });
      res.redirect(`/users?err=${encodeURIComponent(error.message)}`);
    }
  }

  // ========================================================================
  // REST API Endpoints
  // ========================================================================

  static async apiGetAll(req, res) {
    try {
      const users = await UserModel.findAll(req.query);
      res.json({ success: true, count: users.length, data: users });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  static async apiGetOne(req, res) {
    try {
      const user = await UserModel.findById(parseInt(req.params.id, 10));
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      const settlement = await UserModel.checkPaymentSettlement(user.id);
      res.json({ success: true, data: user, settlement });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  static async apiCheckSettlement(req, res) {
    try {
      const settlement = await UserModel.checkPaymentSettlement(parseInt(req.params.id, 10));
      res.json({ success: true, settlement });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}

module.exports = UserManagementController;
