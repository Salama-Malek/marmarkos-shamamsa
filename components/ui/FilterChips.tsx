import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: ChipOption<T>[];
  /** Pass null to show no chip as selected (e.g. "custom" state). */
  value: T | null;
  onChange: (v: T) => void;
  scrollable?: boolean;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  scrollable = true,
}: Props<T>) {
  const chips = options.map((opt) => {
    const selected = opt.value === value;
    return (
      <Pressable
        key={opt.value}
        onPress={() => onChange(opt.value)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.chip,
          selected ? styles.chipSelected : undefined,
          pressed ? { opacity: 0.85 } : undefined,
        ]}
      >
        <Text
          style={[
            text.small,
            {
              color: selected ? colors.white : colors.text,
              fontFamily: 'Cairo_600SemiBold',
            },
          ]}
        >
          {opt.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.row}>{chips}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
