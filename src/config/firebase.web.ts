// Web Firebase Configuration Wrapper (shim to match native interface)
import * as firebaseWeb from './firebase-web';

// Re-export specific functions
export const {
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
    logEvent,
    logScreenView
} = firebaseWeb;

// Match Native Getters
export const getAuth = () => firebaseWeb.auth;
export const getFirestore = () => firebaseWeb.firestore;
export const getStorage = () => firebaseWeb.storage;
export const getAnalytics = () => firebaseWeb.analytics;

// Shared Constants (Duplicated for now to ensure consistency without another file)
export const IS_STAGING = false;
export const MASTER_AUTH_PASS = "Sewvee_Auth_Secure_2025";
export const getAuthPassword = (email: string) => MASTER_AUTH_PASS;

export const COLLECTIONS = {
    USERS: 'users',
    COMPANIES: 'companies',
    CUSTOMERS: 'customers',
    ORDERS: 'orders',
    PAYMENTS: 'payments',
    OUTFITS: 'outfits'
};

export default {
    get auth() { return firebaseWeb.auth; },
    get firestore() { return firebaseWeb.firestore; },
    get storage() { return firebaseWeb.storage; },
    get analytics() { return firebaseWeb.analytics; }
};
