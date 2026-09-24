import User from '../models/User.js';
import { signToken } from '../utils/generateToken.js';
import { ApiError, asyncHandler } from '../utils/apiHelpers.js';

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required.');

  // Only the first ever user may self-assign the admin role
  const isFirstUser = (await User.countDocuments()) === 0;
  const effectiveRole = isFirstUser ? 'admin' : ['admin', 'doctor', 'receptionist'].includes(role) && role !== 'admin' ? role : 'receptionist';
  if (!isFirstUser && role === 'admin') throw new ApiError(403, 'Only an existing admin can create admin accounts.');

  const user = await User.create({ name, email, password, role: effectiveRole });
  res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  res.json({ success: true, token: signToken(user), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users.map(publicUser) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required.');
  const user = await User.create({ name, email, password, role });
  res.status(201).json({ success: true, data: publicUser(user) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'doctor', 'receptionist'].includes(role)) throw new ApiError(400, 'Invalid role.');
  if (String(req.user._id) === req.params.id && role !== 'admin') {
    throw new ApiError(400, 'You cannot demote your own admin account.');
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, data: publicUser(user) });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own account.');
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: publicUser(user) });
});
