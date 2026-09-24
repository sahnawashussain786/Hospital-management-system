import Doctor from '../models/Doctor.js';
import { ApiError, asyncHandler, parsePagination } from '../utils/apiHelpers.js';

// GET /api/doctors?search=&specialty=&page=&limit=
export const getDoctors = asyncHandler(async (req, res) => {
  const { search, specialty } = req.query;
  const { page, limit, skip } = parsePagination(req);

  const query = {};
  if (specialty) query.specialty = specialty;
  if (search) {
    const rx = new RegExp(search.trim().split(/\s+/).join('|'), 'i');
    query.$or = [{ name: rx }, { specialty: rx }];
  }

  const [items, total, specialties] = await Promise.all([
    Doctor.find(query).sort({ name: 1 }).skip(skip).limit(limit),
    Doctor.countDocuments(query),
    Doctor.distinct('specialty'),
  ]);

  res.json({
    success: true,
    data: items,
    specialties: specialties.sort(),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found.');
  res.json({ success: true, data: doctor });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({ success: true, data: doctor });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doctor) throw new ApiError(404, 'Doctor not found.');
  res.json({ success: true, data: doctor });
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found.');
  res.json({ success: true, data: {} });
});
