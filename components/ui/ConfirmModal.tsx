import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radii, spacing, text } from '@/theme';
import { Button } from './Button';
import { ar } from '@/lib/i18n';

interface Props {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireTypeWord?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  requireTypeWord,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!visible) setTyped('');
  }, [visible]);

  const canConfirm = !requireTypeWord || typed.trim() === requireTypeWord;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={[text.heading, styles.title]}>{title}</Text>
          {body ? <Text style={[text.body, styles.body]}>{body}</Text> : null}
          {requireTypeWord ? (
            <View style={styles.typeBlock}>
              <Text style={[text.small, { color: colors.textMuted }]}>
                {ar.settings.typeToConfirm}
              </Text>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                style={[text.body, styles.input]}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={requireTypeWord}
                placeholderTextColor={colors.textSubtle}
                textAlign="right"
              />
            </View>
          ) : null}
          <View style={styles.actions}>
            <Button
              label={cancelLabel ?? ar.actions.cancel}
              variant="secondary"
              onPress={onCancel}
              style={styles.actionBtn}
            />
            <Button
              label={confirmLabel ?? ar.actions.confirm}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              disabled={!canConfirm || loading}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 12, 8, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
  },
  body: {
    color: colors.textMuted,
  },
  typeBlock: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
    minHeight: 44,
    backgroundColor: colors.bg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
});
