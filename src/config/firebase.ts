import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

// Firebase is auto-initialized from google-services.json on Android
// and GoogleService-Info.plist on iOS
// No manual initialization needed with React Native Firebase!

// Environment Toggle - Update this for Production Builds
export const IS_STAGING = true;

// Centralized Collection Names with Staging Logic
export const COLLECTIONS = {
    USERS: IS_STAGING ? 'staging_users' : 'users',
    COMPANIES: IS_STAGING ? 'staging_companies' : 'companies',
    CUSTOMERS: IS_STAGING ? 'staging_customers' : 'customers',
    ORDERS: IS_STAGING ? 'staging_orders' : 'orders',
    PAYMENTS: IS_STAGING ? 'staging_payments' : 'payments',
    OUTFITS: IS_STAGING ? 'staging_outfits' : 'outfits'
};

// Export the modules directly (they auto-initialize when first used)
export { auth, firestore, analytics };

export const logEvent = async (eventName: string, params?: object) => {
    try {
        console.log(`[Analytics] Event: ${eventName}`, params);
        await analytics().logEvent(eventName, params);
    } catch (error) {
        console.error(`[Analytics] Error logging ${eventName}:`, error);
    }
};

export const logScreenView = async (screenName: string) => {
    try {
        console.log(`[Analytics] Screen: ${screenName}`);
        await analytics().logScreenView({
            screen_name: screenName,
            screen_class: screenName,
        });
    } catch (error) {
        console.error(`[Analytics] Error logging screen ${screenName}:`, error);
    }
};

export default { auth, firestore, analytics };
