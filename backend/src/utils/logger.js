/* eslint-disable no-console */
const levels = ['error', 'warn', 'info', 'debug'];

function log(level, ...args) {
  if (!levels.includes(level)) level = 'info';
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  console[level === 'debug' ? 'log' : level](prefix, ...args);
}

module.exports = {
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  info: (...args) => log('info', ...args),
  debug: (...args) => log('debug', ...args),
};
