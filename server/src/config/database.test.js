import { afterEach, describe, expect, it } from 'vitest';
import { connectDatabase } from './database.js';

const originalMongoUri = process.env.MONGODB_URI;

describe('connectDatabase', () => {
  afterEach(() => {
    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }
  });

  it('fails explicitly when the database URI is not configured', async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDatabase()).rejects.toThrow(
      'MONGODB_URI must be configured before connecting to MongoDB.',
    );
  });
});
