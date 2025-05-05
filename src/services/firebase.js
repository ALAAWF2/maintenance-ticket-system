import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCI0wFNIpzWqKLQSyFwnd0u_Hv_JDkAF0Y",
  authDomain: "maintenance-ticket-syste-e79a1.firebaseapp.com",
  projectId: "maintenance-ticket-syste-e79a1",
  storageBucket: "maintenance-ticket-syste-e79a1.appspot.com",
  messagingSenderId: "178890122314",
  appId: "1:178890122314:web:4823aefab5a0218c52f2b3",
  measurementId: "G-7NKPRDPVSK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);