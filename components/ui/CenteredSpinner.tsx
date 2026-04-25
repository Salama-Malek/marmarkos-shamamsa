import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, text } from '@/theme';

interface Props {
  label?: string;
  inline?: boolean;
}

export function CenteredSpinner({ label, inline }: Props) {
  const Container = inline ? View : SafeAreaView;
  return (
    <Container style={[styles.wrap, inline ? null : styles.safe]}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={[text.small, styles.label]}>{label}</Text> : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
  },
});
