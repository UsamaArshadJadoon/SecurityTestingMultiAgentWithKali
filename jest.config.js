/**
 * JEST CONFIGURATION
 *
 * Test runner configuration for penetration testing framework tests
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'orchestrator/**/*.js',
    '!orchestrator/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  // Fail fast on first test failure (remove --no-bail to run all tests)
  bail: true
};
