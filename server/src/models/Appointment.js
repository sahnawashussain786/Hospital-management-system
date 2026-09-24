import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: [true, 'Appointment date is required'] },
    time: { type: String, required: [true, 'Appointment time is required'] },
    reason: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, time: 1 });

export default mongoose.model('Appointment', appointmentSchema);
