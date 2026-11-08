const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./browser-tests",
  timeout: 25000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/serve-app.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
