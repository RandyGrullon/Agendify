import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCSdH504yAqT58BlkRY8qzHAVR1t-M1lFM",
  authDomain: "agendify-4895f.firebaseapp.com",
  projectId: "agendify-4895f",
  storageBucket: "agendify-4895f.firebasestorage.app",
  messagingSenderId: "256868786304",
  appId: "1:256868786304:web:de303cdf784ff6044dc665"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
