import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getDoctors)
  .post(authorize('admin', 'receptionist'), createDoctor);

router
  .route('/:id')
  .get(getDoctor)
  .put(authorize('admin', 'receptionist'), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

export default router;
