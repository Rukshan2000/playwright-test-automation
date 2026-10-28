const { test, expect } = require('../fixtures');

test('should update a student name', async ({ createStudent, page }) => {
  // Arrange: a student that exists only for this test
  const student = await createStudent({ first_name: 'Before' });

  await page.goto('/');

  // Find the row for our student, then the Edit button inside that row
  const row = page.getByRole('row').filter({ hasText: student.email });
  await row.getByRole('button', { name: 'Edit' }).click();

  // The form is pre-filled with the current data
  const firstName = page.getByLabel('First Name');
  await expect(firstName).toHaveValue('Before');

  // fill() clears the input first, then types the new value
  await firstName.fill('After');
  await page.getByRole('button', { name: 'Update' }).click();

  // Verify success message and the new name in the table
  await expect(page.getByRole('status')).toHaveText('Student updated successfully');
  await expect(row).toContainText(`After ${student.last_name}`);
  await expect(row).not.toContainText('Before');
});
