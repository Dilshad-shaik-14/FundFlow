import jwt from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'fundflow_session';
export const AUTH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getJWTSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  return secret;
}

export function createAuthToken(userId) {
  return jwt.sign({ sub: userId.toString() }, getJWTSecret(), {
    expiresIn: '7d',
    issuer: 'fundflow',
    audience: 'fundflow-client',
  });
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_TOKEN_MAX_AGE_MS,
  };
}

export function getAuthClearCookieOptions() {
  const { maxAge: _maxAge, ...options } = getAuthCookieOptions();
  return options;
}
