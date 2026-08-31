const mysql = require('mysql2/promise');
const env = require('./env');

/**
 * A single shared connection pool for the whole app.
 * Always use parameterized queries (pool.query(sql, [params])) —
 * never string-concatenate user input into SQL.
 */
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
});

async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    // eslint-disable-next-line no-console
    console.log('[db] MySQL connection OK');
  } finally {
    conn.release();
  }
}

module.exports = { pool, testConnection };
