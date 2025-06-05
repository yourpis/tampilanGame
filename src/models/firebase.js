import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDVvD8PY42FX073-SERcSUXaDo2NagbAE0",
    authDomain: "eji-react.firebaseapp.com",
    projectId: "eji-react",
    storageBucket: "eji-react.firebasestorage.app",
    messagingSenderId: "194103296120",
    appId: "1:194103296120:web:72aefcff49908ad02f6d8d",
    measurementId: "G-NZF16K4QTJ"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
