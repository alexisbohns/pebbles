import { test, expect } from '@playwright/test';

test('submits a new entry via the form', async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());

	await page.goto('/');

	await expect(page.getByRole('listitem')).toHaveCount(0);

	const data = {
		situation: 'Lost my keys',
		thought: "I'm so careless",
		emotion: 'Frustrated',
		behavior: 'Double-check steps',
		alternative: 'I can retrace calmly'
	};

	await page.getByPlaceholder('Situation').fill(data.situation);
	await page.getByPlaceholder('Automatic thought').fill(data.thought);
	await page.getByPlaceholder('Emotion').fill(data.emotion);
	await page.getByPlaceholder('Behavior').fill(data.behavior);
	await page.getByPlaceholder('Alternative thought').fill(data.alternative);
	await page.getByRole('button', { name: 'Add' }).click();

	const entry = page.getByRole('listitem').filter({ hasText: data.situation });
	await expect(entry).toBeVisible();
	await expect(entry).toContainText(data.thought);
	await expect(entry).toContainText(data.emotion);
	await expect(entry).toContainText(data.behavior);
	await expect(entry).toContainText(data.alternative);

	await expect(page.getByPlaceholder('Situation')).toHaveValue('');
	await expect(page.getByPlaceholder('Automatic thought')).toHaveValue('');
});
