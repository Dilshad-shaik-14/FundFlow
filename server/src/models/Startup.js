import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    industry: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
    },
    fundingGoal: {
      type: Number,
      min: 0,
      default: 0,
    },
    fundingRaised: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

startupSchema.index({ owner: 1, createdAt: -1 });

const Startup = mongoose.model('Startup', startupSchema);

export default Startup;
