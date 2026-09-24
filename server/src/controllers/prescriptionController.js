import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { ApiError, asyncHandler, parsePagination } from '../utils/apiHelpers.js';

// GET /api/prescriptions?search=&page=&limit=
export const getPrescriptions = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = parsePagination(req);

  const query = {};
  if (search) {
    const rx = new RegExp(search.trim().split(/\s+/).join('|'), 'i');
    const [patients, doctors] = await Promise.all([
      Patient.find({ name: rx }).select('_id'),
      Doctor.find({ name: rx }).select('_id'),
    ]);
    const rxName = { $regex: rx };
    query.$or = [
      { patient: { $in: patients.map((p) => p._id) } },
      { doctor: { $in: doctors.map((d) => d._id) } },
      { diagnosis: rxName },
      { 'medicines.name': rxName },
    ];
  }

  const [items, total] = await Promise.all([
    Prescription.find(query)
      .populate('patient', 'name phone gender')
      .populate('doctor', 'name specialty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const createPrescription = asyncHandler(async (req, res) => {
  const { patient, doctor, medicines } = req.body;
  if (!patient || !doctor) throw new ApiError(400, 'Patient and doctor are required.');
  if (!Array.isArray(medicines) || medicines.length === 0) {
    throw new ApiError(400, 'At least one medicine is required.');
  }
  if (medicines.some((m) => !m.name || !String(m.name).trim())) {
    throw new ApiError(400, 'Every medicine needs a name.');
  }

  const [p, d] = await Promise.all([Patient.findById(patient), Doctor.findById(doctor)]);
  if (!p) throw new ApiError(404, 'Patient not found.');
  if (!d) throw new ApiError(404, 'Doctor not found.');

  const prescription = await Prescription.create({ ...req.body, createdBy: req.user._id });
  const populated = await prescription.populate([
    { path: 'patient', select: 'name phone gender' },
    { path: 'doctor', select: 'name specialty' },
  ]);
  res.status(201).json({ success: true, data: populated });
});

export const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'name phone gender dateOfBirth bloodGroup address')
    .populate('doctor', 'name specialty qualification');
  if (!prescription) throw new ApiError(404, 'Prescription not found.');
  res.json({ success: true, data: prescription });
});

export const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'patient', select: 'name phone gender' },
    { path: 'doctor', select: 'name specialty' },
  ]);
  if (!prescription) throw new ApiError(404, 'Prescription not found.');
  res.json({ success: true, data: prescription });
});

export const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findByIdAndDelete(req.params.id);
  if (!prescription) throw new ApiError(404, 'Prescription not found.');
  res.json({ success: true, data: {} });
});
