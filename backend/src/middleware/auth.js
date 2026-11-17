import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { Student } from '../models/Student.js';
import { Admin } from '../models/Admin.js';
import { Faculty } from '../models/Faculty.js';
import { Warden } from '../models/Warden.js';
import { sendError } from '../utils/apiResponse.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token has expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid authentication token.', 401);
    }

    const { id, role } = decoded;

    if (role === 'ADMIN') {
      const admin = await Admin.findById(id);
      if (!admin) {
        return sendError(res, 'Admin account not found.', 401);
      }
      req.user = admin;
      req.role = 'ADMIN';
    } else if (role === 'FACULTY') {
      const faculty = await Faculty.findById(id);
      if (!faculty) {
        return sendError(res, 'Faculty account not found.', 401);
      }
      if (faculty.status !== 'active') {
        return sendError(res, 'Faculty account is deactivated. Please contact administration.', 403);
      }
      req.user = faculty;
      req.role = 'FACULTY';
    } else if (role === 'WARDEN') {
      const warden = await Warden.findById(id);
      if (!warden) {
        return sendError(res, 'Warden account not found.', 401);
      }
      if (warden.emailVerified === false) {
        return sendError(res, 'Warden email is not verified.', 403);
      }
      if (warden.status !== 'active') {
        return sendError(res, 'Warden account is deactivated or inactive. Please contact administration.', 403);
      }
      req.user = warden;
      req.role = 'WARDEN';
    } else if (role === 'STUDENT') {
      const student = await Student.findById(id);
      if (!student) {
        return sendError(res, 'Student account not found.', 401);
      }
      if (student.status !== 'active') {
        return sendError(res, 'Student account is deactivated. Please contact administration.', 403);
      }
      req.user = student;
      req.role = 'STUDENT';
    } else {
      return sendError(res, 'Unrecognized user role in token.', 403);
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return sendError(res, 'Authentication error.', 500);
  }
};
