// Custom fixtures = reusable setup/teardown that tests ask for by name.
// Instead of every test writing its own "create a student via the API" code,
// a test just lists `createStudent` in its arguments and Playwright provides it.
const base = require('@playwright/test');
const { API_URL } = require('./playwright.config');

// Unique data so tests never clash with each other or with leftovers.
function uniqueStudent(overrides = {}) {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    first_name: 'Test',
    last_name: `Student${id}`,
    email: `student${id}@example.com`,
    age: 21,
    course: 'Physics',
    ...overrides,
  };
}

const test = base.test.extend({
  // An API client pointed at the E2E backend.
  api: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({ baseURL: API_URL });
    await use(api);
    await api.dispose();
  },

  // createStudent(overrides?) -> creates a student through the API and returns it.
  // Every student created this way is deleted automatically after the test.
  createStudent: async ({ api }, use) => {
    const created = [];
    await use(async (overrides) => {
      const res = await api.post('/api/students', { data: uniqueStudent(overrides) });
      base.expect(res.status()).toBe(201);
      const student = await res.json();
      created.push(student);
      return student;
    });
    // Teardown: runs after the test, pass or fail. 404 is fine (the test may have deleted it).
    for (const s of created) await api.delete(`/api/students/${s.id}`);
  },

  // Deletes any student with this email (for students a test creates through the UI).
  deleteStudentByEmail: async ({ api }, use) => {
    await use(async (email) => {
      const students = await (await api.get('/api/students')).json();
      for (const s of students.filter((s) => s.email === email)) {
        await api.delete(`/api/students/${s.id}`);
      }
    });
  },

  // Opens the app and waits until the student list has loaded.
  studentsPage: async ({ page }, use) => {
    await page.goto('/');
    await base.expect(page.getByText('Loading students...')).toBeHidden();
    await use(page);
  },
});

module.exports = { test, expect: base.expect, uniqueStudent };
