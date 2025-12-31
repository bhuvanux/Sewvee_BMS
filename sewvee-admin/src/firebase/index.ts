import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBcMwLwVzjh7gd_ClCHkn_e76z-Aghrfu4",
    authDomain: "sewvee-24af2.firebaseapp.com",
    projectId: "sewvee-24af2",
    storageBucket: "sewvee-24af2.firebasestorage.app",
    messagingSenderId: "442916226396",
    appId: "1:442916226396:web:062ba6e11dcfa4adc8ad99" // Fallback to mobilesdk_app_id if web-specific is missing
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const COLLECTIONS = {
    USERS: 'users', // Final decided: no staging vs prod bifurcation for admin if project is same, 
    // but we should check main app's staging logic.
    // Main app uses staging_ prefix.
    COMPANIES: 'companies',
    CUSTOMERS: 'customers',
    ORDERS: 'orders',
    PAYMENTS: 'payments',
    OUTFITS: 'outfits'
};

// Integration with Main App Staging Logic
const IS_STAGING = true; // Hardcoded to true for safety during dev
if (IS_STAGING) {
    Object.keys(COLLECTIONS).forEach(key => {
        COLLECTIONS[key as keyof typeof COLLECTIONS] = `staging_${COLLECTIONS[key as keyof typeof COLLECTIONS]}`;
    });
}
