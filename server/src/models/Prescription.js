import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true, default: '' },
    frequency: { type: String, trim: true, default: '' },
    durationDays: { type: Number, min: 1, default: 5 },
    instructions: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis: { type: String, trim: true, default: '' },
    medicines: { type: [medicineSchema], default: [] },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Prescription', prescriptionSchema);
