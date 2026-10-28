# Learning Playwright with the Student CRUD app

Run `cd e2e && npm run test:slow` once before reading. Watching the browser click around makes everything below easier to follow.

---

## Part 1: What is E2E testing?

| Kind | What it exercises | Example in this repo | Speed |
|---|---|---|---|
| **Unit test** | One function, in isolation | "does `validate()` reject `not-an-email`?" | milliseconds |
| **API test** | The HTTP server + database, no browser | `POST /api/students` returns 201 | ~10 ms |
| **E2E test** | Everything, through a real browser, like a user | click *Add Student*, fill the form, see the row | ~0.3–1 s |

A unit test can pass while the button is hidden behind a modal. An API test can pass while the frontend calls the wrong URL. **Only an E2E test sees what the user sees.** The cost is speed and more moving parts, so E2E tests cover the important user journeys and unit tests cover the rest.

## Part 2: How Playwright works

```
 Playwright test (Node.js)
        │  "click the Save button"   (Chrome DevTools Protocol)
        ▼
 Chromium browser ── loads ──▶ React frontend  (localhost:5273)
                                     │ axios HTTP
                                     ▼
                               Express API      (localhost:4010)
                                     │ Knex SQL
                                     ▼
                               PostgreSQL       (student_crud_e2e)
```

1. `npm test` reads [e2e/playwright.config.js](e2e/playwright.config.js).
2. The **`webServer`** section starts the backend (with `KNEX_ENV=e2e`, port 4010) and the frontend (with `VITE_API_URL=http://localhost:4010`, port 5273). Playwright polls their URLs until they answer.
3. **`globalSetup`** ([e2e/global-setup.js](e2e/global-setup.js)) checks the DB name ends in `_e2e`, migrates, truncates and seeds it, then asks `/api/health` which DB the backend uses, to confirm it's the E2E one.
4. Each test gets a **fresh browser context** (like a new incognito window), so cookies and localStorage never leak between tests.
5. When all tests finish, Playwright kills both servers.

**Auto-waiting:** `click()` waits until the element exists, is visible, enabled and stable. `expect(...).toBeVisible()` retries until it passes or the 10 s timeout runs out. That's why the tests never use `waitForTimeout()`: Playwright waits for the *condition*, not for a guessed number of milliseconds.

## Part 3: Headless vs headed

| | Headless (`npm test`) | Headed (`npm run test:headed`) |
|---|---|---|
| Browser window | none | visible |
| Speed | fastest | a bit slower |
| Use for | CI, quick checks, everyday runs | learning, seeing *why* something fails |

`npm run test:slow` is headed with `slowMo: 800`, set through `launchOptions` in the config from the `SLOW_MO` env variable. Every Playwright action is delayed by 800 ms, and the test files don't change. You can choose your own delay: `SLOW_MO=2000 npx playwright test --headed`.

## Part 4: Understanding a test, line by line

From [e2e/specs/create-student.spec.js](e2e/specs/create-student.spec.js):

```js
const { test, expect, uniqueStudent } = require('../fixtures');
```
We import `test` from **our** fixtures file, not from `@playwright/test`. It's the same `test` with extra fixtures added (Part 6).

```js
test('should create a student through the form', async ({ page, deleteStudentByEmail }) => {
```
`test(name, fn)` registers a test. The `{ page, deleteStudentByEmail }` destructuring is how you *request fixtures*: Playwright sees the names and builds those objects for you. `page` is a browser tab.

```js
  const student = uniqueStudent({ first_name: 'John', course: 'Biology' });
```
Builds data with a unique email/last name (timestamp-based), so this test can run 100 times without "email already exists" errors.

```js
  await page.goto('/');
```
Navigates to `baseURL` + `/` = `http://localhost:5273/`. Every Playwright call returns a Promise, so you `await` each one.

```js
  await page.getByRole('button', { name: 'Add Student' }).click();
```
A **locator** finds elements the way a user or screen reader does: "the button whose accessible name is *Add Student*". If someone renames a CSS class this still works; if someone renames the button, the test should fail, because users would notice too.

```js
  await page.getByLabel('First Name').fill(student.first_name);
```
Finds the input connected to `<label htmlFor="first_name">First Name</label>`, clears it, and types. If the label isn't wired to the input, this fails, so the test also checks basic accessibility.

```js
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Student created successfully');
```
Submit, then assert the success message. The message has `role="status"`. `toHaveText` retries until the text matches (up to 10 s), which covers the HTTP round-trip.

```js
  const row = page.getByRole('row').filter({ hasText: student.email });
  await expect(row).toBeVisible();
  await expect(row).toContainText(`${student.first_name} ${student.last_name}`);
```
**Filtering locators** is the key table technique: "all rows → the one containing this email". Then we assert on that row only.

```js
  await deleteStudentByEmail(student.email);
```
Cleanup through the API, so the test leaves the database as it found it.

## Part 5: Assertions

`expect(locator).<matcher>()` is a **web-first assertion**: it keeps re-checking the page until the matcher passes or times out.

| Matcher | Checks |
|---|---|
| `toBeVisible()` / `toBeHidden()` | element is on screen / gone |
| `toHaveText('x')` | exact text (`toContainText` for a substring) |
| `toHaveValue('x')` | input value (used in the update test to check pre-fill) |
| `toHaveAttribute('aria-invalid', 'true')` | attribute value |
| `toHaveCount(0)` | how many elements match (0 = gone) |
| `.not.toContainText('x')` | any matcher can be negated |

Non-locator values use plain assertions that check once, e.g. `expect(res.status()).toBe(201)` in the fixtures.

Rule of thumb: **assert on what the user sees**, such as text, visibility and values, not on implementation details.

## Part 6: Fixtures

Open [e2e/fixtures.js](e2e/fixtures.js). A fixture is a function with three phases:

```js
createStudent: async ({ api }, use) => {
  const created = [];                 // 1. setup
  await use(async (overrides) => {    // 2. hand a value to the test, wait for test to finish
    ...create via API, remember it...
  });
  for (const s of created) await api.delete(...);  // 3. teardown (runs even if the test fails)
},
```

What this file gives you:

| Fixture | Gives the test |
|---|---|
| `api` | an HTTP client aimed at the E2E backend |
| `createStudent(overrides?)` | creates a student **via the API** and deletes it after the test |
| `deleteStudentByEmail(email)` | cleanup for students created through the UI |
| `studentsPage` | a `page` already on `/` with loading finished |
| `uniqueStudent()` (plain helper) | unique test data |

**Why it matters:** without fixtures, every update/delete/search test would repeat ~10 lines of "POST a student, check it worked, remember to delete it". With them, setup is one line: `const student = await createStudent();`. Creating data through the API instead of clicking through the form makes setup fast, and each test stays **independent**: it never relies on another test having run first. You can check this with `npx playwright test --repeat-each=3`.

## Part 7: Debugging

| Tool | Command | What it's for |
|---|---|---|
| **Playwright Inspector** | `npm run test:debug` (or one test: `npx playwright test specs/update-student.spec.js --debug`) | Pauses before each action. Step through, see the highlighted element, and try locators live. Add `await page.pause()` in a test to stop at a specific line. |
| **UI mode** | `npm run test:ui` | Pick tests from a list, re-run on file save, and scrub a timeline with DOM snapshots of every step. The best everyday tool. |
| **Screenshots** | automatic on failure | `e2e/test-results/<test-name>/test-failed-1.png` |
| **Videos** | automatic on failure | `e2e/test-results/<test-name>/video.webm` |
| **Traces** | automatic on failure | `npx playwright show-trace e2e/test-results/<test-name>/trace.zip`: a full recording with DOM, network, and console for every step |
| **HTML report** | `npm run report` | All results. Failed tests have their screenshot, video and trace attached. |

**Try it:** in `read-student.spec.js` change `'28'` to `'29'`, run `npm test`, then `npm run report`. Open the failed test and look at the screenshot, video and trace. Change it back afterwards.

Also handy: `npx playwright codegen http://localhost:5173` (with the dev app running) records your clicks and writes the locators for you.

## Part 8: Exercise — write your own test

**Goal:** the *Cancel* button on the student form closes it without saving.

Create `e2e/specs/cancel-form.spec.js`:

```js
const { test, expect, uniqueStudent } = require('../fixtures');

test('cancel closes the form without saving', async ({ page }) => {
  const student = uniqueStudent();
  await page.goto('/');

  // TODO 1: click "Add Student"
  // TODO 2: fill First Name and Email with student's values
  // TODO 3: click the "Cancel" button
  //   hint: getByRole('button', { name: 'Cancel' })
  // TODO 4: assert the form is gone
  //   hint: page.getByRole('form', { name: 'Student form' }) should be hidden
  // TODO 5: assert no row contains student.email
  //   hint: toHaveCount(0)
});
```

Run only your test while you work on it: `npx playwright test cancel-form --headed`.

<details><summary>Solution</summary>

```js
  await page.getByRole('button', { name: 'Add Student' }).click();
  await page.getByLabel('First Name').fill(student.first_name);
  await page.getByLabel('Email').fill(student.email);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('form', { name: 'Student form' })).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: student.email })).toHaveCount(0);
```
</details>

**Bonus:** write a test that creates a student with `createStudent()` and then tries to add a second one through the UI with the **same email**. Assert the server's `Email already exists` error appears, using `getByRole('alert')`.

## Part 9: CI/CD with GitHub Actions

[.github/workflows/e2e.yml](.github/workflows/e2e.yml) runs on every push and pull request:

1. Starts a `postgres:16` **service container** with a database named `student_crud_e2e`.
2. Installs Node 22 and runs `npm ci` in `backend`, `frontend` and `e2e`.
3. `npx playwright install --with-deps chromium` installs the browser and its Linux libraries.
4. `npm test` runs headless. The `webServer` config starts the servers, the same as on your machine.
5. Uploads `playwright-report/` as a build artifact **even on failure**, so you can download the report, screenshots, videos and traces from the Actions run page.

In CI, `process.env.CI` is set, so the config uses `retries: 1`. A flaky failure gets a second chance, and its trace is saved.

To use it, put the `student-crud` folder at the root of a GitHub repository and push it.
