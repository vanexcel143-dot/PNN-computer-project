/**
 * Student Request Validation Middleware
 * Validates and sanitizes incoming student data before passing to controllers.
 */

function validateStudent(req, res, next) {
  const { name, email, course } = req.body;
  const errors = [];

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanCourse = typeof course === 'string' ? course.trim() : '';

  // Name validation
  if (!cleanName || cleanName.length < 2) {
    errors.push('Student name must be at least 2 characters long.');
  } else if (cleanName.length > 100) {
    errors.push('Student name must not exceed 100 characters.');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail) {
    errors.push('Email address is required.');
  } else if (!emailRegex.test(cleanEmail)) {
    errors.push('Please provide a valid email address format.');
  } else if (cleanEmail.length > 100) {
    errors.push('Email address must not exceed 100 characters.');
  }

  // Course validation
  if (!cleanCourse || cleanCourse.length < 2) {
    errors.push('Course/program name is required.');
  } else if (cleanCourse.length > 100) {
    errors.push('Course name must not exceed 100 characters.');
  }

  if (errors.length > 0) {
    // If request accepts JSON or is an API route, return JSON error
    if (req.xhr || req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        errors
      });
    }

    // For HTML forms, redirect back with error message
    const backUrl = req.params.id ? `/students/edit/${req.params.id}?err=${encodeURIComponent(errors[0])}` : `/students/create?err=${encodeURIComponent(errors[0])}`;
    return res.redirect(backUrl);
  }

  // Attach sanitized fields
  req.body.name = cleanName;
  req.body.email = cleanEmail;
  req.body.course = cleanCourse;

  next();
}

module.exports = {
  validateStudent
};
