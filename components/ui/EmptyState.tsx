import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text } from '@/theme';
import { CopticCross } from './CopticCross';
import { Button } from './Button';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <CopticCross size={64} color={colors.gold} strokeWidth={2.2} />
      <Text style={[text.heading, styles.title]}>{title}</Text>
      {subtitle ? <Text style={[text.body, styles.subtitle]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="primary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
