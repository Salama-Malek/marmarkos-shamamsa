import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, X as XIcon } from 'lucide-react-native';
import { colors, radii, spacing, text } from '@/theme';
import { Pill } from '@/components/ui/Pill';
import { ar } from '@/lib/i18n';
import type { Part, PartCategory } from '@/types';

interface Props {
  part: Part;
  /** Name of the deacon currently assigned to this part, or undefined. */
  assignedDeaconName?: string;
  onPress: (part: Part) => void;
  onClear?: (part: Part) => void;
}

function AssignmentRowImpl({ part, assignedDeaconName, onPress, onClear }: Props) {
  const handlePress = useCallback(() => onPress(part), [onPress, part]);
  const handleClear = useCallback(() => onClear?.(part), [onClear, part]);
  const tone = toneFor(part.category);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.92 } : undefined]}
      accessibilityRole="button"
      accessibilityLabel={part.arName}
    >
      {/*
        Source order (RTL-natural):
        category pill (start = visual right) → body (middle) → action (end).
      */}
      <Pill label={categoryLabel(part.category)} tone={tone} />
      <View style={styles.body}>
        <Text style={[text.bodyMedium, styles.partName]} numberOfLines={1}>
          {part.arName}
        </Text>
        {assignedDeaconName ? (
          <Text style={[text.small, styles.assigned]} numberOfLines={1}>
            {assignedDeaconName}
          </Text>
        ) : (
          <Text style={[text.small, styles.unassigned]} numberOfLines={1}>
            {ar.assignment.pickDeacon}
          </Text>
        )}
      </View>
      {assignedDeaconName && onClear ? (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          accessibilityLabel={ar.actions.unassign}
          style={styles.clearBtn}
        >
          <XIcon size={18} color={colors.textMuted} />
        </Pressable>
      ) : (
        <View style={styles.chevron}>
          <ChevronLeft size={18} color={colors.textSubtle} />
        </View>
      )}
    </Pressable>
  );
}

export const AssignmentRow = memo(AssignmentRowImpl);

function toneFor(category: PartCategory): React.ComponentProps<typeof Pill>['tone'] {
  switch (category) {
    case 'reading':
      return 'primary';
    case 'response':
      return 'gold';
    case 'service':
      return 'neutral';
    case 'seasonal':
      return 'excused';
  }
}

function categoryLabel(category: PartCategory): string {
  return ar.part.categories[category];
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 64,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  partName: {
    color: colors.text,
  },
  assigned: {
    color: colors.primary,
    fontFamily: 'Cairo_600SemiBold',
  },
  unassigned: {
    color: colors.textSubtle,
    fontStyle: 'italic',
  },
  chevron: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.bgDeep,
  },
});
