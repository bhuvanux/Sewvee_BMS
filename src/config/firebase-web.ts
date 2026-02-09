// Web Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';

// Your web Firebase config - extracted from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyBcMwLwVzjh7gd_ClCHkn_e76z-Aghrfu4",
  authDomain: "sewvee-24af2.firebaseapp.com",
  projectId: "sewvee-24af2",
  storageBucket: "sewvee-24af2.firebasestorage.app",
  messagingSenderId: "442916226396",
  appId: "1:442916226396:web:062ba6e11dcfa4adc8ad99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Export functions that match the React Native Firebase API
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  signInAnonymously,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  addDoc,
  firebaseLogEvent
};

export const logEvent = async (eventName: string, params?: object) => {
  try {
    await firebaseLogEvent(analytics, eventName, params);
  } catch (error) {
    console.error(`[Analytics] Error logging ${eventName}:`, error);
  }
};

export const logScreenView = async (screenName: string) => {
  try {
    await firebaseLogEvent(analytics, 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenName,
    });
  } catch (error) {
    console.error(`[Analytics] Error logging screen ${screenName}:`, error);
  }
};
