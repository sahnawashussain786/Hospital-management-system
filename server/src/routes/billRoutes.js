import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getBills,
  getBill,
  createBill,
  updateBill,
  markBillPaid,
  deleteBill,
} from '../controllers/billController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getBills).post(authorize('admin', 'receptionist'), createBill);

router
  .route('/:id')
  .get(getBill)
  .put(authorize('admin', 'receptionist'), updateBill)
  .delete(authorize('admin', 'receptionist'), deleteBill);

router.patch('/:id/pay', authorize('admin', 'receptionist'), markBillPaid);

export default router;
