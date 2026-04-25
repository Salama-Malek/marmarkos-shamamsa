import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, radii, spacing, text, elevation } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { ar } from '@/lib/i18n';
import type { Deacon } from '@/types';

interface Props {
  deacon: Deacon;
  /** Receives the deacon so the parent can keep callbacks stable. */
  onPress: (deacon: Deacon) => void;
  onLongPress?: (deacon: Deacon) => void;
}

function DeaconCardImpl({ deacon, onPress, onLongPress }: Props) {
  const handlePress = useCallback(() => onPress(deacon), [onPress, deacon]);
  const handleLongPress = useCallback(
    () => onLongPress?.(deacon),
    [onLongPress, deacon],
  );

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.92 } : undefined,
        !deacon.isActive ? styles.archived : undefined,
      ]}
      accessibilityRole="button"
      accessibilityLabel={deacon.name}
    >
      {/*
        RTL-natural source order: avatar → body → chevron. flexDirection:'row'
        auto-flips in RTL so avatar lands on the visual right (Arabic start),
        chevron on the visual left (end).
      */}
      <Avatar name={deacon.name} />
      <View style={styles.body}>
        <Text style={[text.bodyBold, styles.name]} numberOfLines={1}>
          {deacon.name}
        </Text>
        {deacon.phone ? (
          <Text style={[text.small, styles.phone]} numberOfLines={1}>
            {deacon.phone}
          </Text>
        ) : null}
        {!deacon.isActive ? (
          <View style={styles.meta}>
            <Pill label={ar.deacon.archived} tone="cancelled" />
          </View>
        ) : null}
      </View>
      <View style={styles.chevron}>
        <ChevronLeft size={22} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export const DeaconCard = memo(DeaconCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    ...(elevation.card as object),
  },
  archived: {
    opacity: 0.7,
  },
  chevron: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
  },
  phone: {
    color: colors.textMuted,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
});
