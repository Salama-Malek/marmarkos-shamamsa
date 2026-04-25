import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/theme';
import { fromIsoDate, arabicMonthName } from '@/lib/date';
import { formatNumber } from '@/lib/numerals';
import { useNumerals } from '@/lib/numeralsContext';

interface Props {
  date: string;
  tone?: 'primary' | 'cancelled';
  size?: 'md' | 'sm';
}

export function CalendarTile({ date, tone = 'primary', size = 'md' }: Props) {
  const { style: numStyle } = useNumerals();
  const d = fromIsoDate(date);
  const day = formatNumber(d.getDate(), numStyle);
  const month = arabicMonthName(d.getMonth(), true);

  const palette = tone === 'cancelled'
    ? { bg: colors.cancelledBg, fg: colors.cancelled, border: colors.cancelled }
    : { bg: colors.primary, fg: colors.white, border: colors.primaryDark };

  const dim = size === 'sm' ? 48 : 56;

  return (
    <View
      style={[
        styles.tile,
        {
          width: dim,
          height: dim,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
    >
      <Text
        style={[
          styles.day,
          {
            color: palette.fg,
            fontSize: size === 'sm' ? 18 : 22,
          },
        ]}
      >
        {day}
      </Text>
      <Text
        style={[
          styles.month,
          {
            color: palette.fg,
            fontSize: size === 'sm' ? 10 : 11,
          },
        ]}
      >
        {month}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  day: {
    fontFamily: 'Amiri_700Bold',
    lineHeight: 26,
  },
  month: {
    fontFamily: 'Cairo_600SemiBold',
    lineHeight: 14,
  },
});
