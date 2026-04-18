import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AppContext, AppProvider } from '../context/AppContext';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) console.error('Font loading error:', error);
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppProvider>
      <PaperProvider theme={MD3LightTheme}>
        <RootLayoutNav loaded={loaded} />
      </PaperProvider>
    </AppProvider>
  );
}

import { supabase } from '@/lib/supabase';
import { useRouter, useSegments } from 'expo-router';

import { useContext } from 'react';

function useProtectedRoute(loaded: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated } = useContext(AppContext);

  useEffect(() => {
    if (!loaded) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inTabsGroup) {
      router.replace('/');
    } else if (isAuthenticated && !inTabsGroup) {
      router.replace('/(tabs)');
    }
  }, [loaded, segments, isAuthenticated]);
}

function RootLayoutNav({ loaded }: { loaded: boolean }) {
  useProtectedRoute(loaded);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

