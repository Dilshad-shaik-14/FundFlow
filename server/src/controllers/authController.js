import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  AUTH_COOKIE_NAME,
  getAuthClearCookieOptions,
  createAuthToken,
  getAuthCookieOptions,
} from '../config/auth.js';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine((password) => Buffer.byteLength(password, 'utf8') <= 72);

const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(254),
    password: passwordSchema,
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z
      .string()
      .min(1)
      .max(72)
      .refine((password) => Buffer.byteLength(password, 'utf8') <= 72),
  })
  .strict();

function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request body is invalid.', result.error.issues);
  }

  return result.data;
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function setAuthCookie(response, userId) {
  const token = createAuthToken(userId);
  response.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return token;
}

export async function register(request, response) {
  const { name, email, password } = parseBody(registrationSchema, request.body);
  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      throw new HttpError(409, 'EMAIL_IN_USE', 'An account with this email already exists.');
    }

    throw error;
  }

  const token = setAuthCookie(response, user._id);
  response.status(201).json({
    success: true,
    data: {
      token,
      user: publicUser(user),
    },
  });
}

export async function login(request, response) {
  const { email, password } = parseBody(loginSchema, request.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  const token = setAuthCookie(response, user._id);
  response.json({
    success: true,
    data: {
      token,
      user: publicUser(user),
    },
  });
}

export async function logout(_request, response) {
  response.clearCookie(AUTH_COOKIE_NAME, getAuthClearCookieOptions());
  response.json({ success: true, data: { message: 'Logged out successfully.' } });
}

export async function currentUser(request, response) {
  const user = await User.findById(request.auth.userId);

  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required.');
  }

  response.json({ success: true, data: { user: publicUser(user) } });
}
