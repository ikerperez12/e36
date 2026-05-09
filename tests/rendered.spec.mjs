import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

async function runAxe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
      }
    });
  });
}

test('home renders the cinematic experience without accessibility violations', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/E36 318is/);
  await expect(page.getByRole('button', { name: /Iniciar/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Aviso legal/i })).toBeVisible();

  await page.getByRole('button', { name: /Iniciar/i }).click();
  await expect(page.getByRole('heading', { name: /MUNICH|MÚNICH/i })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByText(/CAPO|CAPÓ/i)).toBeVisible();
  await expect(page.getByText(/M44B19/i).first()).toBeVisible();

  if (isMobile) {
    const legalBox = await page.locator('.legal-link').boundingBox();
    expect(legalBox?.width).toBeGreaterThanOrEqual(24);
    expect(legalBox?.height).toBeGreaterThanOrEqual(24);
  }

  const results = await runAxe(page);
  expect(results.violations).toEqual([]);
});

test('home always starts at intro and scene 01, with mobile-safe video playback', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e36:lastIdx', '5');
  });

  await page.goto('/#scene=6');
  await expect(page.getByRole('button', { name: /Iniciar/i })).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/is-intro/);

  await page.getByRole('button', { name: /Iniciar/i }).click();
  await expect(page.locator('body')).not.toHaveClass(/is-intro/);
  await expect(page.getByRole('heading', { name: /MUNICH|MÃšNICH/i })).toBeVisible();

  const activeVideo = page.locator('#video-wrap video.is-active');
  await expect(activeVideo).toHaveCount(1);
  await expect.poll(() => activeVideo.evaluate((video) => video.preload)).toBe('auto');
  await expect.poll(() => activeVideo.evaluate((video) => video.currentSrc.endsWith('/videos/01.mp4'))).toBe(true);
  await expect.poll(
    () => activeVideo.evaluate((video) => !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA),
    { timeout: 10_000 }
  ).toBe(true);
});

test('legal page is readable, linked, and accessible', async ({ page }) => {
  await page.goto('/legal.html');
  await expect(page).toHaveTitle(/Aviso legal/);
  await expect(page.getByRole('heading', { name: /Fan-made/i })).toBeVisible();
  await expect(page.getByText(/No es un sitio oficial/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Volver a la experiencia/i })).toBeVisible();

  const results = await runAxe(page);
  expect(results.violations).toEqual([]);
});
