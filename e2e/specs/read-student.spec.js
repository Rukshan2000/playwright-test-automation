const { test, expect } = require('../fixtures');
const { DEPLOYED } = require('../playwright.config');

test('should display a seeded student', async ({ studentsPage: page }) => {
  // Seed data only exists in the local E2E database
  test.skip(DEPLOYED, 'seed data is not guaranteed on a deployed environment');
  // `studentsPage` already opened "/" and waited for loading to finish.
  // Ada Lovelace comes from backend/seeds/01_students.js (loaded in global-setup).
  const row = page.getByRole('row').filter({ hasText: 'ada@example.com' });

  // Check every column of the row
  await expect(row.getByRole('cell').nth(0)).toHaveText('Ada Lovelace');
  await expect(row.getByRole('cell').nth(1)).toHaveText('ada@example.com');
  await expect(row.getByRole('cell').nth(2)).toHaveText('28');
  await expect(row.getByRole('cell').nth(3)).toHaveText('Mathematics');
});

test('should display a student created through the API', async ({ createStudent, page }) => {
  // Arrange: create data directly through the API (fast, no clicking)
  const student = await createStudent({ course: 'Chemistry' });

  // Act: open the page
  await page.goto('/');

  // Assert: the student shows up in the table
  const row = page.getByRole('row').filter({ hasText: student.email });
  await expect(row).toContainText(`${student.first_name} ${student.last_name}`);
  await expect(row).toContainText('Chemistry');
});
