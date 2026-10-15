import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import app from '../app.js';
import User from '../models/User.js';

const originalJwtSecret = process.env.JWT_SECRET;
let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
});

afterEach(async () => {
  await User.deleteMany({});
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

describe('authentication routes', () => {
  it('registers a user, hashes the password, and sets an HttpOnly cookie', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Taylor Founder',
      email: 'TAYLOR@example.com',
      password: 'correct horse battery staple',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: { user: { name: 'Taylor Founder', email: 'taylor@example.com' } },
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Strict/i);

    const storedUser = await User.findOne({ email: 'taylor@example.com' }).select('+passwordHash');
    expect(storedUser.passwordHash).not.toBe('correct horse battery staple');
  });

  it('rejects invalid registration data with a consistent validation response', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'T',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects duplicate email addresses without exposing database details', async () => {
    const user = {
      name: 'Taylor Founder',
      email: 'taylor@example.com',
      password: 'correct horse battery staple',
    };
    await request(app).post('/api/auth/register').send(user);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...user, email: 'TAYLOR@example.com' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('logs in case-insensitively and provides the current user from the cookie', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Taylor Founder',
      email: 'taylor@example.com',
      password: 'correct horse battery staple',
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'TAYLOR@example.com',
      password: 'correct horse battery staple',
    });
    const cookie = loginResponse.headers['set-cookie'][0].split(';')[0];
    const currentUserResponse = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(loginResponse.status).toBe(200);
    expect(currentUserResponse.status).toBe(200);
    expect(currentUserResponse.body.data.user.email).toBe('taylor@example.com');
  });

  it('returns the same credential error for unknown emails and incorrect passwords', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'missing@example.com',
      password: 'correct horse battery staple',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
    });
  });

  it('protects the current-user route and clears the session cookie on logout', async () => {
    const unauthorized = await request(app).get('/api/auth/me');
    const logoutResponse = await request(app).post('/api/auth/logout');

    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.error.code).toBe('UNAUTHENTICATED');
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers['set-cookie'][0]).toMatch(/Expires=/i);
    expect(logoutResponse.headers['set-cookie'][0]).not.toMatch(/Max-Age=604800/i);
  });
});
