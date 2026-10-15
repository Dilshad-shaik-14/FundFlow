import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import app from '../app.js';
import Investor from '../models/Investor.js';
import Startup from '../models/Startup.js';
import User from '../models/User.js';

const originalJwtSecret = process.env.JWT_SECRET;
let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([Investor.init(), Startup.init(), User.init()]);
});

afterEach(async () => {
  await Promise.all([
    Investor.deleteMany({}),
    Startup.deleteMany({}),
    User.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();

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

async function createStartup(cookie, name) {
  const response = await request(app)
    .post('/api/startups')
    .set('Cookie', cookie)
    .send({ name });

  return response.body.data.startup;
}

describe('investor routes', () => {
  it('enforces user and startup ownership across CRUD and filters', async () => {
    const firstUserCookie = await registerUser('first@example.com');
    const secondUserCookie = await registerUser('second@example.com');
    const firstStartup = await createStartup(firstUserCookie, 'Aster Labs');
    const secondStartup = await createStartup(secondUserCookie, 'Boreal Systems');
    const foreignStartupCreate = await request(app)
      .post('/api/investors')
      .set('Cookie', firstUserCookie)
      .send({ startupId: secondStartup.id, name: 'Foreign Investor' });
    const createResponse = await request(app)
      .post('/api/investors')
      .set('Cookie', firstUserCookie)
      .send({
        startupId: firstStartup.id,
        name: 'Morgan Investor',
        firm: 'Northstar Capital',
        email: 'MORGAN@example.com',
      });
    const investorId = createResponse.body.data.investor.id;

    expect(foreignStartupCreate.status).toBe(404);
    expect(foreignStartupCreate.body.error.code).toBe('STARTUP_NOT_FOUND');
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.investor).toMatchObject({
      startup: { id: firstStartup.id, name: 'Aster Labs' },
      name: 'Morgan Investor',
      email: 'morgan@example.com',
      status: 'potential',
      followUpDate: null,
    });

    const foreignRead = await request(app)
      .get(`/api/investors/${investorId}`)
      .set('Cookie', secondUserCookie);
    const foreignUpdate = await request(app)
      .patch(`/api/investors/${investorId}`)
      .set('Cookie', secondUserCookie)
      .send({ status: 'committed' });
    const foreignDelete = await request(app)
      .delete(`/api/investors/${investorId}`)
      .set('Cookie', secondUserCookie);
    const foreignReassignment = await request(app)
      .patch(`/api/investors/${investorId}`)
      .set('Cookie', firstUserCookie)
      .send({ startupId: secondStartup.id });
    const foreignFilter = await request(app)
      .get(`/api/investors?startupId=${secondStartup.id}`)
      .set('Cookie', firstUserCookie);

    expect(foreignRead.status).toBe(404);
    expect(foreignUpdate.status).toBe(404);
    expect(foreignDelete.status).toBe(404);
    expect(foreignReassignment.status).toBe(404);
    expect(foreignFilter.status).toBe(404);
    expect((await Investor.findById(investorId)).startup.toString()).toBe(firstStartup.id);

    const updateResponse = await request(app)
      .patch(`/api/investors/${investorId}`)
      .set('Cookie', firstUserCookie)
      .send({ status: 'meeting_scheduled', followUpDate: '2026-11-01' });
    const filteredList = await request(app)
      .get('/api/investors?status=meeting_scheduled')
      .set('Cookie', firstUserCookie);
    const getResponse = await request(app)
      .get(`/api/investors/${investorId}`)
      .set('Cookie', firstUserCookie);
    const deleteResponse = await request(app)
      .delete(`/api/investors/${investorId}`)
      .set('Cookie', firstUserCookie);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.investor.followUpDate).toBe('2026-11-01');
    expect(filteredList.body.data.investors).toHaveLength(1);
    expect(getResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(await Investor.exists({ _id: investorId })).toBeNull();
  });

  it('rejects invalid statuses, dates, filters, and IDs', async () => {
    const cookie = await registerUser('founder@example.com');
    const startup = await createStartup(cookie, 'Aster Labs');
    const invalidCreate = await request(app)
      .post('/api/investors')
      .set('Cookie', cookie)
      .send({
        startupId: startup.id,
        name: 'Morgan Investor',
        status: 'interested',
        followUpDate: 'next week',
      });
    const invalidFilter = await request(app)
      .get('/api/investors?status=interested')
      .set('Cookie', cookie);
    const invalidId = await request(app)
      .get('/api/investors/not-an-object-id')
      .set('Cookie', cookie);
    const emptyUpdate = await request(app)
      .patch(`/api/investors/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', cookie)
      .send({});

    expect(invalidCreate.status).toBe(400);
    expect(invalidCreate.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidFilter.status).toBe(400);
    expect(invalidFilter.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidId.status).toBe(400);
    expect(invalidId.body.error.code).toBe('INVALID_ID');
    expect(emptyUpdate.status).toBe(400);
    expect(emptyUpdate.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for investor operations', async () => {
    const response = await request(app).get('/api/investors');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('prevents deleting a startup with linked investors until they are removed', async () => {
    const cookie = await registerUser('founder@example.com');
    const startup = await createStartup(cookie, 'Aster Labs');
    const investorResponse = await request(app)
      .post('/api/investors')
      .set('Cookie', cookie)
      .send({ startupId: startup.id, name: 'Morgan Investor' });
    const investorId = investorResponse.body.data.investor.id;

    const deleteResponse = await request(app)
      .delete(`/api/startups/${startup.id}`)
      .set('Cookie', cookie);

    expect(deleteResponse.status).toBe(409);
    expect(deleteResponse.body.error).toMatchObject({
      code: 'STARTUP_HAS_INVESTORS',
      message: 'Remove this startup’s investors before deleting the startup.',
    });
    expect(await Startup.exists({ _id: startup.id })).not.toBeNull();
    expect(await Investor.exists({ _id: investorId })).not.toBeNull();

    const investorDeleteResponse = await request(app)
      .delete(`/api/investors/${investorId}`)
      .set('Cookie', cookie);
    const startupDeleteResponse = await request(app)
      .delete(`/api/startups/${startup.id}`)
      .set('Cookie', cookie);

    expect(investorDeleteResponse.status).toBe(200);
    expect(startupDeleteResponse.status).toBe(200);
    expect(await Investor.exists({ _id: investorId })).toBeNull();
    expect(await Startup.exists({ _id: startup.id })).toBeNull();
  });
});
