import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAppointmentsByDay,
  getAppointmentsByStatus,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/appointments-by-day', getAppointmentsByDay);
router.get('/appointments-by-status', getAppointmentsByStatus);

export default router;
