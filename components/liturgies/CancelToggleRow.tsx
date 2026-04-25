import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ban } from 'lucide-react-native';
import { colors, radii, spacing, text } from '@/theme';
import { ar } from '@/lib/i18n';

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
}

export function CancelToggleRow({ value, onChange }: Props) {
  return (
    <View style={[styles.row, value ? styles.rowActive : undefined]}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.absent }}
        thumbColor={colors.surface}
      />
      <View style={styles.body}>
        <Text style={[text.bodyMedium, { color: colors.text }]}>{ar.liturgy.cancelled}</Text>
      </View>
      <Ban size={20} color={value ? colors.absent : colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 56,
  },
  rowActive: {
    borderColor: colors.absent,
    backgroundColor: colors.absentBg,
  },
  body: {
    flex: 1,
  },
});
