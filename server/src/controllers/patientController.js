import Patient from '../models/Patient.js';
import { ApiError, asyncHandler, parsePagination } from '../utils/apiHelpers.js';

// GET /api/patients?search=&status=&page=&limit=
export const getPatients = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const { page, limit, skip } = parsePagination(req);

  const query = {};
  if (status) query.status = status;
  if (search) {
    const rx = new RegExp(search.trim().split(/\s+/).join('|'), 'i');
    query.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }

  const [items, total] = await Promise.all([
    Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Patient.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/patients/:id — includes patient's appointments, prescriptions and bills
export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found.');

  const Appointment = (await import('../models/Appointment.js')).default;
  const Prescription = (await import('../models/Prescription.js')).default;
  const Bill = (await import('../models/Bill.js')).default;

  const [appointments, prescriptions, bills] = await Promise.all([
    Appointment.find({ patient: patient._id }).populate('doctor', 'name specialty').sort({ date: -1 }).limit(20),
    Prescription.find({ patient: patient._id }).populate('doctor', 'name specialty').sort({ createdAt: -1 }).limit(20),
    Bill.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(20),
  ]);

  res.json({ success: true, data: { patient, appointments, prescriptions, bills } });
});

export const createPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: patient });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!patient) throw new ApiError(404, 'Patient not found.');
  res.json({ success: true, data: patient });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found.');
  res.json({ success: true, data: {} });
});
