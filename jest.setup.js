/**
 * JEST SETUP FILE
 *
 * Configure environment variables and test globals before running tests
 */

// Set required environment variables
process.env.REQUEST_SIGNING_SECRET = 'test-secret-key-for-jest-tests-only';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
