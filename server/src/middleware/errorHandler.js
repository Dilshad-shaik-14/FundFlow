import mongoose from 'mongoose';
import HttpError from '../utils/HttpError.js';

export function notFoundHandler(request, _response, next) {
  next(new HttpError(404, 'NOT_FOUND', `Route ${request.method} ${request.path} was not found.`));
}

export function errorHandler(error, _request, response, _next) {
  let status = error.status || 500;
  let code = error.code || 'INTERNAL_SERVER_ERROR';
  let message = error.message || 'An unexpected error occurred.';
  let details = error.details;

  if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request data failed validation.';
    details = Object.values(error.errors).map(({ path, message: issue }) => ({ path, message: issue }));
  } else if (error?.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body must contain valid JSON.';
  }

  if (status >= 500) {
    console.error(error);
    code = 'INTERNAL_SERVER_ERROR';
    message = 'An unexpected error occurred.';
    details = undefined;
  }

  const errorResponse = { code, message };
  if (details) {
    errorResponse.details = details;
  }

  response.status(status).json({ success: false, error: errorResponse });
}
