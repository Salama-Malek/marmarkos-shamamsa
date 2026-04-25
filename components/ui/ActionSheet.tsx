import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';
import { ar } from '@/lib/i18n';

export interface ActionSheetItem {
  key: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;
  items: ActionSheetItem[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, items, onClose }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {title ? (
            <Text style={[text.subheading, styles.title]}>{title}</Text>
          ) : null}
          {items.map((item, idx) => (
            <Pressable
              key={item.key}
              onPress={() => {
                onClose();
                requestAnimationFrame(item.onPress);
              }}
              style={({ pressed }) => [
                styles.item,
                idx > 0 ? styles.itemDivider : undefined,
                pressed ? { backgroundColor: colors.bgDeep } : undefined,
              ]}
            >
              <Text
                style={[
                  text.body,
                  {
                    color: item.destructive ? colors.absent : colors.text,
                    fontFamily: 'Cairo_500Medium',
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              pressed ? { backgroundColor: colors.bgDeep } : undefined,
            ]}
          >
            <Text style={[text.bodyBold, { color: colors.primary }]}>
              {ar.actions.cancel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 12, 8, 0.45)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  title: {
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgDeep,
  },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancel: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
});
