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
  await mongoServer?.stop();

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

async function registerUser(email) {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Dashboard Founder',
    email,
    password: 'correct horse battery staple',
  });

  return {
    cookie: response.headers['set-cookie'][0].split(';')[0],
    id: response.body.data.user.id,
  };
}

describe('dashboard metrics', () => {
  it('calculates totals and follow-up counts from only the user’s owned data', async () => {
    const firstUser = await registerUser('first@example.com');
    const secondUser = await registerUser('second@example.com');
    const [firstOwner, secondOwner] = await Promise.all([
      User.findById(firstUser.id),
      User.findById(secondUser.id),
    ]);
    const [firstStartup, secondStartup, foreignStartup] = await Startup.create([
      {
        owner: firstOwner._id,
        name: 'Aster Labs',
        fundingGoal: 1000,
        fundingRaised: 250,
      },
      {
        owner: firstOwner._id,
        name: 'Boreal Systems',
        fundingGoal: 500,
        fundingRaised: 100,
      },
      {
        owner: secondOwner._id,
        name: 'Cinder AI',
        fundingGoal: 9000,
        fundingRaised: 4000,
      },
    ]);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dueToday = today.toISOString().slice(0, 10);
    const overdue = new Date(today);
    overdue.setUTCDate(overdue.getUTCDate() - 2);
    const upcoming = new Date(today);
    upcoming.setUTCDate(upcoming.getUTCDate() + 3);
    const followUpDate = (date) => date.toISOString().slice(0, 10);

    await Investor.create([
      {
        owner: firstOwner._id,
        startup: firstStartup._id,
        name: 'Overdue Investor',
        status: 'potential',
        followUpDate: followUpDate(overdue),
      },
      {
        owner: firstOwner._id,
        startup: firstStartup._id,
        name: 'Due Today Investor',
        status: 'contacted',
        followUpDate: dueToday,
      },
      {
        owner: firstOwner._id,
        startup: secondStartup._id,
        name: 'Upcoming Investor',
        status: 'meeting_scheduled',
        followUpDate: followUpDate(upcoming),
      },
      {
        owner: firstOwner._id,
        startup: firstStartup._id,
        name: 'Inactive Investor',
        status: 'passed',
        followUpDate: followUpDate(overdue),
      },
      {
        owner: secondOwner._id,
        startup: foreignStartup._id,
        name: 'Other User Investor',
        status: 'committed',
      },
      {
        owner: firstOwner._id,
        startup: foreignStartup._id,
        name: 'Invalid Cross-Owner Link',
      },
    ]);

    const firstResponse = await request(app)
      .get('/api/dashboard/metrics')
      .set('Cookie', firstUser.cookie);
    const secondResponse = await request(app)
      .get('/api/dashboard/metrics')
      .set('Cookie', secondUser.cookie);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.data.metrics).toEqual({
      startupCount: 2,
      totalFundingGoal: 1500,
      totalFundingRaised: 350,
      investorCount: 4,
      investorStatusCounts: {
        potential: 1,
        contacted: 1,
        meeting_scheduled: 1,
        passed: 1,
        committed: 0,
      },
      overdueFollowUps: 1,
      followUpsDueToday: 1,
      upcomingFollowUps: 1,
    });
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.metrics).toEqual({
      startupCount: 1,
      totalFundingGoal: 9000,
      totalFundingRaised: 4000,
      investorCount: 1,
      investorStatusCounts: {
        potential: 0,
        contacted: 0,
        meeting_scheduled: 0,
        passed: 0,
        committed: 1,
      },
      overdueFollowUps: 0,
      followUpsDueToday: 0,
      upcomingFollowUps: 0,
    });
  });

  it('returns zero values for accounts without data and requires authentication', async () => {
    const user = await registerUser('empty@example.com');
    const response = await request(app)
      .get('/api/dashboard/metrics')
      .set('Cookie', user.cookie);
    const unauthorized = await request(app).get('/api/dashboard/metrics');

    expect(response.body.data.metrics).toEqual({
      startupCount: 0,
      totalFundingGoal: 0,
      totalFundingRaised: 0,
      investorCount: 0,
      investorStatusCounts: {
        potential: 0,
        contacted: 0,
        meeting_scheduled: 0,
        passed: 0,
        committed: 0,
      },
      overdueFollowUps: 0,
      followUpsDueToday: 0,
      upcomingFollowUps: 0,
    });
    expect(unauthorized.status).toBe(401);
  });
});
