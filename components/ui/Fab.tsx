import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, elevation, radii, spacing, text } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
}

export function Fab({ label, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, pressed ? { opacity: 0.9 } : undefined]}
    >
      <View style={styles.row}>
        {icon ?? <Plus size={20} color={colors.white} />}
        <Text style={[text.button, { color: colors.white }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    // `start` is RTL-aware in RN 0.81 + Yoga: in RTL it resolves to the
    // right edge (where Arabic users expect the primary action), and in
    // LTR Expo Go it resolves to the left edge. (Note: literal `right` is
    // NOT a safe alternative — Yoga flips it in RTL, putting the FAB on
    // the visual left, which is exactly the bug this comment exists to
    // prevent re-introducing.)
    start: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...(elevation.fab as object),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
