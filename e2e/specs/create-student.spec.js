const { test, expect, uniqueStudent } = require('../fixtures');

test('should create a student through the form', async ({ page, deleteStudentByEmail }) => {
  // Unique data so this test never collides with another run
  const student = uniqueStudent({ first_name: 'John', course: 'Biology' });

  // Open the student management application
  await page.goto('/');

  // Click the button that opens the student form
  await page.getByRole('button', { name: 'Add Student' }).click();

  // Fill each field, finding inputs by their visible <label>
  await page.getByLabel('First Name').fill(student.first_name);
  await page.getByLabel('Last Name').fill(student.last_name);
  await page.getByLabel('Email').fill(student.email);
  await page.getByLabel('Age').fill(String(student.age));
  await page.getByLabel('Course').fill(student.course);

  // Submit the form
  await page.getByRole('button', { name: 'Save' }).click();

  // The success message is rendered with role="status"
  await expect(page.getByRole('status')).toHaveText('Student created successfully');

  // Find the table row containing our unique email and check its contents
  const row = page.getByRole('row').filter({ hasText: student.email });
  await expect(row).toBeVisible();
  await expect(row).toContainText(`${student.first_name} ${student.last_name}`);
  await expect(row).toContainText(student.course);

  // Clean up: this student was created via the UI, so the fixture doesn't know about it
  await deleteStudentByEmail(student.email);
});
