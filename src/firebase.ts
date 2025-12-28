// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjWgW2MHpI2dVv7rvXrnkGH1CN1s7hguI",
  authDomain: "attendance-management-de-7bc5f.firebaseapp.com",
  projectId: "attendance-management-de-7bc5f",
  storageBucket: "attendance-management-de-7bc5f.firebasestorage.app",
  messagingSenderId: "645989279212",
  appId: "1:645989279212:web:aa3a48c511ecf443a64cc9",
  measurementId: "G-7MCFZVWLLV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
