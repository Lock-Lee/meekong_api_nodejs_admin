module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    typeRoots: ['<rootDir>/tests/types', '<rootDir>/node_modules/@types'],
    testMatch: [
        '**/tests/**/*.test.ts',
        '**/tests/**/*.spec.ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleNameMapping: {
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@business/(.*)$': '<rootDir>/src/business/$1',
        '^@api/(.*)$': '<rootDir>/src/api/$1',
        '^@data/(.*)$': '<rootDir>/src/data/$1',
        '^@main/(.*)$': '<rootDir>/src/main/$1',
        '^@config/(.*)$': '<rootDir>/src/shared/config/$1',
        '^@middlewares/(.*)$': '<rootDir>/src/api/middlewares/$1',
        '^@controllers/(.*)$': '<rootDir>/src/api/controllers/$1',
        '^@routes/(.*)$': '<rootDir>/src/api/routes/$1',
        '^@utils/(.*)$': '<rootDir>/src/shared/utils/$1',
        '^@schemas/(.*)$': '<rootDir>/src/api/schemas/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/workers/**', // Workers tested separately
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 30000,
    globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
    globalSetup: '<rootDir>/tests/setup/global-setup.ts',
};
