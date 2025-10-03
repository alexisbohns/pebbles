import { test, expect } from '@playwright/test';

test('submits a new entry via the form', async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());

	await page.goto('/');

	const entries = page.locator('ul li');
	await expect(entries).toHaveCount(0);

	const form = page.locator('form');
	const inputs = form.locator('input');

	const data = {
		situation: 'Lost my keys',
		thought: "I'm so careless",
		emotion: 'Frustrated',
		behavior: 'Double-check steps',
		alternative: 'I can retrace calmly'
	};

	await inputs.nth(0).fill(data.situation);
	await inputs.nth(1).fill(data.thought);
	await inputs.nth(2).fill(data.emotion);
	await inputs.nth(3).fill(data.behavior);
	await inputs.nth(4).fill(data.alternative);
	await form.locator('button[type="submit"]').click();
});
