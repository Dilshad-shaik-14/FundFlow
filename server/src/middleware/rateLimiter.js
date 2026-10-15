import HttpError from '../utils/HttpError.js';

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const getMax = typeof options.max === 'function'
    ? options.max
    : () => (options.max ?? (Number(process.env.RATE_LIMIT_AUTH_MAX) || 20));
  const message = options.message ?? 'Too many authentication attempts. Please try again later.';
  const keyGenerator = options.keyGenerator ?? ((request) => request.ip || request.socket?.remoteAddress || 'unknown');

  // In-memory store: Map<key, { count: number, resetTime: number }>
  const store = new Map();

  const limiter = function rateLimiter(request, response, next) {
    const max = getMax(request);
    const key = keyGenerator(request);
    const now = Date.now();
    let record = store.get(key);

    if (!record || now >= record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    response.setHeader('RateLimit-Limit', max);
    response.setHeader('RateLimit-Remaining', remaining);
    response.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      response.setHeader('Retry-After', resetSeconds);
      return next(new HttpError(429, 'TOO_MANY_REQUESTS', message));
    }

    return next();
  };

  limiter.reset = () => {
    store.clear();
  };

  return limiter;
}

export const authRateLimiter = createRateLimiter();
