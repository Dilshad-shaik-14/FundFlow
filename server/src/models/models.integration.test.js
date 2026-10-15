import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectDatabase } from '../config/database.js';
import Investor from './Investor.js';
import Startup from './Startup.js';
import User from './User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
  await Promise.all([User.init(), Startup.init(), Investor.init()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

describe('MongoDB persistence', () => {
  it('connects and persists a user-owned startup and investor', async () => {
    const user = await User.create({
      name: 'Taylor Founder',
      email: 'TAYLOR@example.com',
      passwordHash: 'hashed-password',
    });
    const startup = await Startup.create({
      owner: user._id,
      name: 'Aster Labs',
      fundingGoal: 250000,
    });
    const investor = await Investor.create({
      owner: user._id,
      startup: startup._id,
      name: 'Morgan Investor',
      email: 'MORGAN@example.com',
      followUpDate: new Date('2026-11-01T00:00:00.000Z'),
    });

    const storedInvestor = await Investor.findById(investor._id).lean();
    const storedStartup = await Startup.findById(startup._id).lean();

    expect(storedInvestor.owner.toString()).toBe(user._id.toString());
    expect(storedInvestor.startup.toString()).toBe(startup._id.toString());
    expect(storedInvestor.email).toBe('morgan@example.com');
    expect(storedInvestor.status).toBe('potential');
    expect(storedStartup.fundingGoal).toBe(250000);
  });

  it('enforces unique normalized user email addresses', async () => {
    await User.create({
      name: 'First Founder',
      email: 'unique@example.com',
      passwordHash: 'hashed-password',
    });

    await expect(
      User.create({
        name: 'Second Founder',
        email: 'UNIQUE@example.com',
        passwordHash: 'another-hash',
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
