import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPrescriptions)
  .post(authorize('admin', 'doctor'), createPrescription);

router
  .route('/:id')
  .get(getPrescription)
  .put(authorize('admin', 'doctor'), updatePrescription)
  .delete(authorize('admin', 'doctor'), deletePrescription);

export default router;
