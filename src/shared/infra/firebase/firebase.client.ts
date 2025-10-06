import admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

/**
 * Get or initialize Firebase Admin App (singleton).
 */
export function getFirebaseApp() {
    if (!firebaseApp) {
        if (admin.apps.length > 0) {
            firebaseApp = admin.app();
        } else {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                }),
            });
        }
    }
    return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging() {
    return getFirebaseApp().messaging();
}
