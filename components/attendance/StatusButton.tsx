import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import { colors, layout } from '@/theme';
import type { AttendanceStatus } from '@/types';

type Tone = AttendanceStatus;

interface Props {
  tone: Tone;
  selected: boolean;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
}

export function StatusButton({ tone, selected, onPress, size = 40, accessibilityLabel }: Props) {
  const palette = paletteFor(tone);
  const Icon = iconFor(tone);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: selected ? palette.fill : colors.surface,
          borderColor: palette.fill,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.icon}>
        <Icon size={size * 0.5} color={selected ? colors.white : palette.fill} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

function paletteFor(tone: Tone) {
  switch (tone) {
    case 'present':
      return { fill: colors.present };
    case 'absent':
      return { fill: colors.absent };
    case 'excused':
      return { fill: colors.gold };
  }
}

function iconFor(tone: Tone) {
  switch (tone) {
    case 'present':
      return Check;
    case 'absent':
      return X;
    case 'excused':
      return Clock;
  }
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: layout.minTapTarget,
    minHeight: layout.minTapTarget,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
