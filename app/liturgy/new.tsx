import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { LiturgyForm, type LiturgyFormValue } from '@/components/liturgies/LiturgyForm';
import { createLiturgy, DuplicateLiturgyDateError } from '@/db/liturgies';
import { ar } from '@/lib/i18n';
import { colors } from '@/theme';

export default function NewLiturgyRoute() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{
    existingId: string;
    date: string;
  } | null>(null);

  async function handleSubmit(value: LiturgyFormValue) {
    setSubmitting(true);
    setDuplicateError(null);
    try {
      const liturgy = await createLiturgy({
        date: value.date,
        feastId: value.feastId,
        title: value.title || undefined,
        notes: value.notes || undefined,
        status: value.cancelled ? 'cancelled' : 'held',
        cancellationReason: value.cancelled ? value.cancellationReason : undefined,
      });
      toast.show(ar.liturgy.saved, 'success');
      router.replace({ pathname: '/liturgy/[id]', params: { id: liturgy.id } });
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
        title={ar.liturgy.new}
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
      <LiturgyForm
        submitLabel={ar.actions.saveLiturgy}
        submitting={submitting}
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
        duplicateError={duplicateError}
        onClearDuplicateError={() => setDuplicateError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
});
