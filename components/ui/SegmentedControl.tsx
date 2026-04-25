import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.seg,
              selected ? styles.segSelected : undefined,
              pressed && !selected ? { opacity: 0.85 } : undefined,
            ]}
          >
            <Text
              style={[
                text.bodyMedium,
                {
                  color: selected ? colors.white : colors.text,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgDeep,
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
  },
  seg: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    minHeight: 40,
  },
  segSelected: {
    backgroundColor: colors.primary,
  },
});
