import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

import { OfflineBanner } from "@/components/offline-banner";
import { bootstrapClientId } from "@/lib/client-id";
import { queryClient, queryPersister } from "@/lib/query-client";
import { useSystemColorScheme } from "@/lib/use-system-color-scheme";

// Ensure env is parsed at boot; throws a readable error if misconfigured.
import "@/lib/env";

SplashScreen.preventAutoHideAsync().catch(() => {
  // No-op: called again on hot reload.
});

export default function RootLayout() {
  const scheme = useSystemColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Client UUID must be hydrated before any query fires — apiClient reads it
    // synchronously from the fetch wrapper. Splash stays up until bootstrap
    // resolves so no mount races the first request.
    bootstrapClientId()
      .catch(() => {
        // If secure-store is unavailable we can't identify the client. The app
        // still renders — favorites will error out later, but the rest works.
      })
      .finally(() => {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      });
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
            <BottomSheetModalProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <OfflineBanner />
              <Toaster duration={2000} />
              <StatusBar style="auto" />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
