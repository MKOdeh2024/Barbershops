// jest.config.js
const nextJest = require('next/jest')(); // Use Next.js's Jest configuration preset

// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
 const createJestConfig = nextJest({
   dir: '<rootDir>/src', // Path to your Next.js app
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Run setup file after env is ready
  testEnvironment: 'jest-environment-jsdom', // Use jsdom environment for simulating browser
  moduleNameMapper: { // Handle module aliases (like @/components/*) defined in tsconfig.json
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/context/(.*)$': '<rootDir>/src/context/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  preset: 'ts-jest', // Use ts-jest preset for TypeScript
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// module.exports = createJestConfig(customJestConfig);
// Simpler export if not using next/jest wrapper directly (might need more manual config)
module.exports = { ...customJestConfig };
// OR If using next/jest wrapper:
module.exports = nextJest(customJestConfig);