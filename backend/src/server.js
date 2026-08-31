const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');

async function start() {
  try {
    await testConnection();
    app.listen(env.port, () => {
      logger.info(`HR SaaS API listening on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

start();
