import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import analytics from '@react-native-firebase/analytics';
import { Constants } from 'expo-constants';

// ---- Shared Constants ----
export const IS_STAGING = false; // Hardcode for now or use Constants
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
// --------------------------

// Native Implementation of Unified API
export const getAuth = () => auth();
export const getFirestore = () => firestore();
export const getStorage = () => storage();
export const getAnalytics = () => analytics();

// Wrapper for Auth functions to match likely Context usage
export const onAuthStateChanged = (authInstance: any, cb: any) => authInstance.onAuthStateChanged(cb);
export const signInWithEmailAndPassword = (authInstance: any, e: string, p: string) => authInstance.signInWithEmailAndPassword(e, p);
export const createUserWithEmailAndPassword = (authInstance: any, e: string, p: string) => authInstance.createUserWithEmailAndPassword(e, p);
export const signOut = (authInstance: any) => authInstance.signOut();
export const sendPasswordResetEmail = (authInstance: any, e: string) => authInstance.sendPasswordResetEmail(e);
export const signInAnonymously = (authInstance: any) => authInstance.signInAnonymously();
export const updatePassword = (user: any, p: string) => user.updatePassword(p);

// Firestore Wrappers (Mapping Modular Syntax to Namespaced)
export const collection = (db: any, path: string) => db.collection(path);

export const query = (ref: any, ...args: any[]) => {
    // Basic mapping: native ref supports .where(). 
    // args are likely objects like { type: 'where', field, op, val } from our helper below
    let q = ref;
    args.forEach(arg => {
        if (arg.type === 'where') {
            q = q.where(arg.field, arg.op, arg.val);
        }
    });
    return q;
};

export const where = (field: string, op: string, val: any) => ({ type: 'where', field, op, val });

export const getDocs = (queryRef: any) => queryRef.get();

export const doc = (db: any, colName: string, id?: string) => {
    // If 2 args (db, path), assume path is col/id
    if (!id && colName.includes('/')) return db.doc(colName);
    // If 3 args
    return db.collection(colName).doc(id);
};

export const getDoc = (docRef: any) => docRef.get();
export const updateDoc = (docRef: any, data: any) => docRef.update(data);
export const setDoc = (docRef: any, data: any, opts?: any) => docRef.set(data, opts);
export const addDoc = (colRef: any, data: any) => colRef.add(data);

export const logEvent = async (eventName: string, params?: object) => {
    try {
        await analytics().logEvent(eventName, params);
    } catch (e) {
        console.warn("Analytics Error", e);
    }
};

export const logScreenView = async (screenName: string) => {
    try {
        await analytics().logScreenView({ screen_name: screenName, screen_class: screenName });
    } catch (e) {
        console.warn("Analytics Screen View Error", e);
    }
};

// Export raw native modules for backward compatibility (e.g. firestore() syntax)
export { auth, firestore, storage, analytics };

// Default export if needed
export default {
    auth,
    firestore,
    storage,
    analytics
};
