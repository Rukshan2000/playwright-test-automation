const { test, expect } = require('../fixtures');

test('should filter students by name and email', async ({ createStudent, page }) => {
  const target = await createStudent({ first_name: 'Zelda' });
  const other = await createStudent({ first_name: 'Marco' });

  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Search students' });
  const targetRow = page.getByRole('row').filter({ hasText: target.email });
  const otherRow = page.getByRole('row').filter({ hasText: other.email });

  // Both visible before searching
  await expect(targetRow).toBeVisible();
  await expect(otherRow).toBeVisible();

  // Search by the unique last name -> only the target remains
  await search.fill(target.last_name);
  await expect(targetRow).toBeVisible();
  await expect(otherRow).toBeHidden();

  // Search by email works too
  await search.fill(other.email);
  await expect(otherRow).toBeVisible();
  await expect(targetRow).toBeHidden();

  // A search with no matches shows the empty message
  await search.fill('no-such-student-xyz');
  await expect(page.getByText('No students match your search.')).toBeVisible();
});
