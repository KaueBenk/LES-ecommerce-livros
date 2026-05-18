import { defineConfig } from 'cypress';

const baseUrl = process.env.CYPRESS_BASE_URL || 'http://localhost:5173';
const apiBaseUrl = process.env.CYPRESS_API_BASE_URL || 'http://localhost:8080/api/v1';

export default defineConfig({
  e2e: {
    // Base URL for all cy.visit() calls
    baseUrl,

    // Spec pattern — covers both the legacy __tests__ folder and the new cypress/e2e folder
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      '__tests__/e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    ],

    // Support file
    supportFile: 'cypress/support/e2e.js',

    // Fixtures
    fixturesFolder: 'cypress/fixtures',

    // Screenshots & videos on failure
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    video: true,

    // Viewport — desktop default; tests can override per-suite
    viewportWidth: 1280,
    viewportHeight: 720,

    // Retry failed tests once in CI
    retries: {
      runMode: 0,
      openMode: 0,
    },

    // Timeouts
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // Browser launch args for headless mode
    chromeWebSecurity: false,
    firefoxWebSecurity: false,

    setupNodeEvents(on, config) {
      // Register tasks for node-level operations
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });

      return config;
    },
  },

  // Shared env variables available via Cypress.env()
  env: {
    apiBaseUrl,
  },

  // Component testing (reserved for future use)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
