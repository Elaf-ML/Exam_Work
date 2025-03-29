import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyOgIcQ5LU5n5CYxGWV387PTGb1flMjbE",
  authDomain: "gameshub-da6d0.firebaseapp.com",
  projectId: "gameshub-da6d0",
  storageBucket: "gameshub-da6d0.firebasestorage.app",
  messagingSenderId: "53897871176",
  appId: "1:53897871176:web:396a484efd2b81ca81fd7d",
  measurementId: "G-339TR4QZCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 




