// Custom Jest matchers type declarations

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidUUID(): R;
            toBeS3Key(): R;
        }
    }
}

export { };
