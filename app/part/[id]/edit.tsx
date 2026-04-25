import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CenteredSpinner } from '@/components/ui/CenteredSpinner';
import { useToast } from '@/components/ui/Toast';
import { PartForm, type PartFormValue } from '@/components/parts/PartForm';
import { getPart, updatePart, setPartFeasts, getFeastsForPart } from '@/db/parts';
import { ar } from '@/lib/i18n';
import { colors } from '@/theme';
import type { Part } from '@/types';

export default function EditPartRoute() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [part, setPart] = useState<Part | null>(null);
  const [feastIds, setFeastIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!id) return;
      const [p, fIds] = await Promise.all([getPart(id), getFeastsForPart(id)]);
      if (cancelled) return;
      setPart(p);
      setFeastIds(fIds);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(value: PartFormValue) {
    if (!part) return;
    setSubmitting(true);
    try {
      await updatePart(part.id, {
        arName: value.arName,
        category: value.category,
      });
      if (part.scope === 'feast') {
        await setPartFeasts(part.id, value.feastIds);
      }
      toast.show(ar.part.saved, 'success');
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
        title={ar.part.edit}
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
      {part ? (
        <PartForm
          initial={{ part, feastIds }}
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
