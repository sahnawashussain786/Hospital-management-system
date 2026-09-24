import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  register,
  login,
  me,
  listUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.use(protect);

router.get('/me', me);
router.get('/users', authorize('admin'), listUsers);
router.post('/users', authorize('admin'), createUser);
router.patch('/users/:id/role', authorize('admin'), updateUserRole);
router.patch('/users/:id/toggle-active', authorize('admin'), toggleUserActive);

export default router;
