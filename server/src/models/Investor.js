import mongoose from 'mongoose';

export const INVESTOR_STATUSES = [
  'potential',
  'contacted',
  'meeting_scheduled',
  'passed',
  'committed',
];

const investorSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    firm: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: '',
      match: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    status: {
      type: String,
      enum: INVESTOR_STATUSES,
      default: 'potential',
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  { timestamps: true },
);

investorSchema.index({ owner: 1, startup: 1, status: 1 });
investorSchema.index({ owner: 1, followUpDate: 1 });

const Investor = mongoose.model('Investor', investorSchema);

export default Investor;
