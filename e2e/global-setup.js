// Runs once before the whole test suite.
// 1. Validate the E2E database name   2. Run migrations
// 3. Reset the data                  4. Seed example students
const path = require('path');
const backend = path.join(__dirname, '../backend');
const knex = require(path.join(backend, 'node_modules/knex'));
const { assertE2eDatabase } = require(path.join(backend, 'knexfile'));
const { API_URL, E2E_DATABASE_URL } = require('./playwright.config');

module.exports = async () => {
  // 1. Throws unless the database name ends with "_e2e". Nothing below runs otherwise.
  assertE2eDatabase(E2E_DATABASE_URL);

  const db = knex({
    client: 'pg',
    connection: E2E_DATABASE_URL,
    migrations: { directory: path.join(backend, 'migrations') },
    seeds: { directory: path.join(backend, 'seeds') },
  });
  try {
    await db.migrate.latest();                                   // 2
    await db.raw('TRUNCATE students RESTART IDENTITY CASCADE');  // 3
    await db.seed.run();                                         // 4
  } finally {
    await db.destroy();
  }

  // Double-check the backend Playwright started is really using the E2E database.
  const health = await (await fetch(`${API_URL}/api/health`)).json();
  assertE2eDatabase(`postgresql://x/${health.database}`);
};
