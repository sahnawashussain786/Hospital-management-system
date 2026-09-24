import mongoose from 'mongoose';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Patient from './models/Patient.js';
import Doctor from './models/Doctor.js';
import Appointment from './models/Appointment.js';
import Prescription from './models/Prescription.js';
import Bill from './models/Bill.js';

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const patientNames = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Mehta', 'Ananya Singh', 'Vikram Rao',
  'Sneha Iyer', 'Kabir Malhotra', 'Ishita Das', 'Arjun Nair', 'Meera Joshi',
  'Rahul Verma', 'Pooja Reddy', 'Sanjay Gupta', 'Neha Kapoor', 'Aditya Bose',
  'Divya Menon', 'Karan Shah', 'Ritu Chawla', 'Amit Kumar', 'Lakshmi Pillai',
];
const doctorSeed = [
  { name: 'Dr. Anjali Desai', specialty: 'Cardiology', qualification: 'MBBS, MD, DM (Cardio)', experienceYears: 14, consultationFee: 1200, department: 'Cardiac Sciences' },
  { name: 'Dr. Rajesh Khanna', specialty: 'Orthopedics', qualification: 'MBBS, MS (Ortho)', experienceYears: 11, consultationFee: 900, department: 'Orthopedics' },
  { name: 'Dr. Meera Krishnan', specialty: 'Pediatrics', qualification: 'MBBS, MD (Peds)', experienceYears: 9, consultationFee: 700, department: 'Child Care' },
  { name: 'Dr. Samuel Mathew', specialty: 'Neurology', qualification: 'MBBS, MD, DM (Neuro)', experienceYears: 16, consultationFee: 1500, department: 'Neurosciences' },
  { name: 'Dr. Fatima Sheikh', specialty: 'Dermatology', qualification: 'MBBS, MD (Derm)', experienceYears: 7, consultationFee: 800, department: 'Skin & Cosmetology' },
  { name: 'Dr. Vikas Chandra', specialty: 'General Medicine', qualification: 'MBBS, MD (Gen. Med.)', experienceYears: 12, consultationFee: 600, department: 'Internal Medicine' },
];
const medicines = [
  { name: 'Paracetamol', dosage: '500mg', frequency: '3 times a day' },
  { name: 'Amoxicillin', dosage: '250mg', frequency: '2 times a day' },
  { name: 'Omeprazole', dosage: '20mg', frequency: 'Once before breakfast' },
  { name: 'Cetirizine', dosage: '10mg', frequency: 'Once at night' },
  { name: 'Metformin', dosage: '850mg', frequency: '2 times a day' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
  { name: 'Azithromycin', dosage: '500mg', frequency: 'Once daily' },
  { name: 'Vitamin D3', dosage: '60000 IU', frequency: 'Once weekly' },
];
const reasons = ['Fever and cold', 'Chest pain', 'Routine checkup', 'Back pain', 'Skin rash', 'Diabetes follow-up', 'Headache', 'Annual physical'];

async function seed() {
  const ok = await connectDB({ attempts: 3 });
  if (!ok) {
    console.error('Cannot reach the database — nothing was seeded.');
    process.exit(1);
  }
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Prescription.deleteMany({}),
    Bill.deleteMany({}),
  ]);

  console.log('Creating users...');
  const users = await User.create([
    { name: 'Admin', email: 'admin@medibook.com', password: 'admin123', role: 'admin' },
    { name: 'Dr. Front Desk', email: 'reception@medibook.com', password: 'reception123', role: 'receptionist' },
  ]);

  console.log('Creating doctors...');
  const doctors = await Doctor.create(doctorSeed.map((d) => ({ ...d, phone: `98${randInt(10000000, 99999999)}`, email: `${d.name.toLowerCase().replace(/[^a-z]/g, '')}@medibook.com` })));

  console.log('Creating patients...');
  const patients = await Patient.create(
    patientNames.map((name, i) => ({
      name,
      phone: `9${randInt(100000000, 999999999)}`,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      gender: rand(['Male', 'Female']),
      dateOfBirth: new Date(randInt(1955, 2010), randInt(0, 11), randInt(1, 28)),
      bloodGroup: rand(['A+', 'B+', 'O+', 'O-', 'AB+', 'A-']),
      address: `${randInt(1, 200)} ${rand(['MG Road', 'Park Street', 'Lake View', 'Hill Road', 'Station Road'])}, ${rand(['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Chennai'])}`,
      medicalHistory: rand(['', '', 'Hypertension', 'Type 2 Diabetes', 'Asthma']),
      allergies: rand(['', '', 'Penicillin', 'Dust']),
      status: i % 7 === 0 ? 'admitted' : i % 3 === 0 ? 'outpatient' : 'outpatient',
      roomNumber: i % 7 === 0 ? `${randInt(101, 450)}` : '',
      createdBy: users[0]._id,
    }))
  );

  console.log('Creating appointments...');
  const appointments = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + randInt(-14, 10));
    date.setHours(0, 0, 0, 0);
    appointments.push({
      patient: rand(patients)._id,
      doctor: rand(doctors)._id,
      date,
      time: rand(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '16:00']),
      reason: rand(reasons),
      status: date < new Date() ? rand(['completed', 'completed', 'cancelled', 'no-show']) : 'scheduled',
      createdBy: users[0]._id,
    });
  }
  // dedupe by doctor+date+time to satisfy the unique-ish slot rule
  const seen = new Set();
  const uniqueAppointments = appointments.filter((a) => {
    const key = `${a.doctor}|${a.date.toISOString()}|${a.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const createdAppointments = await Appointment.create(uniqueAppointments);

  console.log('Creating prescriptions & bills...');
  for (const appt of createdAppointments.filter((a) => a.status === 'completed')) {
    await Prescription.create({
      patient: appt.patient,
      doctor: appt.doctor,
      appointment: appt._id,
      diagnosis: rand(['Viral fever', 'Hypertension stage 1', 'Acute gastritis', 'Allergic rhinitis', 'Lower back pain', 'Type 2 diabetes']),
      medicines: [rand(medicines), rand(medicines)].map((m) => ({ ...m, durationDays: randInt(3, 14), instructions: rand(['After meals', 'Before meals', 'With plenty of water']) })),
      createdBy: users[0]._id,
    });

    if (Math.random() > 0.35) {
      await Bill.create({
        patient: appt.patient,
        items: [
          { description: 'Consultation fee', amount: doctors.find((d) => String(d._id) === String(appt.doctor))?.consultationFee || 600 },
          { description: rand(['Blood test', 'X-ray', 'ECG', 'Ultrasound', 'Medication']), amount: randInt(200, 3500) },
        ],
        status: rand(['paid', 'paid', 'pending']),
        paymentMethod: rand(['cash', 'card', 'upi', 'insurance']),
        issuedBy: users[0]._id,
      });
    }
  }

  const counts = {
    users: await User.countDocuments(),
    doctors: await Doctor.countDocuments(),
    patients: await Patient.countDocuments(),
    appointments: await Appointment.countDocuments(),
    prescriptions: await Prescription.countDocuments(),
    bills: await Bill.countDocuments(),
  };
  console.log('✔ Seed complete:', JSON.stringify(counts, null, 2));
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
