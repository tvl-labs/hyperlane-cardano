/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./'],
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['node_modules']
};