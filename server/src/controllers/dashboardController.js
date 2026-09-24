import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Bill from '../models/Bill.js';
import Prescription from '../models/Prescription.js';
import { asyncHandler } from '../utils/apiHelpers.js';

// GET /api/dashboard/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    admittedPatients,
    totalDoctors,
    todayAppointments,
    upcomingAppointments,
    prescriptionsCount,
    revenueAgg,
    recentAppointments,
    recentPatients,
  ] = await Promise.all([
    Patient.countDocuments({}),
    Patient.countDocuments({ status: 'admitted' }),
    Doctor.countDocuments({}),
    Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    Appointment.countDocuments({ date: { $gte: today }, status: 'scheduled' }),
    Prescription.countDocuments({}),
    Bill.aggregate([{ $group: { _id: '$status', sum: { $sum: '$total' } } }]),
    Appointment.find({ date: { $gte: today } })
      .sort({ date: 1, time: 1 })
      .limit(6)
      .populate('patient', 'name')
      .populate('doctor', 'name specialty'),
    Patient.find({}).sort({ createdAt: -1 }).limit(6),
  ]);

  const revenue = { paid: 0, pending: 0 };
  revenueAgg.forEach((r) => {
    if (r._id === 'paid') revenue.paid = r.sum;
    if (r._id === 'pending') revenue.pending = r.sum;
  });

  res.json({
    success: true,
    stats: {
      totalPatients,
      admittedPatients,
      totalDoctors,
      todayAppointments,
      upcomingAppointments,
      prescriptionsCount,
      revenue,
    },
    recentAppointments,
    recentPatients,
  });
});

// GET /api/dashboard/appointments-by-day?days=7
export const getAppointmentsByDay = asyncHandler(async (req, res) => {
  const days = Math.min(30, parseInt(req.query.days) || 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const rows = await Appointment.aggregate([
    { $match: { date: { $gte: start, $lt: today } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
  ]);
  const map = new Map(rows.map((r) => [r._id, r.count]));

  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      count: map.get(key) || 0,
    });
  }

  res.json({ success: true, data: series });
});

// GET /api/dashboard/appointments-by-status
export const getAppointmentsByStatus = asyncHandler(async (req, res) => {
  const rows = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const colorMap = {
    scheduled: '#2563eb',
    completed: '#16a34a',
    cancelled: '#dc2626',
    'no-show': '#d97706',
  };
  const data = rows
    .map((r) => ({ name: r._id, value: r.count, color: colorMap[r._id] || '#64748b' }))
    .filter((d) => d.value > 0);
  res.json({ success: true, data });
});
