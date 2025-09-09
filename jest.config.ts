import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/tests/unit'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  modulePathIgnorePatterns: ['<rootDir>/tests/integration'],
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: 'test.ts',
  setupFiles: ['./jest.setup.ts'],
  setupFilesAfterEnv: ['./tests/unit/setup.ts'],
  moduleNameMapper: {
    '^@config$': '<rootDir>/src/config',
    '^@server$': '<rootDir>/src/server/index',
    '^@server/(.*)$': '<rootDir>/src/server/$1',
    '^@docs$': '<rootDir>/src/docs/index',
    '^@docs/(.*)$': '<rootDir>/src/docs/$1',
    '^@adapters$': '<rootDir>/src/adapters/index',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
    '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
    '^@plugins$': '<rootDir>/src/plugins/index',
    '^@services$': '<rootDir>/src/services/index',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@interfaces$': '<rootDir>/src/interfaces/index',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/server/middlewares/$1',
    '^@middlewares$': '<rootDir>/src/server/middlewares/index',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/tests/__mocks__/$1',
    '^@mocks$': '<rootDir>/tests/__mocks__/index',
  },
};
export default config;
