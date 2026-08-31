const logger = require('../utils/logger');
const { ApiError } = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // MySQL duplicate-entry errors -> friendly 409
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this value already exists';
  }

  if (statusCode >= 500) {
    logger.error(err.stack || err);
  }

  const body = {
    success: false,
    message,
  };
  if (err instanceof ApiError && err.details) {
    body.details = err.details;
  }
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
}

function notFoundMiddleware(req, res) {
  return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorMiddleware, notFoundMiddleware };
