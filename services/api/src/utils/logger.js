/**
 * LOGGING UTILITY
 *
 * Winston-based logger for structured logging across the application.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Determine whether file logging should be enabled
const isServerlessEnv = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.GCP_PROJECT
);
const disableFileLogging = process.env.LOG_TO_FILE === 'false';

const transports = [
  new winston.transports.Console(),
];

if (!isServerlessEnv && !disableFileLogging) {
  const logDir = path.join(__dirname, '../../logs');

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
      }),
    );
  } catch (err) {
    // Fall back to console-only logging if the filesystem is read-only.
    // eslint-disable-next-line no-console
    console.warn('File logging disabled:', err.message);
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
});

module.exports = { logger };
