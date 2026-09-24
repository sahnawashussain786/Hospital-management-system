import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    items: {
      type: [lineItemSchema],
      validate: [(v) => v.length > 0, 'At least one billing item is required'],
    },
    discount: { type: Number, min: 0, default: 0 },
    taxPercent: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'upi', 'bank-transfer'],
      default: 'cash',
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// Computed totals are stored on save for cheap reporting queries
billSchema.pre('validate', function (next) {
  const sub = (this.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  this.subtotal = Math.round(sub * 100) / 100;
  const afterDiscount = this.subtotal - (Number(this.discount) || 0);
  this.taxAmount =
    Math.round(afterDiscount * ((Number(this.taxPercent) || 0) / 100) * 100) / 100;
  this.total = Math.round((afterDiscount + this.taxAmount) * 100) / 100;
  next();
});

billSchema.add({ subtotal: Number, taxAmount: Number, total: Number });

export default mongoose.model('Bill', billSchema);
