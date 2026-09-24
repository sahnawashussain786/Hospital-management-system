import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { ApiError, asyncHandler, parsePagination } from '../utils/apiHelpers.js';

// GET /api/appointments?search=&status=&date=&page=&limit=
export const getAppointments = asyncHandler(async (req, res) => {
  const { search, status, date } = req.query;
  const { page, limit, skip } = parsePagination(req);

  const query = {};
  if (status) query.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }
  if (search) {
    const rx = new RegExp(search.trim().split(/\s+/).join('|'), 'i');
    const [patients, doctors] = await Promise.all([
      Patient.find({ name: rx }).select('_id'),
      Doctor.find({ name: rx }).select('_id'),
    ]);
    query.$or = [
      { patient: { $in: patients.map((p) => p._id) } },
      { doctor: { $in: doctors.map((d) => d._id) } },
    ];
  }

  const filter = Appointment.find(query)
    .populate('patient', 'name phone gender')
    .populate('doctor', 'name specialty consultationFee')
    .sort({ date: -1, time: 1 });

  const [items, total] = await Promise.all([
    filter.clone().skip(skip).limit(limit),
    Appointment.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const createAppointment = asyncHandler(async (req, res) => {
  const { patient, doctor, date, time } = req.body;
  if (!patient || !doctor || !date || !time) {
    throw new ApiError(400, 'Patient, doctor, date and time are required.');
  }

  const [p, d] = await Promise.all([Patient.findById(patient), Doctor.findById(doctor)]);
  if (!p) throw new ApiError(404, 'Patient not found.');
  if (!d) throw new ApiError(404, 'Doctor not found.');
  if (!d.isAvailable) throw new ApiError(400, 'This doctor is currently unavailable.');

  const duplicate = await Appointment.findOne({
    doctor,
    date: new Date(date),
    time,
    status: 'scheduled',
  });
  if (duplicate) throw new ApiError(409, 'This doctor already has an appointment at that slot.');

  const appointment = await Appointment.create({ ...req.body, createdBy: req.user._id });
  const populated = await appointment.populate([
    { path: 'patient', select: 'name phone gender' },
    { path: 'doctor', select: 'name specialty consultationFee' },
  ]);
  res.status(201).json({ success: true, data: populated });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: 'patient', select: 'name phone gender' },
    { path: 'doctor', select: 'name specialty consultationFee' },
  ]);
  if (!appointment) throw new ApiError(404, 'Appointment not found.');
  res.json({ success: true, data: appointment });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found.');
  res.json({ success: true, data: {} });
});
