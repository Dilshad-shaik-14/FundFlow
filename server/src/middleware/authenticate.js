import jwt from 'jsonwebtoken';
import {
  AUTH_COOKIE_NAME,
  getJWTSecret,
} from '../config/auth.js';
import HttpError from '../utils/HttpError.js';

export function authenticate(request, _response, next) {
  let token = request.cookies?.[AUTH_COOKIE_NAME];

  if (!token && typeof request.headers.authorization === 'string') {
    const [scheme, credentials] = request.headers.authorization.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && credentials) {
      token = credentials.trim();
    }
  }

  if (!token && typeof request.headers.cookie === 'string') {
    const match = request.headers.cookie.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]*)`));
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required.'));
  }

  try {
    const payload = jwt.verify(token, getJWTSecret(), {
      issuer: 'fundflow',
      audience: 'fundflow-client',
    });

    if (typeof payload === 'string' || !payload.sub) {
      return next(new HttpError(401, 'INVALID_TOKEN', 'Authentication token is invalid.'));
    }

    request.auth = { userId: payload.sub };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new HttpError(401, 'INVALID_TOKEN', 'Authentication token is invalid.'));
    }

    return next(error);
  }
}
