import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Doctor name is required'], trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    specialty: { type: String, required: [true, 'Specialty is required'], trim: true },
    qualification: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    consultationFee: { type: Number, min: 0, default: 0 },
    department: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);
