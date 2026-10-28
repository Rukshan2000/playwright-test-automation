const { test, expect } = require('../fixtures');

test('should delete a student after confirming', async ({ createStudent, page }) => {
  const student = await createStudent();
  await page.goto('/');

  const row = page.getByRole('row').filter({ hasText: student.email });
  await row.getByRole('button', { name: 'Delete' }).click();

  // The confirmation dialog appears and names the student
  const dialog = page.getByRole('dialog', { name: 'Delete student?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(`${student.first_name} ${student.last_name}`);

  // Confirm
  await dialog.getByRole('button', { name: 'Confirm' }).click();

  // Dialog closes, success message shows, and the row is gone
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status')).toHaveText('Student deleted successfully');
  await expect(row).toHaveCount(0);
});

test('should keep the student when delete is cancelled', async ({ createStudent, page }) => {
  const student = await createStudent();
  await page.goto('/');

  const row = page.getByRole('row').filter({ hasText: student.email });
  await row.getByRole('button', { name: 'Delete' }).click();

  // Click Cancel instead of Confirm
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  // Dialog is gone, the student is still there
  await expect(dialog).toBeHidden();
  await expect(row).toBeVisible();

  // Reload to prove it was not deleted on the server either
  await page.reload();
  await expect(row).toBeVisible();
});
