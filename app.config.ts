import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    const isStaging = process.env.EAS_BUILD_PROFILE === 'staging';

    return {
        ...config,
        name: isStaging ? 'Sewvee (Dev)' : 'Sewvee',
        slug: 'sewvee-mini',
        scheme: 'sewvee',
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/app-icon.png',
        userInterfaceStyle: 'light',
        newArchEnabled: true,
        splash: {
            image: './assets/logo1024.png',
            resizeMode: 'cover',
            backgroundColor: '#0E9F8A',
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.sewvee.app',
        },
        android: {
            splash: {
                image: './assets/logo1024.png',
                resizeMode: 'cover',
                backgroundColor: '#0E9F8A',
            },
            adaptiveIcon: {
                foregroundImage: './assets/app-icon.png',
                backgroundColor: '#ffffff',
            },
            package: isStaging ? 'com.sewvee.app.staging' : 'com.sewvee.app',
            versionCode: 31,
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            softwareKeyboardLayoutMode: 'resize',
            googleServicesFile: isStaging ? './google-services-staging.json' : './google-services.json',
        },
        web: {
            favicon: './assets/favicon.png',
        },
        plugins: [
            [
                'expo-font',
                {
                    fonts: [
                        './assets/fonts/Inter-Regular.ttf',
                        './assets/fonts/Inter-Medium.ttf',
                        './assets/fonts/Inter-SemiBold.ttf',
                        './assets/fonts/Inter-Bold.ttf',
                    ],
                },
            ],
            '@react-native-firebase/app',
            '@react-native-firebase/auth',
            'expo-updates',
            [
                'expo-av',
                {
                    microphonePermission: 'Allow Sewvee to access your microphone.',
                },
            ],
        ],
        updates: {
            url: 'https://u.expo.dev/049c0301-9322-4f3d-ba93-8baa65a13555',
            fallbackToCacheTimeout: 0,
        },
        runtimeVersion: {
            policy: 'appVersion',
        },
        extra: {
            isStaging,
            eas: {
                projectId: '049c0301-9322-4f3d-ba93-8baa65a13555',
            },
        },
        owner: 'neemtreeapps',
    };
};
