import 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { logEvent, logScreenView } from './src/config/firebase';
import { ToastProvider } from './src/context/ToastContext';
import Toast from './src/components/Toast';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ignore all logs for a cleaner demo experience
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

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
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
                <RootNavigator />
              </NavigationContainer>
              <Toast />
            </SafeAreaProvider>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
      <StatusBar style="dark" backgroundColor="#E5E7EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
