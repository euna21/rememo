<<<<<<< HEAD
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
=======
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화 (우리 프로젝트와 Firebase를 연결)
const app = initializeApp(firebaseConfig);

// 로그인/회원가입 기능을 담당할 auth 객체 뽑아내기
>>>>>>> da1fd286669e81d875cb0e4bd903159be6b26ae0
export const auth = getAuth(app);