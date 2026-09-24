import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/apiHelpers.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'medibook_dev_secret');
  } catch {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated.');

  req.user = user;
  next();
});
