import { defineConfig, devices } from '@playwright/test';

const ci = Boolean(process.env.CI);
const projects = [
  {
    name: 'chromium-mobile',
    use: { ...devices['Pixel 5'] }
  },
  {
    name: 'firefox-mobile',
    use: {
      browserName: 'firefox',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      deviceScaleFactor: 2
    }
  },
  {
    name: 'chromium-desktop',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } }
  }
];

if (!ci) {
  projects.splice(1, 0, {
    name: 'webkit-ios',
    use: { ...devices['iPhone 13'] }
  });
}

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 7_500 },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !ci,
    timeout: 90_000
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure'
  },
  projects,
  reporter: ci ? [['github'], ['list']] : [['list']]
});
