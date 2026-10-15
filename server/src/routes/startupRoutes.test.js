import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import app from '../app.js';
import Startup from '../models/Startup.js';
import User from '../models/User.js';

const originalJwtSecret = process.env.JWT_SECRET;
let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([Startup.init(), User.init()]);
});

afterEach(async () => {
  await Promise.all([Startup.deleteMany({}), User.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

async function registerUser(email) {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Startup Founder',
    email,
    password: 'correct horse battery staple',
  });

  return response.headers['set-cookie'][0].split(';')[0];
}

describe('startup routes', () => {
  it('creates, lists, reads, updates, and deletes only the authenticated user’s startups', async () => {
    const firstUserCookie = await registerUser('first@example.com');
    const secondUserCookie = await registerUser('second@example.com');
    const spoofedOwnerResponse = await request(app)
      .post('/api/startups')
      .set('Cookie', firstUserCookie)
      .send({
        name: 'Aster Labs',
        owner: new mongoose.Types.ObjectId().toString(),
      });
    const createResponse = await request(app)
      .post('/api/startups')
      .set('Cookie', firstUserCookie)
      .send({
        name: 'Aster Labs',
        industry: 'Climate',
        fundingGoal: 250000,
      });
    const startupId = createResponse.body.data.startup.id;

    expect(spoofedOwnerResponse.status).toBe(400);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.startup).toMatchObject({
      name: 'Aster Labs',
      industry: 'Climate',
      fundingGoal: 250000,
      fundingRaised: 0,
    });
    expect(createResponse.body.data.startup.owner).toBeUndefined();

    const firstUserList = await request(app)
      .get('/api/startups')
      .set('Cookie', firstUserCookie);
    const secondUserList = await request(app)
      .get('/api/startups')
      .set('Cookie', secondUserCookie);
    const otherUserRead = await request(app)
      .get(`/api/startups/${startupId}`)
      .set('Cookie', secondUserCookie);
    const otherUserUpdate = await request(app)
      .patch(`/api/startups/${startupId}`)
      .set('Cookie', secondUserCookie)
      .send({ name: 'Hijacked Startup' });
    const otherUserDelete = await request(app)
      .delete(`/api/startups/${startupId}`)
      .set('Cookie', secondUserCookie);

    expect(firstUserList.body.data.startups).toHaveLength(1);
    expect(secondUserList.body.data.startups).toHaveLength(0);
    expect(otherUserRead.status).toBe(404);
    expect(otherUserUpdate.status).toBe(404);
    expect(otherUserDelete.status).toBe(404);

    const readResponse = await request(app)
      .get(`/api/startups/${startupId}`)
      .set('Cookie', firstUserCookie);
    const updateResponse = await request(app)
      .patch(`/api/startups/${startupId}`)
      .set('Cookie', firstUserCookie)
      .send({ fundingRaised: 10000 });
    const deleteResponse = await request(app)
      .delete(`/api/startups/${startupId}`)
      .set('Cookie', firstUserCookie);

    expect(readResponse.status).toBe(200);
    expect(updateResponse.body.data.startup.fundingRaised).toBe(10000);
    expect(deleteResponse.status).toBe(200);
    expect(await Startup.exists({ _id: startupId })).toBeNull();
  });

  it('rejects invalid input and malformed IDs using consistent errors', async () => {
    const cookie = await registerUser('founder@example.com');
    const invalidCreate = await request(app)
      .post('/api/startups')
      .set('Cookie', cookie)
      .send({ name: 'A', fundingGoal: -1 });
    const invalidId = await request(app)
      .get('/api/startups/not-an-object-id')
      .set('Cookie', cookie);
    const emptyUpdate = await request(app)
      .patch(`/api/startups/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', cookie)
      .send({});

    expect(invalidCreate.status).toBe(400);
    expect(invalidCreate.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidId.status).toBe(400);
    expect(invalidId.body.error.code).toBe('INVALID_ID');
    expect(emptyUpdate.status).toBe(400);
    expect(emptyUpdate.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for every startup operation', async () => {
    const response = await request(app).get('/api/startups');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});
