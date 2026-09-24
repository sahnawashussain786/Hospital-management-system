import Bill from '../models/Bill.js';
import Patient from '../models/Patient.js';
import { ApiError, asyncHandler, parsePagination } from '../utils/apiHelpers.js';

// GET /api/bills?search=&status=&page=&limit=
export const getBills = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const { page, limit, skip } = parsePagination(req);

  const query = {};
  if (status) query.status = status;
  if (search) {
    const rx = new RegExp(search.trim().split(/\s+/).join('|'), 'i');
    const patients = await Patient.find({ name: rx }).select('_id');
    query.$or = [
      { patient: { $in: patients.map((p) => p._id) } },
      { 'items.description': { $regex: rx } },
    ];
  }

  const [items, total, totalsAgg] = await Promise.all([
    Bill.find(query)
      .populate('patient', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Bill.countDocuments(query),
    Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const revenue = { paid: 0, pending: 0 };
  totalsAgg.forEach((t) => {
    if (t._id === 'paid') revenue.paid = t.total;
    if (t._id === 'pending') revenue.pending = t.total;
  });

  res.json({
    success: true,
    data: items,
    revenue,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const createBill = asyncHandler(async (req, res) => {
  const { patient, items } = req.body;
  if (!patient) throw new ApiError(400, 'Patient is required.');
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one billing item is required.');
  }

  const p = await Patient.findById(patient);
  if (!p) throw new ApiError(404, 'Patient not found.');

  const bill = await Bill.create({ ...req.body, issuedBy: req.user._id });
  const populated = await bill.populate('patient', 'name phone');
  res.status(201).json({ success: true, data: populated });
});

export const getBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('patient', 'name phone gender address dateOfBirth');
  if (!bill) throw new ApiError(404, 'Bill not found.');
  res.json({ success: true, data: bill });
});

export const updateBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) throw new ApiError(404, 'Bill not found.');
  Object.assign(bill, req.body);
  await bill.save(); // re-runs totals pre-validate hook
  const populated = await bill.populate('patient', 'name phone');
  res.json({ success: true, data: populated });
});

export const markBillPaid = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) throw new ApiError(404, 'Bill not found.');
  bill.status = 'paid';
  bill.paidAt = new Date();
  if (req.body?.paymentMethod) bill.paymentMethod = req.body.paymentMethod;
  await bill.save();
  const populated = await bill.populate('patient', 'name phone');
  res.json({ success: true, data: populated });
});

export const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findByIdAndDelete(req.params.id);
  if (!bill) throw new ApiError(404, 'Bill not found.');
  res.json({ success: true, data: {} });
});
