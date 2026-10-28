const { test, expect } = require('../fixtures');

test('should show validation errors', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Student' }).click();

  // Submit the empty form
  await page.getByRole('button', { name: 'Save' }).click();

  // Every required field shows its own message
  for (const label of ['First Name', 'Last Name', 'Email', 'Age', 'Course']) {
    await expect(page.getByText(`${label} is required`)).toBeVisible();
  }
  // aria-invalid marks the input as invalid for screen readers (and for us)
  await expect(page.getByLabel('First Name')).toHaveAttribute('aria-invalid', 'true');

  // Now an invalid email
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Please enter a valid email address')).toBeVisible();

  // Nothing was saved
  await expect(page.getByRole('status')).toHaveCount(0);
});
