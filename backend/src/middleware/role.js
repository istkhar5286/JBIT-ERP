import { sendError } from '../utils/apiResponse.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Your role: ${req.role || 'NONE'}`,
        403
      );
    }
    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireStudent = requireRole('STUDENT');
export const requireFaculty = requireRole('FACULTY');
export const requireFacultyOrAdmin = requireRole('FACULTY', 'ADMIN');
export const requireWarden = requireRole('WARDEN');
export const requireWardenOrAdmin = requireRole('WARDEN', 'ADMIN');
