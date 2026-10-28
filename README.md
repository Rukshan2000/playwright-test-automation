# Student CRUD: a Playwright learning project

A small student management app built for learning Playwright end-to-end (E2E) testing.

- **Frontend:** React, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, Knex, PostgreSQL
- **Tests:** Playwright on Chromium

First time? Follow [SETUP.md](SETUP.md) for a full A to Z setup. New to Playwright? After setup, read [PLAYWRIGHT_LEARNING.md](PLAYWRIGHT_LEARNING.md).

---

## Project structure

```
student-crud/
├── backend/            Express API + Knex migrations/seeds
├── frontend/           React app
├── e2e/                Playwright tests
│   ├── specs/          test files
│   ├── fixtures.js     reusable test helpers
│   ├── global-setup.js resets the E2E database before a run
│   └── playwright.config.js
├── .github/workflows/  GitHub Actions E2E workflow
└── PLAYWRIGHT_LEARNING.md
```

## Requirements

- Node.js 20 or newer
- PostgreSQL on `localhost:5432` with user `postgres` and password `postgres`

## One-time setup

```bash
createdb -U postgres student_crud_dev
createdb -U postgres student_crud_e2e

cd backend  && npm install && npm run migrate && npm run seed && cd ..
cd frontend && npm install && cd ..
cd e2e      && npm install && npm run install-browsers && cd ..
```

## Run the app manually

Open two terminals:

```bash
cd backend  && npm run dev     # API on http://localhost:4000
cd frontend && npm run dev     # app on http://localhost:5173
```

The app uses the `student_crud_dev` database. To use a different one, set `DATABASE_URL`.

## Run the tests

You don't need to start anything first. Playwright starts its own backend on port 4010 and frontend on port 5273, both connected to the `student_crud_e2e` database.

```bash
cd e2e
npm test               # headless (no browser window)
npm run test:headed    # watch Chromium run the tests
npm run test:slow      # headed, with an 800 ms delay before each action
npm run test:ui        # interactive UI mode
npm run test:debug     # Playwright Inspector, step by step
npm run report         # open the last HTML report
```

Run one file:

```bash
npx playwright test specs/create-student.spec.js --headed
```

Use a custom delay:

```bash
SLOW_MO=2000 npx playwright test --headed
```

## Test a deployed app

```bash
cd e2e
BASE_URL=https://your-frontend.com API_URL=https://your-api.com npm test
```

When `BASE_URL` is set:

- Playwright doesn't start local servers.
- No database is migrated, reset or seeded.
- Each test creates its own students through the API and deletes them afterwards.
- The seed-data test is skipped, because a deployed database won't have the seed students.

Two warnings:

- The deployed frontend must be built with its API address: `VITE_API_URL=https://your-api.com npm run build`.
- The tests really create and delete data. Point them at staging, not at production with real data.

## Write tests without reading the codebase

You can write tests from what the browser shows, without opening the source code.

**1. Record a test with codegen**

```bash
cd e2e
npx playwright codegen https://your-app.com     # or http://localhost:5173
```

Click through the app, and Playwright writes the code. Use the toolbar's **Assert visibility**, **Assert text** and **Assert value** buttons to add checks. When you're done, paste the code into a new file in `specs/`.

**2. Find a locator for an element**

- In codegen or UI mode (`npm run test:ui`), use **Pick locator** and hover over the element.
- In Chrome DevTools, choose **Inspect**, then open the **Accessibility** tab. The element's role and name become `getByRole('button', { name: '...' })`.

**3. Choose locators in this order**

1. `getByRole('button', { name: 'Save' })` for buttons, links, headings, rows and dialogs
2. `getByLabel('Email')` for form fields
3. `getByPlaceholder('Search...')` for inputs without a label
4. `getByText('Welcome')` for plain text
5. `getByTestId('x')`, only if the page has `data-testid` attributes
6. `locator('css selector')` as a last resort, because it breaks when the styling changes

**4. Tidy up the recording**

- Add `expect(...)` checks for what the user should see.
- Replace hardcoded data with unique values, for example `` `user${Date.now()}@test.com` ``, so the test can run more than once.
- Don't use `waitForTimeout()`. Playwright waits for elements by itself.

**Example**

```js
const { test, expect } = require('@playwright/test');

test('user can add a student', async ({ page }) => {
  const email = `user${Date.now()}@test.com`;

  await page.goto('/');
  await page.getByRole('button', { name: 'Add Student' }).click();
  await page.getByLabel('First Name').fill('John');
  await page.getByLabel('Last Name').fill('Doe');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Age').fill('22');
  await page.getByLabel('Course').fill('Biology');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Student created successfully')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
});
```

## Debug a failing test

Playwright saves these files only when a test fails, in `e2e/test-results/<test-name>/`:

| File | What it is | How to open |
|---|---|---|
| `test-failed-1.png` | screenshot | any image viewer |
| `video.webm` | video of the test | any browser |
| `trace.zip` | step-by-step recording with DOM, network and console | `npx playwright show-trace <path>/trace.zip` |

`npm run report` opens the HTML report with all of these attached to each failed test.

To pause a test at a specific line, add `await page.pause()` and run it with `--headed` or `--debug`.

## Database safety

- In local mode, the tests only use the database in `E2E_DATABASE_URL`. The default is `postgresql://postgres:postgres@localhost:5432/student_crud_e2e`.
- The database name **must** end in `_e2e`. Both `global-setup.js` and the backend (when started with `KNEX_ENV=e2e`) refuse to run otherwise.
- Before every local run, `global-setup.js` migrates, truncates and seeds the E2E database. Your dev data is never touched.

## API

| Method | Path | Responses |
|---|---|---|
| GET | `/api/health` | 200 `{ status, database }` |
| GET | `/api/students` | 200 list |
| GET | `/api/students/:id` | 200, 404 |
| POST | `/api/students` | 201, 400 validation error, 409 duplicate email |
| PUT | `/api/students/:id` | 200, 400, 404, 409 |
| DELETE | `/api/students/:id` | 204, 404 |

Every student field is required: `first_name`, `last_name`, `email`, `age` and `course`. The `email` must be a valid address, and `age` must be a whole number from 1 to 150.

## CI

[.github/workflows/e2e.yml](.github/workflows/e2e.yml) runs the suite on every push and pull request. It uses a PostgreSQL service container and headless Chromium, and uploads the HTML report as a build artifact even when tests fail.

To use it, push the `student-crud` folder as the root of a GitHub repository.

## License

[MIT](LICENSE). This project is open source and made for education: use it, copy it, change it and teach with it freely.
