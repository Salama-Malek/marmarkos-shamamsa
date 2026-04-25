import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '@/theme';

interface Props {
  name: string;
  size?: number;
  /**
   * Optional accent. Defaults to the primary burgundy. The deacons app uses
   * only one tone, but the prop stays so feast/role-based palettes can be
   * added later without touching every callsite.
   */
  tone?: 'primary' | 'gold';
}

export function Avatar({ name, size = 44, tone = 'primary' }: Props) {
  const initial = (name?.trim()?.[0] ?? '؟').toUpperCase();
  const palette =
    tone === 'gold'
      ? { bg: colors.gold, fg: colors.white }
      : { bg: colors.primary, fg: colors.white };
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
        },
      ]}
    >
      <Text
        style={{
          color: palette.fg,
          fontFamily: 'Amiri_700Bold',
          fontSize: size * 0.45,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
});
