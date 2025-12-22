import 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { logEvent, logScreenView } from './src/config/firebase';

// Ignore all logs for a cleaner demo experience
LogBox.ignoreAllLogs();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, error] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

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
