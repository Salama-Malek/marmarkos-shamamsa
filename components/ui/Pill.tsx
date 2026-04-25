import React from 'react';
import { StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';

interface Props {
  label: string;
  tone?: 'neutral' | 'primary' | 'present' | 'absent' | 'excused' | 'cancelled' | 'gold';
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function Pill({ label, tone = 'neutral', style, icon }: Props) {
  const palette = paletteFor(tone);
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[text.small, { color: palette.fg, fontFamily: 'Cairo_600SemiBold' }]}>
        {label}
      </Text>
    </View>
  );
}

function paletteFor(tone: NonNullable<Props['tone']>) {
  switch (tone) {
    case 'primary':
      return { bg: colors.primary, fg: colors.white, border: colors.primary };
    case 'present':
      return { bg: colors.presentBg, fg: colors.present, border: colors.present };
    case 'absent':
      return { bg: colors.absentBg, fg: colors.absent, border: colors.absent };
    case 'excused':
      return { bg: colors.excusedBg, fg: colors.goldDeep, border: colors.gold };
    case 'cancelled':
      return { bg: colors.cancelledBg, fg: colors.cancelled, border: colors.cancelled };
    case 'gold':
      return { bg: colors.goldLight, fg: colors.goldDeep, border: colors.gold };
    case 'neutral':
    default:
      return { bg: colors.surface, fg: colors.textMuted, border: colors.border };
  }
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginEnd: spacing.xxs,
  },
});
