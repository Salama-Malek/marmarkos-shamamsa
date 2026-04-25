import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { colors, radii, spacing, text } from '@/theme';
import { Pill } from '@/components/ui/Pill';
import { ar } from '@/lib/i18n';
import type { Part, PartCategory } from '@/types';

interface Props {
  part: Part;
  onPress: (part: Part) => void;
  onLongPress?: (part: Part) => void;
  onToggleActive?: (part: Part, next: boolean) => void;
}

function PartRowImpl({ part, onPress, onLongPress, onToggleActive }: Props) {
  const handlePress = useCallback(() => onPress(part), [onPress, part]);
  const handleLongPress = useCallback(
    () => onLongPress?.(part),
    [onLongPress, part],
  );
  const handleToggle = useCallback(
    (next: boolean) => onToggleActive?.(part, next),
    [onToggleActive, part],
  );
  const tone = toneFor(part.category);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.row,
        !part.isActive ? styles.inactive : undefined,
        pressed ? { opacity: 0.92 } : undefined,
      ]}
      accessibilityRole="button"
      accessibilityLabel={part.arName}
    >
      {/*
        Source order RTL-natural:
        category pill (start = visual right) → body → toggle/menu (end).
      */}
      <Pill label={categoryLabel(part.category)} tone={tone} />
      <View style={styles.body}>
        <Text style={[text.bodyMedium, styles.name]} numberOfLines={1}>
          {part.arName}
        </Text>
        <View style={styles.metaRow}>
          {part.isSeeded ? <Pill label={ar.part.seeded} tone="neutral" /> : null}
          {!part.isActive ? <Pill label={ar.part.inactive} tone="cancelled" /> : null}
        </View>
      </View>
      {onToggleActive ? (
        <Switch
          value={part.isActive}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.present }}
          thumbColor={colors.surface}
        />
      ) : (
        <View style={styles.chevron}>
          {onLongPress ? (
            <MoreHorizontal size={20} color={colors.textSubtle} />
          ) : (
            <ChevronLeft size={20} color={colors.textSubtle} />
          )}
        </View>
      )}
    </Pressable>
  );
}

export const PartRow = memo(PartRowImpl);

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
    minHeight: 60,
  },
  inactive: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  chevron: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
