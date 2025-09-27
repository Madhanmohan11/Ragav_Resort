import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD880IVEYyAaSgT--FQ3CjMoimCmuMWmDI",
  authDomain: "ragav-resort.firebaseapp.com",
  projectId: "ragav-resort",
  storageBucket: "ragav-resort.appspot.com",
  messagingSenderId: "770657594594",
  appId: "1:770657594594:web:970b33a8f6480d97fc02bb",
  measurementId: "G-N163LMYKZ6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
