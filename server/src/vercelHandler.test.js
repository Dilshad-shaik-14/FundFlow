import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import handler from '../../api/index.js';

let mongoServer;
const originalMongoUri = process.env.MONGODB_URI;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();

  if (originalMongoUri === undefined) {
    delete process.env.MONGODB_URI;
  } else {
    process.env.MONGODB_URI = originalMongoUri;
  }
});

describe('Vercel serverless function entrypoint (api/index.js)', () => {
  it('serves /api/health through the serverless handler', async () => {
    const response = await request(handler).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('serves /api root through the serverless handler', async () => {
    const response = await request(handler).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { name: 'FundFlow API', status: 'ok' },
    });
  });

  it('normalizes stripped URLs by prepending /api', async () => {
    const response = await request(handler).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });
});
