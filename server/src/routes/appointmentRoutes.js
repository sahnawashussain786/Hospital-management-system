import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAppointments)
  .post(authorize('admin', 'receptionist', 'doctor'), createAppointment);

router
  .route('/:id')
  .put(authorize('admin', 'receptionist', 'doctor'), updateAppointment)
  .delete(authorize('admin', 'receptionist'), deleteAppointment);

export default router;
