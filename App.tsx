import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import firebase from '@react-native-firebase/app';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { logEvent, logScreenView } from './src/config/firebase';
import { ToastProvider } from './src/context/ToastContext';
import Toast from './src/components/Toast';
import OfflineNotice from './src/components/OfflineNotice';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ignore all logs for a cleaner demo experience
LogBox.ignoreLogs(['Expo AV has been deprecated', 'The app is running using the Legacy Architecture']);
// LogBox.ignoreAllLogs();

SplashScreen.preventAutoHideAsync();

export default function App() {
  console.log("🚀 App initializing...");
  const [fontsLoaded, error] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });

  console.log("📊 Fonts Status:", { fontsLoaded, error });

  const navigationRef = React.useRef<any>(null);
  const routeNameRef = React.useRef<string | undefined>(undefined);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || error) {
      await SplashScreen.hideAsync().catch(console.warn);
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    // Failsafe: Hide splash screen if error occurs or meaningful render happens
    if (error) {
      console.error("Font loading failed:", error);
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [error]);

  // Runtime Verification: Log critical environment details for QA/Safety
  useEffect(() => {
    const packageName = Constants.expoConfig?.android?.package || 'Unknown (Check Native)';
    const environment = packageName === 'com.sewvee.app.staging' ? 'STAGING' : (packageName === 'com.sewvee.app' ? 'PRODUCTION' : `UNKNOWN (${packageName})`);
    const firebaseProject = firebase.apps.length > 0 ? firebase.app().options.projectId : 'Not Initialized';

    console.log("\n=========================================================");
    console.log(`🚀 ENVIRONMENT:       ${environment}`);
    console.log(`📦 PACKAGE NAME:      ${packageName}`);
    console.log(`🔥 FIREBASE PROJECT:  ${firebaseProject}`);
    console.log("=========================================================\n");
  }, []);

  // Safety Timeout: Force hide splash screen after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("⏰ Splash Screen Timeout - Forcing hide");
      SplashScreen.hideAsync().catch(console.warn);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <SafeAreaProvider>
              <NavigationContainer
                ref={navigationRef}
                onReady={() => {
                  routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
                }}
                onStateChange={async () => {
                  const previousRouteName = routeNameRef.current;
                  const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

                  if (previousRouteName !== currentRouteName && currentRouteName) {
                    logScreenView(currentRouteName);
                  }
                  routeNameRef.current = currentRouteName;
                }}
              >
                <OfflineNotice />
                <RootNavigator />
              </NavigationContainer>
              <Toast />
            </SafeAreaProvider>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
      <StatusBar style="dark" backgroundColor="#E5E7EB" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
