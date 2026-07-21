// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvVB4b0FEs0hBFSZOApg3l-CJ8XcqH2T0",
  authDomain: "nana-s-bachelorette.firebaseapp.com",
  projectId: "nana-s-bachelorette",
  storageBucket: "nana-s-bachelorette.firebasestorage.app",
  messagingSenderId: "73116818060",
  appId: "1:73116818060:web:fae707db376d80890579a9",
  measurementId: "G-5264ZVVF7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const db = getFirestore(app);