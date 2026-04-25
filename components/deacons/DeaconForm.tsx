import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextField } from '@/components/ui/TextField';
import { DateField } from '@/components/ui/DateField';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/theme';
import { ar } from '@/lib/i18n';
import type { Deacon } from '@/types';

export interface DeaconFormValue {
  name: string;
  phone: string;
  notes: string;
  joinedDate: string;
}

interface Props {
  initial?: Partial<DeaconFormValue> & { existing?: Deacon };
  submitLabel: string;
  onSubmit: (value: DeaconFormValue) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function DeaconForm({ initial, submitLabel, onSubmit, onCancel, submitting }: Props) {
  const [name, setName] = useState(initial?.name ?? initial?.existing?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? initial?.existing?.phone ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? initial?.existing?.notes ?? '');
  const [joinedDate, setJoinedDate] = useState(
    initial?.joinedDate ?? initial?.existing?.joinedDate ?? '',
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError(ar.validation.nameRequired);
      return;
    }
    setError(null);
    await onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      joinedDate: joinedDate.trim(),
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <TextField
        label={ar.deacon.name}
        required
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (error) setError(null);
        }}
        placeholder={ar.deacon.namePlaceholder}
        autoFocus
        error={error ?? undefined}
        autoCapitalize="words"
      />

      <TextField
        label={ar.deacon.phone}
        hint={ar.common.optional}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder={ar.deacon.phonePlaceholder}
      />

      <DateField
        label={ar.deacon.joinedDate}
        value={joinedDate}
        onChange={setJoinedDate}
        optional
        placeholder="—"
      />

      <TextField
        label={ar.deacon.notes}
        hint={ar.common.optional}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.notes}
      />

      {/*
        Primary save first → start side (visual right in RTL). Cancel second
        → end side (visual left). Matches iOS-Arabic / Android-Arabic norms.
      */}
      <View style={styles.actions}>
        <Button
          label={submitLabel}
          variant="primary"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.action}
        />
        <Button
          label={ar.actions.cancel}
          variant="secondary"
          onPress={onCancel}
          style={styles.action}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
