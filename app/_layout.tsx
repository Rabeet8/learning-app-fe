import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AppProvider } from '../context/AppContext';
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
    if (error) throw error;
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

function useProtectedRoute(loaded: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;

    // Supabase enforces and manages sessions via AsyncStorage internally.
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const inAuthGroup = segments[0] !== '(tabs)';

      if (!session && !inAuthGroup) {
        // If the user is unauthenticated and tries to access the protected layout
        router.replace('/');
      } else if (session && inAuthGroup) {
        // If the user has a valid session but is trapped on the auth screen
        router.replace('/(tabs)');
      }
    };

    initializeAuth();

    // The listener fires whenever the intrinsic token states explicitly shift (login / logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] !== '(tabs)';
      
      if (event === 'SIGNED_OUT' || !session) {
        // Force replace to auth screen
        router.replace('/');
      } else if (session && inAuthGroup) {
        // Ensure successful logins natively bounce to the protected interface
        router.replace('/(tabs)');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loaded, segments]);
}

function RootLayoutNav({ loaded }: { loaded: boolean }) {
  // Drives global dynamic routing organically hooked into Supabase state
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

