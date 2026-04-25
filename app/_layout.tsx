import 'react-native-gesture-handler';
import '@/lib/silenceExpoNotificationsLogs';

import { I18nManager, View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import {
  Cairo_300Light,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';

import { getDb } from '@/db/client';
import { colors, text } from '@/theme';
import { ToastProvider } from '@/components/ui/Toast';
import { NumeralsProvider } from '@/lib/numeralsContext';

void SplashScreen.preventAutoHideAsync();

// RTL bootstrap. Identical pattern to marmarkos-moscow-youth: forceRTL
// persists across launches but only takes layout effect after a fresh JS
// engine restart, so on a standalone build we trigger Updates.reloadAsync
// once when isRTL is still false. In Expo Go reloadAsync is unavailable —
// the user just needs to manually reload once.
let rtlReloadAttempted = false;
function ensureRTL() {
  try {
    I18nManager.allowRTL(true);
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
  } catch {
    // no-op (some test environments lack the native module)
  }
}
ensureRTL();

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    Cairo_300Light,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  const [dbReady, setDbReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (rtlReloadAttempted) return;
    rtlReloadAttempted = true;
    if (I18nManager.isRTL || IS_EXPO_GO) return;
    void (async () => {
      try {
        await Updates.reloadAsync();
      } catch {
        // reloadAsync not supported in this build — proceed anyway.
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await getDb();
        if (!cancelled) setDbReady(true);
      } catch (e) {
        if (!cancelled) setBootError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && (dbReady || bootError)) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbReady, bootError]);

  if (bootError) {
    return (
      <View style={styles.center}>
        <Text style={[text.heading, { color: colors.absent }]}>تعذّر فتح قاعدة البيانات</Text>
        <Text style={[text.small, styles.muted]}>{bootError}</Text>
      </View>
    );
  }

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NumeralsProvider>
        <ToastProvider>
          <StatusBar style="dark" backgroundColor={colors.bg} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            {/*
              Sub-routes (liturgy/[id], deacon/[id], part/[id], feast/[id],
              settings) are auto-registered by expo-router as their files
              are created. Modal presentations and screen-specific options
              are added back here once each screen lands.
            */}
          </Stack>
        </ToastProvider>
      </NumeralsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 12,
    padding: 24,
  },
  muted: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
