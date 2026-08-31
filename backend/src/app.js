const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/errorMiddleware');

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to the configured frontend origin, allow credentials
// for cookie-based refresh-token flows if adopted later.
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Body / cookie parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Global rate limiting (auth routes apply a stricter limiter of their own)
app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// API routes
app.use('/api', apiRoutes);

// 404 + centralized error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
