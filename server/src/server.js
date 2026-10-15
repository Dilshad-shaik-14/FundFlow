import 'dotenv/config';
import app from './app.js';
import { getJWTSecret } from './config/auth.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 5000;

try {
  getJWTSecret();
  await connectDatabase();
  app.listen(port, () => {
    console.log(`FundFlow API listening on port ${port}`);
  });
} catch (error) {
  console.error('FundFlow API failed to start:', error);
  process.exitCode = 1;
}
