import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { colors, radii, spacing, text, layout } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  fullWidth,
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  const palette = paletteFor(variant, isDisabled);
  const sizing = sizingFor(size);

  return (
    <Pressable
      testID={testID}
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizing,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
        fullWidth ? styles.fullWidth : undefined,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.fg} />
        ) : (
          <>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text style={[text.button, { color: palette.fg }]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function paletteFor(v: Variant, _disabled: boolean | undefined) {
  switch (v) {
    case 'primary':
      return { bg: colors.primary, fg: colors.white, border: colors.primary };
    case 'secondary':
      return { bg: colors.surface, fg: colors.text, border: colors.borderStrong };
    case 'ghost':
      return { bg: 'transparent', fg: colors.primary, border: 'transparent' };
    case 'danger':
      return { bg: colors.absent, fg: colors.white, border: colors.absent };
  }
}

function sizingFor(s: Size) {
  switch (s) {
    case 'md':
      return { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: layout.minTapTarget };
    case 'lg':
      return { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 52 };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  icon: {
    marginEnd: spacing.xxs,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
