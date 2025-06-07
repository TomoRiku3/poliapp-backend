/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',             // use ts-jest for TS compilation
  testEnvironment: 'node',       // run tests in a Node-like environment

  // where to look for tests
  roots: ['<rootDir>/test'],

  // match both .test.ts and .spec.ts files
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],

  // allow importing these extensions without specifying them
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
