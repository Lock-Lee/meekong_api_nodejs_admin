// Custom Jest matchers for the testing suite

export const customMatchers = {
    toBeValidUUID(received: string) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const pass = uuidRegex.test(received);

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid UUID`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid UUID`,
                pass: false,
            };
        }
    },

    toBeS3Key(received: string) {
        const s3KeyRegex = /^[a-zA-Z0-9!_.*'()-/]+$/;
        const pass = s3KeyRegex.test(received) && !received.startsWith('/') && !received.endsWith('/');

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid S3 key`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid S3 key`,
                pass: false,
            };
        }
    }
};

// Function to extend expect with custom matchers
export function setupCustomMatchers() {
    // expect will be available when this is called from test files
    (global as any).expect.extend(customMatchers);
}
