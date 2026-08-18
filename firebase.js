// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdlsMpjq4OEnEwBo3V9dBldl2VTo7vNMo",
  authDomain: "attendanceapp-c1d31.firebaseapp.com",
  projectId: "attendanceapp-c1d31",
  storageBucket: "attendanceapp-c1d31.firebasestorage.app",
  messagingSenderId: "958468196365",
  appId: "1:958468196365:web:13c84d2ba5c465b8c8ad44",
  measurementId: "G-NBXTEYF82W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };