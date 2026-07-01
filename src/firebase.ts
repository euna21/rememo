import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAffBvs7q8tIVzKbKYjlO-V45juolXbnc8",
  authDomain: "rememo-a616a.firebaseapp.com",
  projectId: "rememo-a616a",
  storageBucket: "rememo-a616a.firebasestorage.app",
  messagingSenderId: "344673341234",
  appId: "1:344673341234:web:0d1e9d0806efc5d955d12b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);