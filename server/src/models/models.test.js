import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import Investor from './Investor.js';
import Startup from './Startup.js';
import User from './User.js';

describe('database models', () => {
  it('normalizes user email and requires a password hash', async () => {
    const user = new User({
      name: '  Taylor Founder ',
      email: ' TAYLOR@EXAMPLE.COM ',
    });

    const error = await user.validate().catch((validationError) => validationError);

    expect(user.name).toBe('Taylor Founder');
    expect(user.email).toBe('taylor@example.com');
    expect(error.errors.passwordHash).toBeDefined();
  });

  it('requires startup ownership and prevents negative funding values', async () => {
    const startup = new Startup({
      name: 'Aster Labs',
      fundingGoal: -1,
    });

    const error = await startup.validate().catch((validationError) => validationError);

    expect(error.errors.owner).toBeDefined();
    expect(error.errors.fundingGoal).toBeDefined();
  });

  it('requires an owner and startup and restricts investor status values', async () => {
    const investor = new Investor({
      name: 'Morgan Investor',
      status: 'unverified-status',
    });

    const error = await investor.validate().catch((validationError) => validationError);

    expect(error.errors.owner).toBeDefined();
    expect(error.errors.startup).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });

  it('stores owner and startup relationships as ObjectIds', () => {
    const ownerId = new mongoose.Types.ObjectId();
    const startupId = new mongoose.Types.ObjectId();
    const investor = new Investor({
      owner: ownerId,
      startup: startupId,
      name: 'Morgan Investor',
    });

    expect(investor.owner).toEqual(ownerId);
    expect(investor.startup).toEqual(startupId);
  });
});
