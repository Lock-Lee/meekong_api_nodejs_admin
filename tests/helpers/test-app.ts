import { Application } from 'express';
import { Container } from 'inversify';
import App from '../../src/main/app';
import { container } from '../../src/main/inversify.config';

let testApp: Application | null = null;

export async function getTestApp(): Promise<Application> {
    if (!testApp) {
        // Create fresh app instance for testing
        const appInstance = new App();
        testApp = appInstance.getApp();
    }
    return testApp;
}

export function getTestContainer(): Container {
    return container;
}

export async function cleanupTestApp(): Promise<void> {
    testApp = null;
}
