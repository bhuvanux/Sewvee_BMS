import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getAnalytics, logEvent as firebaseLogEvent } from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Firebase is auto-initialized from google-services.json on Android
// and GoogleService-Info.plist on iOS

// No manual initialization needed with React Native Firebase!

// Environment Toggle - Dynamic based on EAS Build Profile or Expo Config
export const IS_STAGING = Constants.expoConfig?.extra?.isStaging ?? true;

// --- MANDATORY RUNTIME VERIFICATION ---
console.log('🔥 Environment:', IS_STAGING ? 'STAGING/DEV' : 'PRODUCTION');
console.log('🔥 Firebase Project:', 'sewvee'); // Hardcoded expectation for PROD
// --------------------------------------

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

// Export the modular getters
export const auth = () => getAuth();
export const firestore = () => getFirestore();
export const analytics = () => getAnalytics();

export const logEvent = async (eventName: string, params?: object) => {
    try {

        await firebaseLogEvent(getAnalytics(), eventName, params);
    } catch (error) {
        console.error(`[Analytics] Error logging ${eventName}:`, error);
    }
};

export const logScreenView = async (screenName: string) => {
    try {

        // logScreenView is deprecated in v14+, using logEvent('screen_view', ...) instead
        await firebaseLogEvent(getAnalytics(), 'screen_view', {
            firebase_screen: screenName,
            firebase_screen_class: screenName,
        });
    } catch (error) {
        console.error(`[Analytics] Error logging screen ${screenName}:`, error);
    }
};

export default {
    get auth() { return getAuth(); },
    get firestore() { return getFirestore(); },
    get analytics() { return getAnalytics(); }
};
