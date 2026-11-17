import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Server error:', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    let message = `An account with this ${field} already exists.`;
    if (field === 'universityRollNumber') {
      message = 'University Roll Number is already registered.';
    } else if (field === 'collegeRegistrationNumber') {
      message = 'College Registration Number is already registered.';
    } else if (field === 'email') {
      message = 'Email address is already registered.';
    } else if (field === 'mobile') {
      message = 'Mobile number is already registered.';
    }
    return sendError(res, message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, messages.join(', '), 400, messages);
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, `Invalid resource identifier: ${err.value}`, 400);
  }

  return sendError(res, err.message || 'Internal Server Error', err.status || 500);
};
