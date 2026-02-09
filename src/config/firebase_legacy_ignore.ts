import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Import web Firebase configuration
import * as firebaseWeb from './firebase-web';

// Platform-specific Firebase instances


// Helper for lazy access (keeps existing code compatible-ish or needs refactor)
// Actually, to avoid breaking all imports, we can keep the original export names but make them Proxies or ensure we use the default instance correctly.
// React Native Firebase v15+ uses default export mostly.
// checking require('@react-native-firebase/auth').getAuth() vs .default()


// Internal lazy getters
// Internal lazy getters with explicit static require for Metro compatibility
const getNativeAuth = () => {
    try {
        const m = require('@react-native-firebase/auth');
        const factory = m.default || m;
        return factory();
    } catch (e) { return null; }
};
const getNativeFirestore = () => {
    try {
        const m = require('@react-native-firebase/firestore');
        const factory = m.default || m;
        return factory();
    } catch (e) { return null; }
};
const getNativeStorage = () => {
    try {
        const m = require('@react-native-firebase/storage');
        const factory = m.default || m;
        return factory();
    } catch (e) { return null; }
};
const getNativeAnalytics = () => {
    try {
        const m = require('@react-native-firebase/analytics');
        const factory = m.default || m;
        return factory();
    } catch (e) { return null; }
};

// Define firebaseLogEvent helper (Lazy)
const firebaseLogEvent = Platform.OS === 'web'
    ? firebaseWeb.firebaseLogEvent
    : async (analyticsInstance: any, eventName: string, params?: any) => {
        if (analyticsInstance && analyticsInstance.logEvent) {
            return analyticsInstance.logEvent(eventName, params);
        }
    };

export const getAuth = Platform.OS === 'web' ? () => firebaseWeb.auth : getNativeAuth;
export const getFirestore = Platform.OS === 'web' ? () => firebaseWeb.firestore : getNativeFirestore;
export const getStorage = Platform.OS === 'web' ? () => firebaseWeb.storage : getNativeStorage;
export const getAnalytics = Platform.OS === 'web' ? () => firebaseWeb.analytics : getNativeAnalytics;

// Backward compatibility (Lazy Loaded Properties)
export const auth = Platform.OS === 'web' ? firebaseWeb.auth : {
    get currentUser() { return getNativeAuth().currentUser; },
    onAuthStateChanged: (cb: any) => getNativeAuth().onAuthStateChanged(cb),
    signInWithEmailAndPassword: (a: any, e: string, p: string) => getNativeAuth().signInWithEmailAndPassword(e, p),
    createUserWithEmailAndPassword: (a: any, e: string, p: string) => getNativeAuth().createUserWithEmailAndPassword(e, p),
    signOut: (a: any) => getNativeAuth().signOut(),
    sendPasswordResetEmail: (a: any, e: string) => getNativeAuth().sendPasswordResetEmail(e),
    updatePassword: (u: any, p: string) => u.updatePassword(p),
    signInAnonymously: (a: any) => getNativeAuth().signInAnonymously(),
};

export const firestore = Platform.OS === 'web' ? firebaseWeb.firestore : {
    collection: (db: any, name: string) => getNativeFirestore().collection(name),
    query: (ref: any, ...args: any[]) => ref.where ? ref.where(...args) : ref,
    doc: (db: any, col: string, id: string) => getNativeFirestore().collection(col).doc(id),
    // Add other mocks if strictly needed by consumers who don't use the exports below
};


// Environment Toggle - Dynamic based on EAS Build Profile or Expo Config
export const IS_STAGING = Constants.expoConfig?.extra?.isStaging ?? false;

// Constant Master Password for Firebase Auth
export const MASTER_AUTH_PASS = "Sewvee_Auth_Secure_2025";
export const getAuthPassword = (email: string) => MASTER_AUTH_PASS;

// Centralized Collection Names with Staging Logic
export const COLLECTIONS = {
    USERS: IS_STAGING ? 'staging_users' : 'users',
    COMPANIES: IS_STAGING ? 'staging_companies' : 'companies',
    CUSTOMERS: IS_STAGING ? 'staging_customers' : 'customers',
    ORDERS: IS_STAGING ? 'staging_orders' : 'orders',
    PAYMENTS: IS_STAGING ? 'staging_payments' : 'payments',
    OUTFITS: IS_STAGING ? 'staging_outfits' : 'outfits'
};

export const logEvent = async (eventName: string, params?: object) => {
    try {
        await firebaseLogEvent(getAnalytics(), eventName, params);
    } catch (error) {
        console.error(`[Analytics] Error logging ${eventName}:`, error);
    }
};

export const logScreenView = async (screenName: string) => {
    try {
        await firebaseLogEvent(getAnalytics(), 'screen_view', {
            firebase_screen: screenName,
            firebase_screen_class: screenName,
        });
    } catch (error) {
        console.error(`[Analytics] Error logging screen ${screenName}:`, error);
    }
};

export default {
    get auth() { return auth; },
    get firestore() { return getFirestore(); },
    get storage() { return getStorage(); },
    get analytics() { return getAnalytics(); }
};
