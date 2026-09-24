import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPatients)
  .post(authorize('admin', 'receptionist', 'doctor'), createPatient);

router
  .route('/:id')
  .get(getPatient)
  .put(updatePatient)
  .delete(authorize('admin'), deletePatient);

export default router;
