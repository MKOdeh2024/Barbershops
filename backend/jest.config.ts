// backend/jest.config.js

module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset for ts-jest
  testEnvironment: 'node',
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle module aliases (tsconfig.json -> paths) - IMPORTANT: Adjust paths based on your actual structure
    '^@/config/(.*)$': '<rootDir>/config/$1',
    '^@/controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@/models/(.*)$': '<rootDir>/models/$1',
    '^@/middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@/routes/(.*)$': '<rootDir>/routes/$1',
    '^@/validators/(.*)$': '<rootDir>/validators/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',

    // Force module resolution for ESM imports with .js extensions to corresponding .ts files
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/', // Look for source files in src
    '<rootDir>/tests' // Look for test files in tests (adjust if needed)
  ],

  // The glob patterns Jest uses to detect test files
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.tsx?$', // Look for .test.ts/tsx or .spec.ts/tsx

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Correctly configure ts-jest for ESM
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true, // Tell ts-jest to use ESM
        tsconfig: 'tsconfig.json', // Point to your tsconfig
      },
    ],
  },
  // Indicates that *.node files should be treated as ES modules
  extensionsToTreatAsEsm: ['.ts'],

  // Optional: Setup files to run before each test file
  //setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'], // Example setup file path

  // Optional: Collect coverage
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8", // or 'babel'
   collectCoverageFrom: [ // Specify files to include in coverage
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts", // Exclude declaration files
      "!src/**/index.ts", // Exclude index files if they only export
      "!src/server.ts", // Exclude main server entry if needed
      "!src/config/**", // Exclude config files if not testable directly
   ],
};