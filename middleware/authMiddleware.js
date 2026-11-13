/**
 * Authentication & Role-Based Authorization Middleware
 * Enforces role restrictions at both the web route and JSON API levels.
 */

class AuthMiddleware {
  /**
   * Verify that user is currently authenticated via session
   */
  static isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      // Make current user available in res.locals for view templates
      res.locals.currentUser = req.session.user;
      return next();
    }

    if (req.xhr || req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const returnUrl = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(`/login?returnUrl=${returnUrl}`);
  }

  /**
   * Ensure user has completed mandatory password change if required
   */
  static checkMustChangePassword(req, res, next) {
    if (req.session && req.session.user && req.session.user.must_change_password) {
      // Allow access to change-password endpoints and logout
      const allowedPaths = ['/change-password', '/logout', '/api/auth/change-password', '/api/auth/logout'];
      if (!allowedPaths.includes(req.path)) {
        if (req.xhr || req.path.startsWith('/api')) {
          return res.status(403).json({
            success: false,
            mustChangePassword: true,
            message: 'You must change your default password before proceeding.'
          });
        }
        return res.redirect('/change-password?required=1');
      }
    }
    next();
  }

  /**
   * Restrict access to SUPERADMIN only
   */
  static requireSuperAdmin(req, res, next) {
    AuthMiddleware.isAuthenticated(req, res, () => {
      const role = req.session.user.role_name;
      if (role === 'SUPERADMIN') {
        return next();
      }

      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only SUPERADMIN can perform this action.'
        });
      }

      return res.status(403).send(AuthMiddleware.renderForbiddenPage('SUPERADMIN access required.'));
    });
  }

  /**
   * Restrict access to ADMIN or SUPERADMIN
   */
  static requireAdminOrSuperAdmin(req, res, next) {
    AuthMiddleware.isAuthenticated(req, res, () => {
      const role = req.session.user.role_name;
      if (role === 'SUPERADMIN' || role === 'ADMIN') {
        return next();
      }

      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Administrative privileges required.'
        });
      }

      return res.status(403).send(AuthMiddleware.renderForbiddenPage('Administrative privileges required.'));
    });
  }

  /**
   * Enforce hierarchy rules:
   * - ADMIN cannot edit or delete a SUPERADMIN account
   * - ADMIN cannot assign the SUPERADMIN role
   * - Users can only edit themselves unless they are ADMIN/SUPERADMIN
   */
  static canManageTargetUser(req, res, next) {
    const actor = req.session.user;
    const targetUserId = parseInt(req.params.id || req.body.id, 10);

    // If actor is SUPERADMIN, they can manage anyone
    if (actor.role_name === 'SUPERADMIN') {
      return next();
    }

    // If actor is ADMIN, check that target user is not SUPERADMIN
    if (actor.role_name === 'ADMIN') {
      const UserModel = require('../models/userModel');
      UserModel.findById(targetUserId).then(target => {
        if (!target) {
          return res.status(404).json({ success: false, message: 'Target user not found.' });
        }
        if (target.role_name === 'SUPERADMIN') {
          const msg = 'Security Violation: ADMINs cannot modify or delete SUPERADMIN accounts.';
          if (req.xhr || req.path.startsWith('/api')) {
            return res.status(403).json({ success: false, message: msg });
          }
          return res.redirect(`/users?err=${encodeURIComponent(msg)}`);
        }
        // Also check if trying to promote someone to SUPERADMIN
        if (req.body.user_type_id) {
          UserModel.getUserTypes().then(types => {
            const superType = types.find(t => t.type_name === 'SUPERADMIN');
            if (superType && parseInt(req.body.user_type_id, 10) === superType.id) {
              const msg = 'Security Violation: Only SUPERADMIN can assign the SUPERADMIN role.';
              if (req.xhr || req.path.startsWith('/api')) {
                return res.status(403).json({ success: false, message: msg });
              }
              return res.redirect(`/users?err=${encodeURIComponent(msg)}`);
            }
            next();
          });
          return;
        }
        next();
      }).catch(err => res.status(500).json({ success: false, message: err.message }));
      return;
    }

    // Regular USER can only manage their own account
    if (actor.id === targetUserId) {
      return next();
    }

    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(403).json({ success: false, message: 'Access Denied: You cannot modify other users.' });
    }
    return res.status(403).send(AuthMiddleware.renderForbiddenPage('You cannot modify other accounts.'));
  }

  static renderForbiddenPage(message) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>403 Forbidden | PNN Security</title><link rel="stylesheet" href="/css/styles.css"></head>
      <body style="font-family: sans-serif; background: #0b0c10; color: #fff; text-align: center; padding: 5rem 1rem;">
        <div style="max-width: 500px; margin: 0 auto; background: #161b22; padding: 2.5rem; border-radius: 16px; border: 1px solid #dc2626;">
          <h1 style="color: #ef4444; font-size: 2.5rem; margin-top: 0;">403 Forbidden</h1>
          <p style="color: #94a3b8; font-size: 1.1rem;">${message}</p>
          <div style="margin-top: 2rem;">
            <a href="/" class="btn-primary" style="margin-right: 0.75rem; text-decoration: none;">Return to Storefront</a>
            <a href="/login" class="btn-secondary" style="text-decoration: none; border: 1px solid #cbd5e1; color: #fff;">Switch Account</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = AuthMiddleware;
