import mongoose from 'mongoose';
import app from '../server/src/app.js';
import { connectDatabase } from '../server/src/config/database.js';

let connectionPromise = null;

async function ensureDatabaseConnected() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = connectDatabase().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

export default async function handler(request, response) {
  try {
    await ensureDatabaseConnected();
  } catch (error) {
    console.error('Database connection error in Vercel function:', error);
    return response.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Failed to connect to the database. Please verify MONGODB_URI.',
      },
    });
  }

  // Normalize URL prefix if rewrite stripped /api
  if (request.url && !request.url.startsWith('/api')) {
    request.url = `/api${request.url}`;
  }

  return app(request, response);
}
