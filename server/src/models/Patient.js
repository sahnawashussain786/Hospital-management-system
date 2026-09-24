import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Patient name is required'], trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dateOfBirth: { type: Date },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    address: { type: String, trim: true },
    medicalHistory: { type: String, trim: true, default: '' },
    allergies: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['admitted', 'discharged', 'outpatient'], default: 'outpatient' },
    roomNumber: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

patientSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - new Date(this.dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

export default mongoose.model('Patient', patientSchema);
