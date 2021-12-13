const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');

// Launch challenge watcher
require('./utils/challengeWatcher');

const app = express();

// Enable proxy
app.set('trust proxy', 1);

// Set CORS
app.use(cors({ origin: process.env.CORS }));

// Set security HTTP headers
app.use(helmet());

// Allow 1000 request max in 1 hour from one IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanatization against XSS
app.use(xss());

// Add compression when returning json or html responses
app.use(compression());

// Beautify color console output
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ROUTES
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server !`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
