import React from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { colors, elevation, radii, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...(elevation.card as object),
  },
  padded: {
    padding: spacing.md,
  },
});
