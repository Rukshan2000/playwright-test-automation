# Setup guide: A to Z

This guide takes you from a fresh machine to a running app and a passing Playwright test suite. It assumes no prior setup.

For what the project is and how to write tests, see [README.md](README.md) and [PLAYWRIGHT_LEARNING.md](PLAYWRIGHT_LEARNING.md).

---

## 1. Install the tools

You need **Git**, **Node.js 20+** and **PostgreSQL**.

### macOS (Homebrew)

```bash
brew install git node@20 postgresql@16
brew services start postgresql@16
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y git curl postgresql
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo service postgresql start
```

### Windows

1. Install [Git for Windows](https://git-scm.com/download/win).
2. Install Node.js 20 LTS from [nodejs.org](https://nodejs.org/).
3. Install PostgreSQL from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/). Set the password for the `postgres` user to `postgres` during install, and keep port `5432`.
4. Run the commands below in **Git Bash**.

### Or: PostgreSQL in Docker (any OS)

If you'd rather not install PostgreSQL:

```bash
docker run -d --name student-crud-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres postgres:16
```

### Check

```bash
git --version
node -v      # v20.x or newer
psql --version
```

---

## 2. Get the code

Fork the repository on GitHub (if you plan to contribute), then:

```bash
git clone https://github.com/Rukshan2000/playwright-test-automation.git
cd playwright-test-automation
```

---

## 3. Prepare PostgreSQL

The project expects user `postgres` with password `postgres` on `localhost:5432`.

**macOS (Homebrew)** creates a superuser named after your Mac account, not `postgres`. Create it once:

```bash
psql postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
```

**Ubuntu** has a `postgres` user without a password. Set one:

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

Now create the two databases:

```bash
createdb -h localhost -U postgres student_crud_dev
createdb -h localhost -U postgres student_crud_e2e
```

With Docker, run them inside the container instead:

```bash
docker exec student-crud-db createdb -U postgres student_crud_dev
docker exec student-crud-db createdb -U postgres student_crud_e2e
```

| Database | Used by | Notes |
|---|---|---|
| `student_crud_dev` | the app when you run it by hand | your data, never touched by tests |
| `student_crud_e2e` | Playwright | wiped and reseeded before every test run |

> Using different credentials? Set `DATABASE_URL` and `E2E_DATABASE_URL` (see section 8). The E2E database name must end in `_e2e`.

---

## 4. Install dependencies

```bash
cd backend  && npm install && npm run migrate && npm run seed && cd ..
cd frontend && npm install && cd ..
cd e2e      && npm install && npm run install-browsers && cd ..
```

`migrate` creates the `students` table in the dev database, and `seed` adds sample students.

---

## 5. Run the app

Open two terminals from the project root:

```bash
# terminal 1
cd backend && npm run dev      # API on http://localhost:4000
```

```bash
# terminal 2
cd frontend && npm run dev     # app on http://localhost:5173
```

Open http://localhost:5173. Check the API with http://localhost:4000/api/health, which should return `{"status":"ok","database":"student_crud_dev"}`.

---

## 6. Run the tests

Stop nothing and start nothing: Playwright launches its own backend (port 4010) and frontend (port 5273) against the E2E database.

```bash
cd e2e
npm test               # headless
npm run test:headed    # watch the browser
npm run test:ui        # interactive UI mode
npm run report         # open the last HTML report
```

All tests should pass on a fresh setup.

---

## 7. Continuous integration

[.github/workflows/e2e.yml](.github/workflows/e2e.yml) runs automatically on every push and pull request. It needs no secrets: PostgreSQL runs as a service container.

After a run, download the **playwright-report** artifact from the run's page in the **Actions** tab to see failures.

> The workflow expects this folder (`student-crud/`) to be the repository root.

---

## 8. Environment variables

All have working defaults. Set them only to change something.

| Variable | Used by | Default |
|---|---|---|
| `DATABASE_URL` | backend (dev) | `postgresql://postgres:postgres@localhost:5432/student_crud_dev` |
| `E2E_DATABASE_URL` | backend (e2e), Playwright | `postgresql://postgres:postgres@localhost:5432/student_crud_e2e` |
| `PORT` | backend | `4000` |
| `KNEX_ENV` | backend | `development` (Playwright sets `e2e`) |
| `VITE_API_URL` | frontend build | `http://localhost:4000` |
| `BASE_URL` / `API_URL` | Playwright, to test a deployed app | unset (local mode) |
| `SLOW_MO` | Playwright, delay in ms | `0` |

Example:

```bash
DATABASE_URL=postgresql://me:secret@localhost:5432/student_crud_dev npm run dev
```

`.env` files are git-ignored, but the project doesn't load them automatically. Export variables in your shell or prefix commands as above.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `role "postgres" does not exist` | Create it (section 3, macOS). |
| `password authentication failed for user "postgres"` | Set the password to `postgres` (section 3), or set `DATABASE_URL` / `E2E_DATABASE_URL`. |
| `database "student_crud_dev" does not exist` | Run the `createdb` commands in section 3. |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL isn't running. `brew services start postgresql@16`, `sudo service postgresql start`, or `docker start student-crud-db`. |
| `EADDRINUSE :4000` / `:5173` / `:4010` / `:5273` | Another process uses the port. Find it with `lsof -i :4000` and stop it. |
| `Refusing to use "..." for E2E` | The E2E database name must end in `_e2e`. |
| `Executable doesn't exist ... chromium` | Run `npm run install-browsers` in `e2e/`. |
| `createdb: command not found` (macOS) | Add PostgreSQL to your PATH: `echo 'export PATH="$(brew --prefix postgresql@16)/bin:$PATH"' >> ~/.zshrc` and reopen the terminal. |
| Tests fail only in CI | Download the `playwright-report` artifact and open the trace of the failed test. |

---

## 10. Contributing

1. Create a branch: `git checkout -b my-change`.
2. Make your change, and add or update a test in `e2e/specs/`.
3. Run `cd e2e && npm test` and make sure everything passes.
4. Commit, push to your fork and open a pull request. CI runs the suite on it.

Keep pull requests small and focused on one change.
