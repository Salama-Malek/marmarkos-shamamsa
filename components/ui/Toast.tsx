import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, text, elevation } from '@/theme';

type ToastTone = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const counter = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      counter.current += 1;
      const id = counter.current;
      setToast({ id, message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
          ({ finished }) => {
            if (finished) setToast((current) => (current?.id === id ? null : current));
          },
        );
      }, 2400);
    },
    [opacity],
  );

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
          <View style={[styles.toast, toneStyle(toast.tone)]}>
            <Text style={[text.bodyMedium, styles.message]} numberOfLines={3}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

function toneStyle(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return { backgroundColor: colors.present, borderColor: colors.present };
    case 'error':
      return { backgroundColor: colors.absent, borderColor: colors.absent };
    case 'info':
    default:
      return { backgroundColor: colors.text, borderColor: colors.text };
  }
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  toast: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: '92%',
    ...(elevation.fab as object),
  },
  message: {
    color: colors.white,
    textAlign: 'center',
  },
});
