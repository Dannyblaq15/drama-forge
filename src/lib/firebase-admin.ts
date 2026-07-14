import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

// Prevent re-initialization in Next.js development environment
if (!getApps().length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    
    if (fs.existsSync(absolutePath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com` // Optional but useful for realtime DB
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn(`Firebase Admin SDK could not be initialized: File not found at ${absolutePath}`);
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export const adminDb = getApps().length ? getFirestore() : null;
export const adminAuth = getApps().length ? getAuth() : null;
