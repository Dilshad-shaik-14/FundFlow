import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import investorRoutes from './routes/investorRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5000',
].filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (typeof origin === 'string' && (origin.endsWith('.vercel.app') || (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`)))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api', (_request, response) => {
  response.json({ success: true, data: { name: 'FundFlow API', status: 'ok' } });
});

app.get('/api/health', (_request, response) => {
  response.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
