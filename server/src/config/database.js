import mongoose from 'mongoose';

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI must be configured before connecting to MongoDB.');
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}
