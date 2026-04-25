import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors, radii, spacing, text } from '@/theme';
import { ar } from '@/lib/i18n';
import type { Feast } from '@/types';

interface Props {
  feasts: Feast[];
  /** undefined = "regular liturgy (no feast)". */
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}

export function FeastSelector({ feasts, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? feasts.find((f) => f.id === value) : undefined;
  const label = selected?.arName ?? ar.liturgy.feastNone;

  return (
    <View style={styles.wrap}>
      <Text style={[text.bodyMedium, styles.label]}>{ar.liturgy.feast}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={ar.liturgy.feast}
        style={({ pressed }) => [styles.row, pressed ? { opacity: 0.85 } : undefined]}
      >
        <Text style={[text.body, styles.value]}>{label}</Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={[text.heading, styles.sheetTitle]}>{ar.liturgy.feast}</Text>
            <ScrollView style={styles.list}>
              <Option
                label={ar.liturgy.feastNone}
                selected={!value}
                onPress={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              />
              {feasts.map((f) => (
                <Option
                  key={f.id}
                  label={f.arName}
                  selected={value === f.id}
                  onPress={() => {
                    onChange(f.id);
                    setOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected ? styles.optionSelected : undefined,
        pressed ? { opacity: 0.85 } : undefined,
      ]}
    >
      <Text
        style={[
          text.bodyMedium,
          {
            color: selected ? colors.primary : colors.text,
            flex: 1,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? <Check size={18} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
  },
  label: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  value: {
    flex: 1,
    color: colors.text,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 12, 8, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.md,
    maxHeight: '70%',
    gap: spacing.sm,
  },
  sheetTitle: {
    color: colors.text,
    paddingHorizontal: spacing.xs,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    minHeight: 48,
  },
  optionSelected: {
    backgroundColor: colors.bgDeep,
  },
});
