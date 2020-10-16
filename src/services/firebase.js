import "dotenv/config";

import * as firebaseAdmin from "firebase-admin";

import config from "../config";

// init firebase
const serviceAccount = config.firebase;

export const admin = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// firebase db
export const db = firebaseAdmin.firestore();
