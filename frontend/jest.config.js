/** @type {import('jest').Config} */
const config = {
  // Explicitly set the root directory to the current directory.
  // This is the key to helping Jest find its bearings inside the Docker container.
  rootDir: '.',

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // Use the ts-jest preset to automatically handle TypeScript
  preset: 'ts-jest',

  // Runs special logic, such as cleaning up components after each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Explicitly define the pattern for test files within the src directory
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],

  // Module name mapper configuration for aliased paths
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/context/(.*)$': '<rootDir>/src/context/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },
};

module.exports = config;
