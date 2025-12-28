describe('Environment Isolation Logic', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };

        // Mock the firebase module to prevent "import outside module" errors
        jest.mock('@react-native-firebase/auth', () => ({
            getAuth: jest.fn(),
        }));
        jest.mock('@react-native-firebase/firestore', () => ({
            getFirestore: jest.fn(),
        }));
        jest.mock('@react-native-firebase/analytics', () => ({
            getAnalytics: jest.fn(),
            logEvent: jest.fn(),
        }));
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    test('STAGING: Collections should have "staging/" prefix', () => {
        process.env.EXPO_PUBLIC_APP_ENV = 'staging';

        // We need to re-require to pick up the env change
        const { COLLECTIONS, ENVIRONMENT } = require('../config/firebase');
        // 3. Verify assertions
        expect(ENVIRONMENT).toBe('staging');
        expect(COLLECTIONS.USERS).toBe('staging_users');
        expect(COLLECTIONS.ORDERS).toBe('staging_orders');
        expect(COLLECTIONS.CUSTOMERS).toBe('staging_customers');
        expect(COLLECTIONS.PAYMENTS).toBe('staging_payments');
        expect(COLLECTIONS.OUTFITS).toBe('staging_outfits');
    });

    test('PRODUCTION: Collections should have "production_" prefix', () => {
        // 1. Simulate Production Env
        process.env.EXPO_PUBLIC_APP_ENV = 'production';

        // 2. Re-import config
        const { COLLECTIONS, ENVIRONMENT } = require('../config/firebase');

        // 3. Verify assertions
        expect(ENVIRONMENT).toBe('production');
        expect(COLLECTIONS.USERS).toBe('production_users');
        expect(COLLECTIONS.ORDERS).toBe('production_orders');
    });

    test('DEFAULT: Should fallback to staging if undefined', () => {
        // 1. Simulate Undefined (Local Dev)
        delete process.env.EXPO_PUBLIC_APP_ENV;

        // 2. Re-import config
        const { COLLECTIONS, ENVIRONMENT } = require('../config/firebase');

        // 3. Verify assertions
        expect(ENVIRONMENT).toBe('staging');
        expect(COLLECTIONS.ORDERS).toBe('staging_orders');
    });
});
