import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CenteredSpinner } from '@/components/ui/CenteredSpinner';
import { useToast } from '@/components/ui/Toast';
import { LiturgyForm, type LiturgyFormValue } from '@/components/liturgies/LiturgyForm';
import {
  DuplicateLiturgyDateError,
  getLiturgy,
  updateLiturgy,
} from '@/db/liturgies';
import { ar } from '@/lib/i18n';
import { colors } from '@/theme';
import type { Liturgy } from '@/types';

export default function EditLiturgyRoute() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [liturgy, setLiturgy] = useState<Liturgy | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{
    existingId: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!id) return;
      const l = await getLiturgy(id);
      if (!cancelled) setLiturgy(l);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(value: LiturgyFormValue) {
    if (!liturgy) return;
    setSubmitting(true);
    setDuplicateError(null);
    try {
      await updateLiturgy(liturgy.id, {
        date: value.date,
        feastId: value.feastId,
        title: value.title || undefined,
        notes: value.notes || undefined,
        status: value.cancelled ? 'cancelled' : 'held',
        cancellationReason: value.cancelled ? value.cancellationReason : undefined,
      });
      toast.show(ar.liturgy.saved, 'success');
      router.back();
    } catch (e) {
      if (e instanceof DuplicateLiturgyDateError) {
        setDuplicateError({ existingId: e.existingId, date: e.date });
        toast.show(ar.liturgy.duplicateError, 'error');
      } else {
        toast.show(String(e), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={ar.liturgy.edit}
        showCross={false}
        right={
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityLabel={ar.actions.close}
          >
            <X size={22} color={colors.text} />
          </Pressable>
        }
      />
      {liturgy ? (
        <LiturgyForm
          initial={liturgy}
          submitLabel={ar.actions.save}
          submitting={submitting}
          onCancel={() => router.back()}
          onSubmit={handleSubmit}
          duplicateError={duplicateError}
          onClearDuplicateError={() => setDuplicateError(null)}
        />
      ) : (
        <CenteredSpinner />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
});
