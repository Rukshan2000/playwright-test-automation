// Knex configuration. Two environments, two databases:
//   development -> student_crud_dev (your manual playground)
//   e2e         -> student_crud_e2e (owned by Playwright, wiped before every run)
// Pick one with KNEX_ENV (defaults to development).

const DEV_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/student_crud_dev';
const E2E_URL = process.env.E2E_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/student_crud_e2e';

// Safety guard: the e2e database name MUST end with "_e2e".
// This makes it impossible to point the test suite at the dev database by accident.
function assertE2eDatabase(url) {
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith('_e2e')) {
    throw new Error(`Refusing to use "${name}" for E2E: database name must end with "_e2e".`);
  }
  return url;
}

const shared = {
  client: 'pg',
  migrations: { directory: __dirname + '/migrations' },
  seeds: { directory: __dirname + '/seeds' },
};

module.exports = {
  development: { ...shared, connection: DEV_URL },
  get e2e() {
    return { ...shared, connection: assertE2eDatabase(E2E_URL) };
  },
  assertE2eDatabase,
};
