import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';
import { useNumerals } from '@/lib/numeralsContext';
import { formatNumber } from '@/lib/numerals';

interface Props {
  label: string;
  value: number;
  tone?: 'neutral' | 'primary' | 'present' | 'absent' | 'excused' | 'cancelled' | 'gold';
}

export function StatPill({ label, value, tone = 'neutral' }: Props) {
  const { style: numStyle } = useNumerals();
  const palette = paletteFor(tone);
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[text.bodyBold, { color: palette.fg }]} numberOfLines={1}>
        {formatNumber(value, numStyle)}
      </Text>
      <Text
        style={[text.caption, { color: palette.fg }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
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
      return { bg: colors.surface, fg: colors.text, border: colors.border };
  }
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
});
