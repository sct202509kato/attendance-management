// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "ここに貼る",
  authDomain: "ここに貼る",
  projectId: "ここに貼る",
  storageBucket: "ここに貼る",
  messagingSenderId: "ここに貼る",
  appId: "ここに貼る",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
