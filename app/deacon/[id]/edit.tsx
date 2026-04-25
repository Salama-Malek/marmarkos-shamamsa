import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CenteredSpinner } from '@/components/ui/CenteredSpinner';
import { useToast } from '@/components/ui/Toast';
import { DeaconForm, type DeaconFormValue } from '@/components/deacons/DeaconForm';
import { getDeacon, updateDeacon } from '@/db/deacons';
import { ar } from '@/lib/i18n';
import { colors } from '@/theme';
import type { Deacon } from '@/types';

export default function EditDeaconRoute() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deacon, setDeacon] = useState<Deacon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!id) return;
      const d = await getDeacon(id);
      if (!cancelled) setDeacon(d);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(value: DeaconFormValue) {
    if (!deacon) return;
    setSubmitting(true);
    try {
      await updateDeacon(deacon.id, {
        name: value.name,
        phone: value.phone || undefined,
        notes: value.notes || undefined,
        joinedDate: value.joinedDate || undefined,
      });
      toast.show(ar.deacon.saved, 'success');
      router.back();
    } catch (e) {
      toast.show(String(e), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={ar.deacon.edit}
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
      {deacon ? (
        <DeaconForm
          initial={{ existing: deacon }}
          submitLabel={ar.actions.save}
          submitting={submitting}
          onCancel={() => router.back()}
          onSubmit={handleSubmit}
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
